import {
  MODULE_ID, DEFAULT_PREFS, PRESETS, normalizePrefs, stylePatch,
  snapshotStyle, arrowPoints, arrowDocumentData, duplicateDrawingData, textDocumentData,
  drawingLabel, drawingCenter, findSceneDrawings, filterLockedDrawings, editTextPatch,
  stylePreferencesFromDrawing, singleStylePatch, styleTargetMode, drawingAppearancePatch,
  penStylePatch, isQuickbarArrow, isQuickbarSilhouette,
  shouldRunDrawingShortcut, shouldStyleNewDrawing
} from "./model.js";
import {TUTORIAL_STEPS, TUTORIAL_DISMISSED_FLAG, shouldAutoShowTutorial, tutorialStepIndex}
  from "./tutorial.js";
import {canUseDrawingQuickbar, canSeeDrawing, canChangeDrawing}
  from "./access.js";
import {toggleNativeDrawingSelection} from "./selection.js";
import {ribbonVertices, ribbonDrawingData, calloutDrawingData} from "./annotations.js";
import {planSelectedDrawingDeletion, isDrawingDeletionPlanCurrent,
  commitPlannedDrawingDeletion, drawingDeletionConfirmationHtml} from "./batch-delete.js";
import {drawingLocateGeometry, locateDrawingScale, drawingFocusFrame,
  isLocateFrameOversized} from "./locate.js";

const TOOLS = new Set(["select", "rect", "ellipse", "polygon", "freehand", "text"]);
const KEY_TO_TOOL = {v:"select", r:"rect", e:"ellipse", p:"polygon",
  f:"freehand", t:"text", a:"arrow", l:"line", u:"route", c:"callout"};
let preferences = normalizePrefs(DEFAULT_PREFS);
let dock = null;
let tutorialDialog = null;
let inspectDialog = null;
let tutorialShownThisSession = false;
let arrowOverlay = null;
let arrowStart = null;
let arrowPointerId = null;
let activeGeometryTool = null;
let routeWaypoints = [];
let textOverlay = null;
let textDialog = null;
let textScene = null;
let suspendShortcuts = false;
let lastStyleUndo = null;
let batchDeletePending = false;
let focusedDrawingId = null;
let focusedSceneId = null;
let focusMarker = null;
let focusTimer = null;
let focusSequence = 0;
let editingDrawingId = null;
let editingStyle = null;
let pendingStyle = null;
let pendingStyleTimer = null;
let styleWriteQueue = Promise.resolve();
let newDrawingSerial = 0;
const FINDER_PAGE_SIZE = 60;
let finderVisibleCount = FINDER_PAGE_SIZE;
let finderLockedOnly = false;
let saveQueue = Promise.resolve();
let saveTimer = null;

function notify(message, type = "warn") {
  const n = ui?.notifications;
  n?.[type]?.(`[Drawing Quickbar] ${message}`);
}
function isUsable() {
  return Boolean(canUseDrawingQuickbar(game?.user) &&
    canvas?.ready && canvas?.scene && canvas?.drawings && ui?.controls);
}
function canEdit(doc) { return canChangeDrawing(game?.user, doc, "update"); }
function canDelete(doc) { return canChangeDrawing(game?.user, doc, "delete"); }
function safeSave() {
  // Coalesce rapid color/range input events into one client setting write.
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const copy = structuredClone(preferences);
    saveQueue = saveQueue.catch(() => {}).then(() => game.settings.set(MODULE_ID, "preferences", copy))
      .catch(error => console.warn(`${MODULE_ID} | Could not save drawing preferences`, error));
  }, 250);
}
function activeStyle() { return editingStyle ?? preferences; }
function renderStyleInputs() {
  if (!dock) return;
  const style = activeStyle();
  for (const property of ["strokeColor", "fillColor", "textColor", "strokeWidth", "fillAlpha", "fontSize"]) {
    const input = dock.querySelector(`[name="${property}"]`);
    if (input) input.value = style[property];
  }
  dock.querySelector('[name="filled"]').checked = style.filled;
  dock.querySelector('[name="autoStyle"]').checked = preferences.autoStyle;
  dock.querySelector('[name="arrowEnds"]').value = preferences.arrowEnds;
  dock.querySelector('[name="arrowHeadShape"]').value = preferences.arrowHeadShape;
  const selected = selectedDrawingObjects();
  const selectedArrow = selected.length === 1 &&
    canEdit(selected[0]?.document) && isQuickbarSilhouette(selected[0]?.document);
  const selectedPen = selected.length === 1 && selected[0]?.document?.shape?.type === "f";
  const width = dock.querySelector('[name="strokeWidth"]');
  if (width) {
    width.disabled = selectedArrow;
    width.title = selectedArrow
      ? "Filled line/route/arrow thickness is set when drawn; use native Drawing resize handles."
      : "Line width";
  }
  for (const name of ["filled", "fillColor", "fillAlpha"]) {
    const field = dock.querySelector('[name="' + name + '"]');
    if (field) {
      field.disabled = selectedPen;
      field.title = selectedPen ? "Pen is an open stroke and cannot be filled." : "";
    }
  }
  dock.querySelector('[data-value="strokeWidth"]').textContent = `${style.strokeWidth}px`;
  dock.querySelector('[data-value="fillAlpha"]').textContent = `${Math.round(style.fillAlpha * 100)}%`;
  dock.querySelector('[data-value="fontSize"]').textContent = `${style.fontSize}px`;
  dock.querySelector('[data-action="undo-style"]').disabled = !lastStyleUndo;
}
function updateDockInputs() {
  if (!dock) return;
  renderStyleInputs();
  refreshToolHighlight();
  refreshSelectedPanel();
}
function synchronizeStyleTarget(selected) {
  const mode = styleTargetMode(selected.map(item => ({
    id: item.document.id, locked: !canEdit(item.document)
  })));
  const id = mode.mode === "single" ? mode.id : null;
  if (id !== editingDrawingId) {
    editingDrawingId = id;
    editingStyle = id ? stylePreferencesFromDrawing(selected[0].document, preferences) : null;
    renderStyleInputs();
  }
  dock.classList.toggle("dqb-multi-selection", mode.mode === "batch");
  const hint = dock.querySelector('[data-role="style-scope"]');
  if (hint) hint.textContent = mode.mode === "single"
    ? (isQuickbarArrow(selected[0]?.document)
      ? (selected[0]?.document?.shape?.type === "f"
          ? "Chevron head: selected Drawing appearance follows its native shape."
          : "Arrow appearance: color and opacity. Thickness is set when drawn.")
      : selected[0]?.document?.shape?.type === "f"
        ? "Pen stroke: line color and width. Freehand remains unfilled."
        : "Editing this Drawing now. Changes apply immediately.")
    : mode.mode === "batch"
      ? `${mode.count} unlocked selected. Adjust the controls, then Apply to All Selected.`
      : selected.length && !selected.some(item => canEdit(item.document))
        ? "Read-only: you can edit only your own unlocked Drawings."
        : "Setting new-Drawing defaults. Presets are built in; no saving required.";
  const button = dock.querySelector('[data-action="apply-selected"]');
  if (button) {
    button.textContent = mode.mode === "batch"
      ? `Apply to ${mode.count} Selected` : "Apply to All Selected";
    button.disabled = mode.mode !== "batch" || !mode.count;
  }
}
function queueDirectStylePatch(patch) {
  if (!patch || !isUsable() || !canvas.drawings.active) return;
  const selected = selectedEditableObjects();
  if (selected.length !== 1 || selectedDrawingObjects().length !== 1 ||
      !canEdit(selected[0].document)) return;
  const id = selected[0].document.id, sceneId = canvas.scene.id;
  if (pendingStyle && (pendingStyle.id !== id || pendingStyle.sceneId !== sceneId))
    void flushDirectStylePatch();
  if (pendingStyle && pendingStyle.id === id && pendingStyle.sceneId === sceneId)
    Object.assign(pendingStyle.patch, patch);
  else pendingStyle = {id, sceneId, patch: {...patch}};
  if (pendingStyleTimer !== null) clearTimeout(pendingStyleTimer);
  pendingStyleTimer = setTimeout(() => void flushDirectStylePatch(), 160);
}
async function flushDirectStylePatch() {
  if (pendingStyleTimer !== null) clearTimeout(pendingStyleTimer);
  pendingStyleTimer = null;
  const pending = pendingStyle;
  pendingStyle = null;
  if (!pending) return styleWriteQueue;
  styleWriteQueue = styleWriteQueue.catch(() => {}).then(async () => {
    const scene = canvas?.scene;
    if (!scene || scene.id !== pending.sceneId) return;
    const doc = scene.drawings.get(pending.id);
    if (!canEdit(doc)) return;
    const before = snapshotStyle(doc);
    try {
      const updated = await scene.updateEmbeddedDocuments("Drawing", [{_id: doc.id, ...pending.patch}]);
      if (!updated?.length) return;
      if (lastStyleUndo?.kind !== "live" || lastStyleUndo.sceneId !== scene.id ||
          lastStyleUndo.targetId !== doc.id) {
        lastStyleUndo = {kind: "live", sceneId: scene.id, targetId: doc.id, documents: [before]};
      }
      renderStyleInputs();
      refreshSelectedPanel();
    } catch (error) {
      console.error(`${MODULE_ID} | Direct Drawing style update failed`, error);
      notify("Could not update the selected Drawing. See console.", "error");
    }
  });
  return styleWriteQueue;
}
function refreshToolHighlight() {
  if (!dock) return;
  const active = textOverlay ? "text" : (arrowOverlay ? activeGeometryTool :
    (canvas?.drawings?.active ? (ui.controls?.tool?.name ?? "select") : null));
  const hasSelection = Boolean(canvas?.drawings?.active && selectedDrawingObjects().length);
  const tokenButton = dock.querySelector('[data-action="tokens"]');
  if (tokenButton) tokenButton.disabled = !canvas?.drawings?.active;
  for (const button of dock.querySelectorAll("[data-tool]")) {
    // Select is lit only while one or more native Drawings are controlled.
    const selected = button.dataset.tool === active &&
      (button.dataset.tool !== "select" || hasSelection);
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
    if (button.dataset.tool === "select") {
      const title = hasSelection ? "Unselect" : "Select";
      const span = button.querySelector("span");
      if (span) span.textContent = title;
      button.title = hasSelection
        ? "Unselect all Drawings without changing or deleting them (V)"
        : "Select a Drawing on the canvas (V)";
      button.setAttribute("aria-label", button.title);
    }
  }
  // Do not show options for a selected existing arrow or a non-Arrow tool.
  const options = dock.querySelector(".dqb-arrow-options");
  if (options) options.hidden = active !== "arrow";
  const hint = dock.querySelector(".dqb-geometry-hint");
  if (hint) {
    hint.hidden = active !== "route" && active !== "line" && active !== "callout";
    const label = hint.querySelector("[data-role='geometry-help']");
    if (label) label.textContent = active === "route"
      ? "Click waypoints. Double-click or Finish to save; Esc cancels."
      : active === "callout"
        ? "Drag from the point of interest to the label position."
        : "Drag to draw one straight line.";
    const finish = hint.querySelector('[data-action="finish-route"]');
    if (finish) {
      finish.hidden = active !== "route";
      finish.disabled = routeWaypoints.length < 2;
    }
  }
}
function dragHeader(root) {
  const header = root.querySelector(".dqb-header");
  let anchor = null;
  header.addEventListener("pointerdown", event => {
    if (event.button !== 0 || event.target.closest("button")) return;
    anchor = {x: event.clientX, y: event.clientY, left: root.offsetLeft, top: root.offsetTop};
    header.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  });
  header.addEventListener("pointermove", event => {
    if (!anchor) return;
    const left = anchor.left + event.clientX - anchor.x;
    const top = anchor.top + event.clientY - anchor.y;
    root.style.left = `${Math.round(Math.max(8, Math.min(window.innerWidth - root.offsetWidth - 8, left)))}px`;
    root.style.top = `${Math.round(Math.max(8, Math.min(window.innerHeight - 64, top)))}px`;
  });
  function finish() {
    if (!anchor) return;
    anchor = null;
    preferences.position = {left: root.offsetLeft, top: root.offsetTop};
    safeSave();
  }
  header.addEventListener("pointerup", finish);
  header.addEventListener("pointercancel", finish);
}

