/**
 * Tutorial content/state is independent of the Foundry canvas and has no writes.
 * Keeping it here permits Node regression tests without a browser.
 */
export const TUTORIAL_DISMISSED_FLAG = "tutorialDismissed";
export const TUTORIAL_STEPS = Object.freeze([
  Object.freeze({
    title: "Choose a drawing tool",
    body: "Open the Quickbar from Tokens or Drawings. The top row has Select, Pen, Box, Circle, Polygon and Text. Row two has Line, Arrow, Route and Callout. Pen is freehand. Opening from Tokens preserves selected tokens until you choose a Drawing tool. Click Tokens in the Quickbar header or close it to resume token movement."
  }),
  Object.freeze({
    title: "Select and change appearance",
    body: "New shapes are selected for moving and resizing. Select becomes Unselect while a Drawing is selected; clicking it clears selection. With one unlocked Drawing selected, appearance controls change it. With several, use Apply to N Selected explicitly."
  }),
  Object.freeze({
    title: "Find and protect your map art",
    body: "In All Drawings, use search or Locked only to find markings. Red locks mark protected art. Select several Drawings, then Delete N Selected to review an exact list before confirming. Locked/unauthorized items are skipped. Deselect never deletes. Players can delete only their own unlocked Drawings."
  }),
  Object.freeze({
    title: "Arrows, undo and getting help",
    body: "Arrow lets you choose solid Triangle, Diamond or open Chevron heads. Route uses waypoint clicks; finish with double-click, Enter or Finish. For Callout, drag a pointer and type a label. Undo Style Change affects appearance only. Reopen this guide via Tutorial."
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
