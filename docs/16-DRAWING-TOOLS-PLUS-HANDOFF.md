# 16.1 - Drawing Tools+ / Drawing Quickbar - Development handoff

**Suggested next conversation:** `16.1 - Drawing Tools+ Live Beta` (follow with `16.2`, `16.3`, and so on).
**Independent module ID:** `foundry-drawing-quickbar` (do not rename casually: module settings, CSS, and Drawing flags use this ID).
**GitHub repository:** https://github.com/rebsiot/drawing-tools-plus
**Starting version:** 0.1.0, GitHub prerelease `v0.1.0` uses a Foundry manifest-installable ZIP (2026-10-16).
**Baseline:** Foundry v14; no dependency on WoD20 or TC Modern.
**Status:** 11/11 automated/mock tests passed; **live Foundry test not yet performed**. No official Foundry package publication has occurred.
**Code provenance:** first source import from the 0.1.0 ZIP; metadata/documentation/CI additions only, not a tested functionality upgrade.

## Purpose / product direction

The source currently implements a compact, movable Drawing Quickbar layered onto Foundry **native Drawing documents**. The eventual Drawing Tools+ goal is Excalidraw-like ease of editing on the map, *not* a separate canvas editor and *not* a wall tool. A conceptual mockup is not evidence that planned editing tools exist in v0.1.0.

The current module has native selection/freehand/rectangle/ellipse/polygon/text tool switching, Arrow creation as one native freehand Drawing, Outline/Danger/Highlight/Filled presets, color and size controls, optional style-on-create, batch Style Selected and one-step Revert Style, client-side preferences and shortcuts. GM-only toolbar. It does not offer inline text editing, multi-select grouping, smart arrow connectors, alignment, or generalized undo/redo.

## 16.1 update — v0.1.1 and new selection-protection TODO (2026-10-16)

**Live v0.1.0 report:** GM reports most Drawing Quickbar functions working in live Foundry v14, but Arrow failed on creation with `DataModelValidationFailure [DrawingDocument]: shape.type: f is not a valid choice`. No exact Foundry build number reported. Existing painted gridlines are valuable Scene Drawings to protect.

**v0.1.1 beta work:** Use a v14 `p` polygon for Arrow rather than invalid `f`, use a closed silhouette so the shape doesn't create a return stroke; add Duplicate of selected unlocked Drawing documents and native `Drawing.enableTextEditing()` for exactly one unlocked Drawing. All changes are to native Drawings. Existing module ID/settings/flags preserved. No auto-migration. **This new code is not live validated yet.**

**Requested TODO (priority before deeper manipulation): Drawing Selection & Protection**
1. Show **Selected Objects** inside the Quickbar: exact count, name/type/lock state for each selected native Drawing, with individual deselect controls. Clearly distinguish locked background markings so no accidental selection/deletion.
2. **Protect Drawings:** user-selected gridline/annotation Drawings can be explicitly locked with the native `DrawingDocument.locked` field; offer discoverable unlock/recovery via a list that includes locked objects. Protect from Quickbar bulk edits/delete. No automatic locking of preexisting Drawings.
3. **Background versus Working groups:** a logical grouping/filtering mechanism using native Drawing flags and Foundry's placeables UI; no new renderer or replacement for the real Drawings layer. Explore separation after locking and inspector UX are verified.
4. **Safe deletion:** if the module later adds bulk delete, list the exact targets and request confirmation; leave Foundry's native deletion unchanged until proper guards exist.
5. Safety regression: on Scene with hand-drawn gridlines, explicitly protect them, select several working Drawings, duplicate/style/delete test copies, and verify untouched IDs, geometry and persistence of gridlines.

**Implementation status:** Items 1–5 above are **planned**, not implemented by v0.1.1. Native locking already exists in v14 and can be used manually in the meantime.

**Release sequencing:** GitHub prerelease `v0.1.1` must be built and verified before moving the stable `main/module.json` manifest. Validate Arrow/duplicate/inline editor in a test world, then tackle the Selected Objects inspector/locking UX.

## 16.1 update — v0.1.4: Find Drawing, local focus and stable text editing (2026-10-16)

**User feedback on v0.1.3:** Most features work; a tiny stray single-letter 'a' on the map could not be found, and Edit Text felt unreliable. Wants pan/highlight for Drawings and continued editing progress.

