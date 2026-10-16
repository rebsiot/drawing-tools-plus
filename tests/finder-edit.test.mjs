import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

test("all-Drawings finder exposes local Locate, Select, Edit and locked recovery", async () => {
  const src = await readFile(new URL("../scripts/main.js", import.meta.url), "utf8");
  assert.match(src, /data-role="drawing-search"/);
  assert.match(src, /findSceneDrawings\(sceneDrawingDocuments\(\), input\.value, 60\)/);
  assert.match(src, /makeActionButton\(document, "locate-one"/);
  assert.match(src, /doc\.locked \? "unlock-one" : "select-only"/);
  assert.match(src, /action === "edit-one-text"/);
  assert.match(src, /canvas\.animatePan\(view\)/);
  assert.match(src, /canvas\.clientCoordinatesFromCanvas\(/);
  assert.match(src, /Hooks\.on\("canvasPan", refreshFocusMarker\)/);
  assert.doesNotMatch(src, /canvas\.ping\(/, "Locate should not broadcast a ping to players");
});

test("Edit Text uses a focused, native document update, never a replacement Drawing", async () => {
  const src = await readFile(new URL("../scripts/main.js", import.meta.url), "utf8");
  assert.match(src, /beginEditDrawingText\(sources\[0\]\.document\.id\)/);
  assert.match(src, /textScene = \{sceneId: canvas\.scene\.id, drawingId: doc\.id\}/);
  assert.match(src, /editTextPatch\(existing, raw, newPreferences\)/);
  assert.match(src, /canvas\.scene\.updateEmbeddedDocuments\("Drawing", \[patch\]\)/);
  assert.match(src, /popup\.elements\.namedItem\("drawingText"\)\.value = original\?\.text/);
  assert.doesNotMatch(src, /enableTextEditing\(\)/);
});
