import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('storefront keeps the approved pixel-exact production shell with current cache markers', async () => {
  const html = await read('index.html');
  assert.match(html, /assets\/css\/main\.css\?v=hikari-parts-illustrations-v6/);
  assert.match(html, /assets\/css\/pixel-exact-home\.css\?v=hikari-parts-illustrations-v6/);
  assert.match(html, /assets\/js\/app\.js\?v=hikari-parts-illustrations-v6/);
  assert.doesNotMatch(html, /preview-data\.js/);
  for (const id of ['globalSearchForm', 'modelStripLinks', 'app', 'cartDrawer', 'modalBackdrop']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /SHOP BY TRACTOR MODEL/);
  assert.match(html, /Request a Quote \(RFQ\)/);
});

test('responsive catalog and diagram layouts match the approved dense marketplace direction', async () => {
  const css = await read('assets/css/main.css');
  assert.match(css, /\.catalog-layout\{[^}]*grid-template-columns:218px minmax\(0,1fr\)/);
  assert.match(css, /\.assembly-grid\{[^}]*grid-template-columns:repeat\(4,minmax\(0,1fr\)/);
  assert.match(css, /\.detail-grid\{[^}]*grid-template-columns:minmax\(0,1\.12fr\) minmax\(500px,\.88fr\)/);
  assert.match(css, /\.parts-table\{/);
  assert.match(css, /\.hero-search-panel\{/);
  assert.match(css, /@media\(max-width:820px\)[\s\S]*?\.assembly-grid\{grid-template-columns:repeat\(2,1fr\)/);
  assert.match(css, /@media\(max-width:520px\)[\s\S]*?\.assembly-grid\{grid-template-columns:1fr/);
  assert.match(css, /@media\(max-width:520px\)[\s\S]*?\.brand span\{display:none\}/);
});

test('storefront remains one coherent stylesheet without stale card overrides', async () => {
  const css = await read('assets/css/main.css');
  for (const selector of ['.product-card', '.product-card-image', '.product-info', '.detail-grid']) {
    assert.ok(css.includes(selector), `${selector} should be owned by main.css`);
  }
});

test('published diagram and PDF assets stay on the storefront instead of a lagging API proxy', async () => {
  const js = await read('assets/js/app.js');
  assert.match(js, /assets\/diagrams\//);
  assert.match(js, /assets\/documents\//);
});

test('catalog uses clean parts illustrations with inline filters and no fake gallery or list mode', async () => {
  const html = await read('index.html');
  const js = await read('assets/js/app.js');
  const css = await read('assets/css/main.css');
  const cropScript = await read('scripts/generate-card-diagram-crops.py');
  assert.match(html, />Parts Illustrations</);
  assert.doesNotMatch(html, /data-nav="catalog">Parts <svg/);
  assert.match(js, /showAllModels/);
  assert.match(js, /data-toggle-models/);
  assert.match(js, /data-toggle-categories/);
  assert.doesNotMatch(js, /id="listViewButton"/);
  assert.doesNotMatch(js, /class="diagram-nav/);
  assert.doesNotMatch(js, /class="diagram-thumbs/);
  assert.match(js, /ILUSTRASI KOMPONEN/);
  assert.match(js, /Download Source PDF/);
  assert.match(css, /\.product-card-image img\{[^}]*object-fit:contain!important/);
  assert.match(css, /\.diagram-stage img\{[^}]*object-fit:contain/);
  assert.match(cropScript, /CANVAS = \(760, 420\)/);
  assert.match(cropScript, /product\.get\("fullImage"\)/);
});

test('parts table keeps price visible in a compact part-name cell', async () => {
  const js = await read('assets/js/app.js');
  const css = await read('assets/css/main.css');
  assert.match(js, /const priceLabel = Number\(part\.estimated_usd\)/);
  assert.match(js, /class="part-price"/);
  assert.match(css, /\.part-price\{/);
  assert.match(css, /\.part-name>span\{[^}]*text-overflow:ellipsis/);
});

test('homepage SEO identifies Hikari Tractors Indonesia and Kubota references safely', async () => {
  const html = await read('index.html');
  assert.match(html, /<title>Hikari Tractors Indonesia \| Kubota Tractor Parts Reference<\/title>/);
  assert.match(html, /Find Kubota tractor parts by model, part number, and exploded diagram/);
  assert.match(html, /Hikari Tractors Indonesia/);
  assert.match(html, /assets\/images\/hikari-logo\.png/);
  assert.match(html, /application\/ld\+json/);
  assert.doesNotMatch(html, /100% Genuine|Official Kubota|Authorized Kubota/);
});

test('mobile navigation escapes the hidden desktop header and closes predictably', async () => {
  const css = await read('assets/css/pixel-exact-home.css');
  const mainCss = await read('assets/css/main.css');
  const js = await read('assets/js/app.js');
  assert.match(css, /@media\(max-width:760px\)[\s\S]*?\.header-nav-wrap\{display:block!important/);
  assert.match(css, /\.main-nav\.open\{position:fixed!important;top:56px!important/);
  assert.match(mainCss, /@media\(max-width:760px\)[\s\S]*?\.parts-table\{min-width:0!important;width:100%;table-layout:fixed!important/);
  assert.match(mainCss, /\.parts-table th:nth-child\(8\),\.parts-table td:nth-child\(8\)\{width:52px/);
  assert.match(js, /const setMobileNav = open =>/);
  assert.match(js, /setMobileNav\(false\); if \(parseRoute\(\)\.name !== 'home'\)/);
});
