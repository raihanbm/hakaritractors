import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("active storefront route loads the consolidated technical-commerce stylesheet", async () => {
  const html = await read("index.html");
  assert.match(html, /assets\/css\/main\.css\?v=storefront-v3-2"/);
  assert.match(html, /id="categoryStrip"/);
  assert.match(html, /id="productGrid"/);
  assert.match(html, /id="filtersPanel"/);
  assert.match(html, /id="paginationTop"/);
  assert.match(html, /id="recentViewTop"/);
});

test("active selectors implement a visibly compact responsive catalog", async () => {
  const css = await read("assets/css/main.css");
  assert.match(css, /--header-h:52px/);
  assert.match(css, /\.hero\{[^}]*min-height:260px/);
  assert.match(css, /\.category-strip\{[^}]*repeat\(auto-fit,minmax\(140px,1fr\)\)/);
  assert.match(css, /\.catalog-shell\{[^}]*grid-template-columns:220px minmax\(0,1fr\)/);
  assert.match(css, /\.product-grid\{[^}]*repeat\(4,minmax\(0,1fr\)\)[^}]*gap:10px/);
  assert.match(css, /\.product-img img\{[^}]*object-fit:contain/);
  assert.match(css, /\.cat-card small\{[^}]*line-height:1\.1[^}]*white-space:normal/);
  assert.match(css, /@media\(max-width:1180px\)\{[\s\S]*?\.product-grid\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /@media\(max-width:820px\)\{[\s\S]*?\.product-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /@media\(max-width:520px\)\{[\s\S]*?\.product-grid\{grid-template-columns:1fr/);
  assert.match(css, /@media\(max-width:520px\)\{[\s\S]*?\.site-header \.brand-copy\{display:none\}/);
});

test("diagram-only stylesheet cannot override active catalog cards", async () => {
  const css = await read("assets/css/exploded-sheet.css");
  for (const selector of [".product-grid", ".product-card", ".product-body", ".product-name"]) {
    assert.equal(css.includes(selector), false, `${selector} must stay in main.css`);
  }
});
