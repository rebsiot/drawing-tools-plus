import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {filterLockedDrawings, findSceneDrawings} from "../scripts/model.js";

test("one inventory combines search, locked-only filtering, and pagination", () => {
  const documents=Array.from({length:135},(_,i)=>({
    id:"draw-"+i, name:i%3===0?"Grid marker "+i:"Route "+i,
    locked:i%3===0, shape:{type:"r"}, x:i*10,y:i*10
  }));
  const filtered=filterLockedDrawings(documents,true);
  assert.equal(filtered.length,45);
  assert.equal(findSceneDrawings(filtered,"",60).matches,45);
  assert.equal(findSceneDrawings(filtered,"grid",20).shown.length,20);
  assert.equal(findSceneDrawings(filtered,"grid",60).shown.length,45);
  assert.equal(findSceneDrawings(filtered,"route",60).matches,0);
  assert.equal(findSceneDrawings(filterLockedDrawings(documents,false),"",60).matches,135);
  assert.equal(documents.filter(d=>d.locked).length,45,"Filtering does not mutate native lock flags");
});
test("UI renders a red lock beside locked names without duplicating a second inventory", async () => {
  const main=await readFile(new URL("../scripts/main.js",import.meta.url),"utf8");
  const css=await readFile(new URL("../styles/quickbar.css",import.meta.url),"utf8");
  assert.match(main,/<details class="dqb-finder"/);
  assert.match(main,/data-action="finder-locked-only" class="dqb-locked-filter"/);
  assert.match(main,/for="dqb-drawing-search"/);
  assert.match(main,/id="dqb-drawing-search" type="search" data-role="drawing-search"/);
  assert.match(main,/if \(document\.locked\) \{\s*row\.classList\.add\("dqb-is-locked"\)/);
  assert.match(main,/documentCreate\("i", "fa-solid fa-lock dqb-object-lock-icon"\)/);
  assert.match(main,/lock\.setAttribute\("aria-label", "Locked Drawing"\)/);
  assert.match(main,/details\.prepend\(lock\)/);
  assert.doesNotMatch(main,/<details class="dqb-locked"/);
  assert.doesNotMatch(main,/dqb-locked-list|locked-count/);
  assert.match(css,/\.dqb-object-lock-icon \{\s*color: #f2a3a9/);
  assert.match(css,/\.dqb-find-heading \{/);
  assert.match(css,/\.dqb-locked-filter\[aria-pressed="true"\]/);
});
test("Locked only is a reversible, client-only filter preserving Unlock and Info", async () => {
  const main=await readFile(new URL("../scripts/main.js",import.meta.url),"utf8");
  const click=main.slice(main.indexOf('if (button.dataset.action === "finder-locked-only")'),
    main.indexOf('if (button.dataset.action === "finder-more")'));
  assert.match(click,/finderLockedOnly = !finderLockedOnly/);
  assert.match(click,/finderVisibleCount = FINDER_PAGE_SIZE/);
  assert.match(click,/refreshFinder\(\)/);
  const filter=main.slice(main.indexOf("function refreshFinder()"),main.indexOf("/** Inspect protected map art"));
  assert.match(filter,/sceneDrawingDocuments\(\)/);
  assert.match(filter,/filterLockedDrawings\(documents, finderLockedOnly\)/);
  assert.match(filter,/findSceneDrawings\(visible, input\.value, finderVisibleCount\)/);
  assert.match(filter,/filter\.setAttribute\("aria-pressed", String\(finderLockedOnly\)\)/);
  assert.match(filter,/doc\.locked \? "unlock-one" : "toggle-one"/);
  assert.match(filter,/finderLockedOnly \? "No matching locked Drawings" : "No matching Drawings"/);
  for(const text of ["createEmbeddedDocuments(", "updateEmbeddedDocuments(", "deleteEmbeddedDocuments("]) {
    assert.ok(!filter.includes(text),"Search/filter must not change Scene Drawing data: "+text);
  }
  assert.match(main,/if \(document\.locked && game\.user\.isGM\)/,
    "GM must retain read-only Info for locked objects");
  assert.match(main,/action === "unlock-one" && game\.user\.isGM/,
    "GM must retain Unlock per row while players cannot unlock");
  assert.match(main,/finderLockedOnly = false/);
});
