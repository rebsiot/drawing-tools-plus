import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {
  TUTORIAL_STEPS, TUTORIAL_DISMISSED_FLAG, shouldAutoShowTutorial, tutorialStepIndex
} from "../scripts/tutorial.js";

test("four short guide steps describe the current Quickbar features", () => {
  assert.equal(TUTORIAL_STEPS.length, 4);
  assert.equal(TUTORIAL_DISMISSED_FLAG, "tutorialDismissed");
  for (const step of TUTORIAL_STEPS) {
    assert.ok(step.title && step.title.length < 70);
    assert.ok(step.body && step.body.length < 400);
  }
  const content = TUTORIAL_STEPS.map(step => step.body).join(" ");
  for (const key of ["Tokens", "Circle", "Apply to N Selected", "All Drawings",
    "Lock", "Deselect", "Delete", "Arrow", "Undo Style Change", "Tutorial"]) {
    assert.ok(content.includes(key), "Tutorial should mention: " + key);
  }
  assert.equal(Object.isFrozen(TUTORIAL_STEPS), true);
});

test("only GM first-use gets the welcome guide; user flag suppresses it", () => {
  const base = {isGM:true, hasDock:true, shownThisSession:false, dismissed:false};
  assert.equal(shouldAutoShowTutorial(base), true);
  assert.equal(shouldAutoShowTutorial({...base, dismissed:undefined}), true);
  assert.equal(shouldAutoShowTutorial({...base, dismissed:true}), false);
  assert.equal(shouldAutoShowTutorial({...base, shownThisSession:true}), false);
  assert.equal(shouldAutoShowTutorial({...base, hasDock:false}), false);
  assert.equal(shouldAutoShowTutorial({...base, isGM:false}), false);
  assert.equal(shouldAutoShowTutorial({...base, isGM:false, canUse:true}), true,
    'A permitted player gets the same first-use tutorial');
});

test("Back and Next stay within four steps", () => {
  assert.equal(tutorialStepIndex(0, "previous"), 0);
  assert.equal(tutorialStepIndex(0, "next"), 1);
  assert.equal(tutorialStepIndex(2, "next"), 3);
  assert.equal(tutorialStepIndex(3, "next"), 3);
  assert.equal(tutorialStepIndex(3, "previous"), 2);
  assert.equal(tutorialStepIndex(-50, "none"), 0);
  assert.equal(tutorialStepIndex(500, "none"), 3);
});

test("first-use UI saves only the current GM User flag; can be reopened and skipped safely", async () => {
  const src = await readFile(new URL("../scripts/main.js", import.meta.url), "utf8");
  assert.match(src, /function maybeOfferTutorial\(\)/);
  assert.match(src, /function showTutorial\(\)/);
  assert.match(src, /function closeTutorial\(\)/);
  assert.match(src, /dialog\.showModal\(\)/);
  assert.match(src, /aria-labelledby", "dqb-tutorial-title"/);
  assert.match(src, /dialog\.querySelector\('\[data-tour="dismiss"\]'\)\.hidden = index !== TUTORIAL_STEPS\.length - 1/);
  assert.match(src, /await game\.user\.setFlag\(MODULE_ID, TUTORIAL_DISMISSED_FLAG, true\)/);
  assert.match(src, /game\.user\.getFlag\(MODULE_ID, TUTORIAL_DISMISSED_FLAG\) === true/);
  assert.match(src, /if \(button\.dataset\.action === "tutorial"\) showTutorial\(\)/);
  assert.match(src, /if \(!dock \|\| !isUsable\(\) \|\| tutorialDialog\) return/);
  assert.match(src, /refreshToolHighlight\(\);\s*maybeOfferTutorial\(\);\s*}\s*function closeDock/);
  assert.match(src, /function closeDock\(\{restoreTokens = true\} = \{\}\) \{\s*const shouldRestoreTokens[^]*?closeTutorial\(\)/);
  assert.match(src, /function onKeydown\(event\) \{\s*if \(!dock \|\| !isUsable\(\) \|\| tutorialDialog\?\.open \|\| inspectDialog\?\.open\) return/);
  const guide = src.slice(src.indexOf("function closeTutorial()"), src.indexOf("async function openDock("));
  for (const forbidden of ["createEmbeddedDocuments(", "deleteEmbeddedDocuments(", "updateEmbeddedDocuments(", "localStorage."]) {
    assert.ok(!guide.includes(forbidden), "Tutorial must not touch Scene data: " + forbidden);
  }
  assert.ok(src.includes('data-action="tutorial"'), "Manual reopen link must remain visible");
});
