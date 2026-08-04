import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("active storefront route loads the consolidated technical-commerce stylesheet", async () => {
  const html = await read("index.html");
  assert.match(html, /assets\/css\/main\.css\?v=marketplace-v1"/);
  assert.match(html, /assets\/css\/marketplace\.css\?v=marketplace-v1"/);
  assert.match(html, /assets\/js\/app\.js\?v=marketplace-v1"/);
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

test("storefront uses a marketplace-first catalog flow instead of a marketing-first landing flow", async () => {
  const html = await read("index.html");
  assert.match(html, /class="marketplace-searchbar"/);
  assert.match(html, /class="catalog-flow"/);
  assert.match(html, /class="catalog-flow-step active"/);
  assert.match(html, /class="catalog-stage-head"/);
  assert.match(html, /assets\/css\/main\.css\?v=marketplace-v1"/);
});

test("assembly cards have a stable marketplace anatomy", async () => {
  const app = await read("assets/js/app.js");
  const css = await read("assets/css/marketplace.css");
  assert.match(app, /class="assembly-card-head"/);
  assert.match(app, /class="assembly-code"/);
  assert.match(app, /class="assembly-fitment"/);
  assert.match(app, /class="assembly-card-foot"/);
  assert.match(css, /\.product-card\{[^}]*grid-template-rows:/);
  assert.match(css, /\.product-name\{[^}]*-webkit-line-clamp:2/);
  assert.match(css, /\.product-body\{[^}]*grid-template-rows:/);
  assert.match(css, /@media\(max-width:520px\)[\s\S]*\.catalog-flow\{min-width:0;width:100%;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
});

test("catalog flow visibly advances from tractor to diagram to RFQ", async () => {
  const html = await read("index.html");
  const app = await read("assets/js/app.js");
  assert.match(html, /data-flow-step="1"/);
  assert.match(html, /data-flow-step="4"/);
  assert.match(app, /function updateCatalogFlow\(/);
  assert.match(app, /classList\.toggle\("done"/);
  assert.match(app, /updateCatalogFlow\(3\)/);
  assert.match(app, /updateCatalogFlow\(4\)/);
  assert.match(app, /function currentCatalogFlowStage\(\)/);
  assert.match(app, /function closeModal\(\)[^\n]*updateCatalogFlow\(\)/);
  assert.match(app, /state\.cart=\[\];[^\n]*updateCatalogFlow\(\)/);
});

test("responsive QA fails closed on visual or runtime regressions", async () => {
  const qa = await read("scripts/browser-responsive-qa.mjs");
  assert.match(qa, /QA_ALLOW_API_FALLBACK/);
  assert.match(qa, /overflowX > 0/);
  assert.match(qa, /cards < 1/);
  assert.match(qa, /throw new Error\(`Responsive QA failed/);
});
