#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PUBLIC_ROUTE_ENTRIES, ROUTE_ENTRIES, SITE_BASE, SITE_ORIGIN } from "./site-metadata.mjs";

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
<script>window.__EASYLINE_VARIANT__ = "2.2.3";window.__EASYLINE_SITE_ORIGIN__ = "${SITE_ORIGIN}";window.__EASYLINE_STATIC_ROUTE_KEY__ = "${entryItem.routeKey}";</script>
<script src="/easyline-site/vendor/react.production.min.js"></script>
<script src="/easyline-site/vendor/react-dom.production.min.js"></script>
<link rel="preload" href="/easyline-site/assets/nunito-variable-cyrillic.ttf" as="font" type="font/ttf" crossorigin>
<link rel="preload" href="/easyline-site/assets/bebas-neue-regular-mhMkEidK.ttf" as="font" type="font/ttf" crossorigin>
<link rel="preload" href="/easyline-site/assets/bebas-neue-bold-DqarbXCh.ttf" as="font" type="font/ttf" crossorigin>
<link rel="preload" href="/easyline-site/assets/podkova-variable-DYz2L4Pv.ttf" as="font" type="font/ttf" crossorigin>
<link rel="stylesheet" href="/easyline-site/assets/first-frame-init.css">
<script src="/easyline-site/assets/first-frame-init.js"></script>
<script type="module" crossorigin src="/easyline-site/assets/index-Dwt8uDxZ.js?v=version-2.2.3-20260904"></script>
<script src="/easyline-site/assets/static-route-head.js"></script>
<script type="module">import {normalizePhone,submitInquiry} from "/easyline-site/lead-form.js";window.__EASYLINE_LEADS__=Object.freeze({normalizePhone,submitInquiry});</script>
<link rel="stylesheet" crossorigin href="/easyline-site/assets/index-BmA-8PXs-v222.css">
<link rel="stylesheet" href="/easyline-site/assets/readability-overrides.css">
<link rel="stylesheet" href="/easyline-site/assets/light-mode-only.css">
<link rel="stylesheet" href="/easyline-site/assets/accessible-digital.css">
<link rel="stylesheet" href="/easyline-site/assets/layout-stage-preview.css">
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
  const patchedSignature = `function at(){${bundleDelegator}var z,v;`;
  if (original.includes(patchedSignature)) return;

  const unpatchedSignature = "function at(){var z,v;";
  const matches = original.split(unpatchedSignature).length - 1;
  if (matches !== 1) throw new Error(`Expected one compiled at() signature, found ${matches}`);
  await writeFile(compiledBundlePath, original.replace(unpatchedSignature, patchedSignature));
}

async function writePages() {
  const template = await readFile(path.join(root, "index.html"), "utf8");
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
