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
