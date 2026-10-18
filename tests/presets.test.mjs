import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {
  DEFAULT_PREFS, PRESETS, PRESET_STYLE_KEYS, normalizePrefs, effectivePreset,
  presetEditorStyle, savePreset, restorePreset, presetStylesDiffer
} from "../scripts/model.js";

const style = Object.freeze({
  strokeColor: "#112233", fillColor: "#445566", textColor: "#778899",
  strokeWidth: 9, strokeAlpha: .8, fillAlpha: .65, filled: true, fontSize: 46
});

const oldPrefs = () => normalizePrefs({
  strokeColor: "#ff7733", strokeWidth: 3, position: {left: 32, top: 64},
  arrowEnds: "both", autoStyle: false
});

test("legacy user preferences acquire an empty preset record without losing saved style or position", () => {
  const p = oldPrefs();
  assert.deepEqual(p.presets, {});
  assert.equal(p.strokeColor, "#ff7733");
  assert.equal(p.strokeWidth, 3);
  assert.equal(p.autoStyle, false);
  assert.deepEqual(p.position, {left:32, top:64});
});

test("factory presets remain unchanged for every existing preset button", () => {
  const p = oldPrefs();
  for (const [key, factory] of Object.entries(PRESETS)) {
    assert.deepEqual(effectivePreset(p, key), factory);
  }
});

test("editor opens a complete draft of the chosen factory preset", () => {
  const prefs = oldPrefs();
  const before = structuredClone(prefs);
  const draft = presetEditorStyle(prefs, "danger");
  assert.equal(draft.strokeColor, PRESETS.danger.strokeColor);
  assert.equal(draft.strokeWidth, PRESETS.danger.strokeWidth);
  assert.equal(draft.fillColor, prefs.fillColor, "unchanged factory fields inherit existing defaults");
  assert.equal(draft.arrowEnds, "both");
  assert.deepEqual(prefs, before, "opening editor must not change user preferences");
});

test("saving one preset stores all eight sanitized style controls and preserves every other button", () => {
  const initial = oldPrefs();
  const saved = savePreset(initial, "outline", style);
  assert.deepEqual(Object.keys(saved.presets), ["outline"]);
  assert.deepEqual(Object.keys(saved.presets.outline), [...PRESET_STYLE_KEYS]);
  assert.deepEqual(effectivePreset(saved, "outline"), style);
  assert.deepEqual(effectivePreset(saved, "danger"), PRESETS.danger);
  assert.equal(saved.arrowEnds, "both");
  assert.equal(saved.autoStyle, false);
  assert.deepEqual(saved.position, {left:32,top:64});
  assert.deepEqual(initial.presets, {}, "saving never mutates the previous preferences object");
});

test("custom presets survive serialization and the client settings rehydration", () => {
  const saved = savePreset(oldPrefs(), "highlight", style);
  const roundTrip = normalizePrefs(JSON.parse(JSON.stringify(saved)));
  assert.deepEqual(effectivePreset(roundTrip, "highlight"), style);
  assert.deepEqual(effectivePreset(roundTrip, "filled"), PRESETS.filled);
});

test("each button can be customized separately without affecting other saved buttons", () => {
  const one = savePreset(oldPrefs(), "outline", style);
  const two = savePreset(one, "danger", {...style, strokeColor:"#aa0011"});
  assert.equal(effectivePreset(one,"outline").strokeColor, "#112233");
  assert.equal(effectivePreset(two,"outline").strokeColor, "#112233");
  assert.equal(effectivePreset(two,"danger").strokeColor, "#aa0011");
});

test("restore factory deletes ONLY the named override and retains unrelated settings", () => {
  let prefs = savePreset(oldPrefs(), "filled", style);
  prefs = savePreset(prefs, "outline", {...style, strokeWidth: 14});
  const reset = restorePreset(prefs, "outline");
  assert.equal(Object.hasOwn(reset.presets,"outline"),false);
  assert.deepEqual(effectivePreset(reset,"outline"), PRESETS.outline);
  assert.equal(effectivePreset(reset,"filled").strokeColor,"#112233");
  assert.equal(reset.strokeColor,"#ff7733");
  assert.deepEqual(prefs.presets.outline.strokeWidth,14,"original is never changed");
});

test("invalid preset names cannot be saved or restored", () => {
  const original = oldPrefs();
  for (const key of ["admin","constructor","__proto__","toString",null,undefined]) {
    assert.equal(savePreset(original,key,style),null);
    assert.equal(restorePreset(original,key),null);
    assert.equal(effectivePreset(original,key),null);
  }
});

