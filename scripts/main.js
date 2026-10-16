import {
  MODULE_ID, DEFAULT_PREFS, PRESETS, normalizePrefs, stylePatch,
  snapshotStyle, arrowPoints, arrowDocumentData, shouldStyleNewDrawing
} from "./model.js";

const TOOLS = new Set(["select", "rect", "ellipse", "polygon", "freehand", "text"]);
const KEY_TO_TOOL = {v: "select", r: "rect", e: "ellipse", p: "polygon", f: "freehand", t: "text", a: "arrow"};
let preferences = normalizePrefs(DEFAULT_PREFS);
let dock = null;
let arrowOverlay = null;
let arrowStart = null;
let arrowPointerId = null;
let lastStyleUndo = null;
let saveQueue = Promise.resolve();
let saveTimer = null;

function notify(message, type = "warn") {
  const n = ui?.notifications;
  n?.[type]?.(`[Drawing Quickbar] ${message}`);
}
function isUsable() {
  return Boolean(game?.user?.isGM && canvas?.ready && canvas?.scene && canvas?.drawings && ui?.controls);
}
function safeSave() {
  // Coalesce rapid color/range input events into one client setting write.
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const copy = structuredClone(preferences);
    saveQueue = saveQueue.catch(() => {}).then(() => game.settings.set(MODULE_ID, "preferences", copy))
      .catch(error => console.warn(`${MODULE_ID} | Could not save drawing preferences`, error));
  }, 250);
}
function updateDockInputs() {
  if (!dock) return;
  for (const property of ["strokeColor", "fillColor", "textColor", "strokeWidth", "fillAlpha", "fontSize"]) {
    const input = dock.querySelector(`[name="${property}"]`);
    if (input) input.value = preferences[property];
  }
  dock.querySelector('[name="filled"]').checked = preferences.filled;
  dock.querySelector('[name="autoStyle"]').checked = preferences.autoStyle;
  dock.querySelector('[data-value="strokeWidth"]').textContent = `${preferences.strokeWidth}px`;
  dock.querySelector('[data-value="fillAlpha"]').textContent = `${Math.round(preferences.fillAlpha * 100)}%`;
  dock.querySelector('[data-value="fontSize"]').textContent = `${preferences.fontSize}px`;
  dock.querySelector('[data-action="undo-style"]').disabled = !lastStyleUndo;
  refreshToolHighlight();
}
function refreshToolHighlight() {
  if (!dock) return;
  const active = arrowOverlay ? "arrow" : (ui.controls?.tool?.name ?? "select");
  for (const button of dock.querySelectorAll("[data-tool]")) {
    const selected = button.dataset.tool === active;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
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
      <span><i class="fa-solid fa-pen-ruler" aria-hidden="true"></i> Drawing Quickbar <small>v0.1.0</small></span>
      <button type="button" class="dqb-icon" data-action="close" aria-label="Close Drawing Quickbar" title="Close"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="dqb-content">
      <div class="dqb-tools" role="group" aria-label="Drawing tools">
        <button type="button" data-tool="select" title="Select and edit (V)"><i class="fa-solid fa-arrow-pointer"></i><span>Select</span></button>
        <button type="button" data-tool="freehand" title="Freehand (F)"><i class="fa-solid fa-pencil"></i><span>Pen</span></button>
        <button type="button" data-tool="rect" title="Rectangle (R)"><i class="fa-regular fa-square"></i><span>Box</span></button>
        <button type="button" data-tool="ellipse" title="Ellipse (E)"><i class="fa-regular fa-circle"></i><span>Circle</span></button>
        <button type="button" data-tool="polygon" title="Polygon (P)"><i class="fa-solid fa-draw-polygon"></i><span>Polygon</span></button>
        <button type="button" data-tool="text" title="Text (T)"><i class="fa-solid fa-font"></i><span>Text</span></button>
        <button type="button" data-tool="arrow" title="Draw an arrow by dragging (A)"><i class="fa-solid fa-arrow-right-long"></i><span>Arrow</span></button>
      </div>
      <div class="dqb-section-title">QUICK STYLES</div>
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
      <label class="dqb-option"><input name="autoStyle" type="checkbox"> Use this style for new drawings while Quickbar is open</label>
      <div class="dqb-actions">
        <button type="button" data-action="apply-selected" title="Apply style to selected existing drawings"><i class="fa-solid fa-paintbrush"></i> Style Selected</button>
        <button type="button" data-action="undo-style" title="Restore previous selected drawing styles"><i class="fa-solid fa-rotate-left"></i> Revert Style</button>
      </div>
      <div class="dqb-help">Draw using Foundry's native tools. Select drawings with V to move/resize them. Double-click a drawing for its full native settings. Shortcuts work only on the Drawings layer. Arrow: drag, Esc to exit.</div>
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
    if (button.dataset.tool) return selectTool(button.dataset.tool);
    if (button.dataset.preset) {
      preferences = normalizePrefs({...preferences, ...PRESETS[button.dataset.preset]});
      updateDockInputs();
      safeSave();
    }
    if (button.dataset.action === "close") closeDock();
    if (button.dataset.action === "apply-selected") await styleSelected();
    if (button.dataset.action === "undo-style") await undoSelectedStyle();
  });
  root.addEventListener("input", event => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.name) return;
    if (input.type === "checkbox") preferences[input.name] = input.checked;
    else preferences[input.name] = input.type === "range" ? Number(input.value) : input.value;
    preferences = normalizePrefs(preferences);
    updateDockInputs();
    safeSave();
  });
  dock = root;
  updateDockInputs();
}

