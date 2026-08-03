import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const app = readFileSync(new URL('assets/js/app.js', root), 'utf8');
const catalog = JSON.parse(readFileSync(new URL('assets/data/drive-catalog.json', root), 'utf8'));
const mainShaft = JSON.parse(readFileSync(new URL('assets/data/sheets/L3608-D10100-main-shaft.json', root), 'utf8'));
const searchPath = new URL('assets/data/sheets-search.json', root);

test('part-number search indexes sparepart rows, not only assembly diagram codes', () => {
  assert.ok(existsSync(searchPath), 'assets/data/sheets-search.json must be generated for storefront part-number search');
  const search = JSON.parse(readFileSync(searchPath, 'utf8'));
  const main = catalog.products.find((item) => item.sheetId === 'L3608-D10100-main-shaft');
  assert.ok(main, 'Main Shaft assembly card must exist');
  assert.ok(mainShaft.parts.some((part) => part.part_number === 'TC422-21514'));
  assert.ok(search.partNumbers['tc422-21514'].includes(main.sheetId));
  assert.equal(search.sheets[main.sheetId].matches.some((m) => m.part_number === 'TC422-21514'), true);
});

test('storefront search uses sparepart row index and can show results without preselecting tractor', () => {
  assert.ok(app.includes('sheetSearchIndex'), 'app should load a sheet part search index');
  assert.ok(app.includes('matchesPartSearch'), 'filtering should search parsed sparepart rows');
  assert.ok(app.includes('hasSearchQuery'), 'search should unlock catalog even before selecting a model');
  assert.ok(app.includes('partMatchBadge'), 'cards should explain why a part-number search matched a diagram');
});
