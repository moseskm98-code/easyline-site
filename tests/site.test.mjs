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
