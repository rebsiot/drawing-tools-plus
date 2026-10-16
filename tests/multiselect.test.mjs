import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {toggleNativeDrawingSelection} from "../scripts/selection.js";

function mockSelection() {
  const controlled = new Set();
  const calls = [];
  const drawing = id => ({
    id,
    get controlled() { return controlled.has(id); },
    control(options = {}) {
      calls.push({action:"control", id, options});
      if (options.releaseOthers !== false) controlled.clear();
      controlled.add(id);
      return true;
    },
    release() {
      calls.push({action:"release", id});
      return controlled.delete(id);
    }
  });
  return {controlled, calls, drawing};
}

test("Select several inventory rows: prior native Drawings stay controlled", () => {
  const {controlled,calls,drawing}=mockSelection();
  const a=drawing("a"), b=drawing("b"), c=drawing("c");
  assert.equal(toggleNativeDrawingSelection(a),"selected");
  assert.equal(toggleNativeDrawingSelection(b),"selected");
  assert.equal(toggleNativeDrawingSelection(c),"selected");
  assert.deepEqual([...controlled],["a","b","c"]);
  assert.equal(calls.length,3);
  assert.ok(calls.every(call=>call.action==="control" && call.options.releaseOthers===false));
});
test("Selecting an already controlled Drawing deselects just that one", () => {
  const {controlled,calls,drawing}=mockSelection();
  const a=drawing("a"), b=drawing("b"), c=drawing("c");
  [a,b,c].forEach(d=>assert.equal(toggleNativeDrawingSelection(d),"selected"));
  assert.equal(toggleNativeDrawingSelection(b),"deselected");
  assert.deepEqual([...controlled],["a","c"]);
  assert.deepEqual(calls.at(-1),{action:"release",id:"b"});
  assert.equal(toggleNativeDrawingSelection(b),"selected");
  assert.deepEqual([...controlled],["a","c","b"]);
});
test("Native selection failures cannot trigger selection of unrelated Drawings", () => {
  assert.equal(toggleNativeDrawingSelection(null),"failed");
  assert.equal(toggleNativeDrawingSelection({controlled:false,control:null,release(){}}),"failed");
  assert.equal(toggleNativeDrawingSelection({controlled:false,control:()=>false,release(){}}),"failed");
  assert.equal(toggleNativeDrawingSelection({controlled:true,control(){},release:()=>false}),"failed");
});
test("All Drawings toggle remains a native-only, author-checked operation", async () => {
  const src=await readFile(new URL("../scripts/main.js",import.meta.url),"utf8");
  const helper=await readFile(new URL("../scripts/selection.js",import.meta.url),"utf8");
  assert.match(src,/if \(button\.dataset\.action === "toggle-one"\) await toggleDrawingSelection/);
  assert.match(src,/doc\.locked \? "unlock-one" : "toggle-one"/);
  assert.match(src,/function makeObjectRow\(document, action, title, finder = false\)/);
  assert.match(src,/action === "toggle-one" && canEdit\(document\)/);
  assert.match(src,/const controlled = Boolean\(canvas\?\.drawings\?\.active &&/);
  assert.match(src,/button\.setAttribute\("aria-pressed", String\(controlled\)\)/);
  assert.match(src,/const buttonText = action === "unlock-one" \? "Unlock" :\s*action === "toggle-one" && !controlled \? "Select" : "Deselect"/);
  const method=src.slice(src.indexOf("async function toggleDrawingSelection(id)"),
    src.indexOf("/** This is a local HTML marker", src.indexOf("async function toggleDrawingSelection(id)")));
  assert.ok(method.startsWith("async function toggleDrawingSelection"));
  assert.match(method,/if \(!canEdit\(doc\)\) return/);
  assert.match(method,/canvas\.scene\.drawings\.get\(id\) !== doc \|\| !canEdit\(doc\)/);
  assert.match(method,/toggleNativeDrawingSelection\(placeable\)/);
  assert.doesNotMatch(method,/releaseAll\(/,"Adding one row must never clear the rest");
  assert.doesNotMatch(method,/updateEmbeddedDocuments|deleteEmbeddedDocuments|createEmbeddedDocuments/);
  assert.match(helper,/placeable\.control\(\{releaseOthers: false\}\)/);
  assert.match(helper,/placeable\.release\(\)/);
  assert.doesNotMatch(helper,/updateEmbeddedDocuments|deleteEmbeddedDocuments|createEmbeddedDocuments/);
});
