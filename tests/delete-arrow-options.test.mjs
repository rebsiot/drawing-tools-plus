import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

test('Remove was just Deselect; permanent Delete has separate confirmation and strict lock guard', async () => {
  const s=await readFile(new URL("../scripts/main.js",import.meta.url),"utf8");
  assert.match(s,/action === "toggle-one" && !controlled \? "Select" : "Deselect"/);
  assert.match(s,/button\.dataset\.action === "deselect-one"/);
  assert.match(s,/button\.dataset\.action === "delete-one"\) await deleteOneDrawing/);
  assert.match(s,/function deleteOneDrawing\(id\)/);
  assert.match(s,/DialogV2\?\.confirm/);
  assert.match(s,/approved = await DialogV2\.confirm\(\{/,
    "Confirm must retain the DialogV2 class receiver for its internal this.wait()");
  assert.doesNotMatch(s,/const confirm = foundry\?\.applications\?\.api\?\.DialogV2\?\.confirm/,
    "Never detach the class method: this.wait would throw");
  assert.match(s,/deleteEmbeddedDocuments\("Drawing", \[id\]\)/);
  assert.match(s,/if \(!canDelete\(doc\)\) return notify/);
  assert.match(s,/approved !== true/);
  assert.match(s,/scene\.drawings\.get\(id\) !== doc/);
  assert.match(s,/if \(canDelete\(document\) && \(finder \|\| action === "deselect-one"\)\)/);
  assert.match(s,/Undo Style Change/);
  assert.doesNotMatch(s,/\bRevert Style<\/button>/);
});
test('arrow end options use same preview geometry as one saved native polygon', async () => {
  const s=await readFile(new URL("../scripts/main.js",import.meta.url),"utf8");
  assert.match(s,/<select name="arrowEnds"/);
  for (const end of ['end','start','both','none']) assert.ok(s.includes(`<option value="${end}">`));
  assert.match(s,/preferences = normalizePrefs\(\{\.\.\.preferences, \[field\.name\]: field\.value\}\)/);
  assert.match(s,/preferences\.arrowEnds, preferences\.arrowHeadShape\)/);
  assert.match(s,/drawingAppearancePatch\(selectedDrawingObjects\(\)\[0\]\?\.document, editingStyle\)/);
  assert.match(s,/drawingAppearancePatch\(d, preferences\)/);
});

test('arrowhead panel stays collapsed outside active Arrow mode', async () => {
  const s=await readFile(new URL("../scripts/main.js",import.meta.url),"utf8");
  assert.match(s,/<div class="dqb-arrow-options" hidden>/);
  assert.match(s,/if \(options\) options\.hidden = active !== "arrow"/);
  assert.match(s,/<select name="arrowHeadShape"/);
  for(const shape of ['triangle','diamond','chevron'])
    assert.ok(s.includes(`<option value="${shape}">`));
  assert.match(s,/\["arrowEnds", "arrowHeadShape"\]\.includes\(field\.name\)/);
  assert.match(s,/preferences\.arrowEnds, preferences\.arrowHeadShape\)/,
    "On-canvas arrow preview must honor both dropdowns");
});
