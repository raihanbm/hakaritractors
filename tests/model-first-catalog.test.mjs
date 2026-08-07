import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, readFile as readFilePromise } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const load = (relativePath) => readFile(new URL(relativePath, root), 'utf8');

test('catalog derives tractor models from the verified product dataset', async () => {
  const [html, app, catalogText] = await Promise.all([
    load('index.html'),
    load('assets/js/app.js'),
    readFilePromise(new URL('assets/data/drive-catalog.json', root), 'utf8')
  ]);
  const catalog = JSON.parse(catalogText);
  const models = [...new Set(catalog.products.map((part) => part.model))];
  assert.equal(models.length, 12);
  for (const model of ['L4028', 'L3800D', 'L3218DT-ID', 'L4018DT-ID/L4018TK-ID', 'L5228']) assert.ok(models.includes(model), `missing imported model ${model}`);
  assert.match(app, /state\.models = \[\.\.\.new Set\(state\.products\.map\(product => product\.model\)/);
  assert.match(html, /SHOP BY TRACTOR MODEL/);
  assert.doesNotMatch(app, /Excavator:\s*\[/);
  assert.doesNotMatch(app, /Combine:\s*\[/);
});
