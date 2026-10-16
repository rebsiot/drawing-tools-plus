import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

test("public beta manifest resolves to version-pinned Foundry release and restrictive license", async () => {
  const manifest = JSON.parse(await readFile(new URL("../module.json", import.meta.url), "utf8"));
  const id = "foundry-drawing-quickbar";
  const version = "0.1.15";
  assert.equal(manifest.id, id);
  assert.equal(manifest.version, version);
  assert.equal(manifest.manifest, "https://raw.githubusercontent.com/rebsiot/drawing-tools-plus/main/module.json");
  assert.equal(manifest.download, `https://github.com/rebsiot/drawing-tools-plus/releases/download/v${version}/${id}-${version}.zip`);
  assert.equal(manifest.license, "LICENSE.md");
  assert.equal(manifest.compatibility.minimum, "14");
  assert.equal(manifest.compatibility.verified, undefined, "Do not assert untested live compatibility");
  const license = await readFile(new URL("../LICENSE.md", import.meta.url), "utf8");
  assert.match(license, /Personal Use Only \(No Redistribution\)/);
  assert.match(license, /source-available proprietary software/);
});
