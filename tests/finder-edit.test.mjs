import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

test("all-Drawings finder exposes local Locate, Select, Edit and locked recovery", async () => {
  const src = await readFile(new URL("../scripts/main.js", import.meta.url), "utf8");
  assert.match(src, /data-role="drawing-search"/);
  assert.match(src, /findSceneDrawings\(documents, input\.value, finderVisibleCount\)/);
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
  assert.match(src, /textScene = \{sceneId, drawingId: doc\.id\}/);
  assert.match(src, /editTextPatch\(existing, raw, newPreferences\)/);
  assert.match(src, /canvas\.scene\.updateEmbeddedDocuments\("Drawing", \[patch\]\)/);
  assert.match(src, /popup\.elements\.namedItem\("drawingText"\)\.value = original\?\.text/);
  assert.doesNotMatch(src, /enableTextEditing\(\)/);
});

test("All Drawings is a collapsed sibling of Locked Drawings and supports show more", async () => {
  const src = await readFile(new URL("../scripts/main.js", import.meta.url), "utf8");
  const locked = src.indexOf('<details class="dqb-locked">');
  const all = src.indexOf('<details class="dqb-finder"');
  const endSelection = src.indexOf('</section>', locked);
  assert.ok(locked >= 0 && all > locked && endSelection > all);
  assert.match(src, /<summary>All Drawings \(<span data-value="scene-drawing-count">0<\/span>\)<\/summary>/);
  assert.match(src, /root\.querySelector\("\.dqb-finder"\)\.addEventListener\("toggle", refreshFinder\)/);
  assert.match(src, /if \(!panel\.open\) return/);
  assert.match(src, /more\.hidden = remaining <= 0/);
  assert.match(src, /finderVisibleCount \+= FINDER_PAGE_SIZE/);
  assert.match(src, /finderVisibleCount = FINDER_PAGE_SIZE;/);
  assert.match(src, /textPreview \? "Edit Drawing text" : "Add a text label to this Drawing"/);
  assert.ok(!src.includes('> FIND DRAWING <'));
});
