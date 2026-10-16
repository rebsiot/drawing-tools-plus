import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

test("Token and Drawing controls use one Quickbar, with no layer switch on Token launch", async () => {
  const source = await readFile(new URL("../scripts/main.js", import.meta.url), "utf8");
  assert.match(source, /for \(const controlName of \["drawings", "tokens"\]\)/);
  assert.match(source, /tools\.drawingQuickbar = \{/);
  // Both launchers share this one control declaration and use the Quickbar's own symbol.
  assert.match(source, /icon: "fa-solid fa-pen-ruler"/);
  assert.doesNotMatch(source, /icon: "fa-solid fa-palette"/);
  assert.match(source, /<i class="fa-solid fa-pen-ruler" aria-hidden="true"><\/i> Drawing Quickbar/);
  assert.match(source, /onChange: \(\) => toggleDock\(\{activateDrawings: controlName === "drawings"\}\)/);
  assert.match(source, /async function openDock\(\{activateDrawings = true\} = \{\}\)/);
  assert.match(source, /if \(activateDrawings\) \{\s*try \{ await ui\.controls\.activate/);
  assert.match(source, /function toggleDock\(\{activateDrawings = true\} = \{\}\)/);
  assert.match(source, /return dock \? closeDock\(\) : openDock\(\{activateDrawings\}\)/);
  assert.match(source, /canvas\?\.drawings\?\.active \? \(ui\.controls\?\.tool\?\.name \?\? "select"\) : null/);
});

test("Drawing actions can switch from Tokens only after an explicit click", async () => {
  const source = await readFile(new URL("../scripts/main.js", import.meta.url), "utf8");
  assert.match(source, /async function toggleDrawingSelection\(id\)/);
  assert.match(source, /async function beginEditDrawingText\(id\)/);
  assert.match(source, /if \(!canvas\.drawings\.active\) await ui\.controls\.activate\(\{control: "drawings", tool: "select"\}\)/);
  assert.match(source, /if \(button\.dataset\.action === "toggle-one"\) await toggleDrawingSelection/);
  assert.match(source, /if \(button\.dataset\.action === "edit-one-text"\) await beginEditDrawingText/);
  assert.match(source, /async function unlockDrawing\(id\) \{\s*\/\/ Only a GM may unlock permanent map elements/);
  assert.match(source, /if \(!isUsable\(\) \|\| !game\.user\.isGM\)/);
  assert.match(source, /async function locateDrawing\(id\)/);
  assert.ok(!source.includes('controls.tokens.tools.select ='), "Do not replace native Token selection");
  assert.ok(!source.includes('canvas.ping('), "Locate remains local to the GM");
});
