/**
 * Tutorial content/state is independent of the Foundry canvas and has no writes.
 * Keeping it here permits Node regression tests without a browser.
 */
export const TUTORIAL_DISMISSED_FLAG = "tutorialDismissed";
export const TUTORIAL_STEPS = Object.freeze([
  Object.freeze({
    title: "Choose a drawing tool",
    body: "Open the Quickbar from Tokens or Drawings. Select, Pen, Box, Circle, Polygon and Text share the top row; Arrow is below. Pen makes an unfilled freehand line. Opening from Tokens leaves your tokens selected until you choose a Drawing tool."
  }),
  Object.freeze({
    title: "Select and change appearance",
    body: "New shapes are selected for moving and resizing. Select becomes Unselect while a Drawing is selected; clicking it clears selection. With one unlocked Drawing selected, appearance controls change it. With several, use Apply to N Selected explicitly."
  }),
  Object.freeze({
    title: "Find and protect your map art",
    body: "Expand All Drawings to search or Locate a marking. Click Select on several unlocked Drawings to keep them selected together; click Deselect to remove one. Players can edit only their own Drawings. The GM can Lock map art, and Delete always asks for confirmation."
  }),
  Object.freeze({
    title: "Arrows, undo and getting help",
    body: "Choose Arrow to reveal the head-placement and head-shape options. Undo Style Change restores appearance only—not movement, text edits or deletion. Use Tutorial at the bottom of the Quickbar to reopen this guide anytime."
  })
]);

export function shouldAutoShowTutorial({isGM, canUse = isGM, hasDock, shownThisSession, dismissed}) {
  return Boolean(canUse && hasDock && !shownThisSession && dismissed !== true);
}

export function tutorialStepIndex(current, direction) {
  const safe = Number.isInteger(current) ? current : 0;
  const delta = direction === "previous" ? -1 : direction === "next" ? 1 : 0;
  return Math.min(TUTORIAL_STEPS.length - 1, Math.max(0, safe + delta));
}
