# Drawing Tools+ / Drawing Quickbar - v0.1.4 beta (2026-10-16)

Project repository: https://github.com/rebsiot/drawing-tools-plus

**Beta release:** https://github.com/rebsiot/drawing-tools-plus/releases/tag/v0.1.4

**Permanent Foundry install/update manifest:**
`https://raw.githubusercontent.com/rebsiot/drawing-tools-plus/main/module.json`

**License:** [Personal Use Only (No Redistribution)](LICENSE.md). Free personal/non-commercial use; no redistribution or resale without written permission.

A **system-independent Foundry VTT v14 beta** for making the existing **Drawings** layer less cumbersome. This is not a wall-building tool, nor does it replace Foundry's Drawing documents, native drawing editor, scene persistence, selection, or normal deletion.

**Status:** Initial Quickbar operations work in the user's Foundry v14 test world; an experimental v0.1.1 Arrow fix and later editing controls remain individually subject to live checks. v0.1.4 adds Find Drawing / Locate and replaces unreliable native inline Edit Text invocation with a focused edit form. Run a test on a backed-up Scene before using production artwork.

## What it adds

- A new **Drawing Quickbar** button in Foundry's native **Drawings** tools palette (GM only in v0.1.1).
- One-click access to native **Select, Freehand, Rectangle, Ellipse, Polygon, Text** tools.
- **Arrow**: drag from tail to tip; saves a closed filled arrow silhouette as one native v14 polygon Drawing. Corrects the rejected legacy `f` shape type; visual geometry, resizing and undo still require v14 live verification.
- **Four style presets** (Outline, Danger, Highlight, Filled), plus stroke/fill/text colors, stroke width, fill opacity, and text size.
- Client-only remembered style choices and movable panel position.
- Optional **Use this style for new drawings** while the Quickbar remains open. Styles are applied via the documented `preCreateDrawing` hook, without altering existing drawings.
- **Duplicate** creates offset copies of the selected, unlocked native Drawings without changing their originals, IDs or linked data. **Edit Text** opens Foundry v14's built-in inline text editor for exactly one selected, unlocked Drawing.
- **Text popup:** Quickbar Text changes into a placement cursor. Click the map to open a focused text box with size presets, custom pixel size and text color. **Place Text** creates one native rectangle Drawing carrying the label. Cancel/Escape creates nothing.
- **Selected Drawings:** Immediately beneath the tool buttons, show selected Drawings by name/type with **Locate** and Remove (deselect) plus clearly visible Lock, Properties, Duplicate, Edit Text and Style Selected actions. The action row collapses when nothing is selected, except for Revert Style when an undo exists.
- **Find Drawing:** Expand the Finder and search **all** native Scene Drawings by displayed text, name, type or ID. Exact text is ranked first (useful for a stray letter `a`). **Locate** pans your local camera and flashes a temporary marker for seven seconds; **Select** explicitly replaces the current selection for unlocked objects. Locked and hidden drawings are identified. The Finder does not modify world data or broadcast to players.
- **Edit Text improved:** The Edit Text action (or Edit from a Finder text result) opens the same focused text-size/color popup used for new labels. It prefills the selected Drawing's existing content and saves only text, font size and text color to the original native Drawing, preserving geometry and document ID. Lock uses the native `locked` field; expand **Locked Drawings** to unlock any locked Drawing in this Scene.
- **Style Selected** applies the chosen style to selected, unlocked native Drawing documents; **Revert Style** reverses the last such batch made by this module during the current scene session.
- Shortcuts while the Quickbar is open and the Drawings layer is active (but never during native or popup text editing): `V` Select, `F` Freehand, `R` Rectangle, `E` Ellipse, `P` Polygon, `T` Text, `A` Arrow. `Esc` exits Arrow mode.

Selection, moving, resizing, native Drawing configuration, and shape creation outside Arrow mode remain owned by Foundry. Duplicate and Arrow register native undo history when the current v14 build supports it. `Revert Style` is a separate one-step safeguard for this module's batch restyling; it does not replace Foundry's undo history.

## Prerequisites

- Foundry VTT **v14** running a Scene as GM. Tested against v14 *documentation*, not an actual server.
- No game system dependency; WoD20 is not required.
- No third-party drawing editor, CDN, images, accounts, or credentials.

## Install from the Foundry manifest (test world first)

1. Make a **world snapshot** or back up the relevant world data. This beta creates/modifies native Scene Drawing documents only when you use its controls.
2. In Foundry Setup, open **Add-on Modules > Install Module**.
3. Paste the permanent **Manifest URL** above into the Manifest URL field and click **Install**. Foundry fetches the version-pinned ZIP from the manifest.
4. Enter a disposable **test world**, open **Manage Modules**, and enable **Drawing Quickbar**.
5. Hard-refresh the browser (`Ctrl+Shift+R`). On a Scene, select the **Drawings** controls and open the **Drawing Quickbar** palette button.
6. Use the smoke test below. No live v14 compatibility claim has been made.

