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
  arrowEnds: "end",
  arrowHeadShape: "triangle",
  position: null
});

export const ARROW_END_OPTIONS = Object.freeze(["end", "start", "both", "none"]);
export const ARROW_HEAD_SHAPES = Object.freeze(["triangle", "diamond", "chevron"]);
const normalizeArrowEnds = ends => ARROW_END_OPTIONS.includes(ends) ? ends : "end";
const normalizeArrowHeadShape = shape => ARROW_HEAD_SHAPES.includes(shape) ? shape : "triangle";
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
    arrowEnds: normalizeArrowEnds(source.arrowEnds),
    arrowHeadShape: normalizeArrowHeadShape(source.arrowHeadShape),
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
 * A closed, filled polygon for one native Foundry v14 Drawing.
 * 'ends' controls where arrowheads appear. 'headShape' controls their silhouette.
 * The original end-only triangle retains its seven vertices unchanged.
 */
export function arrowPoints(start, end, head = 18, shaftWidth = 4,
    ends = "end", headShape = "triangle") {
  if (![start?.x, start?.y, end?.x, end?.y, head, shaftWidth].every(Number.isFinite)) return null;
  if (head <= 0 || shaftWidth <= 0) return null;
  const dx = end.x - start.x, dy = end.y - start.y;
  const distance = Math.hypot(dx, dy);
  if (!Number.isFinite(distance) || distance < 2) return null;
  const startHead = ends === "start" || ends === "both";
  const endHead = ends !== "none" && ends !== "start";
  const shape = normalizeArrowHeadShape(headShape);
  const ux = dx / distance, uy = dy / distance;
  const px = -uy, py = ux;
  const length = Math.min(Math.max(2, head), distance * 0.45);
  const halfShaft = Math.min(Math.max(0.5, shaftWidth / 2), length * 0.28);
  const halfHead = Math.min(Math.max(halfShaft * 2.4, length * 0.48), distance * 0.3);
  // An open-chevron uses a single native freehand stroke, not a filled
  // polygon. It is unmistakably different from the solid triangle and remains
  // one native Drawing with the same arrow author/permission contracts.
  if (shape === "chevron") {
    const wing = (origin, along, side) => ({
      x: origin.x + ux * along + px * side,
      y: origin.y + uy * along + py * side
    });
    const result = [];
    if (startHead) {
      result.push(wing(start, length, halfHead), {...start},
        wing(start, length, -halfHead), {...start});
    } else result.push({...start});
    result.push({...end});
    if (endHead) {
      result.push(wing(end, -length, halfHead), {...end},
        wing(end, -length, -halfHead));
    }
    return result;
  }
  const offset = (origin, distanceAlong) => ({
    x: origin.x + ux * distanceAlong,
    y: origin.y + uy * distanceAlong
  });
  const baseStart = offset(start, length);
  const baseEnd = offset(end, -length);
  const point = (origin, side) => ({x: origin.x + px * side, y: origin.y + py * side});
  const vertices = [];

  // Upper outline from starting end to the shaft.
  if (!startHead) vertices.push(point(start, halfShaft));
  else if (shape === "triangle")
    vertices.push({x: start.x, y: start.y}, point(baseStart, halfHead), point(baseStart, halfShaft));
  else if (shape === "diamond")
    vertices.push({x: start.x, y: start.y}, point(offset(start, length * .52), halfHead),
      point(baseStart, halfShaft));
  else vertices.push({x: start.x, y: start.y},
    // A true notched V: the shaft joins near the tip while each wing extends back.
    point(offset(start, length * .92), halfHead),
    point(baseStart, halfHead * .75),
    point(offset(start, length * .2), halfShaft));

  // Upper end outline, followed by lower end outline.
  if (!endHead) vertices.push(point(end, halfShaft), point(end, -halfShaft));
  else if (shape === "triangle")
    vertices.push(point(baseEnd, halfShaft), point(baseEnd, halfHead),
      {x: end.x, y: end.y}, point(baseEnd, -halfHead), point(baseEnd, -halfShaft));
  else if (shape === "diamond")
    vertices.push(point(baseEnd, halfShaft),
      point(offset(end, -length * .52), halfHead),
      {x: end.x, y: end.y},
      point(offset(end, -length * .52), -halfHead),
      point(baseEnd, -halfShaft));
  else vertices.push(
    point(offset(end, -length * .2), halfShaft),
    point(baseEnd, halfHead * .75),
    point(offset(end, -length * .92), halfHead),
    {x: end.x, y: end.y},
    point(offset(end, -length * .92), -halfHead),
    point(baseEnd, -halfHead * .75),
    point(offset(end, -length * .2), -halfShaft));

  // Lower outline from the shaft back to the starting end.
  if (!startHead) vertices.push(point(start, -halfShaft));
  else if (shape === "triangle")
    vertices.push(point(baseStart, -halfShaft), point(baseStart, -halfHead));
  else if (shape === "diamond")
    vertices.push(point(baseStart, -halfShaft), point(offset(start, length * .52), -halfHead));
  else vertices.push(point(offset(start, length * .2), -halfShaft),
    point(baseStart, -halfHead * .75),
    point(offset(start, length * .92), -halfHead));
  return vertices;
}

