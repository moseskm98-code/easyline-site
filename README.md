# EasyLine — версия 2.2.3

Публичный сайт [easyline.club](https://easyline.club) на основе ветки `version-2.2.3` репозитория `moseskm98-code/easyline-site`.

На сайте продаётся только «Протокол 28 дней». Заказ заменён заявкой с именем, телефоном и обязательным согласием на обработку персональных данных; заявка отправляется в EasyLine ERP через `POST https://api.easyline.club/inquiries`.

Контакты, реквизиты ИП и три юридических документа опубликованы на сайте. Telegram и Instagram оставлены неактивными до получения ссылок.

## Проверка

```bash
node --test tests/site.test.mjs
node scripts/sync-static-site.mjs
node scripts/verify-static-site.mjs
```

Требуется Node.js 18+.