**Developed in v0.1.4 (automatic/mock verification only, pending actual live test):**
- Expandable **Find Drawing** below selection controls searches every current Scene Drawing (including locked/hidden) by text/name/type/document ID. Exact text matches sort ahead of generic names. 60 results maximum at once to keep the panel responsive; refine search for large grids.
- **Locate** actions in selected, locked and Finder lists call `canvas.animatePan`, then draw a short-lived HTML/CSS focus ring following Canvas pan/zoom. No persistent world geometry and no broadcast ping.
- **Select** from finder clears prior selections, then controls only the explicit unlocked target. Hidden/locked objects are still findable/locatable but not force-selected.
- **Edit Text** button and Finder text Edit both open the same prefilled text popup used for creating labels; native `updateEmbeddedDocuments("Drawing",...)` patches only `text`, `fontSize`, `textColor`. No replacement document, ID/shape/flags/position changes. Locked target cannot be edited.
- Fix earlier native text shortcut detection mistakenly treating any present `_onkeydown` method as an active text editor. Native Text tool and focused text inputs still suppress shortcuts.
- **Still planned:** logical Background/Working groups, safe delete only with exact-target confirmation, and further manipulation tools. Keep GitHub Issue #1 open.

**Regression test requested:** In an expendable Scene with a stray 'a', Find Drawing > search a > Locate (local pan + ring), Edit to rename and change size, confirm it stays one Drawing after reload; select and lock test Drawings, ensure painted gridlines are not modified; test existing tools and shortcuts. Verify on the live v14 build. If UI fails, save first browser console error.

## 16.1 update — v0.1.3: visible text/selection controls

v0.1.3 supersedes v0.1.2 and places the Selected Drawings inspector/Lock actions immediately below the tool buttons (not after the style sliders). The actions collapse if no Drawings are selected, but recovery for locked Drawings remains visible. This is UI/packaging follow-through; all v0.1.2 native document and keyboard behavior carries forward, still pending live verification.

## 16.1 update — v0.1.2: text popup and selection/lock controls (2026-10-16)

**Live user report:** Quickbar Text placement on the canvas caused letters to activate Quickbar shortcut tools. The GM requests a text-options box on map click with font-size choices, and clearly visible Lock/other actions when Drawings are selected.

**v0.1.2 changes (automated/mock validation only):**
- Quickbar Text activates a placement-only overlay, then opens a focused textarea plus font-size presets/numeric size and text color on map click. Save creates one native rectangle Drawing; cancel/Esc creates nothing. Native canvas Text tool remains available; Quickbar's single-letter shortcuts are suppressed during native text editing as well.
- A selected-objects inspector lists native controlled Drawings with human-readable name/type and per-Drawing Deselect. Actions shown include Lock, Properties (native sheet), Duplicate, Edit Text, Apply Style and Revert Style.
- Lock updates only the chosen native Drawing `locked` fields, no automatic bulk changes. Expand Locked Drawings for recovery/unlock without being able to select locked Drawings on canvas.
- No logical background/working group or secondary canvas layer yet. Groups remain a planned follow-up under GitHub issue #1; native Drawing locking is the present safety mechanism.
- Module ID/settings/flags, source-only ZIP, stable manifest URL and restrictive Personal Use Only license remain unchanged. v0.1.2 release must be verified before advancing the permanent manifest.
- New paths affected: `scripts/main.js`, `scripts/model.js`, `styles/quickbar.css`, tests, changelog/readme/handoff.
- **Pending user smoke test:** 1) create text containing 'TVRA' in popup; ensure no shortcut switches. 2) edit existing text with native inline editor and type 'VRTA'; ensure no tool changes. 3) select spare drawings and confirm list/actions, Lock, unlock and persistence. 4) verify existing painted gridlines remain intact. 5) test the previous Arrow beta fix and duplicate operation.

## 16.1 update — v0.1.5: direct editing and clear release notes (2026-10-16)

**User reports:** Creating a circle requires manually selecting it afterward; style presets and sliders do not change a selected Drawing. "Style Selected" is unclear, and Edit Text on an existing circle does not display its label. GitHub release descriptions repeat obsolete initial-beta text.

