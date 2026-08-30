(() => {
  const currencyPattern = /([−-]?\d[\d\s\u00a0]*(?:[.,]\d+)?\s*₽)/g;

  const wrapHeadingCurrency = (root = document) => {
    const headings = [];
    if (root.nodeType === Node.ELEMENT_NODE && root.matches?.(".sc-host h1, .sc-host h2, .sc-host h3")) {
      headings.push(root);
    }

    const closestHeading = root.nodeType === Node.ELEMENT_NODE
      ? root.closest?.(".sc-host h1, .sc-host h2, .sc-host h3")
      : null;
    if (closestHeading) headings.push(closestHeading);

    if (root.querySelectorAll) {
      headings.push(...root.querySelectorAll(".sc-host h1, .sc-host h2, .sc-host h3"));
    }

    for (const heading of headings) {
      const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
      const textNodes = [];
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node.parentElement?.closest(".el-currency-inline") && node.data.includes("₽")) {
          textNodes.push(node);
        }
      }

      for (const node of textNodes) {
        const parts = node.data.split(currencyPattern);
        if (parts.length === 1) continue;

        const fragment = document.createDocumentFragment();
        for (const part of parts) {
          if (!part) continue;
          if (part.includes("₽")) {
            const span = document.createElement("span");
            span.className = "el-currency-inline";
            span.textContent = part;
            fragment.append(span);
          } else {
            fragment.append(document.createTextNode(part));
          }
        }
        node.replaceWith(fragment);
      }
    }
  };

  wrapHeadingCurrency();
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "characterData") {
        wrapHeadingCurrency(mutation.target.parentElement);
      }
      for (const node of mutation.addedNodes) wrapHeadingCurrency(node);
    }
  });

  const siteRoot = document.querySelector(".sc-host");
  if (siteRoot) observer.observe(siteRoot, { childList: true, characterData: true, subtree: true });
  window.requestAnimationFrame(() => wrapHeadingCurrency());
  window.setTimeout(() => wrapHeadingCurrency(), 250);

  if (document.fonts) {
    document.fonts.load('400 16px "Nunito EasyLine"', "Протокол питания 0 ₽");
    document.fonts.load('600 16px "Nunito EasyLine"', "Кнопка и навигация");
    document.fonts.load('700 16px "Nunito EasyLine"', "Цена 1 000 ₽");
    document.fonts.load('400 32px "Bebas Neue"', "ПРОТОКОЛ ПИТАНИЯ");
    document.fonts.load('700 24px "Bebas Neue"', "КАРТОЧКА ПРОГРАММЫ");
  }
})();
