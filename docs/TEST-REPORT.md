# Test Report — Drawing Quickbar v0.1.9

**Date:** 2026-10-16

## v0.1.9 — Delete confirmation fix and contextual arrow options (2026-10-16)

**Bug reproduced by user:** `DialogV2.confirm` throws an `undefined.wait` TypeError in v0.1.8 before opening the confirmation prompt. Direct class invocation restores the expected `this` receiver, per the Foundry v14 API.
**Automated regression checks:** Source assertion forbids detached `confirm` invocation, requires `DialogV2.confirm` with receiver; Arrow panel is initially hidden and controlled by Arrow overlay state; validates shape options and normalization; checks native polygon model output across shape/end modes and multiple directions; release metadata and ZIP integrity.
**Safety:** No deletion without confirmed positive response; existing GM/Scene/document/locked checks remain. Native Drawings and existing arrows are not altered on installation.
**Pending real Foundry verification:** Confirm/cancel modal UI, exact Drawing deletion and retained locked gridlines, Arrow-only options, head style preview and persistence.

## v0.1.8 — Drawing Delete and Arrow endpoints (2026-10-16)

**Reported live issue:** A row's "Remove" button did not delete a drawing and a line looked nearly invisible. Source proves Remove called local release() and did not itself update/delete the Drawing; the appearance change needs live reproduction to distinguish selected outline disappearing from actual style changes.

**Changes verified by static and Node mock tests:** Deselect label only changes selection; Delete requires v14 DialogV2 confirmation of exact native Drawing ID with lock/Scene checks, uses native embedded-document deletion, and refuses locked objects. Arrowhead modes end/start/both/none remain single polygon Drawings; preview and persistence use the same points. Quickbar style updates keep arrow fill visible; selected-arrow line-width slider is disabled (geometry remains unchanged). Undo Style Change label reflects actual appearance-only restore.

**Live verification outstanding:** Confirm/deletion behavior in current Foundry v14 build, cancel/no-destroy, line appearance after Deselect, all four arrow variants at zoom, arrow style changes and native locked gridline safety. Do not claim live success.

## v0.1.7 — Token Controls launcher (2026-10-16)

**Original baseline:** v0.1.6 GitHub module, token and drawing controls use Foundry v14 `getSceneControlButtons`.
**New automated/mock coverage:** GM-only Quickbar button in Tokens and Drawings, preservation of native Token tools, missing-control fallback, Token-launch Open without immediate Drawing activation, single dock, explicit Drawing action activation, Finder Select/Text transitions and Unlock/Locate availability.
**Live status:** **Not yet tested on the user's Foundry v14 client.** CI checks include syntax, mock unit tests, release manifest metadata and complete installable ZIP packaging.
**Safety:** Opening the palette writes no Scene or Token documents; no migrations; native Token/Drawings control layers, module ID, settings and existing Scene drawing documents preserved.
**Live test request:** Select a disposable Token, open Quickbar via Token controls, confirm no immediate layer/selection change. Then click Circle and verify native Drawing creation. From Tokens, use All Drawings Locate/Unlock and explicit Select/Text. Confirm Drawings launcher toggles the same palette.

## v0.1.6 — All Drawings inventory checks (2026-10-16)

**Baseline:** Verified current `main` v0.1.5 source and its existing Find Drawing panel.

**Automated additions:** All-Drawings search on 305 mock native Documents (locked and unlocked), pagination at 60, 120 and 305, search ranking, invariant original Scene data, and source UI checks for collapsed list inside selection, count, toggle rendering, Show More, unlock and text actions.

**Safety:** The list reads existing Drawing documents. Opening, searching, and Locate do not modify Scene data; only explicit Select/Unlock/Text controls have side effects. No migration or automatic selection.

**Still live-unverified:** Foundry v14 display/layout and performance on a large Scene, row actions, and gridline protection.

## v0.1.5 — Direct editing test coverage (2026-10-16)

**Reported live friction:** No automatic selection after drawing a circle; selected presets/fields do not affect it; Style Selected confusing; new circle label invisible.

**Automated tests added:** Style target count and lock exclusion, style draft synchronization, isolated property updates, textAlpha visibility for previously unlabeled ellipse, native createDrawing selection hook and Select mode, release-note metadata and ZIP packaging.

**Pending live checks:** Native shape creation and selection handle interaction; style updates at slider speed; single-selection undo; multi-selection confirmation; circle label after reload; painted gridline integrity. These are not proven by the mocked tests.

**Release notes:** Version-specific release descriptions replace generic v0.1.0 text. Existing release bodies can be updated without replacing ZIP artifacts.

## v0.1.4 beta — Finder and Edit Text improvements (2026-10-16)

**Source inspection:** Existing v0.1.3 source in GitHub `main` with module ID `foundry-drawing-quickbar`; uses native Drawing documents. Reported live: stray text is hard to locate, selected Edit Text feels unreliable.
**Automated coverage added:** Pure finder ordering/exact-text matching and locked document discoverability; center calculation; conservative native text-only patch; UI source-wiring checks that show local-only `canvas.animatePan` and prefilled text update, and that no network ping or substitute drawing engine is introduced.
**Live state:** **Not yet validated** in the user's Foundry client. Test Finder pane search 'a', local Locate on a tiny/locked Drawing, edit popup save preserving ID/geometry and automatic escape/shortcut behavior.
**Safety:** No data migrations, deletion, scene import, automatic locks or modification to Drawings merely from opening Finder. Locator is temporary DOM only.

