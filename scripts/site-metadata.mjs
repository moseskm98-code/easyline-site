export const SITE_ORIGIN = "https://moseskm98-code.github.io";
export const SITE_BASE = "/easyline-site";

function routeToCanonicalPath(routePath) {
  if (routePath === "/") return `${SITE_BASE}/`;
  return `${SITE_BASE}${routePath.replace(/\/+$/, "")}/`;
}

function entry(file, routeKey, routePath, title, description, options = {}) {
  const noindex = options.noindex === true;
  const canonicalPath = options.canonicalPath || routeToCanonicalPath(routePath);
  return {
    file,
    routeKey,
    routePath,
    title,
    description,
    noindex,
    canonicalPath,
    canonicalUrl: new URL(canonicalPath, SITE_ORIGIN).href,
  };
}

export const ROUTE_ENTRIES = [
  entry("index.html", "home", "/", "Протокол питания вместо диеты — EasyLine", "Протоколы питания, боксы и витрина grab & go EasyLine в Махачкале и Каспийске."),
  entry("programs/index.html", "programs", "/programs", "Протоколы питания — EasyLine", "Два протокола питания EasyLine на 28 дней: меню, КБЖУ, правила цикла и подробности по каждому формату."),
  entry("programs/protokol-28/index.html", "program-protokol-28", "/programs/protokol-28", "Протокол 28 дней — EasyLine", "Базовый протокол EasyLine на 28 дней: три приёма пищи, полный КБЖУ, разгрузочные дни и меню по неделям."),
  entry("programs/sport-2-0/index.html", "program-sport-2-0", "/programs/sport-2-0", "Спортивно-функциональный 2.0 — EasyLine", "Спортивно-функциональный протокол EasyLine на 28 дней: калорийность по приёмам пищи, задачи дня и меню цикла."),
  entry("boxes/index.html", "boxes", "/boxes", "Боксы — EasyLine", "Готовые боксы EasyLine: состав, КБЖУ и фото порционных рационов для поштучного заказа."),
  entry("boxes/bulgur-lyulya/index.html", "box-bulgur-lyulya", "/boxes/bulgur-lyulya", "Булгур на топлёном масле + говяжьи люля + овощи — EasyLine", "Сбалансированный белково-углеводный бокс с булгуром на топлёном масле, говяжьими люля и овощами."),
  entry("boxes/bulgur-kurica/index.html", "box-bulgur-kurica", "/boxes/bulgur-kurica", "Булгур + курица из духовки + овощи с горчичной заправкой — EasyLine", "Белковый бокс с курицей из духовки, булгуром, овощами и горчично-лимонной заправкой."),
  entry("boxes/ris-skumbriya/index.html", "box-ris-skumbriya", "/boxes/ris-skumbriya", "Рис с овощами + скумбрия + стейк из капусты — EasyLine", "Бокс с рисом, овощами, запечённой скумбрией и стейком из капусты в яичной панировке."),
  entry("boxes/grechka-kotlety/index.html", "box-grechka-kotlety", "/boxes/grechka-kotlety", "Гречка + куриные котлеты + свежие овощи — EasyLine", "Белковый бокс с гречкой, куриными котлетами и свежими овощами."),
  entry("boxes/grechka-lyulya/index.html", "box-grechka-lyulya", "/boxes/grechka-lyulya", "Гречка + говяжьи люля + морковный салат — EasyLine", "Сытный бокс с гречкой, говяжьими люля и морковным салатом с чесноком и грецким орехом."),
  entry("boxes/pyure-griby/index.html", "box-pyure-griby", "/boxes/pyure-griby", "Картофельное пюре + тушёные грибы и овощи + пармезан — EasyLine", "Нежный бокс с картофельным пюре, тушёными грибами, овощами и пармезаном."),
  entry("boxes/kinoa-indeyka-tahini/index.html", "box-kinoa-indeyka-tahini", "/boxes/kinoa-indeyka-tahini", "Киноа с индейкой, овощами и соусом тахини — EasyLine", "Белково-углеводный бокс с киноа, индейкой, овощами и кунжутной заправкой на основе тахини."),
  entry("boxes/ovoshi-kurica-bulochka/index.html", "box-ovoshi-kurica-bulochka", "/boxes/ovoshi-kurica-bulochka", "Тушёные овощи с курицей, авокадо и чечевичной булочкой — EasyLine", "Белково-овощной бокс с курицей, авокадо, тушёными овощами, семенами и чечевичной булочкой."),
  entry("boxes/kinoa-kurica-avokado/index.html", "box-kinoa-kurica-avokado", "/boxes/kinoa-kurica-avokado", "Киноа с курицей, авокадо и горчично-лимонной заправкой — EasyLine", "Белково-углеводный бокс с киноа, курицей, авокадо, овощами и горчично-лимонной заправкой."),
  entry("boxes/shavel-yayca/index.html", "box-shavel-yayca", "/boxes/shavel-yayca", "Щавель с яйцами, авокадо, семенами и чечевичными булочками — EasyLine", "Насыщенный бокс с яйцами, щавелем, авокадо, семенами и чечевичными булочками."),
  entry("boxes/golubcy/index.html", "box-golubcy", "/boxes/golubcy", "Голубцы с говядиной, булочка и запечённый картофель — EasyLine", "Сытный домашний бокс с голубцами из капусты и говядины, чечевичной булочкой и запечённым картофелем."),
  entry("boxes/krevetki-kinoa/index.html", "box-krevetki-kinoa", "/boxes/krevetki-kinoa", "Креветки с киноа, авокадо, салатом-щёткой и семенами — EasyLine", "Лёгкий бокс с креветками, киноа, авокадо и салатом-щёткой, сбалансированный по белку и жирам."),
  entry("showcase/index.html", "showcase", "/showcase", "Витрина grab & go — EasyLine", "Витрина grab & go EasyLine: чиабатты, сэндвичи, тортильи, круассаны и бургеры для витрины, вендинга и корпоративных заказов."),
  entry("reviews/index.html", "reviews", "/reviews", "Отзывы — EasyLine", "Отзывы клиентов EasyLine о протоколах питания, боксах, витрине и доставке."),
  entry("promo/index.html", "promo", "/promo", "Акции — EasyLine", "Акции EasyLine: условия знакомства с сервисом и предложения для новых и постоянных клиентов."),
  entry("promo/first-order/index.html", "promo-first-order", "/promo/first-order", "−20% на первый заказ — EasyLine", "Скидка на первый заказ EasyLine: условия предложения для новых клиентов и циклов от 7 дней."),
  entry("promo/14-za-12/index.html", "promo-14-za-12", "/promo/14-za-12", "14 дней по цене 12 — EasyLine", "Акция EasyLine для двухнедельного цикла: два дня питания в подарок при заказе 14 дней."),
  entry("promo/friend/index.html", "promo-friend", "/promo/friend", "Приведите друга — 1 000 ₽ обоим — EasyLine", "Реферальная акция EasyLine: бонусы после первого заказа друга по персональной ссылке из приложения."),
  entry("promo/kaspiysk/index.html", "promo-kaspiysk", "/promo/kaspiysk", "Бесплатная доставка в Каспийск — EasyLine", "Акция EasyLine для Каспийска: доставка за город бесплатна при заказе цикла от 14 дней."),
  entry("articles/index.html", "articles", "/articles", "Блог — EasyLine", "Блог EasyLine о протоколах питания, рационе, режиме, тренировках и доставке."),
  entry("articles/belok/index.html", "article-belok", "/articles/belok", "Сколько белка нужно в день — EasyLine", "Простая формула потребления белка на день для снижения веса, набора массы и повседневного рациона."),
  entry("articles/srivy/index.html", "article-srivy", "/articles/srivy", "Как не сорваться на дефиците — EasyLine", "Пять причин срывов на дефиците и практичные способы удержать режим без лишнего давления."),
  entry("articles/perekusy/index.html", "article-perekusy", "/articles/perekusy", "Почему в протоколе нет перекусов — EasyLine", "Что происходит с аппетитом, когда между приёмами пищи проходит 4–5 часов, и зачем это заложено в протокол."),
  entry("articles/trenirovka/index.html", "article-trenirovka", "/articles/trenirovka", "Что есть до и после тренировки — EasyLine", "Разбор питания до и после тренировки: когда важнее углеводы, а когда белок."),
  entry("articles/razgruzka/index.html", "article-razgruzka", "/articles/razgruzka", "Зачем нужны разгрузочные дни — EasyLine", "Как один разгрузочный день влияет на ритм недели и зачем он встроен в протокол питания."),
  entry("articles/sostav/index.html", "article-sostav", "/articles/sostav", "Как читать состав на упаковке — EasyLine", "На что смотреть в составе продукта в первую очередь и какие формулировки не дают полезной информации."),
  entry("faq/index.html", "faq", "/faq", "Частые вопросы — EasyLine", "Частые вопросы о протоколах EasyLine: меню, доставка, оплата, хранение и пауза цикла."),
  entry("about-production/index.html", "about-production", "/about-production", "О производстве — EasyLine", "О производстве EasyLine: собственная кухня, закупка сырья, фасовка рационов и контроль качества."),
  entry("delivery-payment/index.html", "delivery-payment", "/delivery-payment", "Доставка и оплата — EasyLine", "Доставка и оплата EasyLine: график по городам, способы оплаты, переносы и отмена дней цикла."),
  entry("contacts/index.html", "contacts", "/contacts", "Контакты — EasyLine", "Контакты EasyLine и общая информация для связи по вопросам заказа, самовывоза, витрины и корпоративных запросов."),
  entry("legal/privacy/index.html", "legal-privacy", "/legal/privacy", "Политика конфиденциальности — EasyLine", "Документ EasyLine: политика конфиденциальности для сайта и приложения."),
  entry("legal/terms/index.html", "legal-terms", "/legal/terms", "Пользовательское соглашение — EasyLine", "Документ EasyLine: пользовательское соглашение для сайта и приложения."),
  entry("legal/offer/index.html", "legal-offer", "/legal/offer", "Публичная оферта — EasyLine", "Документ EasyLine: публичная оферта на приготовление и доставку рационов питания."),
  entry("legal/pd/index.html", "legal-pd", "/legal/pd", "Согласие на обработку персональных данных — EasyLine", "Документ EasyLine: согласие на обработку персональных данных."),
  entry("legal/marketing/index.html", "legal-marketing", "/legal/marketing", "Согласие на маркетинговые уведомления — EasyLine", "Документ EasyLine: согласие на маркетинговые уведомления."),
  entry("legal/medical/index.html", "legal-medical", "/legal/medical", "Медицинские ограничения — EasyLine", "Документ EasyLine: медицинские ограничения и пояснения по использованию сервиса."),
  entry("legal/assistant/index.html", "legal-assistant", "/legal/assistant", "Дисклеймер ПП-ассистента — EasyLine", "Документ EasyLine: дисклеймер ПП-ассистента и ограничения автоматических рекомендаций."),
  entry("legal/bonus/index.html", "legal-bonus", "/legal/bonus", "Правила бонусной программы — EasyLine", "Документ EasyLine: правила бонусной программы."),
  entry("legal/delivery/index.html", "legal-delivery", "/legal/delivery", "Правила доставки — EasyLine", "Документ EasyLine: правила доставки рационов и сопутствующих заказов."),
  entry("404.html", "not-found", "/404", "Страница не найдена — EasyLine", "Страница 404 EasyLine: ссылка могла устареть, вернитесь на главную или откройте каталог питания.", { noindex: true, canonicalPath: `${SITE_BASE}/404/` }),
  entry("404/index.html", "not-found", "/404", "Страница не найдена — EasyLine", "Страница 404 EasyLine: ссылка могла устареть, вернитесь на главную или откройте каталог питания.", { noindex: true, canonicalPath: `${SITE_BASE}/404/` }),
];

export const PUBLIC_ROUTE_ENTRIES = ROUTE_ENTRIES.filter((entryItem) => !entryItem.noindex);

export const ROUTE_BY_FILE = new Map(ROUTE_ENTRIES.map((entryItem) => [entryItem.file, entryItem]));
export const ROUTE_BY_PATH = new Map(ROUTE_ENTRIES.map((entryItem) => [entryItem.routePath, entryItem]));
