# Test Report — Drawing Quickbar v0.1.19

**Date:** 2026-10-16

## v0.1.19 - Full Drawing Locate (2026-10-17)

**Baseline:** Verified v0.1.18 GitHub main commit `1b3a825ec96977530b741b82ce3518779eed9d4b`, complete module extracted from the GitHub Actions validation artifact. No live source access. Root cause: fixed-size frame caps at 360x260 CSS pixels and missing fit-to-viewport camera zoom for large Drawing documents.

**Implementation:** Pure geometry for Drawing location including negative dimensions and rotation; native Foundry v14 viewport zoom fit, clamped by native scale min/max; local temporary outline exactly follows Drawing dimensions (with small shape minimum) and rotates with it. Huge Drawings that cannot fit native zoom keep a centered caption. Pan/zoom/resize/delete refresh/clear the marker. No Scene data writes or remote pings.

**Automated:** `npm test`, `node --check`, and full standalone versioned ZIP build/extraction verification. See output for exact counts. Source tests cover multiple shape sizes and no hard-coded clipping. Source-level mock tests cannot validate actual Foundry canvas camera or CSS rendering.

**Live Foundry v14:** **Not yet run on v0.1.19.** GM's v0.1.18 report establishes the bug, not the fix. Next: Locate giant locked rectangle, confirm entire visible border/zoom, test small and rotated shapes, pan/resize; check no document flags/locks/IDs changed. Native minimum zoom may still clip exceptionally large Drawings, but central label remains visible.

**Install/rollback:** Back up world and module folder; install the complete v0.1.19 ZIP once released. Revert to v0.1.18 if necessary. No data migration; actual user-created Drawing edits or deletes require a world snapshot for recovery.

## v0.1.18 — Multi-Delete (2026-10-16)

**Baseline:** Complete versioned v0.1.17 module ZIP recovered from the successful GitHub Actions validation artifact; no speculative recreation of prior source. Existing module ID and native permissions retained.

**New behavior:** Separate Delete N Selected action beside existing selection tools; native DialogV2 confirmation enumerates each intended Drawing by name/type/ID, displays skipped locked/no-permission selections, then atomically requests exactly the approved eligible IDs through native Scene.deleteEmbeddedDocuments. The pending dialog cannot repeat batch deletion. Recheck entire selection, scene reference, each Drawing identity, lock, author and server delete permission immediately before sending the request. Partial responses are reported rather than claiming complete deletion. No automatic unlock or delete-all.

**Automated:** Local Node.js 22 test run: **90 passed, 0 failed** (previous 80 baseline tests plus updated metadata and new coverage). Tests exercise batch planning, runtime guards, native deletion request IDs, HTML escaping (including hidden GM data), player author/deletion permission and GM locked-gridline safeguards; existing model/selection/UI tests also passed. Syntax checks passed for every JavaScript module. Complete ZIP and clean extracted-ZIP tests verified after building. Live Foundry v14 is **not yet verified** for Multi-Delete.

**Distribution:** Public v0.1.18 beta as a version-pinned ZIP through GitHub Actions. The stable Foundry update manifest points to the matching ZIP after successful release publication and main merge. v0.1.17 remains rollback; a world snapshot is required to reverse actual Drawing deletions.

## v0.1.17 — Return to Tokens (2026-10-16)
- User-reported issue: native Drawings layer stays active when leaving Drawing Quickbar, preventing token manipulation.
- Implementation: Tokens header button and close restoration; cancellation of unfinished annotation/new text also returns to Tokens. Canvas-ready teardown opts out of layer restoration.
- Safety: existing Drawing auto-selection preserved for styling; no data migration.
- Automated: new source regression plus existing test suite, syntax check and ZIP build required before release.
- Live Foundry v14: **Not verified**. Test Box→style→Tokens→move token, close while drawing, Esc/right-click cancel, and protected gridlines.
- Rollback: v0.1.16 with matching world backup if drawings were changed.

## v0.1.16 — Second row, Chevron geometry and first-open count (2026-10-16)

**Source baseline:** Published v0.1.15. Current work is a v0.1.16 beta source change for Foundry v14.
**Unit/mock test plan:** Geometry: ribbons from straight and multi-point paths; native type p, bounded coordinates, style preservation, no mutation of old art, invalid geometry fails closed, native Callout pair with distinct editable text rectangle. Chevron triangle versus deeply notched V at equivalent sizes, all start/end/both/none cases, native polygon type instead of invalid freehand shape. UI source: two rows, four tool modes, waypoint/finish/cancel/Enter paths, native creation, scene identity checks, All Drawings count refreshed when collapsed before list rendering. All prior ownership and selection tests retained.
**Packaging/verification:** Node syntax checks for main/model/tutorial/annotations/selection and complete release ZIP builder. Live Foundry v14 canvas preview, clicking, route completion, callout text persistence and player permissions remain unverified until user tests them.
**Safety:** No forced Scene writes on install, data model migration, changing native Drawing IDs/locks or custom permission bypass. Callout is two ordinary independent Drawing documents.

## v0.1.15 — Token/Drawing launcher icon (2026-10-16)

**Source:** `scripts/main.js` shared Foundry v14 `getSceneControlButtons` control declaration. The previous `fa-solid fa-palette` launcher is replaced by `fa-solid fa-pen-ruler`, matching the existing Quickbar header. Both launch points share this declaration, one dock instance, and their existing native layer behavior.

