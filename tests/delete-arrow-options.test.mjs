import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

test('Remove was just Deselect; permanent Delete has separate confirmation and strict lock guard', async () => {
  const s=await readFile(new URL("../scripts/main.js",import.meta.url),"utf8");
  assert.match(s,/action === "select-only" \? "Select" : "Deselect"/);
  assert.match(s,/button\.dataset\.action === "deselect-one"/);
  assert.match(s,/button\.dataset\.action === "delete-one"\) await deleteOneDrawing/);
  assert.match(s,/function deleteOneDrawing\(id\)/);
  assert.match(s,/DialogV2\?\.confirm/);
  assert.match(s,/deleteEmbeddedDocuments\("Drawing", \[id\]\)/);
  assert.match(s,/if \(doc\.locked\) return notify/);
  assert.match(s,/approved !== true/);
  assert.match(s,/scene\.drawings\.get\(id\) !== doc/);
  assert.match(s,/if \(!document\.locked && \(finder \|\| action === "deselect-one"\)\)/);
  assert.match(s,/Undo Style Change/);
  assert.doesNotMatch(s,/\bRevert Style<\/button>/);
});
test('arrow end options use same preview geometry as one saved native polygon', async () => {
  const s=await readFile(new URL("../scripts/main.js",import.meta.url),"utf8");
  assert.match(s,/<select name="arrowEnds"/);
  for (const end of ['end','start','both','none']) assert.ok(s.includes(`<option value="${end}">`));
  assert.match(s,/preferences = normalizePrefs\(\{\.\.\.preferences, arrowEnds: field\.value\}\)/);
  assert.match(s,/preferences\.strokeWidth, preferences\.arrowEnds\)/);
  assert.match(s,/visibleArrowStylePatch\(selectedDrawingObjects\(\)\[0\]\?\.document, editingStyle\)/);
  assert.match(s,/visibleArrowStylePatch\(d, preferences\)/);
});
