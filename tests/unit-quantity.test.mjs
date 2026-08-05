import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../assets/js/app.js', import.meta.url), 'utf8');
const sheet = JSON.parse(readFileSync(new URL('../assets/data/sheets/L3608-D10100-main-shaft.json', import.meta.url), 'utf8'));

test('diagram quantity is preserved as fitment guidance while price and cart remain per piece', () => {
  assert.ok(sheet.parts.every((part) => Number(part.quantity) >= 1));
  assert.match(app, /function partPrice\(part\) \{\s*return Number\(part\?\.estimated_usd\) \|\| 0;/);
  assert.match(app, /qty: 1/);
  assert.match(app, /Diagram qty \$\{Number\(part\.quantity\) \|\| 1\}/);
  assert.match(app, /\$\{money\(item\.price\)\} each/);
  assert.doesNotMatch(app, /partPrice\(part\)\s*\*\s*part\.quantity/);
});
