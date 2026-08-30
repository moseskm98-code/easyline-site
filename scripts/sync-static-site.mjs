#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PUBLIC_ROUTE_ENTRIES, ROUTE_ENTRIES, SITE_BASE, SITE_ORIGIN } from "./site-metadata.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const compiledBundlePath = path.join(root, "assets", "index-Dwt8uDxZ.js");
const bundleDelegator = 'const m=window.__EASYLINE_STATIC_HEAD_SYNC__;if(typeof m=="function"&&m())return;';
const demoFooter = ">© 2026 EasyLine. ИП Магомедов А. М. · ИНН 057200000000</div>";
const neutralFooter = ">© 2026 EasyLine.</div>";
const mapPlaceholder = "    { isPhoto:true, text:'карта проезда · 16:9' },";
const versionCompatBefore = "const IS_022 = ['2.2', '2.2.1', '2.2.2'].includes(HANDOFF_VARIANT);";
const versionCompatAfter = "const IS_022 = ['2.2', '2.2.1', '2.2.2', '2.2.3'].includes(HANDOFF_VARIANT);";
const mapAnchor = `    { isP:true, text:'Махачкала, ул. Ирчи Казака, 31, корпус 2. Самовывоз возможен с 7:00 до 10:00 — предупредите в приложении накануне.' },
    { isH:true, text:'Витрина и вендинг' },`;
const mapWithPlaceholder = `    { isP:true, text:'Махачкала, ул. Ирчи Казака, 31, корпус 2. Самовывоз возможен с 7:00 до 10:00 — предупредите в приложении накануне.' },
${mapPlaceholder}
    { isH:true, text:'Витрина и вендинг' },`;

function escapeScriptJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function buildHead(entryItem) {
  const robots = entryItem.noindex ? "noindex,follow" : "index,follow";
  return `<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<meta name="theme-color" content="#ffffff">
<style id="easyline-light-only">
:root{color-scheme:only light!important}
@media (prefers-color-scheme:dark){:root{color-scheme:only light!important}html,body{background-color:#fff!important;background-image:linear-gradient(#fff,#fff)!important}}
</style>
<meta name="description" content="${entryItem.description}">
<meta name="robots" content="${robots}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="EasyLine">
<meta property="og:title" content="${entryItem.title}">
<meta property="og:description" content="${entryItem.description}">
<meta property="og:url" content="${entryItem.canonicalUrl}">
<link rel="canonical" href="${entryItem.canonicalUrl}">
<title>${entryItem.title}</title>
<link rel="icon" href="/easyline-site/assets/logo-Ddt-JyRw.svg" type="image/svg+xml">
<script>window.__EASYLINE_VARIANT__ = "2.2.3";window.__EASYLINE_SITE_ORIGIN__ = "${SITE_ORIGIN}";window.__EASYLINE_STATIC_ROUTE_KEY__ = "${entryItem.routeKey}";</script>
<script  src="/easyline-site/vendor/react.production.min.js"></script>
<script  src="/easyline-site/vendor/react-dom.production.min.js"></script>
  <link rel="preload" href="/easyline-site/assets/nunito-variable-cyrillic.ttf" as="font" type="font/ttf" crossorigin>
  <link rel="preload" href="/easyline-site/assets/bebas-neue-regular-mhMkEidK.ttf" as="font" type="font/ttf" crossorigin>
  <link rel="preload" href="/easyline-site/assets/bebas-neue-bold-DqarbXCh.ttf" as="font" type="font/ttf" crossorigin>
  <link rel="preload" href="/easyline-site/assets/podkova-variable-DYz2L4Pv.ttf" as="font" type="font/ttf" crossorigin>
  <link rel="stylesheet" href="/easyline-site/assets/first-frame-init.css">
  <script src="/easyline-site/assets/first-frame-init.js"></script>
  <script type="module" crossorigin src="/easyline-site/assets/index-Dwt8uDxZ.js?v=version-2.2.3-20260830"></script>
  <script src="/easyline-site/assets/static-route-head.js"></script>
  <link rel="stylesheet" crossorigin href="/easyline-site/assets/index-BmA-8PXs-v222.css">
  <link rel="stylesheet" href="/easyline-site/assets/readability-overrides.css">
  <link rel="stylesheet" href="/easyline-site/assets/light-mode-only.css">
  <link rel="stylesheet" href="/easyline-site/assets/accessible-digital.css">
  <link rel="stylesheet" href="/easyline-site/assets/layout-stage-preview.css">
  <meta name="x-easyline-color-variant" content="accessible-digital">
</head>`;
}

