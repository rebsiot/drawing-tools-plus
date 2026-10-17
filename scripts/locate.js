/**
 * Pure geometry for a local, non-persistent Locate outline.
 * Uses the native DrawingDocument geometry, never its flags, lock or ownership.
 */
export function drawingLocateGeometry(document) {
  if (!document) return null;
  const x = Number(document.x);
  const y = Number(document.y);
  const rawWidth = Number(document.shape?.width ?? 0);
  const rawHeight = Number(document.shape?.height ?? 0);
  const rotation = Number(document.rotation ?? 0);
  if (![x, y, rawWidth, rawHeight, rotation].every(Number.isFinite)) return null;
  const width = Math.abs(rawWidth);
  const height = Math.abs(rawHeight);
  const radians = rotation * Math.PI / 180;
  const c = Math.abs(Math.cos(radians)), s = Math.abs(Math.sin(radians));
  return {
    center: {x: x + rawWidth / 2, y: y + rawHeight / 2},
    width, height, rotation,
    // The axis-aligned extent of a rotated rectangle, for fitting the camera.
    fitWidth: width * c + height * s,
    fitHeight: width * s + height * c
  };
}

/**
 * Pan to the Drawing's center. Small Drawings retain the existing close-up;
 * large Drawings zoom out only as needed to fit their whole outline.
 * The native Canvas may enforce a minimum zoom for exceptionally large art.
 */
export function locateDrawingScale(geometry, viewport, currentScale, scaleLimits) {
  if (!geometry || !Number.isFinite(currentScale) || currentScale <= 0) return null;
  const width = Number(viewport?.[0]), height = Number(viewport?.[1]);
  if (![width, height].every(Number.isFinite) || width <= 0 || height <= 0) return null;
  let target;
  if (Math.max(geometry.fitWidth, geometry.fitHeight) < 120) {
    target = Math.min(2, Math.max(1.3, currentScale));
  } else {
    // Leave enough room for the outline, caption and adjacent Foundry controls.
    const fit = Math.min(0.76 * width / Math.max(geometry.fitWidth, 1),
      0.76 * height / Math.max(geometry.fitHeight, 1));
    target = Math.min(currentScale, fit);
  }
  const min = Number(scaleLimits?.min), max = Number(scaleLimits?.max);
  if (Number.isFinite(min) && min > 0) target = Math.max(min, target);
  if (Number.isFinite(max) && max > 0) target = Math.min(max, target);
  return Number.isFinite(target) && target > 0 ? target : null;
}

/** Project the actual Drawing edges to CSS pixels; do not cap large outlines. */
export function drawingFocusFrame(geometry, project) {
  if (!geometry || typeof project !== "function") return null;
  const {center, width, height, rotation} = geometry;
  let a, b;
  try {
    a = project({x: center.x - width / 2, y: center.y - height / 2});
    b = project({x: center.x + width / 2, y: center.y + height / 2});
  } catch { return null; }
  if (![a?.x, a?.y, b?.x, b?.y].every(Number.isFinite)) return null;
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    width: Math.max(82, Math.abs(b.x - a.x) + 24),
    height: Math.max(82, Math.abs(b.y - a.y) + 24),
    rotation
  };
}

/** Some Scenes cannot zoom out far enough; keep the caption on-screen then. */
export function isLocateFrameOversized(frame, viewport) {
  const width = Number(viewport?.[0]), height = Number(viewport?.[1]);
  if (!frame || ![width,height].every(Number.isFinite) || width <= 0 || height <= 0) return false;
  return frame.x - frame.width / 2 < 12 || frame.y - frame.height / 2 < 12 ||
    frame.x + frame.width / 2 > width - 12 ||
    frame.y + frame.height / 2 > height - 12;
}
