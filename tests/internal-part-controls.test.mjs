import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const app = await readFile(new URL('../assets/js/app.js', import.meta.url), 'utf8');

test('public exploded rows consume Internal Hikari price, stock, and publication controls', () => {
  assert.match(app, /partControls=control\?\.parts\|\|\{\}/);
  assert.match(app, /admin_publish_status/);
  assert.match(app, /estimated_usd:control\?\.price==null\?sourcePrice:control\.price\*factor/);
  assert.match(app, /currency==="IDR"/);
  assert.match(app, /control\?\.custom/);
  assert.match(app, /admin_stock:control\?\.stock/);
  assert.match(app, /admin_publish_status!=="published"/);
  assert.match(app, /setInterval\(refreshCatalogControl,300000\)/);
  assert.match(app, /visibilitychange/);
  assert.match(app, /catalogRefreshPromise/);
});