function createDock() {
  const root = document.createElement("section");
  root.id = "foundry-drawing-quickbar";
  root.setAttribute("aria-label", "Drawing Quickbar");
  root.innerHTML = `
    <div class="dqb-header">
      <span class="dqb-header-title"><i class="fa-solid fa-pen-ruler" aria-hidden="true"></i> Drawing Quickbar <small>v0.1.19</small></span>
      <div class="dqb-header-actions">
        <button type="button" class="dqb-to-tokens" data-action="tokens" aria-label="Return to Token Controls" title="Return to Token Controls; keep Quickbar open"><i class="fa-solid fa-arrow-pointer" aria-hidden="true"></i> Tokens</button>
        <button type="button" class="dqb-icon" data-action="close" aria-label="Close Drawing Quickbar" title="Close and return to Tokens"><i class="fa-solid fa-xmark"></i></button>
      </div>
    </div>
    <div class="dqb-content">
      <div class="dqb-tools" role="group" aria-label="Drawing tools">
        <button type="button" data-tool="select" title="Select or Unselect (V)" aria-label="Select a Drawing"><i class="fa-solid fa-arrow-pointer"></i><span>Select</span></button>
        <button type="button" data-tool="freehand" title="Freehand Pen — open stroke, never filled (F)"><i class="fa-solid fa-pencil"></i><span>Pen</span></button>
        <button type="button" data-tool="rect" title="Rectangle (R)"><i class="fa-regular fa-square"></i><span>Box</span></button>
        <button type="button" data-tool="ellipse" title="Ellipse (E)"><i class="fa-regular fa-circle"></i><span>Circle</span></button>
        <button type="button" data-tool="polygon" title="Polygon (P)"><i class="fa-solid fa-draw-polygon"></i><span>Polygon</span></button>
        <button type="button" data-tool="text" title="Text (T)"><i class="fa-solid fa-font"></i><span>Text</span></button>
      </div>
      <div class="dqb-annotation-tools" role="group" aria-label="Lines and annotations">
        <button type="button" data-tool="line" title="Draw a straight line by dragging (L)"><i class="fa-solid fa-minus"></i><span>Line</span></button>
        <button type="button" data-tool="arrow" title="Draw an arrow by dragging (A)"><i class="fa-solid fa-arrow-right-long"></i><span>Arrow</span></button>
        <button type="button" data-tool="route" title="Click route waypoints; double-click, Enter or Finish to save (U)"><i class="fa-solid fa-route"></i><span>Route</span></button>
        <button type="button" data-tool="callout" title="Drag a pointer then type a label (C)"><i class="fa-regular fa-comment-dots"></i><span>Callout</span></button>
      </div>
      <div class="dqb-geometry-hint" hidden>
        <span data-role="geometry-help"></span>
        <button type="button" data-action="finish-route" hidden>Finish Route</button>
      </div>
      <div class="dqb-arrow-options" hidden>
        <div class="dqb-section-title">ARROW OPTIONS</div>
        <label>Arrow ends
          <select name="arrowEnds" aria-label="Which ends have arrowheads">
            <option value="end">End only (default)</option>
            <option value="start">Start only</option>
            <option value="both">Both ends</option>
            <option value="none">No arrowheads</option>
          </select>
        </label>
        <label>Arrowhead shape
          <select name="arrowHeadShape" aria-label="Arrowhead shape for new arrows">
            <option value="triangle">Filled triangle (default)</option>
            <option value="diamond">Diamond</option>
            <option value="chevron">Notched chevron (V)</option>
          </select>
        </label>
        <small>These options apply to the next arrow, not existing Drawings.</small>
      </div>
      <details class="dqb-finder" aria-label="All Drawings on this Scene">
        <summary>All Drawings (<span data-value="scene-drawing-count">0</span>)</summary>
        <div class="dqb-find-heading">
          <label class="dqb-find-label" for="dqb-drawing-search">Search drawings</label>
          <button type="button" data-action="finder-locked-only" class="dqb-locked-filter"
            aria-label="Show locked Drawings only" aria-pressed="false" title="Show only locked Drawings">
            <i class="fa-solid fa-lock" aria-hidden="true"></i> Locked only
          </button>
        </div>
        <input id="dqb-drawing-search" type="search" data-role="drawing-search"
          aria-label="Search all Scene Drawings" placeholder="Text, name, shape or ID" autocomplete="off">
        <small class="dqb-find-status" role="status"></small>
        <div class="dqb-find-results"></div>
        <button type="button" data-action="finder-more" class="dqb-finder-more" hidden>Show more</button>
        <p class="dqb-find-help">Locate highlights a Drawing. Select and Deselect change your selection. <i class="fa-solid fa-lock" aria-hidden="true"></i> marks protected Drawings; the GM can Unlock or inspect them here.</p>
      </details>
      <section class="dqb-selection" aria-label="Selected drawings">
        <div class="dqb-section-title">SELECTED DRAWINGS <strong data-value="selected-count">0</strong></div>
        <div class="dqb-actions">
          <button type="button" data-action="lock-selected" title="Protect selected drawings from ordinary canvas edits"><i class="fa-solid fa-lock"></i> Lock</button>
          <button type="button" data-action="open-properties" title="Open native properties for one selected drawing"><i class="fa-solid fa-sliders"></i> Properties</button>
          <button type="button" data-action="duplicate-selected" title="Duplicate selected, unlocked native drawings, offset 24 pixels"><i class="fa-solid fa-copy"></i> Duplicate</button>
          <button type="button" data-action="edit-text" title="Edit the text on exactly one selected, unlocked native drawing"><i class="fa-solid fa-pen-to-square"></i> Edit Text</button>
          <button type="button" data-action="apply-selected" title="Only for multiple selections: apply the chosen style to unlocked Drawings"><i class="fa-solid fa-paintbrush"></i> Apply to All Selected</button>
          <button type="button" data-action="undo-style" title="Undo the most recent Quickbar appearance change only; not movement, text edits or deletion"><i class="fa-solid fa-rotate-left"></i> Undo Style Change</button>
          <button type="button" class="dqb-batch-delete" data-action="delete-selected" title="Delete two or more selected unlocked Drawings after review and confirmation" disabled hidden><i class="fa-solid fa-trash-can" aria-hidden="true"></i> Delete Selected</button>
        </div>
        <div class="dqb-selected-list" aria-live="polite"></div>
      </section>
      <div class="dqb-section-title">STYLE PRESETS</div>
      <div class="dqb-style-scope" data-role="style-scope" aria-live="polite">Setting new-Drawing defaults.</div>
      <div class="dqb-presets" role="group" aria-label="Style presets">
        <button type="button" data-preset="outline">Outline</button>
        <button type="button" data-preset="danger">Danger</button>
        <button type="button" data-preset="highlight">Highlight</button>
        <button type="button" data-preset="filled">Filled</button>
      </div>
      <div class="dqb-fields">
        <label>Stroke <input name="strokeColor" type="color" aria-label="Stroke color"></label>
        <label>Fill <input name="fillColor" type="color" aria-label="Fill color"></label>
        <label>Text <input name="textColor" type="color" aria-label="Text color"></label>
        <label class="dqb-checkbox"><input name="filled" type="checkbox"> Fill shapes</label>
        <label class="dqb-wide">Line width <strong data-value="strokeWidth"></strong><input name="strokeWidth" type="range" min="1" max="32" step="1"></label>
        <label class="dqb-wide">Fill opacity <strong data-value="fillAlpha"></strong><input name="fillAlpha" type="range" min="0" max="1" step="0.05"></label>
        <label class="dqb-wide">Text size <strong data-value="fontSize"></strong><input name="fontSize" type="range" min="8" max="120" step="2"></label>
      </div>
      <label class="dqb-option"><input name="autoStyle" type="checkbox"> Apply my default style to new Drawings</label>

      <div class="dqb-help">Finished editing? Click Tokens above or close this Quickbar to resume using tokens. Deselect never deletes; Delete confirms. Route uses waypoints. Undo Style Change only restores appearance.</div>
      <div class="dqb-footer"><button type="button" data-action="tutorial" title="Reopen the quick tutorial anytime" aria-label="Open Drawing Quickbar tutorial"><i class="fa-solid fa-circle-question" aria-hidden="true"></i> Tutorial</button></div>
    </div>`;
  document.body.append(root);
  const left = preferences.position?.left ?? 112;
  const top = preferences.position?.top ?? 110;
  root.style.left = `${Math.max(8, Math.min(window.innerWidth - 320, left))}px`;
  root.style.top = `${Math.max(8, Math.min(window.innerHeight - 64, top))}px`;
  dragHeader(root);
  root.addEventListener("click", async event => {
    const button = event.target.closest("button");
    if (!button || !root.contains(button)) return;
    if (button.dataset.tool) return selectTool(button.dataset.tool, {toggleSelection: true});
    if (button.dataset.preset) {
      const mode = styleTargetMode(selectedDrawingObjects().map(item => ({
        id: item.document.id, locked: !canEdit(item.document)
      })));
      if (mode.mode === "single") {
        editingStyle = normalizePrefs({...activeStyle(), ...PRESETS[button.dataset.preset]});
        queueDirectStylePatch(drawingAppearancePatch(selectedDrawingObjects()[0]?.document, editingStyle));
      } else {
        preferences = normalizePrefs({...preferences, ...PRESETS[button.dataset.preset]});
        safeSave();
      }
      updateDockInputs();
    }
    if (button.dataset.action === "close") closeDock();
    if (button.dataset.action === "tokens") await returnToTokens();
    if (button.dataset.action === "tutorial") showTutorial();
    if (button.dataset.action === "finish-route") void finishRoute();
    if (button.dataset.action === "deselect-one") {
      // Deselect only changes local selection; it never changes Scene data.
      canvas?.drawings?.get(button.dataset.drawingId)?.release();
      refreshSelectedPanel();
    }
    if (button.dataset.action === "delete-one") await deleteOneDrawing(button.dataset.drawingId);
    if (button.dataset.action === "delete-selected") await deleteSelectedDrawings();
    if (button.dataset.action === "unlock-one") await unlockDrawing(button.dataset.drawingId);
    if (button.dataset.action === "locate-one") await locateDrawing(button.dataset.drawingId);
    if (button.dataset.action === "inspect-one") inspectLockedDrawing(button.dataset.drawingId);
    if (button.dataset.action === "finder-locked-only") {
      finderLockedOnly = !finderLockedOnly;
      finderVisibleCount = FINDER_PAGE_SIZE;
      refreshFinder();
    }
    if (button.dataset.action === "finder-more") {
      finderVisibleCount += FINDER_PAGE_SIZE;
      refreshFinder();
    }
    if (button.dataset.action === "toggle-one") await toggleDrawingSelection(button.dataset.drawingId);
    if (button.dataset.action === "edit-one-text") await beginEditDrawingText(button.dataset.drawingId);
    if (button.dataset.action === "lock-selected") await lockSelected();
    if (button.dataset.action === "open-properties") await openSelectedProperties();
    if (button.dataset.action === "duplicate-selected") await duplicateSelected();
    if (button.dataset.action === "edit-text") await editSelectedText();
    if (button.dataset.action === "apply-selected") await styleSelected();
    if (button.dataset.action === "undo-style") await undoSelectedStyle();
  });
  root.addEventListener("change", event => {
    const field = event.target;
    if (!(field instanceof HTMLSelectElement) ||
        !["arrowEnds", "arrowHeadShape"].includes(field.name)) return;
    preferences = normalizePrefs({...preferences, [field.name]: field.value});
    safeSave();
    renderStyleInputs();
  });
  root.addEventListener("input", event => {
    const input = event.target;
    if (input instanceof HTMLInputElement && input.dataset.role === "drawing-search") {
      finderVisibleCount = FINDER_PAGE_SIZE;
      refreshFinder();
      return;
    }
    if (!(input instanceof HTMLInputElement) || !input.name) return;
    const value = input.type === "checkbox" ? input.checked
      : input.type === "range" ? Number(input.value) : input.value;
    if (input.name === "autoStyle") {
      preferences.autoStyle = input.checked;
      safeSave();
    } else {
      const mode = styleTargetMode(selectedDrawingObjects().map(item => ({
        id: item.document.id, locked: !canEdit(item.document)
      })));
      const existing = mode.mode === "single" ? activeStyle() : preferences;
      const draft = {...existing, [input.name]: value};
      if (input.name === "fillColor" || input.name === "fillAlpha") draft.filled = true;
      if (mode.mode === "single") {
        editingStyle = normalizePrefs(draft);
        queueDirectStylePatch(drawingAppearancePatch(selectedDrawingObjects()[0]?.document,
          editingStyle, input.name));
      } else {
        preferences = normalizePrefs(draft);
        safeSave();
      }
    }
    updateDockInputs();
  });
  dock = root;
  root.querySelector(".dqb-finder").addEventListener("toggle", refreshFinder);
  updateDockInputs();
  // Keep collapsed All Drawings count accurate before the first expansion.
  // refreshFinder returns after the inexpensive count update if it is closed.
  refreshFinder();
}