async function openDock() {
  if (!isUsable()) return notify("Open a Scene as GM before using this toolbar.");
  if (dock) return;
  createDock();
  try { await ui.controls.activate({control: "drawings", tool: "select"}); }
  catch (error) { console.error(`${MODULE_ID} | Could not activate drawings`, error); notify("Could not activate the Drawing tools. Check the browser console.", "error"); closeDock(); }
  refreshToolHighlight();
}
function closeDock() {
  exitArrow();
  dock?.remove();
  dock = null;
}
function toggleDock() { return dock ? closeDock() : openDock(); }

async function selectTool(tool) {
  if (!dock || !isUsable()) return;
  if (tool === "arrow") {
    try {
      await ui.controls.activate({control: "drawings", tool: "select"});
      enterArrow();
    } catch (error) {
      console.error(`${MODULE_ID} | Arrow activation failed`, error);
      notify("Could not activate Arrow mode.", "error");
    }
    return;
  }
  if (!TOOLS.has(tool)) return;
  exitArrow();
  try { await ui.controls.activate({control: "drawings", tool}); }
  catch (error) {
    console.error(`${MODULE_ID} | Could not select native drawing tool`, error);
    notify("The native drawing tool could not be selected.", "error");
  }
  refreshToolHighlight();
}

async function styleSelected() {
  if (!isUsable() || !canvas.drawings.active) return notify("Open the Drawings layer and select one or more drawings.");
  const selected = [...(canvas.drawings.controlled ?? [])].map(o => o.document).filter(d => d?.id && !d.locked);
  if (!selected.length) return notify("Select one or more unlocked drawings first.");
  const scene = canvas.scene;
  const backups = selected.map(snapshotStyle);
  try {
    const result = await scene.updateEmbeddedDocuments("Drawing", selected.map(d => ({_id: d.id, ...stylePatch(preferences)})));
    if (!result?.length) return notify("No drawings were updated.");
    lastStyleUndo = {sceneId: scene.id, documents: backups.filter(old => result.some(r => r.id === old._id))};
    updateDockInputs();
    notify(`Styled ${result.length} drawing${result.length === 1 ? "" : "s"}.`, "info");
  } catch (error) {
    console.error(`${MODULE_ID} | Style update failed`, error);
    notify("Could not update selected drawings. Existing data was not intentionally changed.", "error");
  }
}

