import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

test('RFQ keeps customer contact simple and supports individual buyers', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const app = await readFile(new URL('../assets/js/app.js', import.meta.url), 'utf8');
  assert.match(html, /id="rfqPhone"/);
  assert.match(html, /id="rfqAccountType"/);
  assert.match(html, /id="rfqDestination"[^>]*placeholder="Can be added later"/);
  assert.match(app, /if \(!email && !phone\)/);
  assert.match(app, /accountType/);
  assert.match(app, /emailQuotation/);
  assert.match(app, /whatsappQuotation/);
  assert.match(app, /NPWP, PO, company address and trade details can be provided later/);
});
