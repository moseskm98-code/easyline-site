#!/usr/bin/env node
import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PUBLIC_ROUTE_ENTRIES, ROUTE_ENTRIES, SITE_BASE, SITE_ORIGIN } from "./site-metadata.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localPrefix = `${SITE_BASE}/`;
const bundlePath = path.join(root, "assets", "index-Dwt8uDxZ.js");
const demoFooter = ">© 2026 EasyLine. ИП Магомедов А. М. · ИНН 057200000000</div>";
const neutralFooter = ">© 2026 EasyLine.</div>";
const mapPlaceholder = "    { isPhoto:true, text:'карта проезда · 16:9' },";

function extractSingle(text, pattern, label, file) {
  const match = text.match(pattern);
  assert.ok(match, `${file}: missing ${label}`);
  return match[1];
}

function localAssetCandidates(html) {
  const values = [];
  for (const match of html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)) {
    const value = match[1];
    if (!value.startsWith(localPrefix)) continue;
    if (value.includes("{{")) continue;
    if (/^https?:/i.test(value)) continue;
    values.push(value.replace(/[?#].*$/, ""));
  }
  return values;
}

async function ensureLocalAssetsExist(html, file) {
  const assets = new Set(localAssetCandidates(html));
  for (const asset of assets) {
    const relative = asset.slice(localPrefix.length);
    const assetPath = path.join(root, relative);
    await access(assetPath).catch(() => {
      throw new Error(`${file}: missing local asset ${asset}`);
    });
  }
}

const canonicalSeen = new Set();

for (const entryItem of ROUTE_ENTRIES) {
  const filePath = path.join(root, entryItem.file);
  const html = await readFile(filePath, "utf8");

  assert.match(html, new RegExp(`<html lang="ru" data-el-route-key="${entryItem.routeKey}">`), `${entryItem.file}: route key mismatch`);
  assert.equal(extractSingle(html, /<title>([^<]+)<\/title>/, "title", entryItem.file), entryItem.title);
  assert.equal(extractSingle(html, /<meta name="description" content="([^"]+)">/, "description", entryItem.file), entryItem.description);
  assert.equal(extractSingle(html, /<meta property="og:title" content="([^"]+)">/, "og:title", entryItem.file), entryItem.title);
  assert.equal(extractSingle(html, /<meta property="og:description" content="([^"]+)">/, "og:description", entryItem.file), entryItem.description);
  assert.equal(extractSingle(html, /<link rel="canonical" href="([^"]+)">/, "canonical", entryItem.file), entryItem.canonicalUrl);
  assert.equal(extractSingle(html, /<meta property="og:url" content="([^"]+)">/, "og:url", entryItem.file), entryItem.canonicalUrl);
  assert.equal(extractSingle(html, /<meta name="robots" content="([^"]+)">/, "robots", entryItem.file), entryItem.noindex ? "noindex,follow" : "index,follow");
  assert.match(html, /window\.__EASYLINE_VARIANT__ = "2\.2\.3"/, `${entryItem.file}: variant marker changed`);
  assert.match(html, /const IS_022 = \['2\.2', '2\.2\.1', '2\.2\.2', '2\.2\.3'\]\.includes\(HANDOFF_VARIANT\);/, `${entryItem.file}: 2.2.3 route compatibility missing`);
  assert.match(html, /window\.__EASYLINE_SITE_ORIGIN__ = "https:\/\/moseskm98-code\.github\.io"/, `${entryItem.file}: production origin missing`);
  assert.match(html, /<script src="\/easyline-site\/assets\/static-route-head\.js"><\/script>/, `${entryItem.file}: runtime metadata patch missing`);
  assert.equal(html.split(demoFooter).length - 1, 1, `${entryItem.file}: demo footer must appear exactly once`);
  assert.ok(!html.includes(neutralFooter), `${entryItem.file}: neutral footer still present`);
  assert.equal(html.split(mapPlaceholder).length - 1, 1, `${entryItem.file}: map placeholder must appear exactly once`);

  if (!entryItem.noindex) {
    assert.ok(!canonicalSeen.has(entryItem.canonicalUrl), `${entryItem.file}: duplicate canonical ${entryItem.canonicalUrl}`);
    canonicalSeen.add(entryItem.canonicalUrl);
  }

  await ensureLocalAssetsExist(html, entryItem.file);
}

assert.equal(PUBLIC_ROUTE_ENTRIES.length, 44, "expected 44 public non-404 routes");
assert.equal(ROUTE_ENTRIES.length, 46, "expected 46 html entries including 404 variants");

const sitemap = await readFile(path.join(root, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.equal(sitemapUrls.length, 44, "sitemap route count mismatch");
assert.deepEqual(sitemapUrls, PUBLIC_ROUTE_ENTRIES.map((entryItem) => entryItem.canonicalUrl), "sitemap order/content mismatch");
assert.ok(!sitemap.includes("/404/"), "sitemap must exclude /404/");

const runtimePath = path.join(root, "assets", "static-route-head.js");
const runtime = await readFile(runtimePath, "utf8");
assert.match(runtime, /Протокол питания вместо диеты — EasyLine/, "home runtime title mismatch");
assert.match(runtime, /document\.documentElement\.dataset\.elRouteKey/, "route key runtime sync missing");
assert.match(runtime, /meta\[property="og:url"\]/, "runtime og:url sync missing");
assert.match(runtime, /link\[rel="canonical"\]/, "runtime canonical sync missing");
assert.match(runtime, /noindex,follow/, "runtime 404 robots sync missing");
assert.match(runtime, /window\.__EASYLINE_STATIC_HEAD_SYNC__ = syncStaticRouteHead/, "runtime global sync hook missing");
assert.doesNotMatch(runtime, /new MutationObserver/, "runtime must not run a competing MutationObserver loop");

const runtimeStat = await stat(runtimePath);
assert.ok(runtimeStat.size > 0, "runtime metadata patch is empty");

const bundle = await readFile(bundlePath, "utf8");
const delegator = 'function at(){const m=window.__EASYLINE_STATIC_HEAD_SYNC__;if(typeof m=="function"&&m())return;var z,v;';
const delegatorCount = bundle.split(delegator).length - 1;
assert.equal(delegatorCount, 1, "compiled bundle delegator insertion count mismatch");