function buildRuntime() {
  const publicRouteMap = Object.fromEntries(
    PUBLIC_ROUTE_ENTRIES.map((entryItem) => [
      entryItem.routePath,
      {
        routeKey: entryItem.routeKey,
        title: entryItem.title,
        description: entryItem.description,
        canonicalUrl: entryItem.canonicalUrl,
      },
    ]),
  );
  const notFoundEntry = ROUTE_ENTRIES.find((entryItem) => entryItem.routeKey === "not-found");

  return `(() => {
  const siteBase = ${JSON.stringify(SITE_BASE)};
  const productionOrigin = ${JSON.stringify(SITE_ORIGIN)};
  const routeMap = ${escapeScriptJson(publicRouteMap)};
  const notFound = ${escapeScriptJson({
    routeKey: notFoundEntry.routeKey,
    title: notFoundEntry.title,
    description: notFoundEntry.description,
    canonicalUrl: notFoundEntry.canonicalUrl,
  })};

  function normalizePathname(pathname) {
    const normalized = String(pathname || "/").replace(/\\/+$/, "") || "/";
    if (normalized === siteBase) return "/";
    if (normalized === siteBase + "/404.html") return "/404";
    if (normalized === siteBase + "/404") return "/404";
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

  function entryForCurrentPath() {
    const normalized = normalizePathname(window.location.pathname);
    return routeMap[normalized] || notFound;
  }

  function syncStaticRouteHead() {
    const entry = entryForCurrentPath();
    const h1 = document.querySelector("main h1");
    const h1Text = h1 ? h1.textContent.replace(/\\s+/g, " ").trim() : "";
    document.documentElement.dataset.elRouteKey = entry.routeKey;
    document.title = entry.routeKey === "home" ? "Протокол питания вместо диеты — EasyLine" : entry.title || (h1Text ? h1Text + " — EasyLine" : notFound.title);
    ensureMeta('meta[name="description"]', { name: "description", content: entry.description });
    ensureMeta('meta[name="robots"]', { name: "robots", content: entry === notFound ? "noindex,follow" : "index,follow" });
    ensureMeta('meta[property="og:title"]', { property: "og:title", content: document.title });
    ensureMeta('meta[property="og:description"]', { property: "og:description", content: entry.description });
    ensureMeta('meta[property="og:url"]', { property: "og:url", content: entry.canonicalUrl });
    ensureMeta('link[rel="canonical"]', { rel: "canonical", href: entry.canonicalUrl });
    return true;
  }

  window.__EASYLINE_STATIC_HEAD_SYNC__ = syncStaticRouteHead;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", syncStaticRouteHead, { once: true });
  else syncStaticRouteHead();
})();`;
}

async function patchCompiledBundle() {
  const original = await readFile(compiledBundlePath, "utf8");
  const patchedSignature = `function at(){${bundleDelegator}var z,v;`;
  if (original.includes(patchedSignature)) return;

  const unpatchedSignature = 'function at(){var z,v;';
  const matchCount = original.split(unpatchedSignature).length - 1;
  if (matchCount !== 1) {
    throw new Error(`Expected exactly one compiled at() signature, found ${matchCount}`);
  }

  const next = original.replace(unpatchedSignature, patchedSignature);
  await writeFile(compiledBundlePath, next);
}

async function rewriteHtml(entryItem) {
  const filePath = path.join(root, entryItem.file);
  const original = await readFile(filePath, "utf8");
  const footerCount = original.split(demoFooter).length - 1;
  const neutralFooterCount = original.split(neutralFooter).length - 1;
  const mapCount = original.split(mapPlaceholder).length - 1;
  const versionCompatBeforeCount = original.split(versionCompatBefore).length - 1;
  const versionCompatAfterCount = original.split(versionCompatAfter).length - 1;
  if (footerCount + neutralFooterCount !== 1) throw new Error(`${entryItem.file}: expected exactly 1 footer state, found demo=${footerCount} neutral=${neutralFooterCount}`);
  if (mapCount < 0 || mapCount > 1) throw new Error(`${entryItem.file}: expected 0 or 1 map placeholder, found ${mapCount}`);
  if (mapCount === 0 && !original.includes(mapAnchor)) throw new Error(`${entryItem.file}: map insertion anchor missing`);
  if (versionCompatBeforeCount + versionCompatAfterCount !== 1) throw new Error(`${entryItem.file}: expected exactly 1 version compatibility state, found before=${versionCompatBeforeCount} after=${versionCompatAfterCount}`);

  let next = original
    .replace(/<html lang="ru"(?:\s+data-el-route-key="[^"]*")?>/, `<html lang="ru" data-el-route-key="${entryItem.routeKey}">`)
    .replace(/<head>[\s\S]*?<\/head>/, buildHead(entryItem))
    .replace(neutralFooter, demoFooter)
    .replace(versionCompatBefore, versionCompatAfter);
  if (mapCount === 0) next = next.replace(mapAnchor, mapWithPlaceholder);

  const mapCountAfter = next.split(mapPlaceholder).length - 1;
  const demoFooterAfter = next.split(demoFooter).length - 1;
  const neutralFooterAfter = next.split(neutralFooter).length - 1;
  const versionCompatAfterCountFinal = next.split(versionCompatAfter).length - 1;
  if (mapCountAfter !== 1) throw new Error(`${entryItem.file}: expected 1 map placeholder after rewrite, found ${mapCountAfter}`);
  if (demoFooterAfter !== 1 || neutralFooterAfter !== 0) throw new Error(`${entryItem.file}: expected demo footer after rewrite, found demo=${demoFooterAfter} neutral=${neutralFooterAfter}`);
  if (versionCompatAfterCountFinal !== 1) throw new Error(`${entryItem.file}: expected 2.2.3 route compatibility after rewrite, found ${versionCompatAfterCountFinal}`);

  if (next !== original) await writeFile(filePath, next);
}

async function writeSitemap() {
  const publicUrls = PUBLIC_ROUTE_ENTRIES.map((entryItem) => entryItem.canonicalUrl);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${publicUrls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}\n</urlset>\n`;
  await writeFile(path.join(root, "sitemap.xml"), sitemap);
}

async function writeRuntime() {
  await mkdir(path.join(root, "assets"), { recursive: true });
  await writeFile(path.join(root, "assets", "static-route-head.js"), buildRuntime());
}

for (const entryItem of ROUTE_ENTRIES) {
  await rewriteHtml(entryItem);
}
await writeSitemap();
await writeRuntime();
await patchCompiledBundle();
