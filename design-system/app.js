(() => {
  const toast = document.querySelector(".ds-toast");
  let toastTimer = 0;

  function showToast(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = window.setTimeout(() => {
      toast.hidden = true;
    }, 1800);
  }

  async function copyValue(value) {
    try {
      await navigator.clipboard.writeText(value);
      showToast(`Скопировано: ${value}`);
    } catch {
      showToast(`Значение: ${value}`);
    }
  }

  for (const button of document.querySelectorAll("[data-copy]")) {
    button.addEventListener("click", () => copyValue(button.dataset.copy));
  }

  const navLinks = [...document.querySelectorAll(".ds-nav a")];
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  const observer = new IntersectionObserver(
    (entries) => {
      const current = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!current) return;
      for (const link of navLinks) {
        if (link.getAttribute("href") === `#${current.target.id}`) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      }
    },
    { rootMargin: "-28% 0px -58%", threshold: [0.05, 0.3, 0.6] },
  );

  for (const section of sections) observer.observe(section);
})();
