import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const app = readFileSync(new URL('assets/js/app.js', root), 'utf8');
const catalog = JSON.parse(readFileSync(new URL('assets/data/drive-catalog.json', root), 'utf8'));
const mainShaft = JSON.parse(readFileSync(new URL('assets/data/sheets/L3608-D10100-main-shaft.json', root), 'utf8'));
const searchPath = new URL('assets/data/sheets-search.json', root);

test('part-number index resolves spare-part rows to their assembly diagrams', () => {
  assert.ok(existsSync(searchPath));
  const search = JSON.parse(readFileSync(searchPath, 'utf8'));
  const main = catalog.products.find((item) => item.sheetId === 'L3608-D10100-main-shaft');
  assert.ok(main);
  assert.ok(mainShaft.parts.some((part) => part.part_number === 'TC422-21514'));
  assert.ok(search.partNumbers['tc422-21514'].includes(main.sheetId));
  assert.equal(search.sheets[main.sheetId].matches.some((match) => match.part_number === 'TC422-21514'), true);
});

test('global search consumes the row index and explains part matches', () => {
  assert.match(app, /state\.sheetSearch/);
  assert.match(app, /function partMatches/);
  assert.match(app, /function searchProducts/);
  assert.match(app, /Part match/);
  assert.match(app, /data-suggestion-id/);
});