**Implemented (live Foundry validation pending):**
- A native Drawing created locally while Quickbar is open (rectangle, ellipse, polygon, freehand) schedules switching to Foundry Select and selecting only the new ID, with retries if the placeable has not yet appeared. Same intent for newly created Arrow and Text.
- One selected unlocked Drawing: presets apply a full style, sliders/colors apply only their named field (debounced); locked and other selected objects never change. Controls display the selected Drawing's appearance without overwriting remembered defaults.
- Multiple selected Drawings: explicit Apply to N Selected batch action; locked objects skipped. No selection: edit locally remembered style for future Drawings. The four built-in presets are not separate saved custom styles.
- Edit Text on an existing native ellipse now sets text opacity to 1 along with text, font size and color; geometry, identity and flags are preserved.
- Readable CHANGELOG.md, README.md and per-version GitHub release notes (docs/releases) replace generic boilerplate. A main-branch workflow synchronizes existing release **descriptions only**, preserving release assets.
- Module ID remains foundry-drawing-quickbar; v14; Personal Use Only (No Redistribution) license. No background/working group migration.

**Next live smoke test:** Draw a circle, confirm auto-selection/move/resize, change one style without separate action, add visible label with Edit Text, verify original ID and reload. Multi-select two temporary Drawings and confirm explicit batch apply; verify all painted gridlines remain untouched. If a step fails, capture the first browser console error and precise v14 build.

**Status:** Automated/mock tests and packaged ZIP must pass CI before advancing permanent manifest. Live v14 behavior is not yet verified for this beta. Outstanding protected background/working grouping remains GitHub issue #1. Before submitting to Foundry's official directory, the owner should review human-authored public UI/release text for policy compliance.

## 16.1 update — v0.1.6: All Drawings collapsed inventory (2026-10-16)

**Request:** Keep established design-software term *style*. GM wants an easily discoverable collapsed **All Drawings** list next to **Locked Drawings**, with a complete inventory of items on the current Scene.

**Current source baseline verified:** v0.1.5 already had a collapsed Find Drawing view which searched all Scene Drawings, but the heading suggested a search-only utility, was separated from Locked Drawings, and capped visible results at 60 of at most 250.

**v0.1.6 changes (automated/mock tests only until live verification):**
- Reuse the existing Finder (no parallel list), place directly after Locked Drawings, rename to **All Drawings (N)**. Closed by default, count updates dynamically. Render rows only while expanded.
- Keep text/name/type/ID search and per-object Locate, Select or Unlock, plus Text (add/edit label on any unlocked native Drawing). Show shape type, short ID for generic names, and native map coordinates.
- Show the first 60 results with **Show More** batches of 60 for arbitrarily large Scenes; reset pagination when search changes.
- Preserve all native Drawing IDs, geometry, locking and Scene Documents; no migration, auto-lock, deletion, or additional layer.
- Keep `foundry-drawing-quickbar` module ID, v14 target, stable manifest, Personal Use Only license, and independent versioned ZIP.
- Next test: on a backed-up test Scene, expand All Drawings, verify count and search, locate a stray drawing, confirm only explicit Select affects selection, unlock only an intentional locked item, and test Show More if >60 drawings. Verify painted gridlines remain untouched after refresh.

**Status:** v0.1.6 runtime and release notes are prepared; CI must pass before stable manifest advances. Live verification remains pending. Future Background/Working groups tracked in GitHub issue #1.

## 16.1 update — v0.1.7: Token Controls Quickbar launcher (2026-10-16)

**Request:** Show Drawing Tools+ from the native Token Controls menu too, so the GM can reach drawing tools without first navigating to Foundry's Drawings controls.

**Implementation from live GitHub v0.1.6 source (new beta, pending Foundry v14 client verification):**
- The Foundry v14 `getSceneControlButtons` hook adds a `drawingQuickbar` **button** under both `controls.drawings.tools` and `controls.tokens.tools`, scoped to GM users. Both point at the same `dock` instance, avoiding independent or duplicated quickbars.
- Opening from Tokens leaves the native Token layer and currently controlled tokens untouched; opening from Drawings preserves the existing activate-Drawings behavior. Tool activation (Box, Circle, Pen, Polygon, Arrow, Text) explicitly switches to the Drawings layer as required by native APIs.
- All Drawings Finder still supports local Locate without layer switch. Unlock updates only the explicitly chosen locked native Drawing while Tokens remains active. Select and Text actions from Finder switch to Drawings only when clicked.
- No changes to native Token/Scene/Drawing schema, Actor data, token documents, module flags/settings, existing drawing identities, or GM permissions. Module ID remains `foundry-drawing-quickbar` and manifest remains stable; version bump to v0.1.7 with immutable ZIP and readable release note.
- Automated/mock tests: two launch points and GM-only access; partial-controls guards, preserved Token tools, selective layer switching and ZIP/manifest metadata.
- **Live test still required:** On a disposable Scene as GM, select a token and launch Drawing Quickbar from Token controls. Ensure token selection persists until a Drawing action is explicitly chosen. Confirm Drawings launcher toggles the same palette, Finder Locate/Unlock work from Tokens, and existing native selection and drawing behavior remain functional.
- Prior version v0.1.6 remains the rollback target. Disabling/replacing module code does not reverse Saved Scene Drawing edits; back up the world before testing.

