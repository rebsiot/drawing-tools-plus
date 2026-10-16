import {MODULE_ID, normalizePrefs, textDocumentData} from "./model.js";

const KINDS = new Set(["line", "route", "callout-leader"]);

/** A closed thin ribbon follows a path without closing its *centerline*.
 * Foundry v14 stores it as exactly one native polygon Drawing.
 */
export function ribbonVertices(points, width = 4) {
  if (!Array.isArray(points) || !Number.isFinite(width) || width <= 0 || width > 64) return null;
  const clean = [];
  for (const raw of points) {
    if (![raw?.x, raw?.y].every(Number.isFinite)) return null;
    const p = {x: raw.x, y: raw.y};
    const last = clean.at(-1);
    if (!last || Math.hypot(p.x - last.x, p.y - last.y) >= 1) clean.push(p);
    if (clean.length > 80) return null;
  }
  if (clean.length < 2) return null;
  const normals = [];
  for (let i = 1; i < clean.length; i++) {
    const dx = clean[i].x - clean[i-1].x, dy = clean[i].y - clean[i-1].y;
    const distance = Math.hypot(dx, dy);
    if (!Number.isFinite(distance) || distance < 1) return null;
    normals.push({x: -dy / distance, y: dx / distance});
  }
  const half = width / 2, left = [], right = [];
  for (let i = 0; i < clean.length; i++) {
    let normal;
    if (!i) normal = normals[0];
    else if (i === clean.length - 1) normal = normals.at(-1);
    else {
      const a = normals[i-1], b = normals[i];
      const sum = {x: a.x + b.x, y: a.y + b.y};
      const sumSize = Math.hypot(sum.x, sum.y);
      if (sumSize < .15) normal = b; // U-turn: use safe bevel instead of unbounded miter
      else {
        const mid = {x: sum.x / sumSize, y: sum.y / sumSize};
        const denom = Math.max(.3, Math.abs(mid.x*b.x + mid.y*b.y));
        const miter = Math.min(half / denom, half * 2.5);
        normal = {x: mid.x * miter / half, y: mid.y * miter / half};
      }
    }
    left.push({x: clean[i].x + normal.x * half, y: clean[i].y + normal.y * half});
    right.push({x: clean[i].x - normal.x * half, y: clean[i].y - normal.y * half});
  }
  return [...left, ...right.reverse()];
}

/** Native filled polygon ribbon, visually an open straight or multi-segment line. */
export function ribbonDrawingData(points, prefs = {}, kind = "line") {
  if (!KINDS.has(kind)) return null;
  const p = normalizePrefs(prefs);
  const vertices = ribbonVertices(points, p.strokeWidth);
  if (!vertices) return null;
  const x = Math.min(...vertices.map(v=>v.x)), y = Math.min(...vertices.map(v=>v.y));
  const width = Math.max(1, Math.max(...vertices.map(v=>v.x)) - x);
  const height = Math.max(1, Math.max(...vertices.map(v=>v.y)) - y);
  return {
    name: kind === "route" ? "Route" : kind === "callout-leader" ? "Callout pointer" : "Line",
    x, y,
    shape: {type: "p", width, height,
      points: vertices.flatMap(v=>[
        Number((v.x - x).toFixed(2)), Number((v.y - y).toFixed(2))
      ])},
    fillType: 1,
    fillColor: p.strokeColor,
    fillAlpha: Math.max(.3, p.strokeAlpha),
    strokeWidth: 0,
    strokeAlpha: 0,
    textColor: p.textColor,
    flags: {[MODULE_ID]: {kind, version: 1}}
  };
}

/** Two separate, editable native Drawing documents: leader and text label.
 * They may be multi-selected and moved together; the module never syncs
 * edits or silently deletes the other document.
 */
export function calloutDrawingData(start, labelPosition, text, prefs = {}) {
  const leader = ribbonDrawingData([start, labelPosition], prefs, "callout-leader");
  const label = textDocumentData(
    {x: labelPosition?.x + 8, y: labelPosition?.y - 8}, text, prefs
  );
  if (!leader || !label) return null;
  label.name = "Callout: " + text.trim().slice(0, 45);
  label.flags = {[MODULE_ID]: {kind: "callout-label", version: 1}};
  return [leader, label];
}
