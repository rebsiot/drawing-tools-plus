import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MODULE_ID, DEFAULT_PREFS, normalizePrefs, stylePatch,
  arrowPoints, arrowDocumentData, snapshotStyle, shouldStyleNewDrawing, PRESETS
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
test('arrow endpoints are part of the same native shape path', () => {
  const p = arrowPoints({x:0, y:0}, {x:100, y:0}, 20);
  assert.equal(p.length, 5);
  assert.deepEqual(p[0], {x:0, y:0});
  assert.deepEqual(p[1], p[3]);
  assert.ok(p[2].x < 100 && p[4].x < 100);
});
test('arrow writes exactly one native freehand drawing with no paid art or scene changes', () => {
  const d = arrowDocumentData({x:220,y:200}, {x:120,y:90}, DEFAULT_PREFS);
  assert.equal(d.shape.type, 'f');
  assert.equal(d.shape.points.length, 10);
  assert.ok(d.shape.width > 0 && d.shape.height > 0);
  assert.ok(d.x <= 120 && d.y <= 90);
  assert.equal(d.fillType, 0);
  assert.equal(d.flags[MODULE_ID].kind, 'arrow');
  assert.equal('scene' in d, false);
});
test('degenerate arrow is ignored', () => {
  assert.equal(arrowDocumentData({x:1,y:1}, {x:1,y:1}, DEFAULT_PREFS), null);
});
test('style application is explicitly limited to local, new native drawing creations', () => {
  const base = {open: true, active: true, autoStyle: true, userId:'gm', currentUserId:'gm', existingId:null, sceneId:'scene-1', parentId:'scene-1', tool:'rect'};
  assert.equal(shouldStyleNewDrawing(base), true);
  for (const differences of [{open:false}, {active:false}, {autoStyle:false}, {userId:'player'}, {existingId:'existing'}, {parentId:'other'}, {tool:'select'}, {tool:'drawingQuickbar'}]) {
    assert.equal(shouldStyleNewDrawing({...base, ...differences}), false, JSON.stringify(differences));
  }
});