/**
 * Native browser dialog: the guide changes no Scene, Token or Drawing documents.
 * The opt-out uses a per-User Foundry flag, so it follows the GM account across browsers.
 */
function closeTutorial() {
  const dialog = tutorialDialog;
  if (!dialog) return;
  tutorialDialog = null;
  if (dialog.open) dialog.close();
  dialog.remove();
}

function showTutorial() {
  if (!dock || !isUsable() || tutorialDialog) return;
  tutorialShownThisSession = true;
  const dialog = document.createElement("dialog");
  dialog.id = "dqb-tutorial";
  dialog.setAttribute("aria-labelledby", "dqb-tutorial-title");
  dialog.innerHTML = `
    <div class="dqb-tour-header">
      <strong><i class="fa-solid fa-circle-question" aria-hidden="true"></i> Drawing Quickbar Tutorial</strong>
      <button type="button" data-tour="later" title="Not now" aria-label="Close tutorial">×</button>
    </div>
    <div class="dqb-tour-content">
      <p class="dqb-tour-progress" data-role="tutorial-progress"></p>
      <h2 id="dqb-tutorial-title"></h2>
      <p data-role="tutorial-body"></p>
    </div>
    <div class="dqb-tour-actions">
      <button type="button" data-tour="later">Not now</button>
      <span class="dqb-tour-navigation">
        <button type="button" data-tour="previous">Back</button>
        <button type="button" data-tour="next" class="dqb-tour-primary">Next</button>
        <button type="button" data-tour="dismiss" class="dqb-tour-primary" hidden>Don't Show Again</button>
      </span>
    </div>`;
  let index = 0;
  const render = () => {
    const step = TUTORIAL_STEPS[index];
    dialog.querySelector("[data-role='tutorial-progress']").textContent =
      `Step ${index + 1} of ${TUTORIAL_STEPS.length}`;
    dialog.querySelector("#dqb-tutorial-title").textContent = step.title;
    dialog.querySelector("[data-role='tutorial-body']").textContent = step.body;
    dialog.querySelector('[data-tour="previous"]').hidden = index === 0;
    dialog.querySelector('[data-tour="next"]').hidden = index === TUTORIAL_STEPS.length - 1;
    dialog.querySelector('[data-tour="dismiss"]').hidden = index !== TUTORIAL_STEPS.length - 1;
  };
  dialog.addEventListener("click", async event => {
    const button = event.target.closest("button[data-tour]");
    if (!button || !dialog.contains(button)) return;
    const action = button.dataset.tour;
    if (action === "later") return closeTutorial();
    if (action === "previous" || action === "next") {
      index = tutorialStepIndex(index, action);
      render();
      dialog.querySelector(action === "next" && index === TUTORIAL_STEPS.length - 1
        ? '[data-tour="dismiss"]' : '[data-tour="' + action + '"]')?.focus();
      return;
    }
    if (action === "dismiss" && index === TUTORIAL_STEPS.length - 1) {
      button.disabled = true;
      try {
        // No world-wide setting: this writes only the active GM User document's module flag.
        await game.user.setFlag(MODULE_ID, TUTORIAL_DISMISSED_FLAG, true);
        closeTutorial();
      } catch (error) {
        console.warn(`${MODULE_ID} | Tutorial preference could not be saved`, error);
        notify("Couldn't save Don't Show Again. Use Not now to close and retry later.", "warn");
        button.disabled = false;
      }
    }
  });
  dialog.addEventListener("cancel", event => {
    event.preventDefault();
    closeTutorial(); // Esc = Not now; does not save opt-out
  });
  dialog.addEventListener("close", () => {
    if (tutorialDialog === dialog) tutorialDialog = null;
    dialog.remove();
  });
  document.body.append(dialog);
  tutorialDialog = dialog;
  render();
  try {
    dialog.showModal();
    dialog.querySelector('[data-tour="next"]')?.focus();
  } catch (error) {
    console.error(`${MODULE_ID} | Could not open tutorial`, error);
    closeTutorial();
    notify("Could not open tutorial in this browser. See console.", "warn");
  }
}

function maybeOfferTutorial() {
  if (!dock || tutorialShownThisSession || !isUsable()) return;
  let dismissed = false;
  try {
    dismissed = game.user.getFlag(MODULE_ID, TUTORIAL_DISMISSED_FLAG) === true;
  } catch (error) {
    console.warn(`${MODULE_ID} | Could not read the tutorial preference`, error);
  }
  if (shouldAutoShowTutorial({
    canUse: canUseDrawingQuickbar(game.user), hasDock: Boolean(dock),
    shownThisSession: tutorialShownThisSession, dismissed
  })) showTutorial();
}

async function openDock({activateDrawings = true} = {}) {
  if (!isUsable()) return notify("Open a Scene and ask your GM to enable Use Drawing Tools.");
  if (dock) return;
  createDock();
  // Opening via Token controls must not deselect Tokens or leave the Tokens layer.
  // Choosing an actual Drawing tool activates the native Drawings layer as usual.
  if (activateDrawings) {
    try { await ui.controls.activate({control: "drawings", tool: "select"}); }
    catch (error) {
      console.error(`${MODULE_ID} | Could not activate drawings`, error);
      notify("Could not activate the Drawing tools. Check the browser console.", "error");
      closeDock();
      return;
    }
  }
  refreshToolHighlight();
  maybeOfferTutorial();
}
function closeDock({restoreTokens = true} = {}) {
  const shouldRestoreTokens = Boolean(restoreTokens && dock && canvas?.drawings?.active);
  closeTutorial();
  closeInspect();
  newDrawingSerial++;
  if (pendingStyleTimer !== null) clearTimeout(pendingStyleTimer);
  pendingStyleTimer = null;
  if (pendingStyle) void flushDirectStylePatch();
  editingDrawingId = null;
  editingStyle = null;
  clearFocusMarker();
  exitArrow();
  exitTextPlacement();
  dock?.remove();
  dock = null;
  finderVisibleCount = FINDER_PAGE_SIZE;
  finderLockedOnly = false;
  if (shouldRestoreTokens) void returnToTokens();
}
function toggleDock({activateDrawings = true} = {}) {
  return dock ? closeDock() : openDock({activateDrawings});
}

/** Native Drawings are required for creating and directly editing a shape.
 * Tokens can be restored without closing the Quickbar or changing Scene data.
 */
async function returnToTokens() {
  ++newDrawingSerial; // Cancel a pending automatic Drawing selection.
  exitArrow();
  exitTextPlacement();
  suspendShortcuts = false;
  if (!canvas?.ready || !canvas?.drawings?.active || !ui?.controls) return;
  try {
    await ui.controls.activate({control: "tokens", tool: "select"});
  } catch (error) {
    console.error(MODULE_ID + " | Could not return to Token Controls", error);
    notify("Could not return to Token Controls. Choose Tokens on the Foundry toolbar.", "error");
  }
  refreshToolHighlight();
  refreshSelectedPanel();
}

