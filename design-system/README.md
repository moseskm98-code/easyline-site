# Дизайн-система EasyLine

Живой каталог собран по опубликованному `main@e9cc283` и публичной версии
`2.2.2` на `https://moseskm98-code.github.io/easyline-site/`.

## Что является источником

- активная палитра — `assets/accessible-digital.css`;
- активная типографика — `assets/readability-overrides.css`;
- размеры, motion и responsive-правила — `assets/index-BmA-8PXs-v222.css` и
  `assets/layout-stage-preview.css`;
- компонентная анатомия и реальные тексты — опубликованные маршруты `/`,
  `/programs`, `/boxes`, `/showcase`, `/promo`, `/articles` и `/faq`;
- изображения, логотипы и иконка аккаунта — только локальные ассеты публикации.

## Структура

- `tokens.css` — переносимые CSS custom properties;
- `styles.css` — оформление живого каталога и компонентов;
- `index.html` — основы, компоненты, паттерны и правила доступности;
- `app.js` — копирование токенов и активное состояние навигации.

Каталог намеренно не подключает runtime основного сайта и не изменяет его
страницы. Это изолированная документационная поверхность ветки
`design-system`.

## Проверка

Из корня рабочей копии:

```bash
/Users/user1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node scripts/verify-design-system.mjs
```
