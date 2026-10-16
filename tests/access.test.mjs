import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {canUseDrawingQuickbar, drawingAuthorId, canSeeDrawing, canChangeDrawing}
  from "../scripts/access.js";

const gm = {id:"gm", isGM:true};
const owner = {id:"player-1", isGM:false, can:name=>name==="DRAWING_CREATE"};
const second = {id:"player-2", isGM:false, can:name=>name==="DRAWING_CREATE"};
const denied = {id:"player-3", isGM:false, can:()=>false};
const doc = (author, options={})=>({
  id:"drawing-123", author, locked:false, hidden:false,
  canUserModify:(_user,action)=>action==="update" || action==="delete",
  ...options
});

test("native Foundry Create Drawing permission controls both player launchers", ()=>{
  assert.equal(canUseDrawingQuickbar(gm),true);
  assert.equal(canUseDrawingQuickbar(owner),true);
  assert.equal(canUseDrawingQuickbar(second),true);
  assert.equal(canUseDrawingQuickbar(denied),false);
  assert.equal(canUseDrawingQuickbar(null),false);
  assert.equal(canUseDrawingQuickbar({id:"missing",isGM:false}),false);
  assert.equal(canUseDrawingQuickbar({id:"throws",isGM:false,can(){throw Error("denied")}}),false);
});
test("native author ID, not arbitrary names or flags, decides who may edit",()=>{
  const owned=doc("player-1",{flags:{"foundry-drawing-quickbar":{owner:"player-2"}}});
  const other=doc("player-2",{flags:{"foundry-drawing-quickbar":{owner:"player-1"}}});
  assert.equal(drawingAuthorId(owned),"player-1");
  assert.equal(drawingAuthorId(doc({id:"player-1"})),"player-1");
  assert.equal(canChangeDrawing(owner,owned,"update"),true);
  assert.equal(canChangeDrawing(owner,owned,"delete"),true);
  assert.equal(canChangeDrawing(second,owned,"delete"),false);
  assert.equal(canChangeDrawing(owner,other,"update"),false);
  assert.equal(canChangeDrawing(owner,other,"delete"),false);
  assert.equal(canChangeDrawing(gm,other,"update"),true);
  assert.equal(canChangeDrawing(gm,other,"delete"),true);
});
test("GM map art, locked and hidden Drawings cannot be changed by players",()=>{
  assert.equal(canChangeDrawing(owner,doc("gm"),"update"),false);
  assert.equal(canChangeDrawing(owner,doc("gm"),"delete"),false);
  assert.equal(canChangeDrawing(owner,doc("player-1",{locked:true}),"update"),false);
  assert.equal(canChangeDrawing(owner,doc("player-1",{locked:true}),"delete"),false);
  assert.equal(canChangeDrawing(owner,doc("player-1",{hidden:true}),"update"),false);
  assert.equal(canSeeDrawing(owner,doc("gm",{hidden:true})),false);
  assert.equal(canSeeDrawing(owner,doc("gm")),true);
  assert.equal(canSeeDrawing(gm,doc("gm",{hidden:true})),true);
  assert.equal(canChangeDrawing(gm,doc("player-1",{locked:true}),"delete"),false,
    "GM must deliberately Unlock before deleting protected art");
  assert.equal(canChangeDrawing(denied,doc("player-3"),"update"),false);
});
test("respect Foundry server update/delete permissions separately and fail closed",()=>{
  const updateOnly=doc("player-1",{canUserModify:(_user,action)=>action==="update"});
  assert.equal(canChangeDrawing(owner,updateOnly,"update"),true);
  assert.equal(canChangeDrawing(owner,updateOnly,"delete"),false);
  assert.equal(canChangeDrawing(owner,doc("player-1",{canUserModify:undefined}),"update"),false);
  assert.equal(canChangeDrawing(owner,doc("player-1",{canUserModify(){throw Error("native veto")}}),"delete"),false);
  assert.equal(canChangeDrawing(owner,doc(null),"update"),false);
});
test("Quickbar source rechecks authorship for every edit, undo and Delete confirmation",async ()=>{
  const src=await readFile(new URL("../scripts/main.js",import.meta.url),"utf8");
  assert.match(src,/import \{canUseDrawingQuickbar, canSeeDrawing, canChangeDrawing\}/);
  assert.match(src,/function canEdit\(doc\) \{ return canChangeDrawing\(game\?\.user, doc, "update"\); \}/);
  assert.match(src,/function canDelete\(doc\) \{ return canChangeDrawing\(game\?\.user, doc, "delete"\); \}/);
  assert.match(src,/sceneDrawingDocuments\(\) \{[\s\S]*?all\.filter\(doc => canSeeDrawing\(game\?\.user, doc\)\)/);
  assert.match(src,/const editable = selected\.filter\(item => canEdit\(item\.document\)\)/);
  assert.match(src,/all\.map\(item => item\.document\)\.filter\(canEdit\)/);
  assert.match(src,/if \(!canEdit\(doc\)\) return/);
  assert.match(src,/if \(!canDelete\(doc\)\) return notify/);
  assert.match(src,/scene\.drawings\.get\(id\) !== doc \|\| !canDelete\(doc\)/);
  assert.match(src,/return canEdit\(current\)/);
  assert.match(src,/if \(!isUsable\(\) \|\| !game\.user\.isGM\)/);
  assert.match(src,/lockButton\.hidden = !game\.user\.isGM/);
  assert.match(src,/const locked = \(game\.user\.isGM \? sceneDrawingDocuments\(\) : \[\]\)/);
  assert.match(src,/if \(operation\.drawingId \? !canEdit\(existing\) : !canUseDrawingQuickbar\(game\.user\)\)/);
});
