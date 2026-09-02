export const SITE_ORIGIN = "https://easyline.club";
export const SITE_BASE = "/easyline-site";

function canonicalUrl(routePath) {
  const path = routePath === "/" ? "/" : `${routePath.replace(/\/+$/, "")}/`;
  return new URL(path, SITE_ORIGIN).href;
}

function entry(file, routeKey, routePath, title, description, options = {}) {
  return {
    file,
    routeKey,
    routePath,
    title,
    description,
    noindex: options.noindex === true,
    canonicalUrl: canonicalUrl(options.canonicalPath || routePath),
  };
}

const protocolDescription = "Протокол питания EasyLine на 28 дней: три приёма пищи, рассчитанный КБЖУ и доставка в Махачкале, Каспийске и Избербаше.";

export const ROUTE_ENTRIES = [
  entry("index.html", "home", "/", "Протокол 28 дней — EasyLine", protocolDescription),
  entry("programs/index.html", "program-protokol-28", "/programs", "Протокол 28 дней — EasyLine", protocolDescription, { noindex: true, canonicalPath: "/programs/protokol-28" }),
  entry("programs/protokol-28/index.html", "program-protokol-28", "/programs/protokol-28", "Протокол 28 дней — EasyLine", "Меню базового протокола EasyLine на 28 дней: три приёма пищи, полный КБЖУ и правила цикла."),
  entry("reviews/index.html", "reviews", "/reviews", "Отзывы — EasyLine", "Отзывы клиентов EasyLine о протоколе питания на 28 дней и доставке."),
  entry("faq/index.html", "faq", "/faq", "Частые вопросы — EasyLine", "Ответы о меню, доставке, оплате, хранении и паузе 28-дневного протокола EasyLine."),
  entry("about-production/index.html", "about-production", "/about-production", "О производстве — EasyLine", "Собственная кухня EasyLine: закупка сырья, приготовление, фасовка рационов и контроль качества."),
  entry("delivery-payment/index.html", "delivery-payment", "/delivery-payment", "Доставка и оплата — EasyLine", "График доставки протокола EasyLine по Махачкале, Каспийску и Избербашу, способы оплаты и перенос дней."),
  entry("contacts/index.html", "contacts", "/contacts", "Контакты — EasyLine", "Телефон, WhatsApp, часы работы и реквизиты ИП EasyLine."),
  entry("legal/privacy/index.html", "legal-privacy", "/legal/privacy", "Политика обработки персональных данных — EasyLine", "Официальная политика обработки персональных данных EasyLine."),
  entry("legal/terms/index.html", "legal-terms", "/legal/terms", "Пользовательское соглашение — EasyLine", "Официальное пользовательское соглашение EasyLine."),
  entry("legal/offer/index.html", "legal-offer", "/legal/offer", "Публичная оферта — EasyLine", "Официальная публичная оферта EasyLine."),
  entry("404.html", "not-found", "/404", "Страница не найдена — EasyLine", "Запрошенная страница EasyLine не найдена.", { noindex: true }),
  entry("404/index.html", "not-found", "/404", "Страница не найдена — EasyLine", "Запрошенная страница EasyLine не найдена.", { noindex: true }),
];

export const PUBLIC_ROUTE_ENTRIES = ROUTE_ENTRIES.filter((item) => !item.noindex);
export const ROUTE_BY_PATH = new Map(ROUTE_ENTRIES.map((item) => [item.routePath, item]));

export const RETIRED_PATHS = [
  "articles",
  "boxes",
  "promo",
  "showcase",
  "programs/sport-2-0",
  "legal/assistant",
  "legal/bonus",
  "legal/delivery",
  "legal/marketing",
  "legal/medical",
  "legal/pd",
];
