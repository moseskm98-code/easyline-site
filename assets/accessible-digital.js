(() => {
  const replacements = [
    ["rgb(113, 157, 201)", "#8e242e"],
    ["rgb(95, 141, 187)", "#74202a"],
    ["rgb(187, 220, 239)", "#e4f0f7"],
    ["rgb(216, 232, 242)", "#e4f0f7"],
    ["rgb(169, 202, 223)", "#e4f0f7"],
    ["rgb(70, 90, 103)", "#536f8a"],
    ["rgb(111, 132, 146)", "#536f8a"],
    ["rgb(122, 144, 157)", "#536f8a"],
    ["rgb(15, 77, 122)", "#0f4d7a"],
  ];

  window.__EASYLINE_COLOR_VARIANT__ = "accessible-digital";

  const rewriteStyle = (node) => {
    if (!(node instanceof HTMLElement)) return;

    const styleAttribute = node.getAttribute("style");
    if (!styleAttribute) return;

    let nextStyle = styleAttribute;
    for (const [sourceColor, targetColor] of replacements) {
      nextStyle = nextStyle.split(sourceColor).join(targetColor);
    }

    if (nextStyle !== styleAttribute) {
      node.setAttribute("style", nextStyle);
    }
  };

  const sweep = (root = document) => {
    root.querySelectorAll?.("[style]").forEach(rewriteStyle);
    if (root instanceof HTMLElement) rewriteStyle(root);
  };

  const start = () => {
    sweep(document);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes") {
          rewriteStyle(mutation.target);
        }

        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) sweep(node);
        });
      }
    });

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["style"],
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
