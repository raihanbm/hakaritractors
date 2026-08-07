import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const config = await readFile('assets/js/runtime-config.js', 'utf8');
const app = await readFile('assets/js/app.js', 'utf8');

test('currency configuration exposes working IDR and USD profiles', () => {
  assert.match(config, /currencies:\s*Object\.freeze\(\{/);
  assert.match(config, /IDR:\s*Object\.freeze\(\{[^}]*locale:\s*"id-ID"[^}]*fractionDigits:\s*0/);
  assert.match(config, /USD:\s*Object\.freeze\(\{[^}]*locale:\s*"en-US"[^}]*fractionDigits:\s*2/);
});

test('currency formatter uses the selected locale and Rupiah format', () => {
  assert.match(app, /preset = SITE\.currencies\?\.\[code\]/);
  assert.match(app, /value\.toLocaleString\(CURRENCY\.locale/);
  assert.match(app, /CURRENCY\.code === 'IDR' \? `Rp\$\{formatted\}`/);
  assert.match(app, /writeLocal\('hikari_currency', state\.currency\)/);
});
