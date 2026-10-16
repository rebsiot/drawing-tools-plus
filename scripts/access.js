/**
 * Native Foundry v14 drawing-author permissions, enforced at every Quickbar
 * document write. Never elevate player permissions or alter world settings.
 */
export function canUseDrawingQuickbar(user) {
  if (!user) return false;
  if (user.isGM) return true;
  try { return user.can?.("DRAWING_CREATE") === true; }
  catch { return false; }
}

export function drawingAuthorId(doc) {
  const author = doc?.author;
  return typeof author === "string" ? author : author?.id ?? null;
}

export function canSeeDrawing(user, doc) {
  return Boolean(user && doc?.id && (user.isGM || doc.hidden !== true));
}

export function canChangeDrawing(user, doc, action = "update") {
  if (!canUseDrawingQuickbar(user) || !canSeeDrawing(user, doc) || doc.locked) return false;
  if (user.isGM) return true;
  // Reject old, imported, GM or other-player Drawings without this user's author ID.
  if (!user.id || drawingAuthorId(doc) !== user.id) return false;
  // Native v14 server permissions are authoritative; fail closed if missing.
  try { return doc.canUserModify?.(user, action) === true; }
  catch { return false; }
}
