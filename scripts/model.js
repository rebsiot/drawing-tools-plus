/** Pure model helpers; no Foundry globals or DOM dependencies. */
export const MODULE_ID = "foundry-drawing-quickbar";
export const DEFAULT_PREFS = Object.freeze({
  strokeColor: "#f4f4f4",
  fillColor: "#ffd15a",
  textColor: "#ffffff",
  strokeWidth: 4,
  strokeAlpha: 1,
  fillAlpha: 0.28,
  filled: false,
  fontSize: 32,
  autoStyle: true,
  position: null
});

const STYLABLE = ["strokeColor", "strokeWidth", "strokeAlpha", "fillType", "fillColor", "fillAlpha", "textColor", "fontSize"];
const HEX_COLOR = /^#[\da-fA-F]{6}$/;
const clamp = (value, lower, upper, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(upper, Math.max(lower, number)) : fallback;
};
const color = (value, fallback) => typeof value === "string" && HEX_COLOR.test(value) ? value.toLowerCase() : fallback;

export function normalizePrefs(source = {}) {
  if (!source || typeof source !== "object" || Array.isArray(source)) source = {};
  const d = DEFAULT_PREFS;
  const position = source.position;
  return {
    strokeColor: color(source.strokeColor, d.strokeColor),
    fillColor: color(source.fillColor, d.fillColor),
    textColor: color(source.textColor, d.textColor),
    strokeWidth: clamp(source.strokeWidth, 1, 32, d.strokeWidth),
    strokeAlpha: clamp(source.strokeAlpha, 0.1, 1, d.strokeAlpha),
    fillAlpha: clamp(source.fillAlpha, 0, 1, d.fillAlpha),
    filled: typeof source.filled === "boolean" ? source.filled : d.filled,
    fontSize: Math.round(clamp(source.fontSize, 8, 120, d.fontSize)),
    autoStyle: typeof source.autoStyle === "boolean" ? source.autoStyle : d.autoStyle,
    position: position && Number.isFinite(position.left) && Number.isFinite(position.top)
      ? {left: position.left, top: position.top} : null
  };
}

export const PRESETS = Object.freeze({
  outline: {strokeColor: "#f4f4f4", strokeWidth: 4, filled: false, textColor: "#ffffff"},
  danger: {strokeColor: "#f87171", strokeWidth: 6, filled: false, textColor: "#f87171"},
  highlight: {strokeColor: "#f5ca4e", fillColor: "#f5ca4e", strokeWidth: 2, filled: true, fillAlpha: 0.23},
  filled: {strokeColor: "#56a5eb", fillColor: "#56a5eb", strokeWidth: 2, filled: true, fillAlpha: 0.5}
});

/** Match Foundry v14 DrawingDocument style fields; do not touch geometry or identity. */
export function stylePatch(prefs) {
  const p = normalizePrefs(prefs);
  return {
    strokeColor: p.strokeColor,
    strokeWidth: p.strokeWidth,
    strokeAlpha: p.strokeAlpha,
    fillType: p.filled ? 1 : 0,
    fillColor: p.fillColor,
    fillAlpha: p.filled ? p.fillAlpha : 0,
    textColor: p.textColor,
    fontSize: p.fontSize
  };
}

/** Exact former style values for one-step manual rollback of Apply to Selected. */
export function snapshotStyle(document) {
  const raw = document.toObject();
  const snapshot = {_id: document.id};
  for (const key of STYLABLE) if (Object.hasOwn(raw, key)) snapshot[key] = raw[key];
  return snapshot;
}

/**
 * Build a closed, filled arrow silhouette from 7 vertices. In v14 freehand "f"
 * is not a valid Drawing shape type; a native polygon ("p") is supported.
 * A filled silhouette avoids the unintended closing diagonal of an open stroke.
 */
export function arrowPoints(start, end, head = 18, shaftWidth = 4) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.hypot(dx, dy);
  if (!Number.isFinite(distance) || distance < 2 || !Number.isFinite(head) || !Number.isFinite(shaftWidth)) return null;
  const ux = dx / distance, uy = dy / distance;
  const px = -uy, py = ux;
  const length = Math.min(Math.max(2, head), distance * 0.45);
  const halfShaft = Math.min(Math.max(0.5, shaftWidth / 2), length * 0.28);
  const halfHead = Math.min(Math.max(halfShaft * 2.4, length * 0.48), distance * 0.3);
  const base = {x: end.x - ux * length, y: end.y - uy * length};
  const point = (anchor, side) => ({x: anchor.x + px * side, y: anchor.y + py * side});
  return [
    point(start, halfShaft),
    point(base, halfShaft),
    point(base, halfHead),
    {x: end.x, y: end.y},
    point(base, -halfHead),
    point(base, -halfShaft),
    point(start, -halfShaft)
  ];
}

