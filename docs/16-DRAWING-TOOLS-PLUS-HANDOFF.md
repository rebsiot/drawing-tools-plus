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