**Automated regression:** Shared icon/header match, prohibition of old launcher icon, continued two-launcher and permission-control checks, release manifest and versioned ZIP packaging. **Live verification remains pending:** render the icon in Token and Drawing controls, confirm it differs from the native Palette button and still opens the correct toolbar. No Drawing, Token, Actor, Scene or settings migration.

## v0.1.14 — Stable All Drawings list during multi-selection (2026-10-16)

**Reported live bug:** v0.1.13's Selected Drawings section sits above the All Drawings inventory, so each new selection expands the upper UI and shifts remaining row buttons down. `refreshSelectedPanel` also calls `refreshFinder()`, replacing every DOM row and losing focus on each click.

**Source changes:** Move entire Selected Drawings section beneath the All Drawings panel. Selection-only changes use a DOM in-place selected-state refresh (button text/aria/highlight); actual data, search/filter and pagination rebuild the inventory while retaining scroll positions. Inset highlight and minimum toggle width prevent lateral shifts.

**Automated checks:** Static assertions for All-before-Selected markup order, all existing selected actions retained, selection refresh not invoking inventory replacement, in-place toggling without add/remove DOM methods, scroll restoration, true Drawing update/delete hooks, stable-width CSS; release manifest and ZIP metadata. Native Drawing state and authorization tests remain unchanged.

**Pending real Foundry v14 verification:** Click five or more Select controls successively, confirm row positions and active button focus remain stable, native controlled list reflects selection count, middle-row deselection and batch style work, filter/search/locked gridlines and player access unchanged.

## v0.1.13 — Unified All Drawings locked-only filter (2026-10-16)

**Baseline:** Published v0.1.12 GitHub main source at commit `a18fd196df8b28c302c820ef25eb7607f8b32d4c`.
**What changed:** Remove duplicate Locked Drawings markup and rendering. Keep one All Drawings list with red accessible lock glyphs by protected names; a small togglable Locked only button next to search label; combined locked/text search before pagination; preserve GM Unlock/Info/Locate and per-item Select/Deselect actions.
**Automated/static tests added:** Pure filter returns only `locked === true` and does not mutate native documents; combined search/locked filter/pagination 135-object case; initial and pressed aria states; removal of duplicate locked section and count; GM-only per-row Unlock/Info retained; no Scene document changes by filter renderer; release metadata and installable ZIP.
**Pending live Foundry v14 check:** Four-object Scene with three locked; red glyphs, 4 total, filter 3, search and Info, Unlock drops to 2 matches without altering any other Drawing, filter off restores four. Player cannot unlock/see hidden GM objects. Confirm compact layout at smaller widths.

## v0.1.12 — Additive multi-selection via All Drawings (2026-10-16)

**Cause identified in working source:** `selectOnlyDrawing` always cleared native controlled Drawings via `releaseAll()` before controlling the next one with `releaseOthers:true`. Native Foundry v14 provides `PlaceableObject.control({releaseOthers:false})` for non-destructive additive selection and `release()` for individual deselection.

**New automated tests:** Native mock Placeables A/B/C: Select each, confirm all remain controlled, Deselect B, confirm A/C remain, then reselect B. Failure/no-placeable cases fail closed. Source tests assert native additive API, authorization before and after async layer change, one button per list row with Select/Deselect+aria-pressed, existing main Unselect remains, no Scene data mutation in Finder helper. Existing cross-version release metadata and ZIP tests remain active.

**Live Foundry verification pending:** Actual v14 Drawing layer/DOM, All Drawings row state and count, batch style targeting and locked-gridline protection. No observed live test result from this release yet.

## v0.1.11 — Player permissions, compact controls and Pen fixes (2026-10-16)

**Source:** Native v14 Drawing and User APIs. Existing published v0.1.10 source; changes in isolated v0.1.11 commit chain.
**Automated checks:** Native user.can(DRAWING_CREATE) launcher access; author equality, separate canUserModify update/delete and locked/hidden/unauthorized exclusions; repeated write/delete permission checks; styling pen never fills a native freehand path; Fill controls disabled on selected Pen; source-level UI assertions of six-button row, Arrow below, selected list after actions, tight slider gaps, Select/Unselect toggle without edits, locked Drawing read-only Info.
**Non-destructive:** No world permission changes, document conversions, mass actions, auto unlock, importing existing records or Scene/Actor/Token migrations.
**Pending live:** v14 Pen renderer preview and persistence, real author permission changes/roles, styled and protected GM artwork, button visual state, locked Info modal behavior and responsive CSS. Report exact Foundry build and first error.

## v0.1.10 — First-Use GM Tutorial (2026-10-16)

**Baseline:** Actual main-branch v0.1.9 source at commit `7b013457b54877cb201c1c60c6f29ea3ea00540d`, with CI Node 24 action upgrades applied. No live Foundry browser is accessible from development tools.

**Automated checks added:** Four concise tutorial steps; pure Back/Next step logic; GM-only first-open/one-session suppression predicate; per-account Foundry User `getFlag/setFlag` wiring; final-step opt-out only; manual footer reopening; native dialog show/close and keyboard shortcut guard; static evidence that guide functions never create/update/delete Scene documents. Manifest, license and ZIP metadata remain covered.

**Data safety:** The tutorial does not edit Scenes, Tokens, Actors, or Drawings. Only accepting the final opt-out writes a boolean to the current GM User document's namespaced flag.

**Live Foundry verification still required:** Native dialog visual/focus behavior in Foundry v14, Back/Next/Not now/Esc, first-open across both Token/Drawings controls, opting out across logins and browser sessions, and independent preferences for separate GM accounts.

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
