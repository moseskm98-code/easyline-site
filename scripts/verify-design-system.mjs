#!/usr/bin/env node

import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogRoot = path.join(root, "design-system");

const requiredFiles = [
  "design-system/index.html",
  "design-system/tokens.css",
  "design-system/styles.css",
  "design-system/app.js",
  "design-system/README.md",
  "assets/logo-Ddt-JyRw.svg",
  "assets/logo-cream-D09r1U-t.svg",
  "assets/phosphor-user-circle.svg",
  "assets/photos/home-hero-ration-day.jpg",
  "assets/photos/protocol-protokol-28.jpg",
  "assets/photos/box-bulgur-kurica.jpg",
  "assets/photos/article-belok.jpg",
];

for (const relativePath of requiredFiles) {
  await access(path.join(root, relativePath));
}

const [html, tokens, styles, script] = await Promise.all([
  readFile(path.join(catalogRoot, "index.html"), "utf8"),
  readFile(path.join(catalogRoot, "tokens.css"), "utf8"),
  readFile(path.join(catalogRoot, "styles.css"), "utf8"),
  readFile(path.join(catalogRoot, "app.js"), "utf8"),
]);

const requiredSections = ["foundations", "components", "patterns", "accessibility"];
for (const id of requiredSections) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Не найден раздел #${id}`);
}

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicateIds.length) throw new Error(`Повторяющиеся id: ${[...new Set(duplicateIds)].join(", ")}`);

for (const anchor of html.matchAll(/href="#([^"]+)"/g)) {
  if (!ids.includes(anchor[1])) throw new Error(`Якорь #${anchor[1]} не имеет целевого раздела`);
}

const publishedTokens = {
  "--el-color-primary": "#8e242e",
  "--el-color-primary-hover": "#74202a",
  "--el-color-link": "#0f4d7a",
  "--el-color-ink": "#23333d",
  "--el-color-meta": "#536f8a",
  "--el-color-surface": "#f8fbfd",
  "--el-color-border": "#b8d2e1",
  "--el-color-soft": "#bddced",
  "--el-color-soft-alt": "#e4f0f7",
  "--el-color-focus": "#f8e083",
};

for (const [name, value] of Object.entries(publishedTokens)) {
  const pattern = new RegExp(`${name}\\s*:\\s*${value}`, "i");
  if (!pattern.test(tokens)) throw new Error(`Токен ${name} не совпадает с публикацией`);
}

for (const marker of [
  "Bebas Neue EasyLine",
  "Nunito EasyLine",
  "@media (max-width: 600px)",
  "@media (prefers-reduced-motion: reduce)",
  ":focus-visible",
]) {
  if (!`${tokens}\n${styles}`.includes(marker)) throw new Error(`Не найден обязательный маркер: ${marker}`);
}

for (const assetPath of html.matchAll(/(?:src|href)="(\.\.\/assets\/[^"?#]+)"/g)) {
  await access(path.resolve(catalogRoot, assetPath[1]));
}

if (/https?:\/\/[^"')\s]+\.(?:png|jpe?g|webp|svg)/i.test(html)) {
  throw new Error("В каталоге обнаружен внешний графический ассет");
}

if (!html.includes('role="status"') || !html.includes('aria-live="polite"')) {
  throw new Error("Статус копирования должен объявляться вспомогательным технологиям");
}

if (!script.includes("navigator.clipboard") || !script.includes("IntersectionObserver")) {
  throw new Error("Интерактивный слой каталога неполон");
}

console.log("PASS: дизайн-система EasyLine прошла статическую проверку");
console.log(`PASS: ${requiredFiles.length} обязательных файлов доступны`);
console.log(`PASS: ${Object.keys(publishedTokens).length} цветовых токенов совпадают с публикацией`);
console.log(`PASS: ${ids.length} уникальных HTML id и локальные якоря валидны`);
