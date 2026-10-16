/**
 * Safe batch deletion for already-controlled native Foundry Scene Drawings.
 * No scene-wide selection, unlock, ownership mutation or migration occurs here.
 */
import {canChangeDrawing, canSeeDrawing} from "./access.js";

/** Capture an exact, deduplicated set of selected Drawing document references. */
export function planSelectedDrawingDeletion(selectedObjects, user, sceneId) {
  const selected = [], targets = [], excluded = [];
  const seen = new Set();
  for (const item of selectedObjects ?? []) {
    const doc = item?.document;
    if (!doc?.id || seen.has(doc.id)) continue;
    seen.add(doc.id);
    const entry = {id: doc.id, document: doc};
    selected.push(entry);
    if (canChangeDrawing(user, doc, "delete")) targets.push(entry);
    else excluded.push(entry);
  }
  return {sceneId, selected, targets, excluded};
}

/**
 * Do not execute an approved delete if selection or Scene data changed while the
 * dialog was open. Recheck each native Drawing's ownership/lock permissions.
 */
export function isDrawingDeletionPlanCurrent(plan, scene, selectedObjects, user) {
  if (!plan?.sceneId || !scene || plan.sceneId !== scene.id ||
      !Array.isArray(plan.targets) || plan.targets.length < 2) return false;
  const current = new Map();
  for (const item of selectedObjects ?? []) {
    const doc = item?.document;
    if (!doc?.id || current.has(doc.id)) return false;
    current.set(doc.id, doc);
  }
  if (current.size !== plan.selected.length) return false;
  if (!plan.selected.every(entry => current.get(entry.id) === entry.document)) return false;
  return plan.targets.every(entry =>
    current.get(entry.id) === entry.document &&
    scene.drawings?.get(entry.id) === entry.document &&
    canChangeDrawing(user, entry.document, "delete"));
}

/** Only delete the exact confirmed IDs, through Foundry's native Scene API. */
export async function commitPlannedDrawingDeletion(plan, scene, selectedObjects, user) {
  if (!isDrawingDeletionPlanCurrent(plan, scene, selectedObjects, user))
    return {status: "stale", expected: plan?.targets?.length ?? 0, deletedIds: []};
  const ids = plan.targets.map(entry => entry.id);
  const removed = await scene.deleteEmbeddedDocuments("Drawing", ids);
  const accepted = new Set(ids);
  const deletedIds = [...new Set((removed ?? []).map(doc => doc?.id)
    .filter(id => accepted.has(id)))];
  return {status: deletedIds.length === ids.length ? "deleted" : "partial",
    expected: ids.length, deletedIds};
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g,
    character => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[character]));
}

/** Every target is listed by its original native Drawing ID before confirming. */
export function drawingDeletionConfirmationHtml(plan, user, describe) {
  const title = entry => {
    const doc = entry.document;
    const info = describe(doc) ?? {};
    const visible = canSeeDrawing(user, doc);
    const text = visible && typeof doc.text === "string" ? doc.text.trim() : "";
    const name = visible ? (text || info.name || "Drawing") : "Hidden Drawing";
    const kind = visible ? (info.kind || "Drawing") : "Restricted";
    const shownId = visible ? escapeHtml(entry.id) : "restricted";
    return `<strong>${escapeHtml(String(name).slice(0, 100))}</strong> ` +
      `(${escapeHtml(kind)}) <code>${shownId}</code>`;
  };
  const targets = plan.targets.map(entry => `<li>${title(entry)}</li>`).join("");
  const skipped = plan.excluded.length ? `<p><strong>Not included (${plan.excluded.length}):</strong> ` +
    "These selected Drawings are locked or you do not have delete permission:</p>" +
    `<ul class="dqb-delete-skipped">${plan.excluded.map(entry =>
      `<li>${title(entry)} — ${entry.document.locked ? "Locked" : "No delete permission"}</li>`).join("")}</ul>` : "";
  return `<p>Permanently delete <strong>${plan.targets.length} selected Drawings</strong>?</p>` +
    `<ol class="dqb-delete-targets">${targets}</ol>${skipped}` +
    `<p>This cannot be restored by <strong>Undo Style Change</strong>. ` +
    "Only the listed eligible Drawings will be deleted.</p>";
}
