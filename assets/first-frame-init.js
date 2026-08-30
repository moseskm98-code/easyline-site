(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const SAFE_REVEAL_MS = 900;
  const FAILURE_FALLBACK_MS = 6000;
  const ANIMATION_CLEANUP_MS = 1900;

  let complete = false;
  let frame = 0;
  let main = null;
  let header = null;

  root.dataset.elBootState = "pending";

  function motionIsReady(candidate) {
    if (!root.dataset.motionPreset) return false;
    if (document.fonts && document.fonts.status !== "loaded") return false;
    if (reducedMotion.matches) return true;

    const viewportHeight = Math.max(window.innerHeight, 1);
    const layers = Array.from(candidate.querySelectorAll(".el-parallax-layer")).filter((layer) => {
      const rect = layer.getBoundingClientRect();
      return rect.bottom >= -viewportHeight && rect.top <= viewportHeight * 2;
    });
    if (!layers.length) return false;

    return layers.every((layer) =>
      getComputedStyle(layer).getPropertyValue("--el-parallax-y").trim()
    );
  }

  function clearPageEnter(candidate) {
    candidate.classList.remove("el-page-enter");
    if (header) header.classList.remove("el-header-enter");
  }

  function reveal(candidate, animate) {
    if (complete) return;
    complete = true;
    main = candidate;
    observer.disconnect();
    window.cancelAnimationFrame(frame);

    if (!animate || reducedMotion.matches) {
      clearPageEnter(candidate);
      if (!reducedMotion.matches) root.dataset.elMotionDegraded = "true";
    } else {
      delete root.dataset.elMotionDegraded;
    }
    root.dataset.elBootState = "ready";

    if (animate && !reducedMotion.matches) {
      const onInitialAnimationEnd = (event) => {
        if (event.target !== candidate || event.animationName !== "el-first-frame-reveal") return;
        candidate.removeEventListener("animationend", onInitialAnimationEnd);
        clearPageEnter(candidate);
      };
      candidate.addEventListener("animationend", onInitialAnimationEnd);
      window.setTimeout(() => {
        candidate.removeEventListener("animationend", onInitialAnimationEnd);
        clearPageEnter(candidate);
      }, ANIMATION_CLEANUP_MS);
    }
  }

  function inspect() {
    if (complete) return;
    const candidate = document.querySelector("#dc-root main");
    if (!candidate) return;

    main = candidate;
    header = header || document.querySelector("#dc-root header");
    if (header) header.classList.add("el-header-enter");
    candidate.classList.add("el-page-enter");

    if (motionIsReady(candidate)) {
      reveal(candidate, true);
      return;
    }

    window.cancelAnimationFrame(frame);
    frame = window.requestAnimationFrame(inspect);
  }

  function showFailureFallback() {
    if (complete || document.getElementById("el-boot-fallback")) return;
    const fallback = document.createElement("main");
    const title = document.createElement("h1");
    const message = document.createElement("p");
    const retry = document.createElement("button");

    fallback.id = "el-boot-fallback";
    fallback.setAttribute("role", "alert");
    title.textContent = "Страница не загрузилась";
    message.textContent = "Обновите страницу — ваши действия не потеряются.";
    retry.type = "button";
    retry.textContent = "Обновить";
    retry.addEventListener("click", () => window.location.reload());
    fallback.append(title, message, retry);
    document.body.appendChild(fallback);
    root.dataset.elBootState = "failed";
  }

  const observer = new MutationObserver(inspect);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inspect, { once: true });
  } else {
    inspect();
  }

  window.setTimeout(() => {
    if (complete) return;
    const candidate = document.querySelector("#dc-root main");
    if (candidate) reveal(candidate, false);
  }, SAFE_REVEAL_MS);

  window.setTimeout(() => {
    if (complete) return;
    observer.disconnect();
    showFailureFallback();
  }, FAILURE_FALLBACK_MS);
})();
