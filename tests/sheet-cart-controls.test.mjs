import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../assets/js/app.js', import.meta.url), 'utf8');

test('exploded-sheet rows become visible RFQ controls and support quantity updates', () => {
  assert.match(app, /function cartItemForKey/);
  assert.match(app, /function addPartToCart/);
  assert.match(app, /data-add-part/);
  assert.match(app, /In RFQ \(\$\{inCart\.qty\}\)/);
  assert.match(app, /class="qty-control"/);
  assert.match(app, /data-cart-action="minus"/);
  assert.match(app, /data-cart-action="plus"/);
  assert.match(app, /data-cart-action="remove"/);
});

test('detail view can add selected, visible and individual parts', () => {
  assert.match(app, /selectedPartKeys/);
  assert.match(app, /addAllVisible/);
  assert.match(app, /state\.selectedPartKeys\.size/);
  assert.match(app, /selectedPartKeys\.has/);
});