## v0.1.3 beta — selected UI visibility pass (2026-10-16)

Selected Drawing panel moved ahead of the style controls, with selection-aware compactness. Automated layout source regression added. Same v0.1.2 native Drawing logic and shortcut guards; all require live Foundry tests.

## v0.1.2 beta (2026-10-16) — test evidence

**Reported live issue:** Quickbar letter shortcuts hijacked typing into Foundry's canvas text tool.
**Implementation:** Quickbar Text uses a focused popup and creates a native rectangular Drawing; native Text mode and inline editors bypass shortcut activation. Added selected-Drawing inspector and explicit native lock/unlock recovery.
**Automated tests:** New model tests cover label data, popup size bounds and shortcut gating. Integration lifecycle mock checks Foundry Drawing selection/update hooks; CI runs syntax, tests and complete ZIP packaging.
**Requires live testing:** The popup's canvas click, focus and persistence; editor shortcut behavior; selection updates; locking/unlocking existing Drawing documents and preserving painted gridlines. No live success is claimed for these changes.

## v0.1.1 beta (2026-10-16) — test evidence

**Reported live in v0.1.0:** Most controls appear functional, but creating Arrow throws `shape.type: f is not a valid choice`. This user report supersedes the previous "not tested at all" language for the v0.1.0 runtime only.

**Implemented / awaiting v14 live verification in v0.1.1:**
- Arrow uses a native polygon `p` silhouette with a closed shaft/head, avoiding invalid legacy `f`.
- Duplicate selected unlocked Drawings via native Scene creation, retaining original Drawing documents.
- Edit Text invokes the documented native Drawing `enableTextEditing()` method.
- Unit tests cover polygon arrow shape, invalid/short arrows, native copy data, locked exclusion and release manifest.
- UI integration, panned/zoomed arrow geometry, native text interaction, undo, and gridline safety **still require a real Foundry v14 smoke test**.
- Selected Objects inspector, protective groups, and Quickbar locking controls: **planned, not implemented**.

**Recommended next live test:** Use the current GitHub beta in an expendable Scene. Create an Arrow, duplicate one unlocked test Drawing, and edit text; verify persistence and check console. Do not experiment on valuable gridline Drawings until a matching world backup exists.

## Original v0.1.0 automated / mock-tested: PASS

- `node --check scripts/main.js` — syntax pass.
- `node --check scripts/model.js` — syntax pass.
- `npm test` — **11/11 passed**.
  - Default settings and unsafe-input normalization.
  - Styling field selection and filled/non-filled behavior.
  - Preset values and selected-drawing style backup.
  - Arrow point geometry and construction as one native Drawing object.
  - Prevention of editing existing/imported Drawings on preCreate.
  - Mocked Foundry v14 init/ready hooks, Drawing controls injection, no automatic scene write on startup.
- `module.json` — parse checked during packaging; module ID/version/paths match.
- ZIP structure — verified during packaging; `module.json` is directly under the module-ID folder.

## Confirmed live: NOT RUN

No live Foundry server, client, PIXI renderer, Scene, WoD20 game, or saved world documents were available in this development environment. No claim that the beta has been installed, activated, or tested in the user's world.

## Still to verify in real Foundry v14

1. Native Drawings palette button is visible only to GM and opens Quickbar.
2. Native tool switching works without conflicts and style-on-create changes actual Drawing appearance.
3. Selected Drawing batch styling and manual revert work, preserving IDs and geometry.
4. Arrow screen-to-world conversion, native Drawing geometry validation, move/edit/persistence and arrow undo.
5. Existing tokens, Tiles, Walls, journals, module interactions, browser refresh and scene switching remain unaffected.
6. Client settings survive browser reload and do not alter other users' drawing defaults.
7. Different resolutions, zoom levels and multiple levels/Scenes behave correctly.

## First recommended live test

Follow **step 1 only** in `README.md` first: create one colored rectangle on an expendable Scene and verify it remains selectable and movable. If it fails, provide the Foundry build number and first console error; investigate before attempting any additional features.

## Beta packaging and manifest verification (2026-10-16)

- The original 11 unit/mock tests remain; an additional release metadata test checks ID, stable manifest, version-pinned download, compatibility claims and restrictive license.
- GitHub Actions validates JavaScript syntax, runs Node tests, builds an installer ZIP with `module.json` at ZIP root and checks its content.
- Runtime JS unchanged from the v0.1.0 baseline. GitHub beta publication does not establish successful installation or gameplay behavior in live Foundry v14.
- See the GitHub Actions run and prerelease assets for the actual results of the new packaging workflow.

## GitHub import verification (2026-10-16)

- Baseline source ZIP inspected and extracted without missing files.
- `npm test` rerun on extracted source: 11 passed, 0 failed (Node 22).
- GitHub import adds repository metadata, documentation and release automation; no gameplay/runtime handler has been changed.
- Source push and GitHub-hosted CI require separate confirmation in GitHub.
