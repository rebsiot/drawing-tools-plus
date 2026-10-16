import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {DEFAULT_PREFS, MODULE_ID, arrowDocumentData, drawingAppearancePatch,
  drawingLabel} from "../scripts/model.js";
import {ribbonVertices, ribbonDrawingData, calloutDrawingData} from "../scripts/annotations.js";

const point = (x,y) => ({x,y});
const prefs = {...DEFAULT_PREFS,strokeColor:"#33cc88",strokeWidth:5,filled:true};

test("Line uses exactly one valid native polygon Drawing with a visible narrow stroke",()=>{
  const start=point(10,20),end=point(150,70);
  const vertices=ribbonVertices([start,end],5);
  assert.equal(vertices.length,4);
  assert.ok(vertices.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
  const d=ribbonDrawingData([start,end],prefs,"line");
  assert.ok(d && d.name==="Line");
  assert.equal(d.shape.type,"p");
  assert.equal(d.fillType,1);
  assert.equal(d.fillColor,"#33cc88");
  assert.equal(d.strokeWidth,0);
  assert.ok(d.shape.width>0 && d.shape.height>0);
  assert.equal(d.shape.points.length,8);
  assert.deepEqual(d.flags[MODULE_ID],{kind:"line",version:1});
  assert.ok(!("author" in d) && !("_id" in d) && !("locked" in d));
  assert.equal(drawingLabel({...d,id:"line-1"}).kind,"Line");
});

test("Route stores all waypoints as a single native polygon without scene writes",()=>{
  const route=[point(15,10),point(95,10),point(95,80),point(210,90)];
  const source=structuredClone(route);
  const data=ribbonDrawingData(route,prefs,"route");
  assert.ok(data);
  assert.equal(data.name,"Route");
  assert.equal(data.shape.type,"p");
  assert.equal(data.shape.points.length,route.length*4);
  assert.deepEqual(data.flags[MODULE_ID],{kind:"route",version:1});
  assert.equal(drawingLabel({...data,id:"route-1"}).kind,"Route");
  assert.deepEqual(route,source);
  assert.equal(ribbonVertices([point(0,0)]),null);
  assert.equal(ribbonVertices([point(0,0),point(0,0)]),null);
  assert.equal(ribbonVertices([point(0,0),point(Infinity,5)]),null);
  assert.equal(ribbonDrawingData(route,prefs,"not-a-kind"),null);
  assert.equal(ribbonVertices([...route,...Array.from({length:81},(_,i)=>point(211+i,91))]),null);
});

test("Callout contains two separate native Drawings; label can be edited independently",()=>{
  const start=point(10,10),end=point(110,65);
  const pair=calloutDrawingData(start,end,"Suspicious door",prefs);
  assert.ok(pair && pair.length===2);
  const [leader,label]=pair;
  assert.equal(leader.shape.type,"p");
  assert.equal(leader.flags[MODULE_ID].kind,"callout-leader");
  assert.equal(label.shape.type,"r");
  assert.equal(label.text,"Suspicious door");
  assert.equal(label.flags[MODULE_ID].kind,"callout-label");
  assert.equal(label.x,118);
  assert.equal(label.y,57);
  assert.equal(label.fillType,0);
  assert.ok(!("_id" in leader) && !("_id" in label));
  assert.equal(drawingLabel({...leader,id:"a"}).kind,"Callout pointer");
  assert.equal(drawingLabel({...label,id:"b"}).kind,"Callout text");
  assert.equal(calloutDrawingData(start,end,"   ",prefs),null);
  assert.equal(calloutDrawingData(start,end,"a".repeat(2001),prefs),null);
  assert.equal(calloutDrawingData(null,end,"label",prefs),null);
});

test("Styles cannot erase ribbon geometry or silently change any Drawing IDs",()=>{
  for (const kind of ["line","route","callout-leader"]) {
    const d=ribbonDrawingData([point(0,0),point(100,25)],prefs,kind);
    const before=structuredClone(d);
    const patch=drawingAppearancePatch(d,{...DEFAULT_PREFS,filled:false});
    assert.equal(patch.fillType,1);
    assert.ok(patch.fillAlpha>=.3);
    assert.equal(patch.strokeWidth,0);
    assert.ok(!("shape" in patch)&&!("author" in patch)&&!("_id" in patch));
    assert.deepEqual(d,before);
  }
});
test("New Chevron differs from a solid triangle, remains a v14 polygon and never rewrites legacy Drawings",()=>{
  const base=arrowDocumentData(point(5,0),point(130,0),{...prefs,arrowHeadShape:"triangle"});
  const chevron=arrowDocumentData(point(5,0),point(130,0),{...prefs,arrowHeadShape:"chevron"});
  assert.equal(base.shape.type,"p");
  assert.equal(chevron.shape.type,"p");
  assert.equal(chevron.flags[MODULE_ID].version,4);
  assert.equal(chevron.fillType,1);
  assert.notDeepEqual(base.shape.points,chevron.shape.points);
  assert.ok(!JSON.stringify(chevron).includes('"type":"f"'));
});
test("Quickbar renders first collapsed All Drawings count immediately, then keeps it updated", async()=>{
  const source=await readFile(new URL("../scripts/main.js",import.meta.url),"utf8");
  const create=source.slice(source.indexOf("function createDock()"),
    source.indexOf("function closeTutorial()"));
  assert.match(create,/dock = root;[\s\S]*?updateDockInputs\(\);\s*\/\/ Keep collapsed All Drawings count accurate[^]*?refreshFinder\(\);/);
  const finder=source.slice(source.indexOf("function refreshFinder()"),
    source.indexOf("/** Inspect protected map art"));
  const countIndex=finder.indexOf("scene-drawing-count");
  const collapsedIndex=finder.indexOf("if (!panel.open) return");
  assert.ok(countIndex>0 && collapsedIndex>countIndex,
    "Collapsed heading count must be updated before skipping the expensive list render");
  assert.match(source,/Hooks.on\("createDrawing", \(doc, _options, userId\) => \{\s*refreshSelectedPanel\(\);\s*refreshFinder\(\)/);
  assert.match(source,/Hooks.on\("deleteDrawing", \(\) => \{\s*refreshSelectedPanel\(\);\s*refreshFinder\(\)/);
});
test("Line/Arrow/Route/Callout share one placement overlay but distinct save paths",async()=>{
  const src=await readFile(new URL("../scripts/main.js",import.meta.url),"utf8");
  assert.match(src,/function enterArrow\(tool = "arrow"\)/);
  assert.match(src,/\["arrow", "line", "route", "callout"\]\.includes\(tool\)/);
  assert.match(src,/routeWaypoints\.push\(\{screen: screenPoint\(event\), scene: scenePoint\(event\)\}\)/);
  assert.match(src,/function finishRoute\(\)/);
  assert.match(src,/ribbonDrawingData\(points, preferences, "route"\)/);
  assert.match(src,/ribbonDrawingData\(\[initial\.scene, end\], preferences, "line"\)/);
  assert.match(src,/const toolKind = activeGeometryTool/);
  assert.match(src,/calloutStart: initial\.scene/);
  assert.match(src,/calloutDrawingData\(operation\.calloutStart, operation\.position, raw, newPreferences\)/);
  assert.match(src,/const data = Array\.isArray\(patch\) \? patch : \[patch\]/);
  assert.match(src,/canvas\.scene\.createEmbeddedDocuments\("Drawing", data\)/);
  assert.match(src,/button\.dataset\.action === "finish-route"/);
  assert.match(src,/event\.key === "Enter" && activeGeometryTool === "route"/);
  assert.match(src,/refreshToolHighlight\(\);[\s\S]*?maybeOfferTutorial\(\)/);
  const overlay=src.slice(src.indexOf("function drawArrowPreview(point)"),
    src.indexOf("/**\n * Placement overlay only:"));
  assert.doesNotMatch(overlay,/deleteEmbeddedDocuments|updateEmbeddedDocuments/);
  assert.match(overlay,/if \(!data \|\| !isUsable\(\) \|\| !canvas\.drawings\.active/);
});
