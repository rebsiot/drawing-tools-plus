import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

test("Selected Drawings controls precede style sliders and include native safety actions", async () => {
  const src = await readFile(new URL("../scripts/main.js", import.meta.url), "utf8");
  const selected = src.indexOf('<section class="dqb-selection"');
  const styles = src.indexOf('STYLE PRESETS');
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
  assert.match(src, /textDocumentData\(operation\.position, raw, newPreferences\)/);
  assert.match(src, /editTextPatch\(existing, raw, newPreferences\)/);
  assert.match(src, /popup\.addEventListener\("keydown"/);
});

test("six primary tools stay on row one; Line/Arrow/Route/Callout share row two",async()=>{
  const src=await readFile(new URL("../scripts/main.js",import.meta.url),"utf8");
  const css=await readFile(new URL("../styles/quickbar.css",import.meta.url),"utf8");
  const start=src.indexOf('<div class="dqb-tools"'),end=src.indexOf('</div>',start);
  assert.ok(start>0&&end>start);
  const firstRow=[...src.slice(start,end).matchAll(/data-tool="([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(firstRow,['select','freehand','rect','ellipse','polygon','text']);
  const row2Start=src.indexOf('<div class="dqb-annotation-tools"',end);
  const row2End=src.indexOf('</div>',row2Start);
  assert.ok(row2Start>end && row2End>row2Start);
  const secondRow=[...src.slice(row2Start,row2End).matchAll(/data-tool="([^"]+)"/g)]
    .map(match=>match[1]);
  assert.deepEqual(secondRow,['line','arrow','route','callout']);
  assert.match(css,/\.dqb-annotation-tools \{\s*display: grid;\s*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(css,/\.dqb-tools \{\s*grid-template-columns: repeat\(6, minmax\(0, 1fr\)\)/);
  assert.match(css,/\.dqb-fields \{\s*row-gap: 5px/);
  assert.match(css,/\.dqb-wide input\[type="range"\] \{\s*height: 14px; margin: 0/);
});
test("selected Drawing action buttons stay together above a compact object list",async()=>{
  const src=await readFile(new URL("../scripts/main.js",import.meta.url),"utf8");
  const section=src.slice(src.indexOf('<section class="dqb-selection"'),src.indexOf('</section>',src.indexOf('<section class="dqb-selection"')));
  const action=section.indexOf('<div class="dqb-actions">');
  const list=section.indexOf('<div class="dqb-selected-list"');
  const all=src.indexOf('<details class="dqb-finder"');
  const selectedStart=src.indexOf('<section class="dqb-selection"');
  assert.ok(action>0 && list>action);
  assert.ok(all>=0 && all<selectedStart, "All Drawings must remain above the entire Selected Drawings section");
  assert.ok(!section.includes('<details class="dqb-finder"'), "Do not nest the inventory inside selection controls");
  assert.ok(!section.includes('<details class="dqb-locked"'));
});
test("Select button toggles Unselect on a click and leaves the V shortcut as Select",async()=>{
  const src=await readFile(new URL("../scripts/main.js",import.meta.url),"utf8");
  assert.match(src,/selectTool\(button\.dataset\.tool, \{toggleSelection: true\}\)/);
  assert.match(src,/async function selectTool\(tool, \{toggleSelection = false\} = \{\}\)/);
  assert.match(src,/toggleSelection && tool === "select"/);
  assert.match(src,/canvas\.drawings\.releaseAll\(\)/);
  assert.match(src,/const title = hasSelection \? "Unselect" : "Select"/);
  assert.match(src,/button\.classList\.toggle\("active", selected\)/);
  assert.match(src,/Hooks\.on\("releaseDrawing"/);
  assert.match(src,/selectTool\(tool\);/,'Keyboard shortcuts must not trigger deselect toggles');
});
test("GMs can read locked Drawing info without releasing its lock",async()=>{
  const src=await readFile(new URL("../scripts/main.js",import.meta.url),"utf8");
  assert.match(src,/function inspectLockedDrawing\(id\)/);
  assert.match(src,/if \(!doc \|\| !doc\.locked\) return notify/);
  assert.match(src,/if \(document\.locked && game\.user\.isGM\)/);
  const info=src.slice(src.indexOf('function inspectLockedDrawing(id)'),src.indexOf('async function toggleDrawingSelection',src.indexOf('function inspectLockedDrawing(id)')));
  assert.ok(info.includes('showModal'));
  for(const forbidden of ['deleteEmbeddedDocuments(', 'updateEmbeddedDocuments(', 'locked: false']) {
    assert.ok(!info.includes(forbidden),'Inspect must be non-destructive');
  }
});
