import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('storefront keeps the approved pixel-exact production shell with current cache markers', async () => {
  const html = await read('index.html');
  assert.match(html, /assets\/css\/main\.css\?v=hikari-ui-professional-v2/);
  assert.match(html, /assets\/css\/pixel-exact-home\.css\?v=hikari-ui-professional-v2/);
  assert.match(html, /assets\/js\/app\.js\?v=hikari-ui-professional-v2/);
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