**Outstanding:** Background/Working groups and gridline protection enhancements in GitHub Issue #1 remain in the module thread.

## 16.1 update — v0.1.8: Deselect versus Delete, arrow ends and style-only undo (2026-10-16)

**User report:** Remove did not delete a Drawing, and a line appeared very thin/nearly invisible after using it. Wants choice of arrowheads and asks whether Revert Style means Undo.

**Source finding:** In v0.1.7, Selected Drawings "Remove" was wired to `placeable.release()` (Deselect only), and never modified Scene Documents. Separately, saved Quickbar arrows are filled polygons with `strokeWidth: 0`; general Outline styling can remove fill and make them nearly invisible. Revert Style implements an independent, one-step restore of appearance fields only, not Foundry's general Undo.

**v0.1.8 implementation (new beta; live Foundry v14 tests pending):**
- Relabel selected-list **Remove** as **Deselect**. Add a clearly distinguished **Delete** action in Selected and All Drawings, only for unlocked native Drawing documents. Invoke v14 `DialogV2.confirm` with escaped name/kind and exact ID; cancel/default close does not delete. Re-check GM, Scene, ID and lock state before deleting exactly one ID through `Scene.deleteEmbeddedDocuments("Drawing", [id])`. No bulk delete, migration or auto-unlock. Undo Style Change never claims to restore deletion; back up the world before tests.
- **Arrow ends:** `arrowEnds` in client preferences (default `end`), choices `start/end/both/none`, used in both preview and persisted native polygon. Version-2 namespaced `kind:arrow` flag records end choice; old flags still work. No custom drawing engine or asset changes.
- **Arrow visibility:** v14 Quickbar arrow polygon relies on solid fill, so `visibleArrowStylePatch` preserves fill and visibility when Quickbar appearance presets/controls apply. Existing geometry is left untouched. Thickness controls are disabled on selected arrows (set width *before* creation or resize natively).
- **Undo Style Change:** Rename prior Revert Style without changing single-step appearance snapshot logic. Not geometry, text or deletion Undo.
- Preserve `foundry-drawing-quickbar` identity, native Drawing documents and protected painted gridlines. No changes to adjacent modules.

**Test after installation:** On a disposable Scene, Deselect a Drawing and verify geometry and visual appearance persist; try Delete → Cancel (no change), Delete → Confirm (exact one removed); locked Drawing has no Delete action. Draw one arrow for each end configuration; test preview/persistence, style it with Outline and verify still visible after deselection. Run Undo Style Change only on appearance edits. Check console and unchanged gridlines after reload.

**Release:** v0.1.8 must pass CI before manifest moves; v0.1.7 is rollback. CI does not equal live Foundry verification.

## 16.1 update — v0.1.9: delete confirmation class binding and contextual arrow options (2026-10-16)

**Live Foundry screenshot:** Clicking **Delete** in v0.1.8 emits `TypeError: Cannot read properties of undefined (reading 'wait')` from `confirm`, then Quickbar reports `Delete confirmation failed. Nothing was deleted.` The failing source extracts `DialogV2.confirm` into a detached variable and calls it as `confirm(config)`; Foundry v14's static method uses `this.wait()`.

**Fix in v0.1.9:** Keep the class reference `DialogV2 = foundry.applications.api.DialogV2` and call `await DialogV2.confirm(config)`. Retain existing explicit confirmation text, cancel/no-delete default, GM-only, lock, scene/ID rechecks, and native single-ID deletion. No data migration or permissive fallback.

**Arrow changes:** `Arrow ends` (Start, End, Both, None) is now in a contextual panel hidden until the Arrow creation overlay is active. A new `Arrowhead shape` choice offers Triangle (existing default), Diamond and Chevron—all filled silhouettes rendered in the same single native polygon Drawing. `arrowPoints` accepts the head shape; both screen preview and saved native geometry use it, and creation flags store `headShape` alongside `ends`. New client preference defaults to Triangle; older Arrow Drawing flags/geometry remain intact.