async function selectTool(tool, {toggleSelection = false} = {}) {
  if (!dock || !isUsable()) return;
  // Clicking a lit Select/Unselect control releases native canvas selection.
  // The Select tool remains ready for another Drawing, without modifying artwork.
  if (toggleSelection && tool === "select" && canvas?.drawings?.active &&
      selectedDrawingObjects().length && !arrowOverlay && !textOverlay) {
    newDrawingSerial++;
    canvas.drawings.releaseAll();
    refreshSelectedPanel();
    refreshToolHighlight();
    return;
  }
  newDrawingSerial++;
  if (["arrow", "line", "route", "callout", "text"].includes(tool)) {
    exitArrow();
    exitTextPlacement();
    try {
      await ui.controls.activate({control: "drawings", tool: "select"});
      suspendShortcuts = false;
      if (tool === "text") enterTextPlacement();
      else enterArrow(tool);
    } catch (error) {
      console.error(MODULE_ID + " | Drawing tool activation failed", error);
      notify("Could not activate the drawing tool.", "error");
    }
    return;
  }
  if (!TOOLS.has(tool)) return;
  exitArrow();
  exitTextPlacement();
  suspendShortcuts = false;
  try { await ui.controls.activate({control: "drawings", tool}); }
  catch (error) {
    console.error(`${MODULE_ID} | Could not select native drawing tool`, error);
    notify("The native drawing tool could not be selected.", "error");
  }
  refreshToolHighlight();
}

/** Select a newly created local native Drawing, once Foundry has rendered its placeable.
 * This does not modify or import any Scene documents; it only changes local selection.
 */
function selectCreatedDrawing(drawingId, sceneId) {
  const serial = ++newDrawingSerial;
  setTimeout(async () => {
    if (serial !== newDrawingSerial || !dock || !isUsable() ||
        canvas.scene?.id !== sceneId || !canvas.drawings.active) return;
    try {
      await ui.controls.activate({control: "drawings", tool: "select"});
    } catch (error) {
      console.warn(`${MODULE_ID} | New drawing was created, but native Select activation failed`, error);
      return;
    }
    const trySelect = attempt => {
      if (serial !== newDrawingSerial || !dock || !isUsable() ||
          canvas.scene?.id !== sceneId || !canvas.drawings.active) return;
      const placeable = canvas.drawings.get(drawingId);
      if (placeable) {
        try {
          canvas.drawings.releaseAll();
          if (placeable.control({releaseOthers: true})) refreshSelectedPanel();
        } catch (error) {
          console.warn(`${MODULE_ID} | New Drawing could not be selected`, error);
        }
      } else if (attempt < 8) {
        setTimeout(() => trySelect(attempt + 1), 65);
      }
    };
    trySelect(0);
  }, 60);
}

/** Read current native selection; no persistent selection flags. */
function selectedDrawingObjects() {
  return [...(canvas?.drawings?.controlled ?? [])].filter(item => item?.document?.id);
}
function sceneDrawingDocuments() {
  const drawings = canvas?.scene?.drawings;
  const all = drawings?.contents ?? [...(drawings ?? [])];
  // Do not leak GM-hidden Drawing annotations through the player's inventory.
  return all.filter(doc => canSeeDrawing(game?.user, doc));
}
function makeActionButton(doc, action, title, label) {
  const button = documentCreate("button", "dqb-mini");
  button.type = "button";
  button.dataset.action = action;
  button.dataset.drawingId = doc.id;
  button.title = title + ": " + drawingLabel(doc).name;
  button.setAttribute("aria-label", button.title);
  button.textContent = label;
  if (action === "delete-one") button.classList.add("dqb-delete");
  return button;
}
function makeObjectRow(document, action, title, finder = false) {
  const label = drawingLabel(document);
  const row = documentCreate("div", "dqb-object-row");
  const details = documentCreate("span", "dqb-object-name");
  // Prioritize actual text so a stray single-letter label can be located by name.
  const textPreview = typeof document.text === "string" ? document.text.trim() : "";
  const generic = !textPreview && (!label.name || label.name === "Drawing" || label.name === "Untitled");
  details.textContent = textPreview ? textPreview.slice(0, 70)
    : finder && generic ? `${label.kind} · ${String(document.id ?? "").slice(0, 8)}`
    : label.name;
  details.title = label.name + " (" + (document.id ?? "") + ")";
  if (document.locked) {
    row.classList.add("dqb-is-locked");
    const lock = documentCreate("i", "fa-solid fa-lock dqb-object-lock-icon");
    lock.setAttribute("role", "img");
    lock.setAttribute("aria-label", "Locked Drawing");
    lock.title = "Locked Drawing; unlock before editing";
    details.prepend(lock);
  }
  const sub = documentCreate("small", "dqb-object-kind");
  const place = finder && Number.isFinite(document.x) && Number.isFinite(document.y)
    ? ` · ${Math.round(document.x)}, ${Math.round(document.y)}` : "";
  sub.textContent = label.kind +
    (document.hidden ? " · Hidden" : "") +
    (!game.user.isGM ? (canEdit(document) ? " · Yours" : " · View only") : "") + place;
  const summary = documentCreate("span", "dqb-object-summary");
  summary.append(details, sub);
  const actions = documentCreate("span", "dqb-object-controls");
  actions.append(makeActionButton(document, "locate-one", "Pan and highlight", "Locate"));
  const controlled = Boolean(canvas?.drawings?.active &&
    canvas.drawings.get(document.id)?.controlled);
  if (finder) {
    // A stable ID allows native selection state to refresh without rebuilding buttons.
    row.dataset.drawingId = document.id;
    if (controlled) row.classList.add("dqb-is-selected");
  }
  if (action && (action === "deselect-one" ||
      (action === "unlock-one" && game.user.isGM) ||
      (action === "toggle-one" && canEdit(document)))) {
    const buttonTitle = action === "toggle-one"
      ? controlled ? "Deselect just this Drawing" : "Add this Drawing to the selection"
      : title;
    const buttonText = action === "unlock-one" ? "Unlock" :
      action === "toggle-one" && !controlled ? "Select" : "Deselect";
    const button = makeActionButton(document, action, buttonTitle, buttonText);
    if (action === "toggle-one") button.setAttribute("aria-pressed", String(controlled));
    actions.append(button);
  }
  if (finder && canEdit(document)) {
    actions.append(makeActionButton(document, "edit-one-text",
      textPreview ? "Edit Drawing text" : "Add a text label to this Drawing", "Text"));
  }
  if (canDelete(document) && (finder || action === "deselect-one")) {
    actions.append(makeActionButton(document, "delete-one",
      "Delete this native Drawing after confirmation; Undo Style cannot restore it", "Delete"));
  }
  if (document.locked && game.user.isGM) {
    actions.append(makeActionButton(document, "inspect-one",
      "Read-only information about this locked Drawing", "Info"));
  }
  row.append(summary, actions);
  return row;
}
function documentCreate(tag, className) {
  const el = document.createElement(tag);
  el.className = className;
  return el;
}
function refreshSelectedPanel() {
  if (!dock) return;
  const selected = selectedDrawingObjects();
  refreshToolHighlight();
  dock.classList.toggle("dqb-has-selection", Boolean(selected.length));
  dock.classList.toggle("dqb-can-revert", Boolean(lastStyleUndo));
  const selectedList = dock.querySelector(".dqb-selected-list");
  if (!selectedList) return;
  dock.querySelector('[data-value="selected-count"]').textContent = String(selected.length);
  selectedList.replaceChildren(...(selected.length
    ? selected.map(item => makeObjectRow(item.document, "deselect-one", "Deselect drawing"))
    : [Object.assign(documentCreate("p", "dqb-empty"), {textContent: "No drawings selected"})]));
  const editable = selected.filter(item => canEdit(item.document));
  synchronizeStyleTarget(selected);
  const lockButton = dock.querySelector('[data-action="lock-selected"]');
  lockButton.hidden = !game.user.isGM;
  lockButton.disabled = !game.user.isGM || !editable.length;
  dock.querySelector('[data-action="duplicate-selected"]').disabled = !editable.length;
  const deletable = selected.filter(item => canDelete(item.document));
  const deleteSelectedButton = dock.querySelector('[data-action="delete-selected"]');
  deleteSelectedButton.hidden = selected.length < 2;
  deleteSelectedButton.disabled = batchDeletePending || deletable.length < 2;
  deleteSelectedButton.innerHTML = `<i class="fa-solid fa-trash-can" aria-hidden="true"></i> ` +
    (deletable.length >= 2 ? `Delete ${deletable.length} Selected` : "Delete Selected");
  deleteSelectedButton.title = `${deletable.length} may be deleted; ${selected.length - deletable.length} ` +
    "locked or unauthorized selected Drawings will remain. Confirmation required.";
  for (const action of ["edit-text", "open-properties"]) {
    dock.querySelector('[data-action="' + action + '"]').disabled =
      selected.length !== 1 || editable.length !== 1;
  }
  // Selecting/Deselecting must never rebuild or move the All Drawings rows.
  refreshFinderSelectionState();
}

/** Update Select/Deselect labels and highlights in place, preserving focus and scroll. */
function refreshFinderSelectionState() {
  if (!dock?.querySelector(".dqb-finder")?.open) return;
  for (const row of dock.querySelectorAll(".dqb-find-results .dqb-object-row[data-drawing-id]")) {
    const id = row.dataset.drawingId;
    const selected = Boolean(canvas?.drawings?.active && canvas.drawings.get(id)?.controlled);
    row.classList.toggle("dqb-is-selected", selected);
    const button = row.querySelector('button[data-action="toggle-one"]');
    if (!button) continue; // Locked and read-only rows cannot be selected.
    button.textContent = selected ? "Deselect" : "Select";
    button.setAttribute("aria-pressed", String(selected));
    const title = selected ? "Deselect just this Drawing" : "Add this Drawing to the selection";
    button.title = title;
    button.setAttribute("aria-label", title);
  }
}

