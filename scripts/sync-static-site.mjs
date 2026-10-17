#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

import { PUBLIC_ROUTE_ENTRIES, ROUTE_ENTRIES, SITE_BASE, SITE_ORIGIN, SITE_VERSION } from "./site-metadata.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const compiledBundlePath = path.join(root, "assets", "index-Dwt8uDxZ.js");
const bundleDelegator = 'const m=window.__EASYLINE_STATIC_HEAD_SYNC__;if(typeof m=="function"&&m())return;';

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
<script>window.__EASYLINE_VARIANT__ = "${SITE_VERSION}";window.__EASYLINE_SITE_ORIGIN__ = "${SITE_ORIGIN}";window.__EASYLINE_STATIC_ROUTE_KEY__ = "${entryItem.routeKey}";window.__EASYLINE_MOTION_OWNER__ = "gentle";</script>
<script src="/easyline-site/vendor/react.production.min.js"></script>
<script src="/easyline-site/vendor/react-dom.production.min.js"></script>
<link rel="preload" href="/easyline-site/assets/nunito-variable-cyrillic.ttf" as="font" type="font/ttf" crossorigin>
<link rel="preload" href="/easyline-site/assets/bebas-neue-regular-mhMkEidK.ttf" as="font" type="font/ttf" crossorigin>
<link rel="preload" href="/easyline-site/assets/bebas-neue-bold-DqarbXCh.ttf" as="font" type="font/ttf" crossorigin>
<link rel="preload" href="/easyline-site/assets/podkova-variable-DYz2L4Pv.ttf" as="font" type="font/ttf" crossorigin>
<link rel="stylesheet" href="/easyline-site/assets/first-frame-init.css?v=${SITE_VERSION}">
<script src="/easyline-site/assets/first-frame-init.js?v=${SITE_VERSION}"></script>
<script type="module" crossorigin src="/easyline-site/assets/index-Dwt8uDxZ.js?v=${SITE_VERSION}"></script>
<script src="/easyline-site/assets/static-route-head.js"></script>
<script type="module">import {normalizePhone,submitInquiry} from "/easyline-site/lead-form.js?v=${SITE_VERSION}";window.__EASYLINE_LEADS__=Object.freeze({normalizePhone,submitInquiry});</script>
<link rel="stylesheet" crossorigin href="/easyline-site/assets/index-BmA-8PXs-v222.css">
<link rel="stylesheet" href="/easyline-site/assets/readability-overrides.css">
<link rel="stylesheet" href="/easyline-site/assets/light-mode-only.css">
<link rel="stylesheet" href="/easyline-site/assets/accessible-digital.css?v=${SITE_VERSION}">
<link rel="stylesheet" href="/easyline-site/assets/layout-stage-preview.css">
<link rel="stylesheet" href="/easyline-site/assets/menu-refresh.css?v=${SITE_VERSION}">
<link rel="stylesheet" href="/easyline-site/assets/gentle-motion.css?v=${SITE_VERSION}">
<link rel="stylesheet" href="/easyline-site/assets/customer-experience.css?v=${SITE_VERSION}">
<script defer src="/easyline-site/assets/gentle-motion.js?v=${SITE_VERSION}"></script>
<meta name="x-easyline-color-variant" content="accessible-digital">
</head>`;
}

function buildRuntime() {
  const routeMap = Object.fromEntries(
    ROUTE_ENTRIES.filter((item) => item.routeKey !== "not-found").map((item) => [
      item.routePath,
      {
        routeKey: item.routeKey,
        title: item.title,
        description: item.description,
        canonicalUrl: item.canonicalUrl,
        noindex: item.noindex,
      },
    ]),
  );
  const notFound = ROUTE_ENTRIES.find((item) => item.routeKey === "not-found");

  return `(() => {
  const siteBase = ${JSON.stringify(SITE_BASE)};
  const routeMap = ${escapeScriptJson(routeMap)};
  const notFound = ${escapeScriptJson({
    routeKey: notFound.routeKey,
    title: notFound.title,
    description: notFound.description,
    canonicalUrl: notFound.canonicalUrl,
    noindex: true,
  })};

  function normalizePathname(pathname) {
    const normalized = String(pathname || "/").replace(/\\/+$/, "") || "/";
    if (normalized === siteBase) return "/";
    if (normalized === siteBase + "/404.html" || normalized === siteBase + "/404") return "/404";
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

  function syncStaticRouteHead() {
    const path = normalizePathname(window.location.pathname);
    const entry = routeMap[path] || notFound;
    document.documentElement.dataset.elRouteKey = entry.routeKey;
    document.title = entry.title;
    ensureMeta('meta[name="description"]', { name: "description", content: entry.description });
    ensureMeta('meta[name="robots"]', { name: "robots", content: entry.noindex ? "noindex,follow" : "index,follow" });
    ensureMeta('meta[property="og:title"]', { property: "og:title", content: entry.title });
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
  let patched = original.replaceAll("Протокол", "Рацион").replaceAll("протокол", "рацион");
  const patchedSignature = `function at(){${bundleDelegator}var z,v;`;
  if (!patched.includes(patchedSignature)) {
    const unpatchedSignature = "function at(){var z,v;";
    const matches = patched.split(unpatchedSignature).length - 1;
    if (matches !== 1) throw new Error(`Expected one compiled at() signature, found ${matches}`);
    patched = patched.replace(unpatchedSignature, patchedSignature);
  }

  // Published content must never wait for scroll thresholds or motion timers.
  const previousMotion = 'L=Object.freeze({motionPreset:"soft",motionDuration:650,motionDistance:28,motionStagger:80,scrollReveal:!0,repeatReveal:!0,parallaxPreset:"depth",parallaxStrength:38,parallaxSmoothing:10,ambientPreset:"breathe",ambientSpeed:9,ambientIntensity:6})';
  const immediateMotion = 'L=Object.freeze({motionPreset:"none",motionDuration:0,motionDistance:0,motionStagger:0,scrollReveal:!1,repeatReveal:!1,parallaxPreset:"none",parallaxStrength:0,parallaxSmoothing:10,ambientPreset:"none",ambientSpeed:9,ambientIntensity:0})';
  if (!patched.includes(immediateMotion)) {
    const matches = patched.split(previousMotion).length - 1;
    if (matches !== 1) throw new Error(`Expected one published motion configuration, found ${matches}`);
    patched = patched.replace(previousMotion, immediateMotion);
  }
  // Static pages use one motion controller. The old one also registers classes
  // and scroll listeners when all of its effects are configured as disabled.
  const legacyMotionStart = '(()=>{const j=document.documentElement,G=window.matchMedia("(prefers-reduced-motion: reduce)"),L=Object.freeze(';
  const ownedMotionStart = '(()=>{if(window.__EASYLINE_MOTION_OWNER__==="gentle")return;const j=document.documentElement,G=window.matchMedia("(prefers-reduced-motion: reduce)"),L=Object.freeze(';
  if (!patched.includes(ownedMotionStart)) {
    const matches = patched.split(legacyMotionStart).length - 1;
    if (matches !== 1) throw new Error(`Expected one legacy motion controller, found ${matches}`);
    patched = patched.replace(legacyMotionStart, ownedMotionStart);
  }
  if (patched !== original) await writeFile(compiledBundlePath, patched);
}

async function writePages() {
  const [page, retained, logic, cart, rawCatalog, home, catalogs, cartPages, productCard, quantity, customerState] = await Promise.all(
    ["page.html", "retained-content.js", "site-logic.js", "cart.js", "catalog.json", "home.html", "catalogs.html", "cart-pages.html", "product-card.html", "quantity.html", "customer-state.mjs"]
      .map((file) => readFile(path.join(root, "src", file), "utf8")),
  );
  const catalog = JSON.parse(rawCatalog);
  if (catalog.items.length !== 39 || new Set(catalog.items.map((item) => item.id)).size !== 39) {
    throw new Error("Catalog must contain 39 unique positions");
  }
  for (const item of catalog.items) {
    if (item.priceRub !== null && (!Number.isFinite(item.priceRub) || item.priceRub <= 0)) throw new Error(`Invalid price: ${item.id}`);
    if (item.image) await readFile(path.join(root, item.image.replace(/^\/easyline-site\//, "")));
  }
  const catalogModule = `// Generated from src/catalog.json and src/cart.js.\nexport const CATALOG = ${escapeScriptJson(catalog.items)};\nexport const CATEGORIES = ${escapeScriptJson(catalog.categories)};\n${cart}`;
  const catalogAsset = `menu-catalog-${createHash("sha256").update(catalogModule).digest("hex").slice(0, 12)}.js`;
  await writeFile(path.join(root, "assets", catalogAsset), catalogModule);
  const template = page
    .replace("<!-- NEW_HOME_AND_CATALOGS -->", [home, catalogs, cartPages].join("\n"))
    .replaceAll("<!-- PRODUCT_CARD -->", productCard)
    .replaceAll("<!-- QUANTITY_CONTROL -->", quantity)
    .replace("<!-- EASYLINE_LOGIC -->", retained + "\n" + customerState.replace(/^export /gm, "") + "\n" + logic.replace("__CATALOG_ASSET__", catalogAsset));
  for (const entryItem of ROUTE_ENTRIES) {
    const html = template
      .replace(/<html lang="ru"(?:\s+data-el-route-key="[^"]*")?>/, `<html lang="ru" data-el-route-key="${entryItem.routeKey}">`)
      .replace(/<head>[\s\S]*?<\/head>/, buildHead(entryItem));
    const filePath = path.join(root, entryItem.file);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, html);
  }
}

async function writeSitemap() {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PUBLIC_ROUTE_ENTRIES.map((item) => `  <url><loc>${item.canonicalUrl}</loc></url>`).join("\n")}
</urlset>
`;
  await writeFile(path.join(root, "sitemap.xml"), sitemap);
}

await writePages();
await writeSitemap();
await writeFile(path.join(root, "assets", "static-route-head.js"), buildRuntime());
await patchCompiledBundle();
