import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const main = () => readFile(new URL("../scripts/main.js", import.meta.url),"utf8");
const style = () => readFile(new URL("../styles/quickbar.css", import.meta.url),"utf8");

test("All Drawings is physically above Selected Drawings, with its own stable section",async()=>{
 const s=await main();
 const all=s.indexOf('<details class="dqb-finder"');
 const allEnd=s.indexOf('</details>',all);
 const selected=s.indexOf('<section class="dqb-selection"');
 const selectedEnd=s.indexOf('</section>',selected);
 const styles=s.indexOf('STYLE PRESETS');
 assert.ok(all>0 && allEnd>all && selected>allEnd && selectedEnd>selected && styles>selectedEnd,
   "All Drawings must precede the entire Selected Drawings section, then styling");
 const selection=s.slice(selected,selectedEnd);
 assert.ok(selection.includes('data-value="selected-count"'));
 for(const action of ['lock-selected','open-properties','duplicate-selected','edit-text','apply-selected','undo-style'])
   assert.ok(selection.includes('data-action="'+action+'"'),"Missing selected action: "+action);
 assert.ok(selection.includes('class="dqb-selected-list"'));
 assert.doesNotMatch(selection, /class="dqb-finder"/);
});
test("Selection updates row buttons in place without replacing All Drawings results",async()=>{
 const s=await main();
 const selection=s.slice(s.indexOf("function refreshSelectedPanel()"),
   s.indexOf("function refreshFinderSelectionState()"));
 assert.match(selection,/refreshFinderSelectionState\(\)/);
 assert.doesNotMatch(selection,/refreshFinder\(\)/,"Selection changes may not rebuild the inventory");
 const update=s.slice(s.indexOf("function refreshFinderSelectionState()"),
   s.indexOf("function refreshFinder()"));
 assert.match(update,/row\.dataset\.drawingId/);
 assert.match(update,/row\.classList\.toggle\("dqb-is-selected", selected\)/);
 assert.match(update,/button\.textContent = selected \? "Deselect" : "Select"/);
 assert.match(update,/button\.setAttribute\("aria-pressed", String\(selected\)\)/);
 assert.doesNotMatch(update,/replaceChildren|appendChild|insertBefore|removeChild|\.remove\(/,
   "In-place state refresh should not add or replace DOM nodes");
});
test("Actual data/search changes still rebuild inventory with scroll restoration",async()=>{
 const s=await main();
 const filter=s.slice(s.indexOf("function refreshFinder()"),
   s.indexOf("/** Inspect protected map art"));
 assert.match(filter,/results\.replaceChildren/);
 assert.match(filter,/const scrollTop = content\?\.scrollTop \?\? 0/);
 assert.match(filter,/const resultsScrollTop = results\.scrollTop/);
 assert.match(filter,/results\.scrollTop = resultsScrollTop/);
 assert.match(filter,/if \(content\) content\.scrollTop = scrollTop/);
 assert.match(s,/Hooks\.on\("updateDrawing", \(\) => \{\s*refreshSelectedPanel\(\);\s*refreshFinder\(\);/);
 assert.match(s,/Hooks\.on\("deleteDrawing", \(\) => \{\s*refreshSelectedPanel\(\);\s*refreshFinder\(\);/);
 assert.match(s,/root\.querySelector\("\.dqb-finder"\)\.addEventListener\("toggle", refreshFinder\)/);
});
test("Selection indicator and toggle width do not shift inventory row buttons",async()=>{
 const c=await style();
 assert.match(c,/\.dqb-finder \.dqb-object-row\.dqb-is-selected \{\s*\/\*[^]*?box-shadow: inset 2px 0 #edc777/);
 assert.match(c,/\.dqb-find-results button\[data-action="toggle-one"\] \{\s*min-width: 59px/);
 assert.doesNotMatch(c,/\.dqb-finder \.dqb-object-row\.dqb-is-selected \{\s*border-left: 2px/);
});
