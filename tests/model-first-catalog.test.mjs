import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, root), "utf8");
}

test("catalog prioritizes Hikari tractor models before part-system filters", async () => {
  const [html, app] = await Promise.all([
    read("index.html"),
    read("assets/js/app.js"),
  ]);

  for (const model of ["L3608", "L4400DT", "L5018DT-NES", "M9000DT", "M9540DT", "MX5000DT", "MX5100DT"]) {
    assert.match(app, new RegExp(`tractorModels.*${model}|${model}.*tractorModels`, "s"));
  }

  assert.match(html, /Browse by tractor model/i);
  assert.doesNotMatch(app, /Excavator:\[/);
  assert.doesNotMatch(app, /Combine:\[/);
  assert.doesNotMatch(app, /RTV:\[/);
});
