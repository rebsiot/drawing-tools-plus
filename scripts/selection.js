/**
 * Toggle a single native Foundry v14 Drawing placeable.
 * This uses only PlaceableObject control/release; no Scene documents are changed.
 * Existing controlled objects are never released when adding another Drawing.
 * @returns {"selected"|"deselected"|"failed"}
 */
export function toggleNativeDrawingSelection(placeable) {
  if (!placeable || typeof placeable.control !== "function" ||
      typeof placeable.release !== "function") return "failed";
  if (placeable.controlled) return placeable.release() ? "deselected" : "failed";
  return placeable.control({releaseOthers: false}) ? "selected" : "failed";
}
