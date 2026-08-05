import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const app = await readFile(new URL('../assets/js/app.js', import.meta.url), 'utf8');

test('public exploded rows consume Internal Hikari price, stock, publication and custom-part controls', () => {
  assert.match(app, /state\.partControls = control\?\.parts \|\| \{\}/);
  assert.match(app, /admin_publish_status/);
  assert.match(app, /estimated_usd: control\?\.price == null \? sourcePrice : Number\(control\.price\) \* factor/);
  assert.match(app, /control\?\.currency === 'IDR'/);
  assert.match(app, /control\?\.custom/);
  assert.match(app, /admin_stock: control\?\.stock/);
  assert.match(app, /admin_publish_status === 'published'/);
});

test('catalog controls refresh in the background and when the tab returns', () => {
  assert.match(app, /let catalogRefreshPromise = null/);
  assert.match(app, /async function refreshCatalogControl/);
  assert.match(app, /visibilitychange/);
  assert.match(app, /300_000/);
  assert.match(app, /window\.setInterval\(\(\) => refreshCatalogControl\(\), 300_000\)/);
});
