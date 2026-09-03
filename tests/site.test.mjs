import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const index = await readFile(new URL("index.html", root), "utf8");

test("version 2.2.3 sells only the 28-day protocol through an ERP lead form", async () => {
  assert.match(index, /window\.__EASYLINE_VARIANT__ = "2\.2\.3"/);
  assert.match(index, /<form[^>]+onSubmit="\{\{ submitApplication \}\}"/);
  assert.match(index, /replaceState\(\{\}, '', PAGES_BASE \+ '\/programs\/protokol-28'\)/);
  assert.doesNotMatch(index, /data-el-app-intent="auth"|>Войти</);
  assert.doesNotMatch(index, /\{ label:'Боксы'|\{ label:'Витрина'|\{ label:'Блог'/);

  const leads = await import(new URL("lead-form.js", root));
  assert.equal(leads.LEAD_ENDPOINT, "https://api.easyline.club/inquiries");
  assert.equal(leads.normalizePhone("8 (964) 018-23-73"), "+79640182373");
});

test("contacts and the three supplied legal documents are published", async () => {
  assert.match(index, /tel:\+79640182373/);
  assert.match(index, /https:\/\/wa\.me\/79640182373/);
  assert.match(index, /data-el-social="telegram"[^>]+href=""[^>]+aria-disabled="true"/);
  assert.match(index, /data-el-social="instagram"[^>]+href=""[^>]+aria-disabled="true"/);
  assert.match(index, /ИП Ибрагимов Рамазан Расулович/);

  for (const name of [
    "privacy-policy.docx",
    "privacy-policy.pdf",
    "user-agreement.docx",
    "user-agreement.pdf",
    "public-offer.docx",
    "public-offer.pdf",
  ]) await access(new URL(`documents/${name}`, root));
});

test("the supplied 28-day menu is shown as one fixed menu without selectors", async () => {
  const { PROTOCOLS } = await import(new URL("../assets/menu-data-6F787N4k.js", import.meta.url));
  const protocol = PROTOCOLS.find(({ slug }) => slug === "protokol-28");

  assert.equal(protocol.days.length, 28);
  assert.deepEqual(protocol.days[0].meals[0].items, [
    "Кабачковые оладьи — 200 г",
    "Клубника — 100 г",
    "Бразильский орех — 15 г",
    "Греческий йогурт — 50 г",
    "Брокколи запечённая — 30 г",
    "Цветная капуста запечённая — 30 г",
  ]);
  assert.deepEqual(protocol.days[27].meals[2].items, [
    "Кета запечённая — 130 г",
    "Салат «Грин микс» — 180 г",
    "Лимон — 20 г",
    "Смесь семян — 10 г",
  ]);
  assert.match(index, /<sc-for list="\{\{ menuDays \}\}" as="d"/);
  assert.match(index, /Выбор блюд на сайте не предусмотрен/);
  assert.match(index, /menu-data-6F787N4k\.js\?v=version-2\.2\.3-20260903/);
  assert.doesNotMatch(index, /day\.kcalPlain/);
  assert.doesNotMatch(index, /weekTabs|weekDays|\{\{ w\.select \}\}/);
});
