#!/usr/bin/env node
import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PUBLIC_ROUTE_ENTRIES, RETIRED_PATHS, ROUTE_ENTRIES, SITE_BASE, SITE_ORIGIN } from "./site-metadata.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localPrefix = `${SITE_BASE}/`;

function extractSingle(text, pattern, label, file) {
  const match = text.match(pattern);
  assert.ok(match, `${file}: missing ${label}`);
  return match[1];
}

async function ensureLocalAssetsExist(html, file) {
  const assets = new Set();
  for (const match of html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)) {
    const value = match[1];
    if (!value.startsWith(localPrefix) || value.includes("{{")) continue;
    assets.add(value.slice(localPrefix.length).replace(/[?#].*$/, ""));
  }
  for (const asset of assets) {
    await access(path.join(root, asset)).catch(() => {
      throw new Error(`${file}: missing local asset ${SITE_BASE}/${asset}`);
    });
  }
}

for (const item of ROUTE_ENTRIES) {
  const html = await readFile(path.join(root, item.file), "utf8");
  assert.match(html, new RegExp(`<html lang="ru" data-el-route-key="${item.routeKey}">`), `${item.file}: route key mismatch`);
  assert.equal(extractSingle(html, /<title>([^<]+)<\/title>/, "title", item.file), item.title);
  assert.equal(extractSingle(html, /<meta name="description" content="([^"]+)">/, "description", item.file), item.description);
  assert.equal(extractSingle(html, /<link rel="canonical" href="([^"]+)">/, "canonical", item.file), item.canonicalUrl);
  assert.equal(extractSingle(html, /<meta name="robots" content="([^"]+)">/, "robots", item.file), item.noindex ? "noindex,follow" : "index,follow");
  assert.match(html, /window\.__EASYLINE_VARIANT__ = "2\.2\.3"/, `${item.file}: version marker missing`);
  assert.match(html, /window\.__EASYLINE_SITE_ORIGIN__ = "https:\/\/easyline\.club"/, `${item.file}: production origin mismatch`);
  assert.match(html, /\/easyline-site\/lead-form\.js/, `${item.file}: ERP lead client missing`);
  await ensureLocalAssetsExist(html, item.file);
}

assert.equal(PUBLIC_ROUTE_ENTRIES.length, 10, "public route count mismatch");
const sitemap = await readFile(path.join(root, "sitemap.xml"), "utf8");
assert.deepEqual(
  [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]),
  PUBLIC_ROUTE_ENTRIES.map((item) => item.canonicalUrl),
  "sitemap content mismatch",
);
assert.ok([...sitemap.matchAll(/<loc>/g)].every(() => sitemap.includes(SITE_ORIGIN)), "sitemap origin mismatch");

for (const retired of RETIRED_PATHS) {
  const retiredPath = path.join(root, retired);
  const exists = await stat(retiredPath).then(() => true).catch(() => false);
  assert.equal(exists, false, `${retired}: retired route is still published`);
}

const index = await readFile(path.join(root, "index.html"), "utf8");
assert.match(index, /D\.protocols\.filter\(p => p\.slug === 'protokol-28'\)/, "protocol data is not restricted to protokol-28");
assert.match(index, /<form[^>]+onSubmit="\{\{ submitApplication \}\}"/, "application form missing");
assert.doesNotMatch(index, /data-el-app-intent="auth"|>Войти<|Заказ — в приложении|оформление — в приложении/i, "legacy account flow remains");
assert.doesNotMatch(index, /\{ label:'Боксы'|\{ label:'Витрина'|\{ label:'Блог'/, "retired section remains in footer");
assert.match(index, /data-el-social="telegram"[^>]+href=""[^>]+aria-disabled="true"/, "Telegram placeholder must stay disabled");
assert.match(index, /data-el-social="instagram"[^>]+href=""[^>]+aria-disabled="true"/, "Instagram placeholder must stay disabled");

const leadModule = await import(new URL("../lead-form.js", import.meta.url));
assert.equal(leadModule.LEAD_ENDPOINT, "https://api.easyline.club/inquiries");
assert.deepEqual(
  leadModule.buildInquiryPayload({
    idempotencyKey: "11111111-1111-4111-8111-111111111111",
    name: " Рамазан ",
    phone: "8 (964) 018-23-73",
  }),
  {
    idempotencyKey: "11111111-1111-4111-8111-111111111111",
    fullName: "Рамазан",
    phone: "+79640182373",
    message: "Заявка на протокол питания на 28 дней",
    consent: true,
    personalDataVersion: "12 мая 2026",
    website: "",
  },
);

const runtime = await readFile(path.join(root, "assets", "static-route-head.js"), "utf8");
assert.match(runtime, /document\.documentElement\.dataset\.elRouteKey/, "runtime route sync missing");
assert.match(runtime, /noindex,follow/, "runtime noindex handling missing");
assert.doesNotMatch(runtime, /new MutationObserver/, "runtime must not create a competing observer");

const bundle = await readFile(path.join(root, "assets", "index-Dwt8uDxZ.js"), "utf8");
assert.equal(
  bundle.split('function at(){const m=window.__EASYLINE_STATIC_HEAD_SYNC__;if(typeof m=="function"&&m())return;var z,v;').length - 1,
  1,
  "compiled metadata delegator mismatch",
);