export function arrowDocumentData(start, end, prefs) {
  const p = normalizePrefs(prefs);
  const points = arrowPoints(start, end, Math.max(14, p.strokeWidth * 5), p.strokeWidth);
  if (!points) return null;
  const xs = points.map(point => point.x);
  const ys = points.map(point => point.y);
  const x = Math.min(...xs), y = Math.min(...ys);
  const width = Math.max(1, Math.max(...xs) - x);
  const height = Math.max(1, Math.max(...ys) - y);
  const flat = points.flatMap(point => [
    Number((point.x - x).toFixed(2)), Number((point.y - y).toFixed(2))
  ]);
  return {
    name: "Arrow",
    x, y,
    shape: {type: "p", width, height, points: flat},
    ...stylePatch({...p, filled: false}),
    fillType: 1,
    fillColor: p.strokeColor,
    fillAlpha: p.strokeAlpha,
    strokeWidth: 0,
    strokeAlpha: 0,
    flags: {[MODULE_ID]: {kind: "arrow", version: 1}}
  };
}

/** Duplicate only a selected, unlocked native Drawing; preserve flags, geometry, and styles. */
export function duplicateDrawingData(document, offset = 24) {
  if (!document || document.locked) return null;
  const raw = document.toObject();
  if (!raw || raw.locked || !Number.isFinite(raw.x) || !Number.isFinite(raw.y)) return null;
  if (!Number.isFinite(offset) || offset < 0 || offset > 200) return null;
  const {_id, id, author, _stats, ...copy} = raw;
  const sourceName = typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : "Drawing";
  return {
    ...copy,
    name: `${sourceName.slice(0, 110)} (Copy)`,
    x: raw.x + offset,
    y: raw.y + offset
  };
}

export function shouldStyleNewDrawing({open, active, autoStyle, userId, currentUserId, existingId, sceneId, parentId, tool}) {
  return Boolean(open && active && autoStyle && userId === currentUserId && !existingId &&
    sceneId && sceneId === parentId && ["rect", "ellipse", "polygon", "freehand", "text"].includes(tool));
}

/** A native v14 rectangle Drawing used to display one text label. */
export function textDocumentData(point, text, options = {}) {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
  if (typeof text !== "string" || !text.trim() || text.length > 2000) return null;
  const p = normalizePrefs(options);
  const size = p.fontSize;
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const longest = Math.max(...lines.map(line => [...line].length));
  // Generous initial bounds; native resize handles remain available.
  const width = Math.max(90, Math.min(2400, Math.ceil(longest * size * 0.7 + 36)));
  const height = Math.max(size + 18, Math.min(2400, Math.ceil(lines.length * size * 1.35 + 24)));
  return {
    name: "Text: " + text.trim().slice(0, 48),
    x: Math.round(point.x),
    y: Math.round(point.y),
    shape: {type: "r", width, height},
    text: text.replace(/\r\n?/g, "\n"),
    textColor: p.textColor,
    fontSize: size,
    textAlpha: 1,
    fillType: 0,
    fillAlpha: 0,
    strokeWidth: 0,
    strokeAlpha: 0
  };
}

/** Readable metadata for a selected native Drawing; no mutations or generated IDs. */
export function drawingLabel(document) {
  if (!document) return "Drawing";
  const shape = document.shape?.type;
  const kind = document.text?.trim() ? "Text" : ({
    r: "Rectangle", e: "Ellipse", p: "Polygon"
  }[shape] || "Drawing");
  const name = typeof document.name === "string" ? document.name.trim() : "";
  const detail = name || (document.text?.trim().slice(0, 40)) || ((document.id || "").slice(0, 8));
  return {kind, name: detail || "Untitled", locked: Boolean(document.locked)};
}

/** Avoid consuming keys used by native or Quickbar text editors. */
export function shouldRunDrawingShortcut({
  tool, activeLayer, editableTarget, nativeEditor, quickbarEditor, isComposing,
  repeated, modified
} = {}) {
  return Boolean(activeLayer && tool !== "text" && !editableTarget && !nativeEditor &&
    !quickbarEditor && !isComposing && !repeated && !modified);
}
