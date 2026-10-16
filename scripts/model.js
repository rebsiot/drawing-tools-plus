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

/** Screen or scene coordinate geometry for a single native freehand arrow. */
export function arrowPoints(start, end, head = 18) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.hypot(dx, dy);
  if (!Number.isFinite(distance) || distance < 1) return null;
  const length = Math.min(head, distance * 0.48);
  const angle = Math.atan2(dy, dx);
  const wing = Math.PI / 6;
  return [
    {x: start.x, y: start.y}, {x: end.x, y: end.y},
    {x: end.x - length * Math.cos(angle - wing), y: end.y - length * Math.sin(angle - wing)},
    {x: end.x, y: end.y},
    {x: end.x - length * Math.cos(angle + wing), y: end.y - length * Math.sin(angle + wing)}
  ];
}

export function arrowDocumentData(start, end, prefs) {
  const p = normalizePrefs(prefs);
  const points = arrowPoints(start, end, Math.max(14, p.strokeWidth * 5));
  if (!points) return null;
  const xs = points.map(point => point.x);
  const ys = points.map(point => point.y);
  const x = Math.min(...xs), y = Math.min(...ys);
  const width = Math.max(1, Math.max(...xs) - x);
  const height = Math.max(1, Math.max(...ys) - y);
  const flat = points.flatMap(point => [Number((point.x - x).toFixed(2)), Number((point.y - y).toFixed(2))]);
  return {
    name: "Arrow",
    x, y,
    shape: {type: "f", width, height, points: flat},
    ...stylePatch({...p, filled: false}),
    flags: {[MODULE_ID]: {kind: "arrow", version: 1}}
  };
}

export function shouldStyleNewDrawing({open, active, autoStyle, userId, currentUserId, existingId, sceneId, parentId, tool}) {
  return Boolean(open && active && autoStyle && userId === currentUserId && !existingId &&
    sceneId && sceneId === parentId && ["rect", "ellipse", "polygon", "freehand", "text"].includes(tool));
}
