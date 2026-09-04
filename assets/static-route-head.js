(() => {
  const siteBase = "/easyline-site";
  const routeMap = {"/":{"routeKey":"home","title":"Протокол 28 дней — EasyLine","description":"Протокол питания EasyLine на 28 дней: три приёма пищи, фиксированное меню и доставка в Махачкале, Каспийске, Избербаше и Дербенте.","canonicalUrl":"https://easyline.club/","noindex":false},"/programs":{"routeKey":"program-protokol-28","title":"Протокол 28 дней — EasyLine","description":"Протокол питания EasyLine на 28 дней: три приёма пищи, фиксированное меню и доставка в Махачкале, Каспийске, Избербаше и Дербенте.","canonicalUrl":"https://easyline.club/programs/protokol-28/","noindex":true},"/programs/protokol-28":{"routeKey":"program-protokol-28","title":"Протокол 28 дней — EasyLine","description":"Фиксированное меню протокола EasyLine на 28 дней: завтрак, обед и ужин с указанными порциями.","canonicalUrl":"https://easyline.club/programs/protokol-28/","noindex":false},"/reviews":{"routeKey":"reviews","title":"Отзывы — EasyLine","description":"Отзывы клиентов EasyLine о протоколе питания на 28 дней и доставке.","canonicalUrl":"https://easyline.club/reviews/","noindex":false},"/faq":{"routeKey":"faq","title":"Частые вопросы — EasyLine","description":"Ответы о меню, доставке, оплате, хранении и паузе 28-дневного протокола EasyLine.","canonicalUrl":"https://easyline.club/faq/","noindex":false},"/about-production":{"routeKey":"about-production","title":"О производстве — EasyLine","description":"Собственная кухня EasyLine: закупка сырья, приготовление, фасовка рационов и контроль качества.","canonicalUrl":"https://easyline.club/about-production/","noindex":false},"/delivery-payment":{"routeKey":"delivery-payment","title":"Доставка и оплата — EasyLine","description":"График доставки протокола EasyLine по Махачкале, Каспийску, Избербашу и Дербенту, способы оплаты и перенос дней.","canonicalUrl":"https://easyline.club/delivery-payment/","noindex":false},"/contacts":{"routeKey":"contacts","title":"Контакты — EasyLine","description":"Телефон, WhatsApp, часы работы и реквизиты ИП EasyLine.","canonicalUrl":"https://easyline.club/contacts/","noindex":false},"/legal/privacy":{"routeKey":"legal-privacy","title":"Политика обработки персональных данных — EasyLine","description":"Официальная политика обработки персональных данных EasyLine.","canonicalUrl":"https://easyline.club/legal/privacy/","noindex":false},"/legal/terms":{"routeKey":"legal-terms","title":"Пользовательское соглашение — EasyLine","description":"Официальное пользовательское соглашение EasyLine.","canonicalUrl":"https://easyline.club/legal/terms/","noindex":false},"/legal/offer":{"routeKey":"legal-offer","title":"Публичная оферта — EasyLine","description":"Официальная публичная оферта EasyLine.","canonicalUrl":"https://easyline.club/legal/offer/","noindex":false}};
  const notFound = {"routeKey":"not-found","title":"Страница не найдена — EasyLine","description":"Запрошенная страница EasyLine не найдена.","canonicalUrl":"https://easyline.club/404/","noindex":true};

  function normalizePathname(pathname) {
    const normalized = String(pathname || "/").replace(/\/+$/, "") || "/";
    if (normalized === siteBase) return "/";
    if (normalized === siteBase + "/404.html" || normalized === siteBase + "/404") return "/404";
    if (normalized.startsWith(siteBase + "/")) return normalized.slice(siteBase.length) || "/";
    return normalized;
  }

  function ensureMeta(selector, attributes) {
    let node = document.head.querySelector(selector);
    if (!node) {
      node = document.createElement(attributes.property ? "meta" : selector.startsWith("link") ? "link" : "meta");
      document.head.append(node);
    }
    for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
    return node;
  }

  function syncStaticRouteHead() {
    const path = normalizePathname(window.location.pathname);
    const entry = routeMap[path] || notFound;
    document.documentElement.dataset.elRouteKey = entry.routeKey;
    document.title = entry.title;
    ensureMeta('meta[name="description"]', { name: "description", content: entry.description });
    ensureMeta('meta[name="robots"]', { name: "robots", content: entry.noindex ? "noindex,follow" : "index,follow" });
    ensureMeta('meta[property="og:title"]', { property: "og:title", content: entry.title });
    ensureMeta('meta[property="og:description"]', { property: "og:description", content: entry.description });
    ensureMeta('meta[property="og:url"]', { property: "og:url", content: entry.canonicalUrl });
    ensureMeta('link[rel="canonical"]', { rel: "canonical", href: entry.canonicalUrl });
    return true;
  }

  window.__EASYLINE_STATIC_HEAD_SYNC__ = syncStaticRouteHead;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", syncStaticRouteHead, { once: true });
  else syncStaticRouteHead();
})();