**Manual install alternative:** Stop Foundry before copying files through Samba. Extract the **contents of the release ZIP directly into**
`Z:\Data\modules\foundry-drawing-quickbar\` so `module.json` exists immediately inside that folder (not one directory lower). Restart Foundry, enable the module in your test world and hard-refresh.

**Updating:** Use Foundry Setup's **Check Update** / **Update** for this installed module. Its `manifest` URL stays stable, while each published `version` links to its matching immutable release ZIP. Before upgrading, retain a world snapshot and the previous installed module directory.

## First smoke test (send this result back)

1. On a **test Scene**, open the Quickbar and click **Box**. Choose **Danger**; draw a rectangle. Verify that it saves as an ordinary, red native Drawing and can be selected, moved, and resized.
2. Select that box and choose **Highlight > Style Selected > Revert Style**. Verify the original appearance returns. (If the box is the first new drawing in the chosen Danger style, the rollback should restore Danger.)
3. Click **Arrow**, drag a line on the map and release. Verify it appears as one solid polygon arrow, can be selected/moved and persists after reload. Test Arrow at two zoom levels and undo once.
4. Select a test rectangle and choose **Duplicate**. Check that one offset copy appears and the original remains unchanged. Select only the copy, then choose **Edit Text**; verify Foundry's inline editor opens and the entered text persists.
5. Select Quickbar **Text**, click an empty part of the map, type a label containing letters V, R, T and A, select a font size, and press **Place Text**. Verify no tool switches, then reload to check persistence.
6. Open **Find Drawing**, search for a stray character such as `a`, and click **Locate**. Verify the canvas pans, shows a temporary glowing outline around its location, and no other player's view changes. For unlocked results, use **Select** (replaces any other selection). For text results, use **Edit**, change the label and font size, Save Changes, then verify position, ID and other fields are unchanged.
7. Select a disposable Drawing and check its identity appears under **Selected Drawings**, with Locate, Lock, Properties, Duplicate and Edit Text visible. Click Lock, verify it cannot be manipulated on the canvas, then expand **Locked Drawings** and unlock it. Verify the drawing still exists unchanged.
8. Make sure existing Drawings, Walls, Tiles and tokens still behave normally. Check the browser console for errors.

If step 1 fails, **stop testing and report the Foundry v14 build number and first console error**. Do not test on important world Scenes until a basic creation check passes.

## Usage notes

- **New-drawing styles:** The native shape preview may temporarily use Foundry's existing drawing defaults until the new Drawing is committed. This beta applies Quickbar styles on creation, not by replacing the internal preview renderer.
- **Existing drawings:** Select them with Foundry's native Select tool, then click **Style Selected**. It changes only style fields; geometry, ownership, IDs, positions, existing flags, and attached data are untouched.
- **Revert Style:** One batch, current scene, current browser session. It cannot restore deleted drawings or undo unrelated changes.
- **Arrow:** The custom pointer overlay is active only while Arrow is chosen; right-click or press Esc to exit. It writes one native polygon Drawing with a namespaced `kind: arrow` flag. Arrows do not modify Foundry Walls or Regions.
- **Selection safety:** Duplicate, Edit Text and Style Selected deliberately skip locked Drawings. The Quickbar can now lock selected drawings and show an unlockable list of locked Scene Drawings. Your existing painted gridlines are not automatically tagged or locked. To safeguard them today, manually lock them using Foundry's native Drawing/Placeables controls. Background/Working groups remain planned, not part of v0.1.3.
- **Preferences:** Per-browser Foundry client setting (`foundry-drawing-quickbar.preferences`); no world-level configuration or migrations.

## Rollback

1. Disable **Drawing Quickbar** in Manage Modules. Existing Scene Drawings remain normal Foundry documents; disabling the module does not remove any created artwork.
2. To remove the module's files, stop Foundry and delete only `Z:\Data\modules\foundry-drawing-quickbar`, then restart.
3. If a test modified important world data unexpectedly, restore the **matching world snapshot**, not merely the module directory. Rollback of a module folder cannot undo world data edits.

## Known limits / non-goals in v0.1.4

- No changes to wall editing, elevation/levels, or native Foundry Drawing geometry handlers.
- GM-only Quickbar launch. Players' standard Foundry drawing permissions are not changed.
- Keyboard shortcuts are active only with the panel open and the Drawings layer selected.
- The Arrow's invalid `f` type was reported live on v0.1.0. It now uses a native `p` polygon silhouette; pan/zoom geometry, text editor activation, copy selection and Arrow undo remain unverified live.
- Styling of preexisting Drawings is deliberately manual. It does not bulk migrate any world or Scene data.
- Not yet a full Excalidraw-style editor: selection inspector, Finder, native lock controls and editable text popup exist, but background/working groups, alignment, snapping enhancements, custom resize handles and generalized history are not implemented. Text edits via Quickbar use the focused form, rather than Foundry's context-sensitive inline handler. Existing text shape dimensions are preserved; resize its native Drawing if longer text is clipped.
- Source is maintained at https://github.com/rebsiot/drawing-tools-plus, with beta release ZIPs and an install/update manifest. This **GitHub beta is not listed in Foundry's official package directory**.
- Software is distributed under the [Personal Use Only (No Redistribution)](LICENSE.md) source-available proprietary license. Public GitHub visibility does not authorize redistribution.

## Development / source

- `scripts/main.js`: Foundry hooks, Quickbar UI, native tool activation, optional Arrow pointer interaction.
- `scripts/model.js`: pure validation, styles, geometry builders, rollback snapshot helpers.
- `styles/quickbar.css`: scoped UI styles.
- `tests/*.test.mjs`: Node mock/unit tests (`npm test`, Node 18+).
- `docs/TEST-REPORT.md`: automated vs. live evidence.
- `docs/16-DRAWING-TOOLS-PLUS-HANDOFF.md`: current next-chat handoff and pending integration checks.
- `tools/build_release.py` and `.github/workflows/`: versioned root-layout Foundry installer ZIP, CI and prerelease automation. A release can be created by a matching tag or dedicated `beta/vX.Y.Z` branch.

See `CHANGELOG.md` for version-specific notes. No files in Foundry core, game systems, other modules, Actors, Tiles, Journals or Walls are modified on install.
