import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {drawingLocateGeometry, locateDrawingScale, drawingFocusFrame,
  isLocateFrameOversized} from "../scripts/locate.js";

const rectangle = (width, height, other = {}) => ({
  id: "rectangle", x: 100, y: 200, shape: {width, height, type: "r"}, ...other
});
const nearly = (actual, expected, tolerance = 0.000001) =>
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);

test("giant Scene rectangle retains its actual dimensions and center", () => {
  const doc = rectangle(8000, 3500, {locked: true, name: "map border"});
  const before = structuredClone(doc);
  const g = drawingLocateGeometry(doc);
  assert.deepEqual(g.center, {x: 4100, y: 1950});
  assert.equal(g.fitWidth, 8000);
  assert.equal(g.fitHeight, 3500);
  assert.equal(g.width, 8000);
  assert.equal(g.height, 3500);
  assert.deepEqual(doc, before, "Location calculations must not change locked Drawings");
});

test("giant rectangle zooms out to fit the viewport, rather than zooming in", () => {
  const g = drawingLocateGeometry(rectangle(8000, 3500));
  const zoom = locateDrawingScale(g, [1400, 900], 1, {min: 0.05, max: 3});
  nearly(zoom, 0.76 * 1400 / 8000);
  assert.ok(g.fitWidth * zoom < 1400 * 0.8);
  assert.ok(g.fitHeight * zoom < 900 * 0.8);
  assert.equal(locateDrawingScale(g, [1400, 900], 0.1, {min: 0.05}), 0.1,
    "Locate must not unnecessarily zoom in on large Drawings");
});

test("small rectangles retain close-up and minimum visible highlight", () => {
  const g = drawingLocateGeometry(rectangle(15, 8));
  assert.equal(locateDrawingScale(g, [1400, 900], 1, {min: 0.1, max: 3}), 1.3);
  assert.equal(locateDrawingScale(g, [1400, 900], 1.7, {min: 0.1, max: 3}), 1.7);
  assert.equal(locateDrawingScale(g, [1400, 900], 3, {min: 0.1, max: 3}), 2);
  const frame = drawingFocusFrame(g, p => p);
  assert.deepEqual({width:frame.width, height:frame.height}, {width:82,height:82});
});

test("full-size on-screen outline has no 360 x 260 pixel cap", () => {
  const g = drawingLocateGeometry(rectangle(8000, 3500));
  const frame = drawingFocusFrame(g, p => ({x:p.x * 0.15 + 42, y:p.y * 0.15 - 20}));
  nearly(frame.width, 1224);
  nearly(frame.height, 549);
  nearly(frame.x, 4100 * 0.15 + 42);
  nearly(frame.y, 1950 * 0.15 - 20);
  assert.ok(frame.width > 360 && frame.height > 260);
});

test("rotation fits the bounding extent but outlines the original rotated rectangle", () => {
  const g = drawingLocateGeometry(rectangle(200,100,{rotation:45}));
  nearly(g.fitWidth, Math.SQRT1_2 * 300);
  nearly(g.fitHeight, Math.SQRT1_2 * 300);
  const frame = drawingFocusFrame(g, p => ({x:p.x * 0.5,y:p.y * 0.5}));
  assert.equal(frame.rotation, 45);
  assert.equal(frame.width, 124);
  assert.equal(frame.height, 82);
  assert.deepEqual({x:frame.x, y:frame.y},{x:100,y:125});
});

test("negative width/height and unusual rotations remain valid native geometry", () => {
  const g = drawingLocateGeometry(rectangle(-200,-100,{rotation:-30}));
  assert.deepEqual(g.center,{x:0,y:150});
  assert.equal(g.width,200);
  assert.equal(g.height,100);
  assert.ok(g.fitWidth > 200 && g.fitHeight > 100);
  const frame = drawingFocusFrame(g, p => p);
  assert.equal(frame.width,224);
  assert.equal(frame.height,124);
  assert.equal(frame.rotation,-30);
});

test("respects Foundry native zoom limits when an enormous Drawing cannot fully fit", () => {
  const g = drawingLocateGeometry(rectangle(20000,20000));
  assert.equal(locateDrawingScale(g,[1400,900],1,{min:0.25,max:3}),0.25);
  assert.equal(locateDrawingScale(g,[1400,900],1,{min:0.01,max:3}),0.0342);
  assert.equal(locateDrawingScale(g,[1400,900],1,{min:0.5,max:3}),0.5);
});

test("unfittable drawings keep a visible center label when native minZoom clips borders", () => {
  assert.equal(isLocateFrameOversized({x:700,y:450,width:1000,height:650},[1400,900]),false);
  assert.equal(isLocateFrameOversized({x:700,y:450,width:2000,height:1000},[1400,900]),true);
  assert.equal(isLocateFrameOversized({x:30,y:30,width:82,height:82},[1400,900]),true);
  assert.equal(isLocateFrameOversized(null,[1400,900]),false);
});

test("invalid projected and world geometry fail closed without mutating the Scene", () => {
  assert.equal(drawingLocateGeometry(null),null);
  assert.equal(drawingLocateGeometry(rectangle(100,20,{x:Infinity})),null);
  assert.equal(drawingLocateGeometry(rectangle(NaN,20)),null);
  assert.equal(drawingFocusFrame(null, p=>p),null);
  assert.equal(drawingFocusFrame(drawingLocateGeometry(rectangle(100,100)), ()=>({x:Infinity,y:0})),null);
  assert.equal(locateDrawingScale(drawingLocateGeometry(rectangle(200,100)),null,1),null);
  assert.equal(locateDrawingScale(drawingLocateGeometry(rectangle(200,100)),[0,500],1),null);
});

test("Quickbar Locate uses real bounds and pan/resize refresh while remaining read-only", async () => {
  const src = await readFile(new URL("../scripts/main.js", import.meta.url), "utf8");
  const marker = src.slice(src.indexOf("function refreshFocusMarker()"),src.indexOf("async function lockSelected()"));
  assert.match(src,/import \{drawingLocateGeometry, locateDrawingScale, drawingFocusFrame,/);
  assert.match(marker,/drawingFocusFrame\(geometry,/);
  assert.match(marker,/locateDrawingScale\(geometry,/);
  assert.match(marker,/canvas\.screenDimensions/);
  assert.match(marker,/canvas\.dimensions\?\.scale/);
  assert.match(marker,/rotate\(\$\{frame\.rotation\}deg\)/);
  assert.match(marker,/rotate\(\$\{-frame\.rotation\}deg\)/);
  assert.match(marker,/isLocateFrameOversized\(frame,/);
  assert.match(marker,/dqb-focus-oversize/);
  assert.match(src,/Hooks\.on\("canvasPan", refreshFocusMarker\)/);
  assert.match(src,/Hooks\.on\("updateDrawing", \(\) => \{\s*refreshSelectedPanel\(\);\s*refreshFinder\(\);\s*refreshFocusMarker\(\)/);
  assert.match(src,/Hooks\.on\("deleteDrawing", \(\) => \{\s*refreshSelectedPanel\(\);\s*refreshFinder\(\);\s*refreshFocusMarker\(\)/);
  assert.doesNotMatch(marker,/Math\.min\(360|Math\.min\(260/);
  for (const operation of ["createEmbeddedDocuments(","updateEmbeddedDocuments(","deleteEmbeddedDocuments(","canvas.ping("]) {
    assert.ok(!marker.includes(operation),`Locate must not write or broadcast: ${operation}`);
  }
});
