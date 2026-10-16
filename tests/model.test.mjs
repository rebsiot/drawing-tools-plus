import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MODULE_ID, DEFAULT_PREFS, normalizePrefs, stylePatch,
  arrowPoints, arrowDocumentData, duplicateDrawingData, textDocumentData, drawingLabel,
  drawingCenter, editTextPatch, findSceneDrawings,
  shouldRunDrawingShortcut, snapshotStyle, shouldStyleNewDrawing, PRESETS
} from '../scripts/model.js';

test('module has a stable independent identifier', () => {
  assert.equal(MODULE_ID, 'foundry-drawing-quickbar');
});
test('preferences reject malformed colors, out-of-range values and invalid position', () => {
  const p = normalizePrefs({strokeColor: 'javascript:alert(1)', strokeWidth: -22, fillAlpha: 4, fontSize: 900, position: {left: 'a', top: 20}});
  assert.equal(p.strokeColor, DEFAULT_PREFS.strokeColor);
  assert.equal(p.strokeWidth, 1);
  assert.equal(p.fillAlpha, 1);
  assert.equal(p.fontSize, 120);
  assert.equal(p.position, null);
});
test('style patch changes appearance only and never geometry', () => {
  const patch = stylePatch({...DEFAULT_PREFS, filled: true});
  assert.equal(patch.fillType, 1);
  assert.equal(patch.strokeWidth, 4);
  assert.equal(patch.fillAlpha, 0.28);
  assert.equal('shape' in patch, false);
  assert.equal('_id' in patch, false);
  assert.equal('author' in patch, false);
});
test('filled false forces native none fill type', () => {
  const patch = stylePatch({...DEFAULT_PREFS, filled: false, fillAlpha: 0.7});
  assert.equal(patch.fillType, 0);
  assert.equal(patch.fillAlpha, 0);
});
test('presets retain safe style ranges', () => {
  for (const patch of Object.values(PRESETS)) {
    const normalized = normalizePrefs({...DEFAULT_PREFS, ...patch});
    assert.match(normalized.strokeColor, /^#[0-9a-f]{6}$/);
    assert.ok(normalized.strokeWidth >= 1 && normalized.strokeWidth <= 32);
  }
});
test('one-step backup captures style fields only', () => {
  const before = {strokeColor: '#fefefe', strokeWidth: 5, fillType: 1, x: 80, shape: {type: 'r'}, flags: {my: true}};
  const snapshot = snapshotStyle({id: 'a', toObject: () => before});
  assert.deepEqual(snapshot, {_id:'a', strokeColor:'#fefefe', strokeWidth: 5, fillType:1});
});
test('arrow creates a closed, filled seven-vertex arrowhead and shaft', () => {
  const p = arrowPoints({x:0, y:0}, {x:100, y:0}, 20, 4);
  assert.equal(p.length, 7);
  assert.equal(p[0].x, 0);
  assert.deepEqual(p[3], {x:100, y:0});
  assert.equal(p[6].x, 0);
  assert.ok(p[2].y > p[1].y && p[4].y < p[5].y);
});
test('arrow uses valid native v14 polygon shape type with no paid art or scene changes', () => {
  const d = arrowDocumentData({x:220,y:200}, {x:120,y:90}, DEFAULT_PREFS);
  assert.equal(d.shape.type, 'p');
  assert.equal(d.shape.points.length, 14);
  assert.ok(d.shape.width > 0 && d.shape.height > 0);
  assert.ok(d.x <= 120 && d.y <= 90);
  assert.equal(d.fillType, 1);
  assert.equal(d.fillColor, DEFAULT_PREFS.strokeColor);
  assert.equal(d.strokeWidth, 0);
  assert.equal(d.flags[MODULE_ID].kind, 'arrow');
  assert.equal('scene' in d, false);
});
test('degenerate arrow is ignored', () => {
  assert.equal(arrowDocumentData({x:1,y:1}, {x:1,y:1}, DEFAULT_PREFS), null);
});
test('duplicate native drawing data preserves style, flags, text and geometry without copying identity', () => {
  const original = {
    _id: 'drawing-1', author: 'gm', name: 'Grid note', x: 100, y: 200,
    shape: {type: 'p', width: 80, height: 50, points: [0, 0, 80, 50]},
    strokeColor: '#aabbcc', text: 'Hello', locked: false,
    flags: {[MODULE_ID]: {kind: 'arrow'}}
  };
  const duplicate = duplicateDrawingData({locked:false, toObject: () => structuredClone(original)});
  assert.equal(duplicate.name, 'Grid note (Copy)');
  assert.equal(duplicate.x, 124);
  assert.equal(duplicate.y, 224);
  assert.equal(duplicate.text, 'Hello');
  assert.deepEqual(duplicate.flags, original.flags);
  assert.deepEqual(duplicate.shape, original.shape);
  assert.equal('_id' in duplicate, false);
  assert.equal('author' in duplicate, false);
  assert.equal(original.x, 100);
  assert.equal(original.y, 200);
});
test('locked drawings are never duplicated by the module', () => {
  const document = {locked: true, toObject: () => ({locked:true, x:0, y:0})};
  assert.equal(duplicateDrawingData(document), null);
});
test('arrow geometry works in each direction and refuses degenerate coordinates', () => {
  for (const [start, end] of [
    [{x:0,y:0},{x:100,y:0}],
    [{x:0,y:0},{x:0,y:-100}],
    [{x:80,y:30},{x:-20,y:190}]
  ]) {
    const arrow = arrowDocumentData(start,end,DEFAULT_PREFS);
    assert.ok(arrow.shape.points.every(Number.isFinite));
    assert.ok(arrow.shape.width > 0 && arrow.shape.height > 0);
    assert.equal(arrow.shape.type, 'p');
  }
  assert.equal(arrowDocumentData({x:0,y:0},{x:0.3,y:0.1},DEFAULT_PREFS), null);
});
test('style application is explicitly limited to local, new native drawing creations', () => {
  const base = {open: true, active: true, autoStyle: true, userId:'gm', currentUserId:'gm', existingId:null, sceneId:'scene-1', parentId:'scene-1', tool:'rect'};
  assert.equal(shouldStyleNewDrawing(base), true);
  for (const differences of [{open:false}, {active:false}, {autoStyle:false}, {userId:'player'}, {existingId:'existing'}, {parentId:'other'}, {tool:'select'}, {tool:'drawingQuickbar'}]) {
    assert.equal(shouldStyleNewDrawing({...base, ...differences}), false, JSON.stringify(differences));
  }
});

test('text popup model creates one editable native rectangle Drawing with size and color', () => {
  const data = textDocumentData({x:125.5,y:81.3}, "Hello World", {
    ...DEFAULT_PREFS, fontSize: 48, textColor: "#abcdef"
  });
  assert.equal(data.shape.type, "r");
  assert.equal(data.text, "Hello World");
  assert.equal(data.fontSize, 48);
  assert.equal(data.textColor, "#abcdef");
  assert.equal(data.x, 126);
  assert.equal(data.y, 81);
  assert.equal(data.fillType, 0);
  assert.equal(data.strokeWidth, 0);
  assert.ok(data.shape.width > 0 && data.shape.height > 0);
  assert.equal("_id" in data, false);
});
test('text data respects native Drawing size bounds and rejects empty or invalid text', () => {
  assert.equal(textDocumentData({x:0,y:0}, "   ", DEFAULT_PREFS), null);
  assert.equal(textDocumentData({x:NaN,y:1}, "Valid", DEFAULT_PREFS), null);
  assert.equal(textDocumentData({x:0,y:0}, "A".repeat(2001), DEFAULT_PREFS), null);
  const data = textDocumentData({x:1,y:1},"Hello\nWorld",{fontSize: 300, textColor: "url(javascript:foo)"});
  assert.equal(data.fontSize, 120);
  assert.equal(data.textColor, DEFAULT_PREFS.textColor);
  assert.equal(data.text, "Hello\nWorld");
  assert.ok(data.shape.height > 120);
});
test('Drawing list labels expose native shape and lock state without altering objects', () => {
  assert.deepEqual(drawingLabel({id:"abc", name:" Grid  ", shape:{type:"p"}, locked:true, text:""}), {
    kind:"Polygon",name:"Grid",locked:true
  });
  assert.equal(drawingLabel({id:"id1", name:"",shape:{type:"r"},text:"hello"}).kind,"Text");
});
test('keyboard shortcuts never run in either native text or quickbar text editor', () => {
  const base = {
    tool:"select",activeLayer:true,editableTarget:false,nativeEditor:false,
    quickbarEditor:false,isComposing:false,repeated:false,modified:false
  };
  assert.equal(shouldRunDrawingShortcut(base),true);
  for (const changed of [
    {tool:"text"},{nativeEditor:true},{quickbarEditor:true},{editableTarget:true},
    {isComposing:true},{repeated:true},{modified:true},{activeLayer:false}
  ]) {
    assert.equal(shouldRunDrawingShortcut({...base,...changed}),false,JSON.stringify(changed));
  }
});

test('finder searches every native Drawing and ranks exact stray text ahead of generic names', () => {
  const docs = [
    {id:'background', name:'Background Grid', text:'', shape:{type:'r'}, locked:true},
    {id:'middle', name:'Drawing', text:'Random artwork', shape:{type:'r'}, locked:false},
    {id:'stray', name:'Drawing', text:'a', shape:{type:'r'}, locked:false},
    {id:'another', name:'a note', text:'', shape:{type:'r'}, locked:false}
  ];
  const result = findSceneDrawings(docs, 'a', 2);
  assert.equal(result.total, 4);
  assert.equal(result.matches, 4);
  assert.equal(result.shown.length, 2);
  assert.equal(result.shown[0].id, 'stray');
  assert.equal(result.shown[1].id, 'another');
  assert.equal(findSceneDrawings(docs, 'straY').shown[0].id, 'stray');
  assert.equal(findSceneDrawings(docs, 'background').shown[0].id, 'background');
  assert.equal(findSceneDrawings(docs, 'missing').matches, 0);
});
test('finder uses native document IDs, including locked Drawings; no mutations', () => {
  const docs = [{id:'a1', name:'Grid', text:'', locked:true},
    {id:'a2', name:'Note', text:'', locked:false}];
  const before = structuredClone(docs);
  assert.deepEqual(findSceneDrawings(docs, '', 100).shown.map(d => d.id), ['a1','a2']);
  assert.deepEqual(docs, before);
});
test('drawing center respects native shape dimensions and invalid geometry', () => {
  assert.deepEqual(drawingCenter({x:100,y:200,shape:{width:40,height:80}}),{x:120,y:240});
  assert.deepEqual(drawingCenter({x:0,y:0,shape:{width:-10,height:0}}),{x:-5,y:0});
  assert.equal(drawingCenter({x:NaN,y:0,shape:{width:1,height:1}}),null);
});
test('focused text editing patch changes only text and appearance, preserving locked targets', () => {
  const doc={id:'drawing-a',locked:false,x:10,y:20,
    shape:{type:'r',width:100,height:20},flags:{important:true},text:'a'};
  const original=structuredClone(doc);
  const patch=editTextPatch(doc,'Very Rare Text Art',{fontSize:48,textColor:'#abcdef'});
  assert.deepEqual(patch,{_id:'drawing-a',text:'Very Rare Text Art',fontSize:48,textColor:'#abcdef'});
  assert.equal('shape' in patch,false);
  assert.equal('x' in patch,false);
  assert.equal('flags' in patch,false);
  assert.deepEqual(doc,original);
  assert.equal(editTextPatch({...doc,locked:true},'changed',{fontSize:48}),null);
  assert.equal(editTextPatch(doc,'  ',{}),null);
  assert.equal(editTextPatch(doc,'x'.repeat(2001),{}),null);
});
