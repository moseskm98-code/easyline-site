import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const index = await readFile(new URL("index.html", root), "utf8");
const readability = await readFile(new URL("assets/readability-overrides.css", root), "utf8");
const menuSource = await readFile(new URL("assets/menu-data-6F787N4k.js", root), "utf8");

test("menu refresh retains the protocol and adds two catalog directions", async () => {
  assert.match(index, /window\.__EASYLINE_VARIANT__ = "2\.3\.0-images-preview"/);
  assert.match(index, /<form[^>]+onSubmit="\{\{ submitApplication \}\}"/);
  assert.ok(index.includes("history.replaceState({},'',PAGES_BASE + '/programs/protokol-28')"), 'legacy programs URL resolves to protocol');
  assert.doesNotMatch(index, /data-el-app-intent="auth"|>Войти</);
  assert.doesNotMatch(index, /\{ label:'Боксы'|\{ label:'Витрина'|\{ label:'Блог'/);

  assert.match(index, /path === '\/corporate-lunches'/);
  assert.match(index, /path === '\/assortment'/);
  assert.match(index, /class="el-direction-grid"/);
  assert.doesNotMatch(index, /Один протокол\. Полный цикл|Начните протокол на 28 дней/);

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
  assert.match(index, /'contacts':[\s\S]*?\{k:'Город',v:'Избербаш'\}/);

  for (const name of [
    "privacy-policy.docx",
    "privacy-policy.pdf",
    "user-agreement.docx",
    "user-agreement.pdf",
    "public-offer.docx",
    "public-offer.pdf",
  ]) await access(new URL(`documents/${name}`, root));
});

test("delivery includes both Izberbash and Derbent", () => {
  for (const city of ['Махачкала','Каспийск','Избербаш','Дербент']) assert.ok(index.includes("{k:'" + city + "',v:'"), city + ' delivery retained');
});

test("the supplied 28-day menu is shown as one fixed menu without selectors", async () => {
  const { PROTOCOLS } = await import(new URL("../assets/menu-data-6F787N4k.js", import.meta.url));
  const protocol = PROTOCOLS.find(({ slug }) => slug === "protokol-28");
  const protocolPage = index.match(/<!-- СТРАНИЦА ПРОТОКОЛА -->([\s\S]*?)<!-- ТЕКСТОВАЯ СТРАНИЦА ИЗ CMS/)[1];

  assert.equal(protocol.days.length, 28);
  assert.deepEqual(protocol.days[0].meals[0].items, [
    "Кабачковые оладьи",
    "Клубника",
    "Бразильский орех",
    "Греческий йогурт",
    "Брокколи запечённая",
    "Цветная капуста запечённая",
  ]);
  assert.deepEqual(protocol.days[27].meals[2].items, [
    "Кета запечённая",
    "Салат «Грин микс»",
    "Лимон",
    "Смесь семян",
  ]);
  assert.ok(protocol.days.flatMap(({ meals }) => meals.flatMap(({ items }) => items)).includes("Апельсин — 1 шт."));
  assert.doesNotMatch(menuSource, /\d+(?:[.,]\d+)?\s*г(?!\p{L})/iu);
  assert.doesNotMatch(index, /\d+(?:[.,]\d+)?\s*г(?!\p{L})/iu);
  assert.doesNotMatch(index, /(?:^|[^\p{L}])грамм(?:а|ов|ах|ы)?(?!\p{L})/iu);
  assert.match(protocolPage, /<sc-for list="\{\{ menuDays \}\}" as="d"/);
  assert.match(protocolPage, /выбор блюд на сайте не предусмотрен/i);
  assert.match(index, /menu-data-6F787N4k\.js\?v=version-2\.2\.3-20260904/);
  assert.doesNotMatch(protocolPage, />День \{\{ d\.n \}\}</);
  assert.doesNotMatch(protocolPage, /\{\{ d\.dow \}\}/);
  assert.doesNotMatch(protocolPage, /day\.kcalPlain/);
  assert.doesNotMatch(protocolPage, /weekTabs|weekDays|\{\{ w\.select \}\}/);

  assert.match(protocolPage, /class="el-photo-frame el-protocol-hero"/);
  assert.match(protocolPage, /class="el-photo el-protocol-hero__image"/);
  assert.match(protocolPage, /class="el-protocol-menu"/);
  assert.match(protocolPage, /class="el-protocol-sticky"/);
  assert.doesNotMatch(protocolPage, /coverRatio/);
  assert.match(readability, /\.el-protocol-hero\s*\{[^}]*aspect-ratio:\s*1823\s*\/\s*863/s);
  assert.match(readability, /\.el-protocol-hero__image\.el-parallax-layer\s*\{[^}]*translate:\s*none\s*!important/s);
  assert.match(readability, /\.el-protocol-menu\.el-reveal\s*\{[^}]*opacity:\s*1\s*!important/s);
  assert.match(readability, /program-protokol-28[^}]*header\.el-header-enter[^}]*\{[^}]*animation:\s*none\s*!important/s);
});