export function arrowDocumentData(start, end, prefs) {
  const p = normalizePrefs(prefs);
  const points = arrowPoints(start, end, Math.max(14, p.strokeWidth * 5), p.strokeWidth,
    p.arrowEnds, p.arrowHeadShape);
  if (!points) return null;
  const xs = points.map(point => point.x);
  const ys = points.map(point => point.y);
  const x = Math.min(...xs), y = Math.min(...ys);
  const width = Math.max(1, Math.max(...xs) - x);
  const height = Math.max(1, Math.max(...ys) - y);
  const flat = points.flatMap(point => [
    Number((point.x - x).toFixed(2)), Number((point.y - y).toFixed(2))
  ]);
  const openChevron = p.arrowHeadShape === "chevron";
  return {
    name: "Arrow",
    x, y,
    shape: {type: openChevron ? "f" : "p", width, height, points: flat},
    ...stylePatch({...p, filled: false}),
    fillType: openChevron ? 0 : 1,
    fillColor: p.strokeColor,
    fillAlpha: openChevron ? 0 : Math.max(0.3, p.strokeAlpha),
    strokeWidth: openChevron ? p.strokeWidth : 0,
    strokeAlpha: openChevron ? p.strokeAlpha : 0,
    flags: {[MODULE_ID]: {
      kind: "arrow", ends: p.arrowEnds, headShape: p.arrowHeadShape,
      version: openChevron ? 4 : 3
    }}
  };
}

/**
 * Arrows use a filled polygon silhouette; a normal "Outline" preset would erase
 * the fill and leave strokeWidth=0. Keep arrow visibility during styling.
 * Geometry (including an already-resized or moved arrow) is not rewritten.
 */
export function isQuickbarArrow(document) {
  return document?.flags?.[MODULE_ID]?.kind === "arrow";
}
export function isQuickbarSilhouette(document) {
  // Existing v3 filled Chevron drawings remain filled and unmodified;
  // only new open-stroke Chevron drawings use the freehand style path.
  if (document?.shape?.type === "f") return false;
  return ["arrow", "line", "route", "callout-leader"]
    .includes(document?.flags?.[MODULE_ID]?.kind);
}

export function visibleArrowStylePatch(document, prefs, field = null) {
  const p = normalizePrefs(prefs);
  if (!isQuickbarSilhouette(document)) return field ? singleStylePatch(field, p) : stylePatch(p);
  const keep = {fillType: 1, strokeWidth: 0, strokeAlpha: 0};
  switch (field) {
    case "textColor": return {textColor: p.textColor, textAlpha: 1};
    case "fontSize": return {fontSize: p.fontSize, textAlpha: 1};
    case "strokeColor": return {...keep, fillColor: p.strokeColor, strokeColor: p.strokeColor,
      fillAlpha: Math.max(0.3, p.strokeAlpha)};
    case "fillColor": return {...keep, fillColor: p.fillColor, strokeColor: p.fillColor,
      fillAlpha: Math.max(0.3, p.fillAlpha)};
    case "fillAlpha": return {...keep, fillAlpha: Math.max(0.3, p.fillAlpha)};
    case "strokeWidth":
    case "filled": return {...keep, fillAlpha: Math.max(0.3, p.fillAlpha)};
    default: return {...keep, fillColor: p.strokeColor, strokeColor: p.strokeColor,
      fillAlpha: Math.max(0.3, p.strokeAlpha),
      textColor: p.textColor, fontSize: p.fontSize};
  }
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

/** Center of a native Drawing in scene coordinates. Does not modify the Drawing. */
export function drawingCenter(document) {
  if (!document) return null;
  const x = Number(document.x), y = Number(document.y);
  const width = Number(document.shape?.width ?? 0);
  const height = Number(document.shape?.height ?? 0);
  if (![x, y, width, height].every(Number.isFinite)) return null;
  return {x: x + width / 2, y: y + height / 2};
}

/** Only update text fields on one existing native Drawing, never its geometry or ID. */
export function editTextPatch(document, text, preferences) {
  if (!document?.id || document.locked || typeof text !== "string" ||
      text.length > 2000 || !text.trim()) return null;
  const p = normalizePrefs(preferences);
  return {
    _id: document.id,
    text: text.replace(/\r\n?/g, "\n"),
    fontSize: p.fontSize,
    textColor: p.textColor,
    textAlpha: 1
  };
}

/** UI-only locked filter. It never mutates Drawings or changes their lock states. */
export function filterLockedDrawings(documents, lockedOnly = false) {
  const all = documents ?? [];
  return lockedOnly ? [...all].filter(doc => doc?.locked === true) : all;
}

/** Search ALL Scene Drawing documents; exact text is more useful than generic names. */
export function findSceneDrawings(documents, query = "", limit = 60) {
  const all = [...(documents ?? [])].filter(doc => doc?.id);
  const needle = String(query ?? "").trim().toLocaleLowerCase();
  const priority = (doc) => {
    if (!needle) return 0;
    const label = String(doc.name ?? "").trim().toLocaleLowerCase();
    const text = String(doc.text ?? "").trim().toLocaleLowerCase();
    // Text on an ellipse remains an ellipse for shape searches.
    const shapeName = ({r: "rectangle box", e: "ellipse circle", p: "polygon"})[doc.shape?.type] ?? "";
    const type = (drawingLabel(doc).kind + " " + shapeName).toLocaleLowerCase();
    const id = String(doc.id ?? "").toLocaleLowerCase();
    if (text === needle) return 0;
    if (label === needle) return 1;
    if (text.startsWith(needle)) return 2;
    if (label.startsWith(needle)) return 3;
    if (text.includes(needle)) return 4;
    if (label.includes(needle)) return 5;
    if (type.includes(needle)) return 6;
    if (id.includes(needle)) return 7;
    return Infinity;
  };
  const matched = all.map(doc => ({doc, score: priority(doc)}))
    .filter(entry => Number.isFinite(entry.score))
    .sort((a, b) => a.score - b.score ||
      drawingLabel(a.doc).name.localeCompare(drawingLabel(b.doc).name) ||
      a.doc.id.localeCompare(b.doc.id));
  // The Show More action can reveal every Scene Drawing without a hidden 250-item cap.
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(Math.trunc(limit), matched.length || 1)) : 60;
  return {total: all.length, matches: matched.length, shown: matched.slice(0, safeLimit).map(entry => entry.doc)};
}