async function undoSelectedStyle() {
  const undo = lastStyleUndo;
  if (!undo || canvas?.scene?.id !== undo.sceneId) return notify("No style change to revert in this Scene.");
  // Only restore documents that still exist; never resurrect removed drawings.
  const updates = undo.documents.filter(d => canvas.scene.drawings.get(d._id));
  if (!updates.length) { lastStyleUndo = null; updateDockInputs(); return notify("The selected drawings no longer exist."); }
  try {
    await canvas.scene.updateEmbeddedDocuments("Drawing", updates);
    lastStyleUndo = null;
    updateDockInputs();
    notify("Previous drawing styles restored.", "info");
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
function drawArrowPreview(point) {
  const path = arrowOverlay?.querySelector("path");
  if (!path || !arrowStart) return;
  const points = arrowPoints(arrowStart.screen, point, 20);
  path.setAttribute("d", points ? points.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") : "");
  path.setAttribute("stroke", preferences.strokeColor);
  path.setAttribute("stroke-width", String(preferences.strokeWidth));
}
function resetArrowPointer() {
  arrowStart = null;
  arrowPointerId = null;
  const path = arrowOverlay?.querySelector("path");
  if (path) path.setAttribute("d", "");
}
function enterArrow() {
  if (!dock || !isUsable() || !canvas.drawings.active) return;
  exitArrow();
  const board = boardElement();
  if (!board) return notify("Cannot locate the Foundry canvas.", "error");
  arrowOverlay = document.createElement("div");
  arrowOverlay.id = "dqb-arrow-overlay";
  arrowOverlay.title = "Drag an arrow on the map; press Esc to leave Arrow mode";
  arrowOverlay.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="none"><path d="" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  document.body.append(arrowOverlay);
  updateArrowBounds();
  arrowOverlay.addEventListener("contextmenu", event => { event.preventDefault(); exitArrow(); refreshToolHighlight(); });
  arrowOverlay.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;
    if (!canvas.drawings.active || !canvas.scene) return exitArrow();
    updateArrowBounds();
    try {
      arrowStart = {screen: screenPoint(event), scene: scenePoint(event), sceneId: canvas.scene.id};
      arrowPointerId = event.pointerId;
      arrowOverlay.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    } catch (error) {
      console.error(`${MODULE_ID} | Cannot start arrow`, error);
      notify("Arrow coordinates are unavailable.", "error");
      resetArrowPointer();
    }
  });
  arrowOverlay.addEventListener("pointermove", event => {
    if (arrowStart && event.pointerId === arrowPointerId) drawArrowPreview(screenPoint(event));
  });
  arrowOverlay.addEventListener("pointercancel", resetArrowPointer);
  arrowOverlay.addEventListener("pointerup", async event => {
    if (!arrowStart || event.pointerId !== arrowPointerId) return;
    const initial = arrowStart;
    const finish = screenPoint(event);
    resetArrowPointer();
    if (Math.hypot(finish.x - initial.screen.x, finish.y - initial.screen.y) < 8) return;
    if (!canvas.scene || canvas.scene.id !== initial.sceneId || !canvas.drawings.active) return;
    try {
      const end = scenePoint(event);
      const data = arrowDocumentData(initial.scene, end, preferences);
      if (!data) return;
      const created = await canvas.scene.createEmbeddedDocuments("Drawing", [data]);
      if (created?.length) {
        // Enter the native drawing undo history when supported by this Foundry build.
        try { canvas.drawings.storeHistory("create", created.map(d => d.toObject())); }
        catch (error) { console.debug(`${MODULE_ID} | Native arrow undo registration unavailable`, error); }
      }
    } catch (error) {
      console.error(`${MODULE_ID} | Arrow creation failed`, error);
      notify("Could not save arrow. See console; no existing drawings were modified.", "error");
    }
  });
  refreshToolHighlight();
}
function exitArrow() {
  resetArrowPointer();
  arrowOverlay?.remove();
  arrowOverlay = null;
  refreshToolHighlight();
}
function onKeydown(event) {
  if (!dock || !isUsable() || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  const el = event.target;
  if (el instanceof Element && el.closest("input, textarea, select, [contenteditable], [role='textbox']")) return;
  if (event.key === "Escape" && arrowOverlay) {
    event.preventDefault();
    selectTool("select");
    return;
  }
  if (!canvas.drawings.active) return;
  const tool = KEY_TO_TOOL[event.key.toLowerCase()];
  if (tool) { event.preventDefault(); selectTool(tool); }
}

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "preferences", {
    name: "Drawing Quickbar preferences",
    hint: "Per-browser drawing styles and quickbar position",
    scope: "client", config: false, type: Object,
    default: structuredClone(DEFAULT_PREFS)
  });
  Hooks.on("getSceneControlButtons", controls => {
    if (!game.user?.isGM || !controls.drawings?.tools) return;
    controls.drawings.tools.drawingQuickbar = {
      name: "drawingQuickbar", title: "Drawing Quickbar", icon: "fa-solid fa-palette",
      order: 95, button: true, onChange: () => toggleDock()
    };
  });
});
Hooks.once("ready", () => {
  preferences = normalizePrefs(game.settings.get(MODULE_ID, "preferences"));
  if (!game.user.isGM) return;
  Hooks.on("preCreateDrawing", (document, data, _options, userId) => {
    if (shouldStyleNewDrawing({
      open: !!dock, active: !!canvas?.drawings?.active, autoStyle: preferences.autoStyle,
      userId, currentUserId: game.user.id, existingId: data?._id,
      sceneId: canvas?.scene?.id, parentId: document?.parent?.id,
      tool: ui?.controls?.tool?.name
    })) document.updateSource(stylePatch(preferences));
  });
  Hooks.on("canvasReady", () => {lastStyleUndo = null; closeDock();});
  Hooks.on("deactivateDrawingsLayer", () => exitArrow());
  Hooks.on("renderSceneControls", () => refreshToolHighlight());
  ui.controls?.addEventListener?.("activate", () => {
    if (arrowOverlay && (!canvas?.drawings?.active || ui.controls?.tool?.name !== "select")) exitArrow();
    refreshToolHighlight();
  });
  window.addEventListener("resize", updateArrowBounds);
  document.addEventListener("keydown", onKeydown);
  document.addEventListener("pointerdown", event => {
    // A tool switch or Scene navigation should never leave an invisible input shield over the canvas.
    if (arrowOverlay && !arrowOverlay.contains(event.target) && !dock?.contains(event.target) && !canvas?.drawings?.active) exitArrow();
  });
  console.info(`${MODULE_ID} | v0.1.0 ready (Foundry v14 native Drawing workflow)`);
});
