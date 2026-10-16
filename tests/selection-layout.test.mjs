import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

test("Selected Drawings controls precede style sliders and include native safety actions", async () => {
  const src = await readFile(new URL("../scripts/main.js", import.meta.url), "utf8");
  const selected = src.indexOf('<section class="dqb-selection"');
  const styles = src.indexOf('QUICK STYLES');
  assert.ok(selected > 0 && styles > selected, "Selection panel must be above style fields");
  for (const action of ["lock-selected", "unlock-one", "open-properties", "deselect-one",
    "duplicate-selected", "edit-text", "apply-selected", "undo-style"]) {
    assert.ok(src.includes('data-action="' + action + '"') || src.includes('dataset.action = action') &&
      src.includes('"' + action + '"'), action + " wiring absent");
  }
  assert.match(src, /controlDrawing/);
  assert.match(src, /scene.updateEmbeddedDocuments\("Drawing", drawings\.map/);
});
test("Quickbar Text workflow uses focused modal and native embedded Drawing creation", async () => {
  const src = await readFile(new URL("../scripts/main.js", import.meta.url), "utf8");
  assert.match(src, /popup\.elements\.namedItem\("drawingText"\)\.focus\(\)/);
  assert.match(src, /textDocumentData\(textScene\.position, raw, newPreferences\)/);
  assert.match(src, /popup\.addEventListener\("keydown"/);
});
