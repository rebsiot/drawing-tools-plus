import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

test("native local creation switches to Select and focuses only its own new Drawing", async () => {
  const s=await readFile(new URL("../scripts/main.js",import.meta.url),"utf8");
  assert.match(s,/Hooks\.on\("createDrawing", \(doc, _options, userId\)/);
  assert.match(s,/userId !== game\.user\.id/);
  assert.match(s,/doc\?\.parent\?\.id !== canvas\.scene\.id/);
  assert.match(s,/\["rect", "ellipse", "polygon", "freehand"\]/);
  assert.match(s,/function selectCreatedDrawing\(drawingId, sceneId\)/);
  assert.match(s,/await ui\.controls\.activate\(\{control: "drawings", tool: "select"\}\)/);
  assert.match(s,/placeable\.control\(\{releaseOthers: true\}\)/);
  assert.match(s,/canvas\.drawings\.releaseAll\(\)/);
});
test("direct single style editing targets one ID and never touches locked Drawings", async () => {
  const s=await readFile(new URL("../scripts/main.js",import.meta.url),"utf8");
  assert.match(s,/queueDirectStylePatch\(visibleArrowStylePatch\(selectedDrawingObjects\(\)\[0\]\?\.document,\s*editingStyle, input\.name\)\)/);
  assert.match(s,/queueDirectStylePatch\(visibleArrowStylePatch\(selectedDrawingObjects\(\)\[0\]\?\.document, editingStyle\)\)/);
  assert.match(s,/scene\.drawings\.get\(pending\.id\)/);
  assert.match(s,/if \(!doc \|\| doc\.locked/);
  assert.match(s,/\[\{_id: doc\.id, \.\.\.pending\.patch\}\]/);
  assert.match(s,/all\.map\(item => item\.document\)\.filter\(d => d\?\.id && !d\.locked\)/);
  assert.doesNotMatch(s,/> Style Selected<\/button>/);
});
