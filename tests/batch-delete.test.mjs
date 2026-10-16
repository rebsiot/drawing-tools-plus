import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {
  planSelectedDrawingDeletion, isDrawingDeletionPlanCurrent,
  commitPlannedDrawingDeletion, drawingDeletionConfirmationHtml
} from "../scripts/batch-delete.js";

const gm = {id: "gm", isGM: true};
const player = {id: "player", isGM: false, can: permission => permission === "DRAWING_CREATE"};
const make = (id, props = {}) => ({
  id, author: "player", locked: false, hidden: false, text: "",
  canUserModify: (_user, action) => action === "delete" || action === "update",
  ...props
});
const selection = (...docs) => docs.map(document => ({document}));
const sceneWith = (docs, id = "scene") => ({
  id, drawings: new Map(docs.map(doc => [doc.id, doc])),
  calls: [],
  async deleteEmbeddedDocuments(type, ids) {
    this.calls.push({type, ids: [...ids]});
    const deleted = ids.map(id => this.drawings.get(id)).filter(Boolean);
    for (const id of ids) this.drawings.delete(id);
    return deleted;
  }
});
const describe = doc => ({name: doc.id === "a" ? '<img onerror="alert(1)">' : "Drawing " + doc.id,
  kind: doc.id === "a" ? "Box & <script>" : "Circle"});

test("batch plan contains ONLY controlled, distinct, deletable documents", () => {
  const a = make("a"), b = make("b"), locked = make("locked", {locked: true});
  const foreign = make("foreign", {author: "other"});
  const denied = make("denied", {canUserModify: (_user, action) => action === "update"});
  const hidden = make("hidden", {hidden: true});
  const plan = planSelectedDrawingDeletion(selection(a,b,locked,foreign,denied,hidden,a), player, "scene");
  assert.deepEqual(plan.selected.map(e => e.id), ["a","b","locked","foreign","denied","hidden"]);
  assert.deepEqual(plan.targets.map(e => e.id), ["a","b"]);
  assert.deepEqual(plan.excluded.map(e => e.id), ["locked","foreign","denied","hidden"]);
  assert.equal(plan.sceneId, "scene");
  assert.deepEqual(planSelectedDrawingDeletion([], player, "scene").targets, []);
  assert.deepEqual(planSelectedDrawingDeletion([{document: null}], player, "scene").targets, []);
});

test("GM can batch delete unlocked art, but even GM cannot batch delete locked native Drawing", () => {
  const a = make("a",{author:"gm"}), b = make("b",{author:"another"});
  const locked = make("gridline",{locked:true,author:"gm"});
  const p = planSelectedDrawingDeletion(selection(a,b,locked), gm, "scene");
  assert.deepEqual(p.targets.map(e => e.id), ["a", "b"]);
  assert.deepEqual(p.excluded.map(e => e.id), ["gridline"]);
});

test("confirmation enumerates exact original IDs, escapes user text and explains exclusions", () => {
  const a = make("a", {text: '<img src=x onerror="evil()">'});
  const b = make("b"), locked = make("locked", {locked:true});
  const plan = planSelectedDrawingDeletion(selection(a,b,locked), player, "scene");
  const html = drawingDeletionConfirmationHtml(plan, player, describe);
  assert.match(html, /delete <strong>2 selected Drawings/);
  assert.match(html, /<code>a<\/code>/);
  assert.match(html, /<code>b<\/code>/);
  assert.match(html, /Not included \(1\)/);
  assert.match(html, /<code>locked<\/code>/);
  assert.match(html, /Locked/);
  assert.ok(!html.includes('<img src=x'), "Must escape text input");
  assert.ok(!html.includes('Box & <script>'), "Must escape drawingLabel data");
  assert.match(html, /&lt;img src=x onerror=&quot;evil\(\)&quot;&gt;/);
  assert.match(html, /Undo Style Change/);
});

test("hidden Drawing names and IDs never leak through an exclusion notice", () => {
  const a=make("a"), b=make("b"), hidden=make("SECRET_GM_ID",{hidden:true,text:"GM SECRET"});
  const plan=planSelectedDrawingDeletion(selection(a,b,hidden),player,"scene");
  const html=drawingDeletionConfirmationHtml(plan,player,describe);
  assert.ok(!html.includes("SECRET_GM_ID"));
  assert.ok(!html.includes("GM SECRET"));
  assert.match(html,/Hidden Drawing/);
});

