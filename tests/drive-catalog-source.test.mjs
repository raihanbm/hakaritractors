import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../assets/js/app.js', import.meta.url), 'utf8');
const catalog = JSON.parse(readFileSync(new URL('../assets/data/drive-catalog.json', import.meta.url), 'utf8'));
const sheetIndex = JSON.parse(readFileSync(new URL('../assets/data/sheets-index.json', import.meta.url), 'utf8'));
const mainShaft = JSON.parse(readFileSync(new URL('../assets/data/sheets/L3608-D10100-main-shaft.json', import.meta.url), 'utf8'));

test('public catalog is sourced from the downloaded Hikari Drive inventory, not generated demo SKUs', () => {
  assert.equal(app.includes('function makeProducts'), false);
  assert.equal(app.includes('makeProducts()'), false);
  assert.equal(catalog.source, 'Google Drive #PARTS HIKARI TRACTORS');
  assert.equal(catalog.importedPdfRecords, catalog.products.length);
  assert.ok(catalog.products.length > 800, 'audit should retain a substantial verified catalog');
  assert.ok(catalog.products.every((part) => part.priceEstimate === true));
  assert.equal(catalog.orderablePartRows, catalog.products.reduce((sum, part) => sum + part.partCount, 0));
  assert.equal(Object.keys(sheetIndex).length, catalog.products.length);
  assert.ok(catalog.products.every((part) => part.partCount > 0), '0-part diagrams must not be public');
  assert.ok(catalog.products.every((part) => !/accessor|service parts/i.test(`${part.name} ${part.category}`)), 'accessories/service parts must not be public');
  assert.ok(catalog.products.every((part) => Number.isInteger(part.pageCount) && part.pageCount > 0));
  assert.ok(catalog.products.every((part) => part.sheetId && sheetIndex[part.sheetId]));
  assert.ok(catalog.products.every((part) => part.previewImage?.endsWith('-crop.webp')));
  assert.ok(catalog.products.every((part) => part.fullImage?.endsWith('-full.webp')));
  assert.ok(catalog.products.every((part) => part.img === 'diagram'));
  assert.ok(catalog.products.every((part) => part.grade === 'Exploded diagram' && part.origin === 'Hikari catalog'));
  assert.ok(catalog.products.every((part) => /^([A-Z]?\d{4,})$/.test(part.sku)));
  assert.ok(catalog.products.every((part) => typeof part.model === 'string' && !('models' in part) && !('alt' in part)));
  assert.deepEqual([...new Set(catalog.products.map((part) => part.model))].sort(), [
    'L3608', 'L4400DT', 'L5018DT-NES', 'M9000DT', 'M9540DT', 'MX5000DT', 'MX5100DT'
  ]);
});

test('Main Shaft is an exploded diagram with clickable callouts and individual source part rows', () => {
  assert.equal(mainShaft.model_code, 'L3608');
  assert.equal(mainShaft.diagram_code, 'D10100');
  assert.equal(mainShaft.parts.length, 10);
  assert.ok(mainShaft.parts.every((part) => part.price_estimated === true));
  assert.ok(mainShaft.parts.some((part) => part.callout === '010' && part.part_number === 'TC422-21514'));
  assert.deepEqual(mainShaft.hotspots.map((spot) => spot.callout).sort(), ['010', '020', '030', '040', '050', '060']);
  assert.ok(mainShaft.hotspots.every((spot) => spot.x > 0 && spot.x < 40), 'left-side labels must stay clear of table/right diagram area');
  assert.ok(app.includes('imgFor'));
  assert.ok(app.includes('previewImage'));
  assert.ok(app.includes('addPartToCart'));
  assert.ok(app.includes('Tambah 1 pcs'));
  assert.ok(app.includes('SPAREPART ROWS'));
  assert.equal(app.includes('Google Drive source'), false);
  assert.equal(app.includes('Drive diagram'), false);
  assert.ok(app.includes('openExplodedSheet'));
  assert.ok(app.includes('selectedModel'));
  assert.ok(app.includes('Select your Hikari tractor first'));
});
