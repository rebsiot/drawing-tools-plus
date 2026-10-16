# Drawing Tools+ / Drawing Quickbar - v0.1.0 (2026-10-16)

Project repository: https://github.com/rebsiot/drawing-tools-plus

A **system-independent Foundry VTT v14 beta** for making the existing **Drawings** layer less cumbersome. This is not a wall-building tool, nor does it replace Foundry's Drawing documents, native drawing editor, scene persistence, selection, or normal deletion.

**Status: automated/mock-tested only. Not yet tested in a live Foundry client.** This is a test-world beta, not a confirmed public release.

## What it adds

- A new **Drawing Quickbar** button in Foundry's native **Drawings** tools palette (GM only in v0.1.0).
- One-click access to native **Select, Freehand, Rectangle, Ellipse, Polygon, Text** tools.
- **Arrow**: drag from tail to tip; saves one ordinary native freehand Drawing document. The arrow's coordinates/shape require live testing in v14.
- **Four style presets** (Outline, Danger, Highlight, Filled), plus stroke/fill/text colors, stroke width, fill opacity, and text size.
- Client-only remembered style choices and movable panel position.
- Optional **Use this style for new drawings** while the Quickbar remains open. Styles are applied via the documented `preCreateDrawing` hook, without altering existing drawings.
- **Style Selected** applies the chosen style to selected, unlocked native Drawing documents; **Revert Style** reverses the last such batch made by this module during the current scene session.
- Shortcuts while the Quickbar is open and the Drawings layer is active (but not while typing): `V` Select, `F` Freehand, `R` Rectangle, `E` Ellipse, `P` Polygon, `T` Text, `A` Arrow. `Esc` exits Arrow mode.

Selection, moving, resizing, native Drawing configuration, Ctrl+Z, and shape creation outside Arrow mode remain owned by Foundry. `Revert Style` is a separate one-step safeguard for this module's batch restyling; it does not replace Foundry's undo history.

## Prerequisites

- Foundry VTT **v14** running a Scene as GM. Tested against v14 *documentation*, not an actual server.
- No game system dependency; WoD20 is not required.
- No third-party drawing editor, CDN, images, accounts, or credentials.

## Install (test world first)

1. Make a **world snapshot** or back up the relevant world data. The beta can create/modify Scene Drawing documents when you choose its controls.
2. Stop the Foundry application on Ubuntu before copying through Samba.
3. Extract the ZIP into your Foundry modules folder so this exact file exists:
   `Z:\Data\modules\foundry-drawing-quickbar\module.json`
   (The mapped `Z:` is the user-data root; `Z:\Data` is the real Foundry Data folder.)
4. Restart Foundry, open a **test world**, and enable **Drawing Quickbar** under Manage Modules.
5. Hard-refresh the browser (`Ctrl+Shift+R`). On a Scene, select the pencil **Drawings** controls; click the palette icon labeled **Drawing Quickbar**.
6. Test creation on an expendable Scene before using production content.

## First smoke test (send this result back)

1. On a **test Scene**, open the Quickbar and click **Box**. Choose **Danger**; draw a rectangle. Verify that it saves as an ordinary, red native Drawing and can be selected, moved, and resized.
2. Select that box and choose **Highlight > Style Selected > Revert Style**. Verify the original appearance returns. (If the box is the first new drawing in the chosen Danger style, the rollback should restore Danger.)
3. Click **Arrow**, drag a line on the map and release. Verify it appears, can be selected/moved as **one** Drawing, and remains after refreshing the browser. Test Ctrl+Z once when the Arrow is the most recently created drawing.
4. Make sure existing Drawings, Walls, Tiles and tokens still behave normally. Check the browser console for errors.

If step 1 fails, **stop testing and report the Foundry v14 build number and first console error**. Do not test on important world Scenes until a basic creation check passes.

## Usage notes

- **New-drawing styles:** The native shape preview may temporarily use Foundry's existing drawing defaults until the new Drawing is committed. This beta applies Quickbar styles on creation, not by replacing the internal preview renderer.
- **Existing drawings:** Select them with Foundry's native Select tool, then click **Style Selected**. It changes only style fields; geometry, ownership, IDs, positions, existing flags, and attached data are untouched.
- **Revert Style:** One batch, current scene, current browser session. It cannot restore deleted drawings or undo unrelated changes.
- **Arrow:** The custom pointer overlay is active only while Arrow is chosen; right-click or press Esc to exit. It writes a normal native Drawing with a small namespaced `kind: arrow` flag. Arrows do not modify Foundry Walls or Regions.
- **Preferences:** Per-browser Foundry client setting (`foundry-drawing-quickbar.preferences`); no world-level configuration or migrations.

## Rollback

1. Disable **Drawing Quickbar** in Manage Modules. Existing Scene Drawings remain normal Foundry documents; disabling the module does not remove any created artwork.
2. To remove the module's files, stop Foundry and delete only `Z:\Data\modules\foundry-drawing-quickbar`, then restart.
3. If a test modified important world data unexpectedly, restore the **matching world snapshot**, not merely the module directory. Rollback of a module folder cannot undo world data edits.

## Known limits / non-goals in v0.1.0

- No changes to wall editing, elevation/levels, or native Foundry Drawing geometry handlers.
- GM-only Quickbar launch. Players' standard Foundry drawing permissions are not changed.
- Keyboard shortcuts are active only with the panel open and the Drawings layer selected.
- The Arrow tool is experimental pending a real v14 test: canvas-to-Scene coordinate conversion, arrowhead sizing under zoom, and Drawing geometry validity are unverified live.
- Styling of preexisting Drawings is deliberately manual. It does not bulk migrate any world or Scene data.
- Not yet a full Excalidraw-style editor: no multi-object alignment, text editing in place, snapping enhancements, or generalized history panel.
- Source is maintained at https://github.com/rebsiot/drawing-tools-plus. This beta has no published GitHub Release or working remote auto-update manifest yet. The GitHub tag workflow can package a pre-release after testing; source on GitHub does not by itself mean the module has been submitted to Foundry.
- No public license has been selected. Do not assume public source visibility grants redistribution rights.

## Development / source

- `scripts/main.js`: Foundry hooks, Quickbar UI, native tool activation, optional Arrow pointer interaction.
- `scripts/model.js`: pure validation, styles, geometry builders, rollback snapshot helpers.
- `styles/quickbar.css`: scoped UI styles.
- `tests/*.test.mjs`: Node mock/unit tests (`npm test`, Node 18+).
- `docs/TEST-REPORT.md`: automated vs. live evidence.
- `docs/16-DRAWING-TOOLS-PLUS-HANDOFF.md`: current next-chat handoff and pending integration checks.
- `tools/build_release.py` and `.github/workflows/`: versioned package generation, CI and optional GitHub prerelease from a manually pushed tag.

See `CHANGELOG.md` for version-specific notes. No files in Foundry core, game systems, other modules, Actors, Tiles, Journals or Walls are modified on install.
