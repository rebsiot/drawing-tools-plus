# Test Report — Drawing Quickbar v0.1.1

**Date:** 2026-10-16

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