**Test:** In a backed-up disposable Scene, click Delete → Cancel, confirm object survives; Delete → Confirm, verify exactly one intended unlocked Drawing removed; try a locked Drawing and verify no deletion. Check Arrow panel stays closed with Select, Box, Circle and Text; choose Arrow and try each head shape with ends Start/End/Both. Confirm preview, create, reload and map visuals, with no painted-gridline changes. Static/mock tests are not live runtime proof.

**Stable ID/contract:** `foundry-drawing-quickbar`, Foundry v14 target, same live manifest, restrictive license, prior v0.1.8 ZIP as rollback. No cross-module changes. Owning handoff: `docs/16-DRAWING-TOOLS-PLUS-HANDOFF.md`, global release/testing documents unchanged.

## 16.1 update — v0.1.10: first-use GM tutorial and per-account opt-out (2026-10-16)

**Request:** A quick tutorial when someone first encounters the Drawing Quickbar, with **Don't Show Again** at the end.

**Implementation grounded in current v0.1.9 source:**
- Four short steps cover tools and Token launch, selected-Drawing appearance, All Drawings/Locate/locking/confirmation, Arrow options and appearance-only Undo.
- On the **first successful Quickbar opening** as GM, show a native HTML dialog. Do not interrupt the Foundry login or display a guide to player accounts. Both Tokens and Drawings launchers share the flow.
- Back/Next/Not now, browser Escape/close, and **Don't Show Again** on the final step. Not now avoids repeated popups in the same login without saving an opt-out.
- Final opt-out writes only `game.user.setFlag("foundry-drawing-quickbar", "tutorialDismissed", true)`; next login calls `getFlag` on the GM account. This flag is per User document within the Foundry world and follows that GM across browsers. Errors in saving are explicitly reported and do not pretend success.
- Small secondary footer **Tutorial** link reopens the guide on demand, even after permanent opt-out.
- Native dialog handles focus and Escape; drawing hotkeys are suppressed during the tutorial. Closing Quickbar disposes the modal.
- No Scene/Actor/Token/Drawing data updates, module renaming, data migrations, or changes to player access. Added `scripts/tutorial.js`, matching CSS, Node regression coverage, versioned ZIP and readable release notes.
- **First live check:** Open Quickbar as a GM on a disposable Scene, verify steps and Not now; reopen this login without a popup; refresh/relogin, choose Don't Show Again on last step; refresh and reopen and confirm hidden. Reopen via Tutorial, verify a second GM has independent state, and confirm browser console and world data are unchanged.

**Status:** v0.1.10 beta is subject to automated/mock CI and real v14 verification. Owning handoff remains `docs/16-DRAWING-TOOLS-PLUS-HANDOFF.md`; no shared data contract changes.

## 16.1 update — v0.1.11: player ownership, freehand Pen and compact UI (2026-10-16)

**User requests:** Allow players to draw/edit/delete their own Shapes/Pen/Arrows/Text; protect GM/other-player/locked Drawings; preserve GM access and tutorial. Live UI feedback: Pen creates a closed filled shape instead of a freeform open line; native selection is hard to clear; locked Drawings cannot be selected; the Quickbar is too tall and selected-object details get separated from action buttons. Specifically put the six primary tool buttons in one row and remove whitespace between Line width, Fill opacity and Text size.

**Source baseline:** v0.1.10 published main SHA `f037c4b0ba9897e16e6e66caf3c94db673b19e82`, with later CI upgrade; v0.1.11 work is in a separate commit chain and must pass CI before the manifest advances.

**Implementation:**
- New `scripts/access.js` uses native v14 `game.user.can("DRAWING_CREATE")`, immutable Drawing `author` IDs, `DrawingDocument.canUserModify(user, "update"/"delete")`, and locked/hidden guards. GM retains authority to edit all **unlocked** Drawings, explicitly unlocking protected artwork first. Players can edit/delete only native-author-owned unlocked Drawings. Read-only/hidden list states are filtered; GM-only Lock/Unlock remain restricted. Checks occur at input, immediately before native update/create, and after the single-ID Delete confirmation. No custom permission flag or world-role mutation.
- Player launchers appear in Tokens and Drawings when Use Drawing Tools is enabled. Both GM and player get the same opt-out tutorial per Foundry User document.
- Native freehand Pen is always patched to `fillType:0, fillAlpha:0` during local preCreate, even when Apply Default Style is disabled. Generic style presets on native `shape.type:"f"` retain stroke but not fill; Pen fill controls disabled. Saved pen IDs, points and geometry are unchanged.
- The first six tools (Select/Pen/Box/Circle/Polygon/Text) form one grid row, Arrow directly below. Select toggles visual `Unselect` while native selection exists; mouse click releases all locally controlled Drawings, without document updates. Keyboard `V` activates native Select but does not toggle deselection. Selection hooks refresh state.
- Selected Drawing list moves below Lock/Properties/Duplicate/Edit Text/Apply/Undo controls. CSS lowers section spacing and the row gaps for Line width, Fill opacity and Text size.
- Native locked Drawings are intentionally not selectable/editable while locked. The GM can locate and use a small read-only Info dialog (type, ID, position, dimensions, author, text), or explicitly Unlock first. No migration or layers duplicated.

