(() => {
  const root = document.documentElement;
  let complete = false;
  let timeout = 0;
  root.dataset.elBootState = "pending";

  function inspect() {
    if (complete) return;
    const main = document.querySelector("#dc-root main");
    if (!main) return;
    complete = true;
    window.clearTimeout(timeout);
    observer.disconnect();
    document.getElementById('el-boot-fallback')?.remove();
    main.classList.remove("el-page-enter");
    document.querySelector("#dc-root header")?.classList.remove("el-header-enter");
    root.dataset.elMotionDegraded = "true";
    root.dataset.elBootState = "ready";
  }

  const observer = new MutationObserver(inspect);
  observer.observe(root, { childList: true, subtree: true });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inspect, { once: true });
  } else inspect();

  // Keep the retry state if the renderer itself fails to load.
  timeout = window.setTimeout(() => {
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
  }, 6000);
})();
