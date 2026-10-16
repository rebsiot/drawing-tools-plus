import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

test("all-Drawings finder exposes local Locate, additive Select, Edit and locked recovery", async () => {
  const src = await readFile(new URL("../scripts/main.js", import.meta.url), "utf8");
  assert.match(src, /data-role="drawing-search"/);
  assert.match(src, /findSceneDrawings\(visible, input\.value, finderVisibleCount\)/);
  assert.match(src, /makeActionButton\(document, "locate-one"/);
  assert.match(src, /doc\.locked \? "unlock-one" : "toggle-one"/);
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

test("All Drawings is the sole collapsed inventory and supports locked-only plus show more", async () => {
  const src = await readFile(new URL("../scripts/main.js", import.meta.url), "utf8");
  const selected = src.indexOf('<div class="dqb-selected-list"');
  const all = src.indexOf('<details class="dqb-finder"');
  const endSelection = src.indexOf('</section>', all);
  assert.ok(selected >= 0 && all > selected && endSelection > all);
  assert.doesNotMatch(src, /<details class="dqb-locked">/);
  assert.doesNotMatch(src, /dqb-locked-list|locked-count/);
  assert.match(src, /<summary>All Drawings \(<span data-value="scene-drawing-count">0<\/span>\)<\/summary>/);
  assert.match(src, /root\.querySelector\("\.dqb-finder"\)\.addEventListener\("toggle", refreshFinder\)/);
  assert.match(src, /if \(!panel\.open\) return/);
  assert.match(src, /data-action="finder-locked-only"/);
  assert.match(src, /aria-pressed="false"/);
  assert.match(src, /filterLockedDrawings\(documents, finderLockedOnly\)/);
  assert.match(src, /filter\.setAttribute\("aria-pressed", String\(finderLockedOnly\)\)/);
  assert.match(src, /more\.hidden = remaining <= 0/);
  assert.match(src, /finderVisibleCount \+= FINDER_PAGE_SIZE/);
  assert.match(src, /finderVisibleCount = FINDER_PAGE_SIZE;/);
  assert.match(src, /textPreview \? "Edit Drawing text" : "Add a text label to this Drawing"/);
  assert.ok(!src.includes('> FIND DRAWING <'));
});
