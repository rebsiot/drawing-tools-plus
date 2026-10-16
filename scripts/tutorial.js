/**
 * Tutorial content/state is independent of the Foundry canvas and has no writes.
 * Keeping it here permits Node regression tests without a browser.
 */
export const TUTORIAL_DISMISSED_FLAG = "tutorialDismissed";
export const TUTORIAL_STEPS = Object.freeze([
  Object.freeze({
    title: "Choose a drawing tool",
    body: "Open the Drawing Quickbar from Tokens or Drawings. Choose Box, Circle, Pen, Polygon, Text, or Arrow to draw on the Scene. Opening it from Tokens keeps your current Token selection until you choose a drawing tool."
  }),
  Object.freeze({
    title: "Select and change appearance",
    body: "New shapes are selected for moving and resizing. With one unlocked Drawing selected, stroke, fill, text and the built-in style presets change that Drawing. With multiple Drawings selected, use Apply to N Selected explicitly."
  }),
  Object.freeze({
    title: "Find and protect your map art",
    body: "Expand All Drawings to search or Locate a tiny marking. Lock permanent gridlines and annotations, and use Locked Drawings when you need to unlock them. Deselect does not delete; Delete requires confirmation."
  }),
  Object.freeze({
    title: "Arrows, undo and getting help",
    body: "Choose Arrow to reveal the head-placement and head-shape options. Undo Style Change restores appearance only—not movement, text edits or deletion. Use Tutorial at the bottom of the Quickbar to reopen this guide anytime."
  })
]);

export function shouldAutoShowTutorial({isGM, hasDock, shownThisSession, dismissed}) {
  return Boolean(isGM && hasDock && !shownThisSession && dismissed !== true);
}

export function tutorialStepIndex(current, direction) {
  const safe = Number.isInteger(current) ? current : 0;
  const delta = direction === "previous" ? -1 : direction === "next" ? 1 : 0;
  return Math.min(TUTORIAL_STEPS.length - 1, Math.max(0, safe + delta));
}
