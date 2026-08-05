import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../assets/js/app.js', import.meta.url), 'utf8');
const catalog = JSON.parse(readFileSync(new URL('../assets/data/drive-catalog.json', import.meta.url), 'utf8'));
const sheetIndex = JSON.parse(readFileSync(new URL('../assets/data/sheets-index.json', import.meta.url), 'utf8'));
const mainShaft = JSON.parse(readFileSync(new URL('../assets/data/sheets/L3608-D10100-main-shaft.json', import.meta.url), 'utf8'));

test('public catalog is sourced from the real Hikari Drive inventory, not demo SKUs', () => {
  assert.equal(app.includes('function makeProducts'), false);
  assert.equal(catalog.source, 'Google Drive #PARTS HIKARI TRACTORS');
  assert.equal(catalog.importedPdfRecords, catalog.products.length);
  assert.ok(catalog.products.length > 800);
  assert.equal(catalog.orderablePartRows, catalog.products.reduce((sum, part) => sum + part.partCount, 0));
  assert.equal(Object.keys(sheetIndex).length, catalog.products.length);
  assert.ok(catalog.products.every((part) => part.partCount > 0));
  assert.ok(catalog.products.every((part) => Number.isInteger(part.pageCount) && part.pageCount > 0));
  assert.ok(catalog.products.every((part) => part.sheetId && sheetIndex[part.sheetId]));
  assert.ok(catalog.products.every((part) => part.previewImage?.endsWith('-visual.webp')));
  assert.ok(catalog.products.every((part) => part.fullImage?.endsWith('-full.webp')));
  assert.deepEqual([...new Set(catalog.products.map((part) => part.model))].sort(), [
    'L3608', 'L4400DT', 'L5018DT-NES', 'M9000DT', 'M9540DT', 'MX5000DT', 'MX5100DT'
  ]);
});

test('Main Shaft retains exact exploded-diagram rows and searchable callouts', () => {
  assert.equal(mainShaft.model_code, 'L3608');
  assert.equal(mainShaft.diagram_code, 'D10100');
  assert.equal(mainShaft.parts.length, 10);
  assert.ok(mainShaft.parts.some((part) => part.callout === '010' && part.part_number === 'TC422-21514'));
  assert.deepEqual(mainShaft.hotspots.map((spot) => spot.callout).sort(), ['010', '020', '030', '040', '050', '060']);
  for (const feature of ['previewImage', 'loadSheet', 'renderDetail', 'addPartToCart', 'selectedModel']) {
    assert.ok(app.includes(feature), `${feature} integration is required`);
  }
});
