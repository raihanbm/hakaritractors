import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../assets/js/app.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function generatedInlineHandlers(source) {
  return [...source.matchAll(/<[^>]*\son(?:click|change|input|submit|load|error)\s*=/gi)].map((match) => match[0]);
}

test('production CSP is not undermined by generated inline event handlers', () => {
  assert.deepEqual(generatedInlineHandlers(html), []);
  assert.deepEqual(generatedInlineHandlers(app), []);
  assert.match(app, /modalBody'\)\.addEventListener\('click'/);
  assert.match(app, /data-modal-close/);
  assert.match(app, /data-add-part/);
});

test('diagram load failures produce a visible recovery page', () => {
  assert.match(app, /async function renderDetail/);
  assert.match(app, /await loadSheet\(product\)/);
  assert.match(app, /catch \(error\)/);
  assert.match(app, /Diagram could not be loaded/);
  assert.match(app, /renderNotFound/);
});

test('RFQ CSV uses a submission snapshot before a successful cart clear', () => {
  assert.match(app, /const rfqSnapshot = state\.cart\.map/);
  assert.match(app, /downloadRfqCsv\(rfqSnapshot, reference\)/);
  assert.match(app, /function downloadRfqCsv\(items = state\.cart, reference = 'draft'\)/);
});
