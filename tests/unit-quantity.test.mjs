import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../assets/js/app.js', import.meta.url), 'utf8');
const extractor = readFileSync(new URL('../../internalhikaritractors/scripts/extract_exploded_sheets.py', import.meta.url), 'utf8');

test('diagram Qty is buyer-facing assembly guidance while every listed price and cart action remains per piece', () => {
  assert.ok(app.includes('Jual satuan'), 'part rows must say that the product is sold individually');
  assert.ok(app.includes('kebutuhan per set'), 'cart metadata must retain assembly guidance');
  assert.ok(app.includes('Kebutuhan per set: ${part.quantity} pcs'), 'cart metadata must retain assembly guidance in buyer language');
  assert.ok(app.includes('Harga / pcs'), 'price must be labelled as a per-piece price');
  assert.ok(app.includes('Tambah 1 pcs'), 'cart action must state that it adds one sellable piece');
  assert.ok(extractor.includes('return round(base + variation)'), 'estimated price must be per individual sellable unit');
  assert.equal(extractor.includes('* max(1, quantity)'), false, 'PDF requirement must not multiply the unit price');
});
