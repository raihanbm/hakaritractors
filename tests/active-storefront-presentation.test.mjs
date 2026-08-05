import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('storefront V5 loads the pixel-locked production shell', async () => {
  const html = await read('index.html');
  assert.match(html, /assets\/css\/main\.css\?v=pixel-v5/);
  assert.match(html, /assets\/js\/app\.js\?v=pixel-v5/);
  assert.doesNotMatch(html, /marketplace\.css|exploded-sheet\.css|storefront-v4-layout-lock/);
  for (const id of ['globalSearchForm', 'modelStripLinks', 'app', 'cartDrawer', 'modalBackdrop']) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
  assert.match(html, /SHOP BY TRACTOR MODEL/);
  assert.match(html, /Request a Quote \(RFQ\)/);
});

test('V5 baseline geometry preserves 216px catalog side filter, four cards and detail split', async () => {
  const css = await read('assets/css/main.css');
  assert.match(css, /\.hk-catalog-layout\{display:grid;grid-template-columns:216px minmax\(0,1fr\)/);
  assert.match(css, /\.hk-product-grid\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)/);
  assert.match(css, /\.hk-detail-grid\{display:grid;grid-template-columns:minmax\(0,1\.12fr\) minmax\(480px,\.88fr\)/);
  assert.match(css, /\.hk-parts-table\{/);
  assert.match(css, /\.hk-hero-search\{/);
  assert.match(css, /@media\(max-width:1180px\)[\s\S]*?\.hk-detail-grid\{grid-template-columns:1fr/);
  assert.match(css, /@media\(max-width:820px\)[\s\S]*?\.hk-product-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /@media\(max-width:560px\)[\s\S]*?\.hk-product-grid\{grid-template-columns:1fr/);
});

test('V5 main stylesheet owns the active presentation components', async () => {
  const css = await read('assets/css/main.css');
  for (const selector of ['.hk-product-card', '.hk-product-card-img', '.hk-detail-grid', '.hk-hero', '.hk-part-stepper']) {
    assert.ok(css.includes(selector), `${selector} should be owned by main.css`);
  }
});
