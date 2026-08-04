import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../assets/js/app.js', import.meta.url), 'utf8');

function generatedInlineHandlers(source) {
  return [...source.matchAll(/<[^>]*\son(?:click|change|input|submit)\s*=/gi)].map((match) => match[0]);
}

test('CSP-safe storefront interactions never generate inline event handlers', () => {
  assert.deepEqual(generatedInlineHandlers(app), [], 'inline handlers are blocked by production CSP');
  assert.match(app, /modalBody\.addEventListener\("click"/);
  assert.match(app, /data-sheet-action="add"/);
  assert.match(app, /data-modal-action="close"/);
});

test('diagram failures are caught and reported to the buyer', () => {
  assert.match(app, /async function openExplodedSheet/);
  assert.match(app, /catch\(error\)/);
  assert.match(app, /Diagram unavailable/);
});
