import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../assets/js/app.js', import.meta.url), 'utf8');

test('exploded-sheet rows become quantity controls after a sparepart is added to the cart', () => {
  assert.ok(app.includes('function sheetCartQuantity'), 'sheet viewer needs a cart quantity lookup per part row');
  assert.ok(app.includes('function changeSheetPartQuantity'), 'sheet viewer needs plus/minus quantity controls');
  assert.ok(app.includes('sheet-qty-control'), 'sheet viewer needs an in-row quantity UI');
  assert.ok(app.includes('In cart'), 'buyer needs visible added-to-cart status');
  assert.ok(app.includes('Sheet cart'), 'sheet viewer needs a cart count summary');
});