**Verification needed:** CI unit/static/mock tests and release ZIP integrity. Live v14 GM/Player roles: enable Use Drawing Tools; Player creates freehand open path with Filled preset, verifies no fill and persistence, edits/deletes only authored Drawing; cannot touch GM/other-player/locked grid art. Select/Unselect toggle, compact UI, locked Info, native token/drawing controls and arrow/Text regression. Back up world before testing. Do not call static checks live validation.

**Owned handoff:** `docs/16-DRAWING-TOOLS-PLUS-HANDOFF.md`. Foundry v14, independent `foundry-drawing-quickbar` v0.1.11, same manifest and restrictive license. No adjacent module changes. Outstanding Background/Working layer-grouping design remains Issue #1.

## 16.1 update — v0.1.12: additive native multi-selection (2026-10-16)

**User intent:** Do not add a second selection mode or more selection controls. Simply allow clicking **Select** on more than one Drawing in **All Drawings**, keeping earlier selected Drawings controlled. A selected item's button should become **Deselect**, removing only that one; existing main **Unselect** clears everything.

**Source-verified root cause:** v0.1.11 Finder's `selectOnlyDrawing(id)` unconditionally called `canvas.drawings.releaseAll()` and `placeable.control({releaseOthers:true})`. That implementation could never retain multiple controlled Drawings. Foundry v14's native `PlaceableObject.control({releaseOthers:false})` adds to the controlled set, and `release()` removes just the target.

**Implementation (v0.1.12 beta; pending live v14 test):**
- Replace Finder action `select-only` with `toggle-one`, reusing existing row buttons; no additional toolbar buttons or separate selection state.
- New small pure/native helper `scripts/selection.js` invokes `control({releaseOthers:false})` to add and `release()` to remove. `toggleDrawingSelection` transitions from Tokens or another tool to native Drawings Select if needed, and rechecks Scene, exact Drawing identity, and `canEdit(doc)` after that transition.
- All Drawings rows reflect native `placeable.controlled` state with a Select/Deselect label, `aria-pressed`, and subtle selected indication. Existing selected count/list and **Apply to N Selected** flow already handle multiple controlled Drawings; main Unselect still calls native `releaseAll()` explicitly.
- Neither the helper nor Finder selection creates/updates/deletes native Scene Documents. Locked, GM-hidden, and player-unowned Drawings remain protected by existing author/permission and visibility checks. GM Locked Drawings remains separate Info/Unlock.
- Update the four-step opt-in tutorial and README, add actual mock native additive/release tests plus source wiring tests, run the existing release/manifest tests and syntax-check selection.js in both CI workflows.

**Live smoke test:** Back up the world, on a disposable Scene expand All Drawings and select A then B then C; verify count 3 and all three native control outlines, and each row says Deselect. Deselect B; verify A/C remain. Apply Highlight to remaining two; verify B and locked gridlines unchanged. Press main Unselect; count must be 0. For player, try GM and another player's Drawings, which must remain view-only. From Tokens, select first row to switch to Drawings, then add the second without switching away.

**Ownership and continuity:** `foundry-drawing-quickbar` v0.1.12; stable Foundry manifest, no migration/format/API change; source still on GitHub. Previous v0.1.11 ZIP stays the rollback target. Live Foundry verification must not be asserted from Node/mock tests.

## 16.1 update — v0.1.13: consolidated Drawing inventory with Locked only filter (2026-10-16)

**User request:** The separate collapsed **Locked Drawings** section duplicates the **All Drawings** inventory. Replace duplicate locked status text with a small red lock icon beside a Drawing's name. Add an easy **Locked only** filter at the top right of the search area; preserve per-row GM Unlock/Info controls and the existing text search.

