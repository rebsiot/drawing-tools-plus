import test from 'node:test';
import assert from 'node:assert/strict';

/** Mocked Foundry boot lifecycle only; does not simulate a canvas renderer or live UI. */
test('v14 lifecycle registers a GM-only native control and never mutates drawings at boot', async () => {
  const once = new Map();
  const handlers = new Map();
  const registered = [];
  const setCalls = [];
  globalThis.Hooks = {
    once: (name, fn) => once.set(name, fn),
    on: (name, fn) => handlers.set(name, fn)
  };
  globalThis.game = {
    user: {isGM:true, id:'gm'},
    settings: {
      register: (...args) => registered.push(args),
      get: () => ({strokeWidth: 6, autoStyle:true}),
      set: (...args) => {setCalls.push(args); return Promise.resolve();}
    }
  };
  globalThis.ui = {controls:{tool:{name:'rect'}}, notifications: {warn(){}, info(){}, error(){}}};
  globalThis.canvas = {ready:true, scene:{id:'scene-1'}, drawings:{active:true}};
  globalThis.document = {addEventListener(){}};
  globalThis.window = {addEventListener(){}};
  await import('../scripts/main.js');
  assert.ok(once.has('init') && once.has('ready'));
  once.get('init')();
  assert.equal(registered.length, 1);
  assert.equal(registered[0][0], 'foundry-drawing-quickbar');
  const nativeControls = {drawings:{tools:{select:{name:'select'}}}};
  handlers.get('getSceneControlButtons')(nativeControls);
  assert.equal(nativeControls.drawings.tools.drawingQuickbar.button, true);
  assert.equal(nativeControls.drawings.tools.drawingQuickbar.name, 'drawingQuickbar');
  once.get('ready')();
  assert.ok(handlers.has('controlDrawing'), 'Selection UI tracks native controlDrawing changes');
  assert.ok(handlers.has('updateDrawing'), 'Locked status updates are observed');
  let mutationCount = 0;
  const pending = {parent:{id:'scene-1'}, updateSource:()=>mutationCount++};
  handlers.get('preCreateDrawing')(pending, {_id:null}, {}, 'gm');
  assert.equal(mutationCount, 0, 'No mutation when Quickbar is closed');
  assert.equal(setCalls.length, 0, 'No settings writes during boot');
  assert.equal(handlers.has('preUpdateDrawing'), false, 'Does not intercept existing drawing edits');
  assert.equal(handlers.has('preCreateWall'), false, 'Does not touch Walls layer');
});