/** Rebuild the list only for search/filter/pagination and actual Scene Drawing changes. */
function refreshFinder() {
  if (!dock) return;
  const panel = dock.querySelector(".dqb-finder");
  const input = dock.querySelector('[data-role="drawing-search"]');
  const results = dock.querySelector(".dqb-find-results");
  const status = dock.querySelector(".dqb-find-status");
  const more = dock.querySelector('[data-action="finder-more"]');
  const filter = dock.querySelector('[data-action="finder-locked-only"]');
  if (!panel || !input || !results || !status || !more || !filter) return;
  const documents = sceneDrawingDocuments();
  dock.querySelector('[data-value="scene-drawing-count"]').textContent = String(documents.length);
  filter.setAttribute("aria-pressed", String(finderLockedOnly));
  filter.title = finderLockedOnly ? "Show all Drawings again" : "Show only locked Drawings";
  if (!panel.open) return; // Keep the closed panel cheap on frequent Drawing updates.
  // Apply the lock filter before text matching/pagination. Never change the documents.
  const visible = filterLockedDrawings(documents, finderLockedOnly);
  const found = findSceneDrawings(visible, input.value, finderVisibleCount);
  status.textContent = found.matches
    ? `Showing ${found.shown.length} of ${found.matches}${finderLockedOnly ? " locked" : ""} Drawing${found.matches === 1 ? "" : "s"}`
    : finderLockedOnly ? "No matching locked Drawings" : "No matching Drawings";
  // Genuine data/search redraws should preserve the inventory's browsing position.
  const content = dock.querySelector(".dqb-content");
  const scrollTop = content?.scrollTop ?? 0;
  const resultsScrollTop = results.scrollTop;
  results.replaceChildren(...(found.shown.length
    ? found.shown.map(doc => makeObjectRow(doc,
      doc.locked ? "unlock-one" : "toggle-one",
      doc.locked ? "Unlock drawing" : "Add or remove this Drawing from selection", true))
    : [Object.assign(documentCreate("p", "dqb-empty"), {textContent:
      finderLockedOnly ? "No locked Drawings match this search" : "Try a different search"})]));
  results.scrollTop = resultsScrollTop;
  if (content) content.scrollTop = scrollTop;
  const remaining = found.matches - found.shown.length;
  more.hidden = remaining <= 0;
  if (remaining > 0) more.textContent = `Show ${Math.min(FINDER_PAGE_SIZE, remaining)} more`;
}
/** Inspect protected map art without controlling, unlocking or editing the Drawing. */
function closeInspect() {
  const modal = inspectDialog;
  if (!modal) return;
  inspectDialog = null;
  if (modal.open) modal.close();
  modal.remove();
}
function inspectLockedDrawing(id) {
  if (!isUsable() || !game.user.isGM) return;
  const doc = canvas.scene.drawings.get(id);
  if (!doc || !doc.locked) return notify("This Drawing is not locked. Use Select to inspect it.");
  closeInspect();
  const info = drawingLabel(doc);
  const modal = document.createElement("dialog");
  modal.id = "dqb-inspect";
  const heading = documentCreate("h2", "dqb-inspect-title");
  heading.textContent = "Locked Drawing · " + info.name;
  const explanation = documentCreate("p", "dqb-inspect-hint");
  explanation.textContent = "Read-only details. Use Locate to find it or Unlock before editing.";
  const data = documentCreate("dl", "dqb-inspect-details");
  const fields = [
    ["Type", info.kind],
    ["ID", doc.id],
    ["Position", `${Math.round(doc.x ?? 0)}, ${Math.round(doc.y ?? 0)}`],
    ["Size", `${Math.round(doc.shape?.width ?? 0)} × ${Math.round(doc.shape?.height ?? 0)}`],
    ["Author", typeof doc.author === "string" ? doc.author : (doc.author?.name ?? "Unknown")],
    ["Text", typeof doc.text === "string" ? doc.text.slice(0, 150) : ""]
  ];
  for (const [name, value] of fields) {
    const dt = documentCreate("dt");
    dt.textContent = name;
    const dd = documentCreate("dd");
    dd.textContent = value || "—";
    data.append(dt, dd);
  }
  const close = documentCreate("button", "dqb-inspect-close");
  close.type = "button";
  close.textContent = "Close";
  close.addEventListener("click", closeInspect);
  modal.append(heading, explanation, data, close);
  modal.addEventListener("close", () => {
    if (inspectDialog === modal) inspectDialog = null;
    modal.remove();
  });
  document.body.append(modal);
  inspectDialog = modal;
  try { modal.showModal(); close.focus(); }
  catch (error) {
    console.warn(`${MODULE_ID} | Could not inspect locked Drawing`, error);
    closeInspect();
  }
}

async function toggleDrawingSelection(id) {
  if (!isUsable()) return;
  const sceneId = canvas.scene.id;
  const doc = canvas.scene.drawings.get(id);
  if (!canEdit(doc)) return notify("You can select only your own unlocked Drawings.");
  try {
    // Activate native Drawing Select when invoked from Tokens or another drawing tool.
    // Once active, adding another Drawing must preserve every earlier selection.
    if (!canvas.drawings.active || ui.controls?.tool?.name !== "select") {
      await ui.controls.activate({control: "drawings", tool: "select"});
    }
    // Recheck the scene, original identity and ownership after asynchronous activation.
    if (canvas.scene?.id !== sceneId || !canvas.drawings.active ||
        canvas.scene.drawings.get(id) !== doc || !canEdit(doc)) return;
    const placeable = canvas.drawings.get(id);
    if (!placeable) return notify("This Drawing has no visible canvas object. Locate is still available.");
    const result = toggleNativeDrawingSelection(placeable);
    if (result === "failed") return notify("Foundry could not change this Drawing's selection.");
    refreshSelectedPanel();
  } catch (error) {
    console.error(MODULE_ID + " | Toggle Drawing selection failed", error);
    notify("Could not change Drawing selection. See console.", "error");
  }
}
/** This is a local HTML marker, never a Scene Drawing and never a broadcast ping. */
function clearFocusMarker() {
  focusSequence++;
  if (focusTimer !== null) clearTimeout(focusTimer);
  focusTimer = null;
  focusMarker?.remove();
  focusMarker = null;
  focusedDrawingId = null;
  focusedSceneId = null;
}
function refreshFocusMarker() {
  if (!focusMarker || !canvas?.scene || canvas.scene.id !== focusedSceneId) return;
  const doc = canvas.scene.drawings.get(focusedDrawingId);
  const geometry = drawingLocateGeometry(doc);
  if (!geometry || typeof canvas.clientCoordinatesFromCanvas !== "function") return clearFocusMarker();
  const frame = drawingFocusFrame(geometry,
    point => canvas.clientCoordinatesFromCanvas(point));
  if (!frame) return clearFocusMarker();
  focusMarker.style.left = Math.round(frame.x) + "px";
  focusMarker.style.top = Math.round(frame.y) + "px";
  focusMarker.style.width = Math.round(frame.width) + "px";
  focusMarker.style.height = Math.round(frame.height) + "px";
  focusMarker.style.transform = `translate(-50%, -50%) rotate(${frame.rotation}deg)`;
  // Native minZoom can prevent an enormous Drawing's borders from entering view.
  // In that case the original-size frame remains accurate, but keep its label centered.
  const oversized = isLocateFrameOversized(frame,
    canvas.screenDimensions ?? [window.innerWidth, window.innerHeight]);
  focusMarker.classList.toggle("dqb-focus-oversize", oversized);
  const caption = focusMarker.querySelector(".dqb-focus-caption");
  if (caption) {
    caption.style.transform = oversized
      ? `translate(-50%, -50%) rotate(${-frame.rotation}deg)`
      : `translateX(-50%) rotate(${-frame.rotation}deg)`;
    caption.title = oversized ? "Drawing bounds extend outside this view at the current zoom" : "";
  }
}
async function locateDrawing(id) {
  if (!isUsable()) return notify("Open a Scene to locate Drawings.");
  const doc = canvas.scene.drawings.get(id);
  const geometry = drawingLocateGeometry(doc);
  if (!canSeeDrawing(game.user, doc) || !geometry)
    return notify("Drawing location is unavailable.");
  clearFocusMarker();
  const request = ++focusSequence;
  const sceneId = canvas.scene.id;
  try {
    const view = {x: geometry.center.x, y: geometry.center.y, duration: 450};
    const zoom = locateDrawingScale(geometry,
      canvas.screenDimensions ?? [window.innerWidth, window.innerHeight],
      canvas.stage?.scale?.x ?? 1, canvas.dimensions?.scale);
    if (zoom !== null) view.scale = zoom;
    await canvas.animatePan(view);
    if (!dock || !canvas.scene || canvas.scene.id !== sceneId || request !== focusSequence) return;
    focusMarker = documentCreate("div", "dqb-focus-marker");
    focusMarker.id = "dqb-focus-marker";
    focusMarker.setAttribute("aria-hidden", "true");
    const label = documentCreate("span", "dqb-focus-caption");
    const text = doc.text?.trim();
    label.textContent = (text ? text.slice(0, 50) : drawingLabel(doc).name) +
      (doc.hidden ? " (hidden)" : "");
    focusMarker.append(label);
    document.body.append(focusMarker);
    focusedDrawingId = doc.id;
    focusedSceneId = sceneId;
    refreshFocusMarker();
    focusTimer = setTimeout(clearFocusMarker, 7000);
  } catch(error) {
    console.error(MODULE_ID + " | Locate Drawing failed", error);
    notify("Could not center this Drawing. See console.", "error");
  }
}

async function lockSelected() {
  if (!isUsable() || !game.user.isGM || !canvas.drawings.active)
    return notify("Only the GM can lock map Drawings.");
  const scene = canvas.scene;
  const drawings = selectedEditableObjects().map(item => item.document);
  if (!drawings.length) return notify("Select unlocked drawings to protect.");
  try {
    const updated = await scene.updateEmbeddedDocuments("Drawing", drawings.map(doc => ({_id: doc.id, locked: true})));
    notify("Locked " + updated.length + " drawing(s). Use Locked Drawings to unlock.", "info");
  } catch(error) {
    console.error(MODULE_ID + " | Could not lock drawings", error);
    notify("Could not lock selected drawings. See console.", "error");
  }
  refreshSelectedPanel();
}
/**
 * Delete exactly one unlocked native Drawing, only after an explicit Foundry v14
 * confirmation. Deselect is a different action and never changes Scene data.
 * Re-check the Scene, ID and lock state after confirmation before deleting.
 */