test("unsafe or malformed saved overrides are cleaned before use", () => {
  const prefs = normalizePrefs({presets: {
    danger: {strokeColor:"url(javascript:evil)",fontSize:1e4,strokeWidth:-10,
      fillAlpha:2,filled:true, author:"another-user",locked:false,flags:{x:1}},
    owned: style,
    filled: "no"
  }});
  assert.deepEqual(Object.keys(prefs.presets),["danger"]);
  const clean = prefs.presets.danger;
  assert.equal(clean.strokeColor,PRESETS.danger.strokeColor);
  assert.equal(clean.fontSize,120);
  assert.equal(clean.strokeWidth,1);
  assert.equal(clean.fillAlpha,1);
  assert.equal(clean.filled,true);
  assert.equal("locked" in clean,false);
  assert.equal("author" in clean,false);
  assert.equal("flags" in clean,false);
});

test("restoring factory values after client reload recovers the exact original partial patch", () => {
  const saved = JSON.parse(JSON.stringify(savePreset(oldPrefs(),"danger",style)));
  const reset = restorePreset(saved,"danger");
  assert.deepEqual(effectivePreset(reset,"danger"),PRESETS.danger);
  assert.equal(PRESETS.danger.strokeColor,"#f87171");
});

test("draft dirty checking considers style only, never canvas or profile metadata", () => {
  const same = {...style, position:{left:99,top:88}, autoStyle:true};
  assert.equal(presetStylesDiffer(style,same),false);
  assert.equal(presetStylesDiffer(style,{...style,strokeWidth:5}),true);
  assert.equal(presetStylesDiffer(null,style),true);
});

test("preset editing UI is collapsed initially and exposes direct Save, Restore, Discard", async () => {
  const source = await readFile(new URL("../scripts/main.js", import.meta.url), "utf8");
  const css = await readFile(new URL("../styles/quickbar.css", import.meta.url), "utf8");
  for (const action of ["customize-presets","save-preset","restore-preset","discard-preset"]) {
    assert.ok(source.includes(`data-action="${action}"`), `Missing ${action} action`);
  }
  assert.match(source, /class="dqb-preset-editor" aria-label="Customize style presets" hidden/);
  assert.match(css, /\.dqb-preset-editor\[hidden\] \{ display: none; \}/);
  assert.match(source, /data-preset="outline"/);
  assert.match(source, /data-preset="danger"/);
  assert.match(source, /data-preset="highlight"/);
  assert.match(source, /data-preset="filled"/);
});

test("preset editor field changes are isolated from selected Drawing writes", async () => {
  const source = await readFile(new URL("../scripts/main.js", import.meta.url), "utf8");
  assert.match(source,/else if \(customizingPreset\) \{\s*const draft =/);
  assert.match(source,/presetDirty = presetStylesDiffer\(presetDraft, presetOriginal\)/);
  assert.match(source,/if \(customizingPreset\) \{\s*editPreset\(button\.dataset\.preset\);\s*return;/);
  assert.match(source,/button\.disabled = Boolean\(customizingPreset\) \|\| mode\.mode !== "batch"/);
  const helper = source.slice(source.indexOf("const PRESET_LABELS"),source.indexOf("function queueDirectStylePatch"));
  assert.ok(helper.length>500);
  for (const method of ["updateEmbeddedDocuments(","createEmbeddedDocuments(","deleteEmbeddedDocuments("]) {
    assert.equal(helper.includes(method),false,`Editor must not write native Scene data: ${method}`);
  }
  assert.match(source,/presetDraft = null;\s*presetOriginal = null;\s*presetDirty = false;\s*clearFocusMarker\(\)/);
});

test("module label in Foundry and floating Quickbar header is AFT Drawing Tools+",async()=>{
  const source = await readFile(new URL("../scripts/main.js", import.meta.url), "utf8");
  const manifest=JSON.parse(await readFile(new URL("../module.json", import.meta.url),"utf8"));
  assert.equal(manifest.title,"AFT Drawing Tools+");
  assert.equal(manifest.id,"foundry-drawing-quickbar");
  assert.match(source, /dqb-header-title.*AFT Drawing Tools\+ <small>v0\.1\.22<\/small>/);
  assert.match(source, /title: "AFT Drawing Tools\+", icon: "fa-solid fa-pen-ruler"/);
});
