import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../assets/css/main.css', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../assets/js/app.js', import.meta.url), 'utf8');

test('V5 uses one pixel-lock presentation stylesheet with no legacy layout injection', () => {
  assert.match(html, /assets\/css\/main\.css\?v=pixel-v5/);
  assert.doesNotMatch(html, /storefront-v4-layout-lock|marketplace\.css|exploded-sheet\.css/);
  assert.doesNotMatch(app, /storefront-v4-layout-lock/);
});

test('V5 desktop baseline locks homepage and catalog grid geometry', () => {
  assert.match(css, /--hero-h:236px/);
  assert.match(css, /\.hk-model-cards\{display:grid;grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);
  assert.match(css, /\.hk-system-cards\{display:grid;grid-template-columns:repeat\(7,minmax\(0,1fr\)\)/);
  assert.match(css, /\.hk-assembly-row\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(css, /\.hk-product-grid\{display:grid;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(css, /@media\(max-width:1380px\).*?\.hk-product-grid\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/s);
});

test('V5 diagram layout retains a side-by-side viewer and compact parts stepper', () => {
  assert.match(css, /\.hk-detail-grid\{display:grid;grid-template-columns:minmax\(0,1\.12fr\) minmax\(480px,\.88fr\)/);
  assert.match(css, /\.hk-parts-table th\{position:sticky;top:0/);
  assert.match(css, /\.hk-part-stepper\{display:inline-flex/);
  assert.match(app, /data-stepper-action/);
});