async function deleteOneDrawing(id) {
  if (!isUsable()) return;
  const scene = canvas.scene;
  const doc = scene.drawings.get(id);
  if (!doc) return notify("Drawing no longer exists.");
  if (!canDelete(doc)) return notify("You may delete only your own unlocked Drawings.");
  // The static confirm() method calls this.wait() internally in Foundry v14.
  // Never detach it from DialogV2: an unbound call throws "undefined.wait".
  const DialogV2 = foundry?.applications?.api?.DialogV2;
  if (typeof DialogV2?.confirm !== "function")
    return notify("Native confirmation is unavailable; nothing was deleted.", "error");
  const html = value => String(value).replace(/[&<>"']/g,
    character => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[character]));
  const label = (doc.text?.trim() || drawingLabel(doc).name).slice(0, 90);
  let approved;
  try {
    approved = await DialogV2.confirm({
      window: {title: "Delete Drawing?"},
      content: `<p>Delete <strong>${html(label)}</strong> (${html(drawingLabel(doc).kind)})?</p>
        <p>Drawing ID: <code>${html(id)}</code></p>
        <p>Only this one Drawing will be deleted. Undo Style Change cannot restore it.</p>`,
      yes: {label: "Delete Drawing"},
      no: {label: "Cancel"},
      modal: true,
      rejectClose: false
    });
  } catch (error) {
    console.error(`${MODULE_ID} | Delete confirmation failed`, error);
    return notify("Delete confirmation failed. Nothing was deleted.", "error");
  }
  if (approved !== true) return;
  if (!isUsable() || canvas.scene?.id !== scene.id ||
      scene.drawings.get(id) !== doc || !canDelete(doc))
    return notify("Drawing or Scene changed; nothing was deleted.");
  await flushDirectStylePatch();
  if (canvas.scene?.id !== scene.id || scene.drawings.get(id) !== doc || !canDelete(doc))
    return notify("Drawing changed; nothing was deleted.");
  try {
    const removed = await scene.deleteEmbeddedDocuments("Drawing", [id]);
    if (!removed?.some(item => item.id === id)) throw new Error("Requested Drawing not deleted");
    refreshSelectedPanel();
    notify("Deleted one Drawing. Undo Style Change cannot restore it.", "info");
  } catch (error) {
    console.error(`${MODULE_ID} | Native Drawing deletion failed`, error);
    notify("Could not delete Drawing. See console.", "error");
  }
}
/**
 * Multi-Delete touches only explicitly selected, currently deletable native
 * Drawings. All targets appear in a confirmation; any changes to the scene,
 * selection, author or lock state abort the entire operation before writing.
 */
async function deleteSelectedDrawings() {
  if (batchDeletePending || !isUsable() || !canvas.drawings.active) return;
  const scene = canvas.scene;
  const plan = planSelectedDrawingDeletion(selectedDrawingObjects(), game.user, scene.id);
  if (plan.targets.length < 2)
    return notify("Select at least two unlocked Drawings you have permission to delete.");
  const DialogV2 = foundry?.applications?.api?.DialogV2;
  if (typeof DialogV2?.confirm !== "function")
    return notify("Native confirmation unavailable. Nothing was deleted.", "error");
  batchDeletePending = true;
  refreshSelectedPanel();
  try {
    let approved;
    try {
      approved = await DialogV2.confirm({
        window: {title: `Delete ${plan.targets.length} Selected Drawings?`},
        content: drawingDeletionConfirmationHtml(plan, game.user, drawingLabel),
        yes: {label: `Delete ${plan.targets.length} Drawings`},
        no: {label: "Cancel"},
        modal: true,
        rejectClose: false
      });
    } catch (error) {
      console.error(`${MODULE_ID} | Multi-Delete confirmation failed`, error);
      return notify("Multi-Delete confirmation failed. Nothing was deleted.", "error");
    }
    if (approved !== true) return;
    // Any style write started before the confirmation must settle first.
    await flushDirectStylePatch();
    if (!isUsable() || canvas.scene !== scene || !canvas.drawings.active ||
        !isDrawingDeletionPlanCurrent(plan, scene, selectedDrawingObjects(), game.user))
      return notify("Selection, Scene or permissions changed. Nothing was deleted.");
    const result = await commitPlannedDrawingDeletion(
      plan, scene, selectedDrawingObjects(), game.user);
    if (result.status === "stale")
      return notify("Drawing permissions or selection changed. Nothing was deleted.");
    if (result.deletedIds.length && lastStyleUndo?.sceneId === scene.id) {
      const deleted = new Set(result.deletedIds);
      const keep = lastStyleUndo.documents.filter(d => !deleted.has(d._id));
      lastStyleUndo = keep.length ? {...lastStyleUndo, documents: keep} : null;
    }
    if (result.status === "partial") {
      notify(`Deleted ${result.deletedIds.length} of ${result.expected} Drawings. ` +
        "Check the Scene and console; the rest were not confirmed deleted.", "warn");
    } else {
      notify(`Deleted ${result.deletedIds.length} selected Drawings. ` +
        `${plan.excluded.length} protected or unauthorized Drawing(s) skipped.`, "info");
    }
    refreshFinder();
  } catch (error) {
    console.error(`${MODULE_ID} | Native Multi-Delete failed`, error);
    notify("Multi-Delete failed. Check the Scene and console before trying again.", "error");
  } finally {
    batchDeletePending = false;
    refreshSelectedPanel();
  }
}

async function unlockDrawing(id) {
  // Only a GM may unlock permanent map elements.
  if (!isUsable() || !game.user.isGM)
    return notify("Only the GM can unlock map Drawings.");
  const doc = canvas.scene.drawings.get(id);
  if (!doc?.locked) return refreshSelectedPanel();
  try {
    await canvas.scene.updateEmbeddedDocuments("Drawing", [{_id: id, locked: false}]);
    notify("Drawing unlocked. It is not automatically selected.", "info");
  } catch (error) {
    console.error(MODULE_ID + " | Could not unlock drawing", error);
    notify("Could not unlock drawing. See console.", "error");
  }
  refreshSelectedPanel();
}
async function openSelectedProperties() {
  const selected = selectedEditableObjects();
  if (selected.length !== 1 || selectedDrawingObjects().length !== 1) {
    return notify("Select exactly one unlocked drawing.");
  }
  try {
    await selected[0].sheet.render({force: true});
  } catch(error) {
    console.error(MODULE_ID + " | Native drawing properties failed", error);
    notify("Could not open Drawing properties. See console.", "error");
  }
}

/**
 * Native drawing selection is the authoritative target set. No global select-all,
 * automatic deletion, or edits to locked drawings are performed here.
 */
function selectedEditableObjects() {
  return [...(canvas?.drawings?.controlled ?? [])]
    .filter(object => object?.document?.id && canEdit(object.document));
}

async function duplicateSelected() {
  if (!isUsable() || !canvas.drawings.active) return notify("Open the Drawings layer and select your drawings first.");
  const sources = selectedEditableObjects();
  if (!sources.length) return notify("Select one or more unlocked drawings to duplicate.");
  const data = sources.map(object => duplicateDrawingData(object.document)).filter(Boolean);
  if (!data.length) return notify("No eligible drawings could be duplicated.");
  const scene = canvas.scene;
  try {
    const created = await scene.createEmbeddedDocuments("Drawing", data);
    if (!created?.length) return notify("No drawings were duplicated.");
    try { canvas.drawings.storeHistory("create", created.map(d => d.toObject())); }
    catch (error) { console.debug(`${MODULE_ID} | Native duplicate undo registration unavailable`, error); }
    // Use Foundry's native selection so users can immediately move the duplicates.
    try {
      canvas.drawings.releaseAll();
      for (const item of created) canvas.drawings.get(item.id)?.control({releaseOthers: false});
    } catch (error) {
      console.debug(`${MODULE_ID} | Could not select duplicate drawings`, error);
    }
    notify(`Duplicated ${created.length} drawing${created.length === 1 ? "" : "s"}.`, "info");
  } catch (error) {
    console.error(`${MODULE_ID} | Duplicate drawings failed`, error);
    notify("Could not duplicate the selected drawings. See console.", "error");
  }
}

async function editSelectedText() {
  if (!isUsable() || !canvas.drawings.active) return notify("Open the Drawings layer and select one drawing.");
  const sources = selectedEditableObjects();
  if (selectedDrawingObjects().length !== 1 || sources.length !== 1) {
    return notify("Select exactly one unlocked Drawing to edit text.");
  }
  await beginEditDrawingText(sources[0].document.id);
}
/** Reuse the reliable focused popup instead of Foundry's context-sensitive text-edit handler. */
async function beginEditDrawingText(id) {
  if (!isUsable()) return notify("Open a Scene before editing Drawing text.");
  const sceneId = canvas.scene.id;
  const doc = canvas.scene.drawings.get(id);
  if (!doc) return notify("This Drawing no longer exists.");
  if (!canEdit(doc)) return notify("You can edit only your own unlocked Drawings.");
  if (textDialog) return notify("Finish or cancel the current text entry first.");
  try {
    // Finder's Text action may be invoked while the Tokens layer is active.
    if (!canvas.drawings.active) await ui.controls.activate({control: "drawings", tool: "select"});
    if (canvas.scene?.id !== sceneId || !canvas.drawings.active) return;
    exitArrow();
    exitTextPlacement();
    const center = drawingCenter(doc);
    if (!center) return notify("Cannot position the text editor.");
    const pos = canvas.clientCoordinatesFromCanvas(center);
    textScene = {sceneId, drawingId: doc.id};
    showTextDialog(pos.x, pos.y);
  } catch (error) {
    console.error(MODULE_ID + " | Could not open Drawing text editor", error);
    notify("Could not open Drawing text editor. See console.", "error");
  }
}

async function styleSelected() {
  if (!isUsable() || !canvas.drawings.active) return notify("Open the Drawings layer first.");
  const all = selectedDrawingObjects();
  if (all.length <= 1) return notify("Style controls edit one selected Drawing immediately.");
  const selected = all.map(item => item.document).filter(canEdit);
  if (!selected.length) return notify("No unlocked Drawings selected.");
  await flushDirectStylePatch();
  const scene = canvas.scene;
  const backups = selected.map(snapshotStyle);
  try {
    const result = await scene.updateEmbeddedDocuments("Drawing",
      selected.map(d => ({_id: d.id, ...drawingAppearancePatch(d, preferences)})));
    if (!result?.length) return notify("No Drawings were updated.");
    lastStyleUndo = {kind: "batch", sceneId: scene.id, documents: backups.filter(old => result.some(r => r.id === old._id))};
    updateDockInputs();
    notify(`Styled ${result.length} selected unlocked Drawings.`, "info");
  } catch (error) {
    console.error(`${MODULE_ID} | Batch style update failed`, error);
    notify("Could not style the selected Drawings. See console.", "error");
  }
}

async function undoSelectedStyle() {
  await flushDirectStylePatch();
  const undo = lastStyleUndo;
  if (!undo || canvas?.scene?.id !== undo.sceneId) return notify("No style change to revert in this Scene.");
  // Only restore documents that still exist; never resurrect removed drawings.
  const updates = undo.documents.filter(d => {
    const current = canvas.scene.drawings.get(d._id);
    return canEdit(current);
  });
  if (!updates.length) { lastStyleUndo = null; updateDockInputs(); return notify("The selected drawings no longer exist."); }
  try {
    await canvas.scene.updateEmbeddedDocuments("Drawing", updates);
    lastStyleUndo = null;
    editingDrawingId = null;
    editingStyle = null;
    updateDockInputs();
    notify("Last Quickbar style change undone. Other edits are unchanged.", "info");
  } catch (error) {
    console.error(`${MODULE_ID} | Style rollback failed`, error);
    notify("Could not restore the previous styles.", "error");
  }
}