**Source baseline:** Published v0.1.12 main commit `a18fd196df8b28c302c820ef25eb7607f8b32d4c`, module ID `foundry-drawing-quickbar`. Existing All Drawings list already includes native locked Drawings and their Locate/Unlock/Info actions; the separate locked list was redundant rendering.

**Implementation:**
- Delete the extra `<details class="dqb-locked">` from Quickbar markup and corresponding locked-list DOM references/count/render loop. **All Drawings** remains the single collapsed inventory and counts all visible-to-current-user native Scene Drawings regardless of filter.
- Every locked Drawing gains a small red inline Font Awesome lock beside its label, with an accessible `aria-label="Locked Drawing"` and tooltip. Remove duplicate subtitle “Locked” word. Native flag `locked` is read only; never altered by rendering or filtering.
- Compact **Locked only** button beside search label, `aria-pressed` reflects active state. Search and Show More pagination operate on the filtered subset via pure `filterLockedDrawings`. Filter is local UI state (reset on Quickbar close), not a Foundry setting or document flag. Unlocking an item drops it from locked-only results automatically.
- GM **Locate**, **Info**, and **Unlock** actions still appear directly on the locked row; player-owned/hidden and native permission guards stay unchanged, including GM-locked gridline protection. Existing per-row Select/Deselect and batch styling are untouched.
- CSS scopes lock icon/status and compact filter to the module; no changes to Foundry Scenes, Tokens, Actors, Drawing geometry, IDs, roles, or imported records.

**Tests:** Static/mock Node coverage for combined lock+text+pagination filters, total count versus matches, toggle off/on and reset behavior, inline lock marker, no duplicate panel, retained authorized per-row Unlock/Info, no Scene writes from filtering. **Pending live v14 test:** With four test Drawings (3 locked), All Drawings shows four, Locked only shows three; red locks beside names; search finds a locked object; Locate/Info work; unlocking reduces locked matches to two while the world Drawing count stays four. Player should not gain Unlock/Info access. Back up the world and test on expendable art. No live validation claimed.

**Release boundary:** Versioned v0.1.13 ZIP, same stable GitHub manifest URL and Personal Use Only license. v0.1.12 retained as rollback. Owning handoff remains this file; no shared contract or adjacent module changes.

## 16.1 update — v0.1.14: remove selection-induced inventory jumps (2026-10-16)

**Live user feedback:** In published v0.1.13, All Drawings is nested *below* the expanding Selected Drawings heading/actions/list. Each selected item increases that upper section's height and pushes all inventory rows downward, making consecutive clicking frustrating. Selection also invoked `refreshFinder()` via `refreshSelectedPanel()`, replacing the DOM buttons on every click and losing focus. User explicitly approved moving the **entire Selected Drawings box** below All Drawings, including all actions and selected-item list.

**Implementation:**
- Move one unchanged native All Drawings `<details class="dqb-finder">` directly below creation tools/conditional Arrow options, above the whole `<section class="dqb-selection">`. Selected box retains count, GM/player-safe actions, and all selected rows. Style presets remain below.
- `refreshSelectedPanel` updates only selected box plus `refreshFinderSelectionState()`, which changes existing All Drawings rows' `dqb-is-selected` class and Select/Deselect button label, `aria-pressed`, tooltip/accessible label. It does **not** call `refreshFinder()` during native control/release, preserving DOM row identity, focus and scroll.
- Actual Drawing create/update/delete hooks explicitly call `refreshFinder()` again; text search/filter/pagination and panel toggle already call it. Real list redraw restores outer Quickbar and list scroll positions. Selection marker becomes inset box-shadow, not width-changing border/padding, and toggle buttons gain stable 59px minimum width.
- No changes to Drawing native APIs, ownership, locked gridlines, IDs, Scene documents, tutorial settings, module ID, license, player permissions or style data.
- **Unresolved UI question:** User also requested a “different symbol” alongside an unmarked screenshot. The exact target icon is ambiguous (launcher logo vs Select vs another tool); ask which before silently changing icons.

**Required test:** On a disposable Scene with 5+ Drawings, expand All Drawings and click Select repeatedly from top to bottom. The entire inventory must remain visually fixed, each clicked button become Deselect without losing focus, and Selected Drawings beneath it must grow. Deselect a middle row while all others stay controlled; use main Unselect. Verify real updates/search still refresh correct rows and preserve scroll, no change to artwork or protections. Static/Node tests and GitHub packaging are not live Foundry verification.