test("nothing can be committed if the Scene, selection, lock or permissions changed", async () => {
  const a=make("a"), b=make("b"), c=make("c"), docs=selection(a,b);
  const plan=planSelectedDrawingDeletion(docs, player, "scene");
  const scene=sceneWith([a,b,c]);
  assert.equal(isDrawingDeletionPlanCurrent(plan, scene, docs, player), true);
  assert.equal(isDrawingDeletionPlanCurrent(plan, sceneWith([a,b],"scene2"), docs, player), false);
  assert.equal(isDrawingDeletionPlanCurrent(plan, scene, selection(a,c), player), false);
  assert.equal(isDrawingDeletionPlanCurrent(plan, scene, selection(a,b,c), player), false);
  scene.drawings.set("b", make("b"));
  assert.equal(isDrawingDeletionPlanCurrent(plan, scene, docs, player), false);
  scene.drawings.set("b", b);
  b.locked = true;
  assert.equal(isDrawingDeletionPlanCurrent(plan, scene, docs, player), false);
  b.locked = false;
  b.author = "other";
  assert.equal(isDrawingDeletionPlanCurrent(plan, scene, docs, player), false);
  b.author = "player";
  b.canUserModify = ()=>false;
  assert.equal(isDrawingDeletionPlanCurrent(plan, scene, docs, player), false);
  const outcome = await commitPlannedDrawingDeletion(plan, scene, docs, player);
  assert.equal(outcome.status, "stale");
  assert.equal(scene.calls.length, 0);
  assert.deepEqual([...scene.drawings.keys()].sort(), ["a","b","c"]);
});

test("confirmed batch passes exactly eligible IDs to ONE native deletion call", async () => {
  const a=make("a"), b=make("b"), locked=make("locked",{locked:true});
  const scene=sceneWith([a,b,locked]);
  const controlled=selection(a,b,locked);
  const plan=planSelectedDrawingDeletion(controlled, player, "scene");
  const result=await commitPlannedDrawingDeletion(plan, scene, controlled, player);
  assert.deepEqual(scene.calls, [{type:"Drawing", ids:["a","b"]}]);
  assert.deepEqual(result,{status:"deleted",expected:2,deletedIds:["a","b"]});
  assert.deepEqual([...scene.drawings.keys()],["locked"], "Locked gridline untouched");
});

test("report partial server deletion without pretending all targets were removed", async () => {
  const a=make("a"), b=make("b"), controlled=selection(a,b);
  const scene=sceneWith([a,b]);
  scene.deleteEmbeddedDocuments = async (_type,ids)=>{scene.calls.push(ids);return [a];};
  const plan=planSelectedDrawingDeletion(controlled, gm, "scene");
  const result=await commitPlannedDrawingDeletion(plan,scene,controlled,gm);
  assert.deepEqual(result,{status:"partial",expected:2,deletedIds:["a"]});
  assert.deepEqual(scene.calls,[["a","b"]]);
});

test("single selection or unchanged zero-permission selection cannot invoke batch delete", async () => {
  const a=make("a");
  const p=planSelectedDrawingDeletion(selection(a), gm, "scene");
  const scene=sceneWith([a]);
  assert.equal(isDrawingDeletionPlanCurrent(p,scene,selection(a),gm),false);
  assert.equal((await commitPlannedDrawingDeletion(p,scene,selection(a),gm)).status,"stale");
  assert.deepEqual(scene.calls,[]);
});

test("batch action is separated from Deselect and uses the class-bound native confirmation", async () => {
  const src=await readFile(new URL("../scripts/main.js",import.meta.url),"utf8");
  const css=await readFile(new URL("../styles/quickbar.css",import.meta.url),"utf8");
  const section=src.slice(src.indexOf('<section class="dqb-selection"'),src.indexOf("</section>",src.indexOf('<section class="dqb-selection"')));
  const fn=src.slice(src.indexOf("async function deleteSelectedDrawings()"),src.indexOf("async function unlockDrawing(id)"));
  assert.match(section,/data-action="delete-selected"/);
  assert.match(section,/data-action="undo-style"/);
  assert.match(src,/if \(button\.dataset\.action === "delete-selected"\) await deleteSelectedDrawings\(\)/);
  assert.match(src,/const deletable = selected\.filter\(item => canDelete\(item\.document\)\)/);
  assert.match(src,/deleteSelectedButton\.disabled = batchDeletePending \|\| deletable\.length < 2/);
  assert.match(src,/Delete \$\{deletable\.length\} Selected/);
  assert.match(fn,/approved = await DialogV2\.confirm\(\{/);
  assert.match(fn,/approved !== true/);
  assert.match(fn,/flushDirectStylePatch\(\)/);
  assert.match(fn,/isDrawingDeletionPlanCurrent\(plan, scene, selectedDrawingObjects\(\), game\.user\)/);
  assert.match(fn,/commitPlannedDrawingDeletion\(/);
  assert.match(css,/\.dqb-batch-delete/);
  assert.doesNotMatch(fn,/releaseAll\(|locked: false|deleteEmbeddedDocuments\("Tile"/);
});