function boardElement() {
  return document.querySelector("canvas#board") || canvas?.app?.view || canvas?.app?.canvas;
}
function updateArrowBounds() {
  if (!arrowOverlay) return;
  const board = boardElement();
  if (!board) return;
  const rect = board.getBoundingClientRect();
  for (const prop of ["left", "top", "width", "height"]) arrowOverlay.style[prop] = `${rect[prop]}px`;
  arrowOverlay.querySelector("svg").setAttribute("viewBox", `0 0 ${Math.max(1, rect.width)} ${Math.max(1, rect.height)}`);
}
function screenPoint(event) {
  const rect = arrowOverlay.getBoundingClientRect();
  return {x: event.clientX - rect.left, y: event.clientY - rect.top};
}
function scenePoint(event) {
  const board = boardElement();
  if (!board || !canvas?.stage?.toLocal) throw new Error("Canvas stage is unavailable");
  const rect = board.getBoundingClientRect();
  const dimensions = canvas?.app?.renderer?.screen;
  const x = (event.clientX - rect.left) * (dimensions?.width ? dimensions.width / rect.width : 1);
  const y = (event.clientY - rect.top) * (dimensions?.height ? dimensions.height / rect.height : 1);
  const point = canvas.stage.toLocal(new PIXI.Point(x, y));
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) throw new Error("Invalid drawing coordinates");
  return {x: point.x, y: point.y};
}
/** Render Arrow, Line, Route, or Callout pointer through the same transient overlay. */
function drawArrowPreview(point) {
  const path = arrowOverlay?.querySelector("path");
  if (!path || !activeGeometryTool) return;
  let vertices = null, closed = true;
  if (activeGeometryTool === "route") {
    if (routeWaypoints.length) {
      vertices = ribbonVertices([...routeWaypoints.map(entry => entry.screen), point],
        preferences.strokeWidth);
    }
  } else if (arrowStart) {
    if (activeGeometryTool === "arrow") {
      vertices = arrowPoints(arrowStart.screen, point,
        Math.max(14, preferences.strokeWidth * 5), preferences.strokeWidth,
        preferences.arrowEnds, preferences.arrowHeadShape);
      // All Arrow head variants are valid native closed polygon silhouettes.
    } else vertices = ribbonVertices([arrowStart.screen, point], preferences.strokeWidth);
  }
  path.setAttribute("d", vertices
    ? vertices.map((p, i) => (i ? "L" : "M") +
        p.x.toFixed(1) + "," + p.y.toFixed(1)).join(" ") + (closed ? " Z" : "")
    : "");
  path.setAttribute("fill", closed ? preferences.strokeColor : "none");
  path.setAttribute("stroke", closed ? "none" : preferences.strokeColor);
  path.setAttribute("stroke-width", String(preferences.strokeWidth));
}

function resetArrowPointer() {
  arrowStart = null;
  arrowPointerId = null;
  const path = arrowOverlay?.querySelector("path");
  if (path) path.setAttribute("d", "");
}

/** Save one native Drawing, including native creation history when available. */
async function saveAnnotation(data, sceneId, caption = "Drawing") {
  if (!data || !isUsable() || !canvas.drawings.active ||
      canvas.scene?.id !== sceneId) return;
  try {
    const created = await canvas.scene.createEmbeddedDocuments("Drawing", [data]);
    if (!created?.length) throw new Error("Foundry returned no new Drawing");
    try { canvas.drawings.storeHistory("create", created.map(d => d.toObject())); }
    catch (error) { console.debug(MODULE_ID + " | Native Drawing undo unavailable", error); }
    selectCreatedDrawing(created[0].id, sceneId);
  } catch (error) {
    console.error(MODULE_ID + " | " + caption + " creation failed", error);
    notify("Could not save " + caption + ". See console.", "error");
  }
}

/** A Route is an editable native Drawing; click multiple points, then finish. */
async function finishRoute() {
  if (activeGeometryTool !== "route" || routeWaypoints.length < 2) {
    return notify("Choose at least two Route waypoints first.");
  }
  const points = routeWaypoints.map(entry => entry.scene);
  const sceneId = canvas.scene?.id;
  const data = ribbonDrawingData(points, preferences, "route");
  exitArrow();
  await saveAnnotation(data, sceneId, "Route");
}

function enterArrow(tool = "arrow") {
  if (!dock || !isUsable() || !canvas.drawings.active) return;
  if (!["arrow", "line", "route", "callout"].includes(tool)) return;
  exitArrow();
  const board = boardElement();
  if (!board) return notify("Cannot locate the Foundry canvas.", "error");
  activeGeometryTool = tool;
  routeWaypoints = [];
  arrowOverlay = document.createElement("div");
  arrowOverlay.id = "dqb-arrow-overlay";
  arrowOverlay.title = tool === "route"
    ? "Click route waypoints, double-click or Enter to finish, right-click or Esc to cancel"
    : tool === "callout"
      ? "Drag from a map point to a label location; type text to save"
      : "Drag on the map; Esc to cancel";
  arrowOverlay.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="none"><path d="" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  document.body.append(arrowOverlay);
  updateArrowBounds();
  arrowOverlay.addEventListener("contextmenu", event => {
    event.preventDefault();
    void returnToTokens();
  });
  arrowOverlay.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;
    if (!canvas.drawings.active || !canvas.scene) return exitArrow();
    updateArrowBounds();
    if (activeGeometryTool === "route") {
      event.preventDefault();
      if (event.detail >= 2) {
        if (routeWaypoints.length >= 2) void finishRoute();
        return;
      }
      try {
        if (routeWaypoints.length >= 80) return notify("A Route supports up to 80 waypoints.");
        routeWaypoints.push({screen: screenPoint(event), scene: scenePoint(event)});
        drawArrowPreview(screenPoint(event));
        refreshToolHighlight();
      } catch (error) {
        console.error(MODULE_ID + " | Route waypoint failed", error);
        notify("Cannot place this Route waypoint.", "error");
      }
      return;
    }
    try {
      arrowStart = {screen: screenPoint(event), scene: scenePoint(event), sceneId: canvas.scene.id};
      arrowPointerId = event.pointerId;
      arrowOverlay.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    } catch (error) {
      console.error(MODULE_ID + " | Cannot start " + activeGeometryTool, error);
      notify("Map coordinates are unavailable.", "error");
      resetArrowPointer();
    }
  });
  arrowOverlay.addEventListener("pointermove", event => {
    if (activeGeometryTool === "route") {
      if (routeWaypoints.length) drawArrowPreview(screenPoint(event));
    } else if (arrowStart && event.pointerId === arrowPointerId) {
      drawArrowPreview(screenPoint(event));
    }
  });
  arrowOverlay.addEventListener("pointercancel", resetArrowPointer);
  arrowOverlay.addEventListener("dblclick", event => {
    if (activeGeometryTool === "route" && routeWaypoints.length >= 2) {
      event.preventDefault();
      void finishRoute();
    }
  });
  arrowOverlay.addEventListener("pointerup", async event => {
    if (activeGeometryTool === "route" || !arrowStart || event.pointerId !== arrowPointerId) return;
    const initial = arrowStart;
    const toolKind = activeGeometryTool;
    const finish = screenPoint(event);
    resetArrowPointer();
    if (Math.hypot(finish.x - initial.screen.x, finish.y - initial.screen.y) < 8) return;
    if (!canvas.scene || canvas.scene.id !== initial.sceneId || !canvas.drawings.active) return;
    try {
      const end = scenePoint(event);
      if (toolKind === "callout") {
        textScene = {sceneId: initial.sceneId, calloutStart: initial.scene,
          position: end, kind: "callout"};
        exitArrow();
        showTextDialog(event.clientX, event.clientY);
        return;
      }
      const data = toolKind === "arrow"
        ? arrowDocumentData(initial.scene, end, preferences)
        : ribbonDrawingData([initial.scene, end], preferences, "line");
      exitArrow();
      await saveAnnotation(data, initial.sceneId, toolKind === "arrow" ? "Arrow" : "Line");
    } catch (error) {
      console.error(MODULE_ID + " | " + toolKind + " creation failed", error);
      notify("Could not create " + toolKind + ". See console.", "error");
      exitArrow();
    }
  });
  refreshToolHighlight();
}

function exitArrow() {
  resetArrowPointer();
  routeWaypoints = [];
  arrowOverlay?.remove();
  arrowOverlay = null;
  activeGeometryTool = null;
  refreshToolHighlight();
}

/**
 * Placement overlay only: text itself is a native Drawing document.
 * Clicking the map never writes world data until the user submits the form.
 */
