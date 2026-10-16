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
  const nativeControls = {
    drawings:{tools:{select:{name:'select'}}},
    tokens:{tools:{select:{name:'select'}, target:{name:'target'}}}
  };
  handlers.get('getSceneControlButtons')(nativeControls);
  for (const layer of ['drawings','tokens']) {
    const launcher = nativeControls[layer].tools.drawingQuickbar;
    assert.equal(launcher.button, true, layer + ' quickbar is a button');
    assert.equal(launcher.name, 'drawingQuickbar', layer + ' uses the same module launcher');
    assert.equal(launcher.title, 'Drawing Quickbar');
    assert.equal(typeof launcher.onChange, 'function');
  }
  assert.equal(nativeControls.tokens.tools.target.name,'target','Existing Token tools remain intact');
  const tokensOnly = {tokens:{tools:{select:{name:'select'}}}};
  handlers.get('getSceneControlButtons')(tokensOnly);
  assert.ok(tokensOnly.tokens.tools.drawingQuickbar, 'No need for Drawings control to be present');
  const drawingsOnly = {drawings:{tools:{select:{name:'select'}}}};
  handlers.get('getSceneControlButtons')(drawingsOnly);
  assert.ok(drawingsOnly.drawings.tools.drawingQuickbar, 'Original Drawings button remains');
  game.user.isGM = false;
  const playerControls = {drawings:{tools:{}},tokens:{tools:{}}};
  handlers.get('getSceneControlButtons')(playerControls);
  assert.equal(playerControls.tokens.tools.drawingQuickbar, undefined, 'No player Token launcher');
  assert.equal(playerControls.drawings.tools.drawingQuickbar, undefined,
    'Players without native Drawing permission cannot launch Quickbar');
  game.user.id = 'player-1';
  game.user.can = name => name === 'DRAWING_CREATE';
  const allowedPlayerControls = {tokens:{tools:{}},drawings:{tools:{}}};
  handlers.get('getSceneControlButtons')(allowedPlayerControls);
  assert.ok(allowedPlayerControls.tokens.tools.drawingQuickbar,
    'Player with Foundry Use Drawing Tools permission receives Token launcher');
  assert.ok(allowedPlayerControls.drawings.tools.drawingQuickbar,
    'Player with Foundry Use Drawing Tools permission receives Drawing launcher');
  game.user.isGM = true;
  game.user.id = 'gm';
  once.get('ready')();
  assert.ok(handlers.has('controlDrawing'), 'Selection UI tracks native controlDrawing changes');
  assert.ok(handlers.has('releaseDrawing'), 'Clearing a selection refreshes the Select/Unselect label');
  assert.ok(handlers.has('updateDrawing'), 'Locked status updates are observed');
  assert.ok(handlers.has('createDrawing'), 'Creation hook can select a newly created Drawing');
  let mutationCount = 0;
  const pending = {parent:{id:'scene-1'}, updateSource:()=>mutationCount++};
  handlers.get('preCreateDrawing')(pending, {_id:null}, {}, 'gm');
  assert.equal(mutationCount, 0, 'No mutation when Quickbar is closed');
  assert.equal(setCalls.length, 0, 'No settings writes during boot');
  assert.equal(handlers.has('preUpdateDrawing'), false, 'Does not intercept existing drawing edits');
  assert.equal(handlers.has('preCreateWall'), false, 'Does not touch Walls layer');
});