**Owning handoff:** `docs/16-DRAWING-TOOLS-PLUS-HANDOFF.md`, v0.1.14 beta, source from verified v0.1.13 main SHA `921a3e3efe3ffffe0c99ef52c558317c7a1a5560`. Roll back module to v0.1.13 if needed; backups protect world data. No shared contract changes.

## Source of truth and GitHub release boundaries

- Use the actual GitHub source at `rebsiot/drawing-tools-plus` (default branch `main`) and/or the newest verified working ZIP. Handoff notes describe intent but are not code.
- The GitHub repository name is Drawing Tools+, while the existing Foundry module ID is `foundry-drawing-quickbar`. Preserve module identity and its flags and settings.
- `module.json` includes stable manifest `https://raw.githubusercontent.com/rebsiot/drawing-tools-plus/main/module.json` and version-pinned GitHub release `download`. Each subsequent release must bump `version` and change the pinned download URL; preserve the stable manifest URL.
- `.github/workflows/validate.yml` tests source on changes and builds a ZIP artifact. The prerelease workflow can be triggered by matching `vX.Y.Z` tag or `beta/vX.Y.Z` branch; it publishes an immutable versioned release ZIP and manifest asset. Verify actual run results and URLs after triggering.
- License: `LICENSE.md`, **Personal Use Only (No Redistribution)**, source-available proprietary software matching the restrictive rebsiot module licenses. GitHub beta publication is not Foundry's official directory approval; review AI policy and human-authored prepared-content requirements before official submission.
- Source contains no TC Modern licensed artwork, characters, campaign information, Patreon credentials, or server configuration.

## First live Foundry v14 smoke test (stop at first failure)

1. On an expendable Scene as GM, enable the module and open the native Drawings controls. Confirm its palette launch button appears and opens Quickbar.
2. Select `Danger` and `Box`; create a rectangle. Confirm red appearance after save and that Foundry native selection, move, resize and reload work.
3. Select it, choose `Highlight`, apply `Style Selected`, then `Revert Style`; ensure geometry and document ID remain unchanged.
4. Use Arrow on both a panned and zoomed map. Confirm arrow geometry, selection, persistence and no unexpected writes to Walls, Tokens or Tiles.
5. Check console errors, client settings across reload, scene switch cleanup and interaction with ordinary native tools. If the first rectangle fails, capture exact v14 build and first console error before any wider testing.

## Development sequence

- **0.1.0 baseline:** Quickbar/style presets/experimental arrows. Not live confirmed.
- **Next priority:** Resolve live v14 failures before adding scope. Then native Drawing direct manipulation: intuitive selection handles, move/resize/rotate, duplicate and text editing in place.
- **Later:** Grouping, alignment, comprehensive drawing undo/redo; then connected arrows and snapping.
- **Eventually:** Release-quality UI, accessibility, docs, compatibility checks and optional public listing. Keep premium/Patreon planning separate from stability work.

## Install/rollback and safety

- Back up the world. Prefer Foundry Setup's Install Module via the stable manifest URL. For manual ZIP installation, stop Foundry and extract the ZIP contents directly into `Z:\Data\modules\foundry-drawing-quickbar\` so `module.json` is immediately inside the folder; restart, enable in a test world and hard refresh.
- Disable the module to stop its UI; native Drawings created in a scene persist. A module rollback cannot undo edits made to Scene Drawing documents; use the matching world snapshot if needed.
- Do not modify Foundry core, WoD20, other modules, or import/update Scenes/Actors automatically.

## Handoff coordination

- New project/thread `16` owns these changes. Keep `00-START-HERE.md`, `GLOBAL-04-DECISIONS-ROADMAP-RISKS.md` and `GLOBAL-03-RELEASE-DEPLOYMENT-TESTING.md` in sync when the new module is accepted into the project index and live-test results exist; these global files have not been modified by this source import.
- Read `docs/TEST-REPORT.md`, `README.md` and the current source before editing. New chat should record the verified GitHub commit/tag and the real install/test results.
- Suggested next-chat opening: `Continue 16.1 Drawing Tools+ from the attached handoff and GitHub repository. Preserve module ID foundry-drawing-quickbar. First inspect current main source and test v0.1.0 on Foundry v14; do not claim the mockup features already exist. Fix the first live issue and deliver a complete, independently versioned installable ZIP with release notes and tests.`