/** Map a single Drawing's visible style into editor controls without replacing saved new-shape preferences. */
export function stylePreferencesFromDrawing(doc, saved = DEFAULT_PREFS) {
  const defaults = normalizePrefs(saved);
  if (!doc) return defaults;
  return normalizePrefs({
    ...defaults,
    strokeColor: doc.strokeColor ?? defaults.strokeColor,
    strokeWidth: Number.isFinite(doc.strokeWidth) && doc.strokeWidth > 0 ? doc.strokeWidth : defaults.strokeWidth,
    strokeAlpha: Number.isFinite(doc.strokeAlpha) ? doc.strokeAlpha : defaults.strokeAlpha,
    fillColor: doc.fillColor ?? defaults.fillColor,
    fillAlpha: Number.isFinite(doc.fillAlpha) && doc.fillAlpha > 0 ? doc.fillAlpha : defaults.fillAlpha,
    filled: Number(doc.fillType) > 0,
    textColor: doc.textColor ?? defaults.textColor,
    fontSize: Number.isFinite(doc.fontSize) ? doc.fontSize : defaults.fontSize
  });
}

/** Restrict a direct edit to the single intended style property. */
export function singleStylePatch(name, prefs) {
  const p = normalizePrefs(prefs);
  switch (name) {
    case "strokeColor": return {strokeColor: p.strokeColor, strokeAlpha: Math.max(.1, p.strokeAlpha)};
    case "strokeWidth": return {strokeWidth: p.strokeWidth, strokeAlpha: Math.max(.1, p.strokeAlpha)};
    case "fillColor": return {fillColor: p.fillColor, fillType: 1, fillAlpha: Math.max(.05, p.fillAlpha)};
    case "fillAlpha": return {fillType: 1, fillAlpha: p.fillAlpha};
    case "filled": return {fillType: p.filled ? 1 : 0, fillAlpha: p.filled ? Math.max(.05, p.fillAlpha) : 0};
    case "textColor": return {textColor: p.textColor, textAlpha: 1};
    case "fontSize": return {fontSize: p.fontSize, textAlpha: 1};
    default: return null;
  }
}

/** Protect native freehand Pen paths from being closed and flood-filled.
 * Unlike a polygon Drawing, a freehand shape must remain an open stroke.
 */
export function penStylePatch(prefs) {
  const p = stylePatch(prefs);
  return {...p, fillType: 0, fillAlpha: 0, strokeAlpha: Math.max(.1, p.strokeAlpha)};
}

/** Route native freehand and Quickbar arrows away from generic filled-shape styling. */
export function drawingAppearancePatch(document, prefs, field = null) {
  if (isQuickbarSilhouette(document)) return visibleArrowStylePatch(document, prefs, field);
  if (document?.shape?.type === "f") {
    if (["filled", "fillColor", "fillAlpha"].includes(field)) return null;
    if (field) {
      const patch = singleStylePatch(field, prefs);
      return patch && {...patch, fillType: 0, fillAlpha: 0};
    }
    return penStylePatch(prefs);
  }
  return field ? singleStylePatch(field, prefs) : stylePatch(prefs);
}

/** Locked objects never become automatic editing targets. */
export function styleTargetMode(selected = []) {
  const all = [...selected];
  if (!all.length) return {mode: "defaults", count: 0, id: null};
  if (all.length === 1 && all[0]?.id && !all[0].locked)
    return {mode: "single", count: 1, id: all[0].id};
  return {mode: "batch", count: all.filter(d => d?.id && !d.locked).length, id: null};
}