function updateTextBounds() {
  if (!textOverlay) return;
  const board = boardElement();
  if (!board) return;
  const rect = board.getBoundingClientRect();
  for (const prop of ["left", "top", "width", "height"]) textOverlay.style[prop] = rect[prop] + "px";
}
function exitTextPlacement() {
  textDialog?.remove();
  textDialog = null;
  textOverlay?.remove();
  textOverlay = null;
  textScene = null;
  refreshToolHighlight();
}
/** Canceling a NEW label returns to Tokens; canceling Edit Text preserves native selection. */
function cancelTextDialog() {
  const creating = Boolean(textOverlay || (textScene && !textScene.drawingId));
  exitTextPlacement();
  if (creating) void returnToTokens();
}
function enterTextPlacement() {
  if (!dock || !isUsable() || !canvas.drawings.active) return;
  exitArrow();
  exitTextPlacement();
  if (!boardElement()) return notify("Cannot locate the Foundry canvas.", "error");
  textOverlay = document.createElement("div");
  textOverlay.id = "dqb-text-overlay";
  textOverlay.title = "Click the map to place a text label; Esc to cancel";
  document.body.append(textOverlay);
  updateTextBounds();
  textOverlay.addEventListener("contextmenu", event => {
    event.preventDefault();
    void returnToTokens();
  });
  textOverlay.addEventListener("pointerdown", event => {
    if (event.button !== 0 || textDialog) return;
    try {
      const position = scenePoint(event);
      textScene = {sceneId: canvas.scene.id, position};
      showTextDialog(event.clientX, event.clientY);
      event.preventDefault();
    } catch(error) {
      console.error(MODULE_ID + " | Text placement coordinates unavailable", error);
      notify("Cannot position text here. See console.", "error");
      exitTextPlacement();
    }
  });
  refreshToolHighlight();
}
function showTextDialog(clientX, clientY) {
  if (!textScene || textDialog) return;
  const editing = Boolean(textScene.drawingId);
  const callout = !editing && textScene.kind === "callout";
  const original = editing ? canvas.scene.drawings.get(textScene.drawingId) : null;
  if (editing && !canEdit(original)) return notify("You can edit only your own unlocked Drawings.");
  const popup = document.createElement("form");
  popup.id = "dqb-text-dialog";
  popup.setAttribute("aria-label", editing ? "Edit Drawing text" :
    callout ? "Callout label" : "Text options");
  popup.innerHTML = `
    <div class="dqb-text-dialog-title">${editing ? "Edit Text" : callout ? "Place Callout" : "Place Text"}
      <button type="button" data-action="cancel-text" title="Cancel text placement" aria-label="Cancel text placement">&times;</button>
    </div>
    <label>${callout ? "Callout label" : "Text"} <textarea name="drawingText" rows="3" maxlength="2000" placeholder="Type your label here" required></textarea></label>
    <div class="dqb-text-dialog-options">
      <label>Size
        <select name="fontSizePreset" aria-label="Font size preset">
          <option value="">Custom</option>
          <option value="16">Small · 16px</option>
          <option value="24">Medium · 24px</option>
          <option value="32">Normal · 32px</option>
          <option value="48">Large · 48px</option>
          <option value="64">XL · 64px</option>
          <option value="96">Huge · 96px</option>
        </select>
      </label>
      <label>Pixels <input name="fontSize" type="number" min="8" max="120" step="1" required></label>
      <label>Color <input name="textColor" type="color"></label>
    </div>
    <div class="dqb-text-dialog-actions">
      <button type="button" data-action="cancel-text">Cancel</button>
      <button type="submit" class="dqb-primary">${editing ? "Save Changes" : callout ? "Place Callout" : "Place Text"}</button>
    </div>`;
  document.body.append(popup);
  textDialog = popup;
  popup.style.left = Math.max(8, Math.min(window.innerWidth - 338, clientX + 15)) + "px";
  popup.style.top = Math.max(8, Math.min(window.innerHeight - 340, clientY + 15)) + "px";
  const initial = normalizePrefs({
    ...preferences,
    fontSize: Number.isFinite(original?.fontSize) ? original.fontSize : preferences.fontSize,
    textColor: original?.textColor ?? preferences.textColor
  });
  popup.elements.namedItem("drawingText").value = original?.text ?? "";
  popup.elements.namedItem("fontSize").value = String(initial.fontSize);
  popup.elements.namedItem("textColor").value = initial.textColor;
  popup.elements.namedItem("fontSizePreset").value = String(initial.fontSize);
  popup.addEventListener("click", event => {
    if (event.target.closest('[data-action="cancel-text"]')) cancelTextDialog();
  });
  popup.addEventListener("change", event => {
    if (event.target.name === "fontSizePreset" && event.target.value) {
      popup.elements.namedItem("fontSize").value = event.target.value;
    }
  });
  popup.addEventListener("keydown", event => {
    // Prevent shortcut handlers (ours or Foundry's bubble-phase handlers) from seeing typed text.
    if (event.key === "Escape") {
      event.preventDefault();
      cancelTextDialog();
    }
    event.stopPropagation();
  });
  popup.addEventListener("keyup", event => event.stopPropagation());
  popup.addEventListener("submit", async event => {
    event.preventDefault();
    event.stopPropagation();
    if (!textScene || !isUsable() || canvas.scene.id !== textScene.sceneId) {
      exitTextPlacement();
      return notify("The Scene changed. Text was not added.");
    }
    const raw = popup.elements.namedItem("drawingText").value;
    const newPreferences = normalizePrefs({
      ...preferences, fontSize: Number(popup.elements.namedItem("fontSize").value),
      textColor: popup.elements.namedItem("textColor").value
    });
    const operation = {...textScene};
    const existing = operation.drawingId ? canvas.scene.drawings.get(operation.drawingId) : null;
    const patch = operation.drawingId
      ? editTextPatch(existing, raw, newPreferences)
      : operation.kind === "callout"
        ? calloutDrawingData(operation.calloutStart, operation.position, raw, newPreferences)
        : textDocumentData(operation.position, raw, newPreferences);
    if (operation.drawingId ? !canEdit(existing) : !canUseDrawingQuickbar(game.user))
      return notify("You may edit only your own unlocked Drawings.");
    if (!patch) return notify("Enter text and a valid font size on an editable Drawing.", "warn");
    const button = popup.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      if (operation.drawingId) {
        // Only text, fontSize, textColor and visible text opacity change. Shape, lock, flags and ID persist.
        const updated = await canvas.scene.updateEmbeddedDocuments("Drawing", [patch]);
        if (!updated?.length) throw new Error("No Drawing was updated");
        exitTextPlacement();
        notify("Drawing text updated.", "info");
      } else {
        // Leader and label are created together. Never delete or rewrite either
        // Drawing if Foundry reports an incomplete creation.
        const data = Array.isArray(patch) ? patch : [patch];
        const created = await canvas.scene.createEmbeddedDocuments("Drawing", data);
        if (!created?.length || created.length !== data.length)
          throw new Error("Foundry returned an incomplete Drawing creation; inspect Scene art");
        preferences = newPreferences;
        safeSave();
        updateDockInputs();
        try { canvas.drawings.storeHistory("create", created.map(doc => doc.toObject())); }
        catch(error) { console.debug(MODULE_ID + " | Native text undo not available", error); }
        exitTextPlacement();
        selectCreatedDrawing(created.at(-1).id, canvas.scene.id);
      }
      refreshSelectedPanel();
    } catch(error) {
      console.error(MODULE_ID + " | Could not save Drawing text", error);
      notify("Could not save Drawing text. See console.", "error");
      button.disabled = false;
    }
  });
  popup.elements.namedItem("drawingText").focus();
}

function onKeydown(event) {
  if (!dock || !isUsable() || tutorialDialog?.open || inspectDialog?.open) return;
  if (event.key === "Escape" && (arrowOverlay || textOverlay)) {
    event.preventDefault();
    void returnToTokens();
    return;
  }
  if (event.key === "Enter" && activeGeometryTool === "route" && arrowOverlay &&
      !(event.target instanceof Element &&
        event.target.closest("input, textarea, select, [contenteditable], [role='textbox']"))) {
    event.preventDefault();
    void finishRoute();
    return;
  }
  // Foundry's native Text tool listens on document, not necessarily an input.
  const editable = "input, textarea, select, [contenteditable], [role='textbox']";
  const isEditable = el => el instanceof Element && Boolean(el.closest(editable));
  // Do not mistake a Drawing's _onkeydown handler method for an active editor.
  const nativeEditor = Boolean(suspendShortcuts);
  if (!shouldRunDrawingShortcut({
    tool: ui.controls?.tool?.name,
    activeLayer: canvas.drawings.active,
    editableTarget: isEditable(event.target) || isEditable(document.activeElement),
    nativeEditor,
    quickbarEditor: Boolean(textOverlay || textDialog),
    isComposing: event.isComposing,
    repeated: event.repeat,
    modified: event.ctrlKey || event.metaKey || event.altKey
  })) return;
  const tool = KEY_TO_TOOL[event.key.toLowerCase()];
  if (tool) {
    event.preventDefault();
    selectTool(tool);
  }
}

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "preferences", {
    name: "Drawing Quickbar preferences",
    hint: "Per-browser drawing styles and quickbar position",
    scope: "client", config: false, type: Object,
    default: structuredClone(DEFAULT_PREFS)
  });
  Hooks.on("getSceneControlButtons", controls => {
    if (!canUseDrawingQuickbar(game.user)) return;
    // Two launch points, ONE movable Quickbar. Do not add a new Scene control layer.
    for (const controlName of ["drawings", "tokens"]) {
      const tools = controls[controlName]?.tools;
      if (!tools) continue;
      tools.drawingQuickbar = {
        name: "drawingQuickbar", title: "Drawing Quickbar", icon: "fa-solid fa-pen-ruler",
        order: 95, button: true, visible: true,
        onChange: () => toggleDock({activateDrawings: controlName === "drawings"})
      };
    }
  });
});
Hooks.once("ready", () => {
  preferences = normalizePrefs(game.settings.get(MODULE_ID, "preferences"));
  if (!canUseDrawingQuickbar(game.user)) return;
  Hooks.on("preCreateDrawing", (document, data, _options, userId) => {
    const nativeTool = ui?.controls?.tool?.name;
    const localNewDrawing = Boolean(dock && canvas?.drawings?.active &&
      userId === game.user.id && !data?._id &&
      canvas?.scene?.id && canvas.scene.id === document?.parent?.id);
    if (!localNewDrawing) return;
    const applyDefaults = shouldStyleNewDrawing({
      open: true, active: true, autoStyle: preferences.autoStyle,
      userId, currentUserId: game.user.id, existingId: data?._id,
      sceneId: canvas.scene.id, parentId: document.parent.id, tool: nativeTool
    });
    if (nativeTool === "freehand") {
      // Even with Apply Default Style disabled, native Pen must not be flood-filled.
      document.updateSource(applyDefaults
        ? penStylePatch(preferences) : {fillType: 0, fillAlpha: 0});
    } else if (applyDefaults) document.updateSource(stylePatch(preferences));
  });
  Hooks.on("canvasReady", () => {lastStyleUndo = null; closeDock({restoreTokens: false});});
  Hooks.on("deactivateDrawingsLayer", () => {
    exitArrow();
    exitTextPlacement();
  });
  Hooks.on("controlDrawing", () => queueMicrotask(refreshSelectedPanel));
  Hooks.on("releaseDrawing", () => queueMicrotask(refreshSelectedPanel));
  Hooks.on("updateDrawing", () => {
    refreshSelectedPanel();
    refreshFinder();
    refreshFocusMarker();
  });
  Hooks.on("createDrawing", (doc, _options, userId) => {
    refreshSelectedPanel();
    refreshFinder();
    if (!dock || !isUsable() || !canvas.drawings.active ||
        userId !== game.user.id || doc?.parent?.id !== canvas.scene.id ||
        !canEdit(doc) || arrowOverlay || textOverlay ||
        !["rect", "ellipse", "polygon", "freehand"].includes(ui.controls?.tool?.name)) return;
    selectCreatedDrawing(doc.id, canvas.scene.id);
  });
  Hooks.on("deleteDrawing", () => {
    refreshSelectedPanel();
    refreshFinder();
    refreshFocusMarker();
  });
  Hooks.on("canvasPan", refreshFocusMarker);
  Hooks.on("renderSceneControls", () => {
    refreshToolHighlight();
    refreshSelectedPanel();
  });
  ui.controls?.addEventListener?.("activate", () => {
    if ((!canvas?.drawings?.active || ui.controls?.tool?.name !== "select")) {
      exitArrow();
      exitTextPlacement();
    }
    refreshToolHighlight();
    refreshSelectedPanel();
  });
  window.addEventListener("resize", () => {
    updateArrowBounds();
    updateTextBounds();
    refreshFocusMarker();
  });
  document.addEventListener("keydown", onKeydown);
  document.addEventListener("pointerdown", event => {
    // A tool switch or Scene navigation should never leave an invisible input shield over the canvas.
    if (arrowOverlay && !arrowOverlay.contains(event.target) && !dock?.contains(event.target) && !canvas?.drawings?.active) exitArrow();
  });
  console.info(`${MODULE_ID} | v0.1.19 ready (Foundry v14 native Drawing workflow)`);
});
