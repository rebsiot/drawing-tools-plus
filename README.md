# Drawing Tools+ — v0.1.14 Beta

**Foundry:** v14 · **Module ID:** `foundry-drawing-quickbar` · **License:** [Personal Use Only (No Redistribution)](LICENSE.md)

A small floating toolbar for **native Foundry Scene Drawings**. No extra drawing engine or World of Darkness dependency.

## Core workflow

- **Compact tools:** Select, Pen, Box, Circle, Polygon and Text fit on one row; Arrow sits directly below. Pen creates an **open stroke with no fill**, even when the current preset is Filled.
- **Fast, stable multi-select:** **All Drawings** now sits above the entire **Selected Drawings** box. Click **Select** down the list—earlier selections stay selected, the list does not jump or rebuild, and the clicked button turns into **Deselect** in place. Deselect removes only that Drawing. The main **Unselect** button releases all controlled Drawings, and `V` still activates native Select without clearing it.
- **Appearance:** Stroke/Fill/Text colors and Line width, Fill opacity, Text size sliders. Slider rows are closer together. One selected unlocked Drawing is styled immediately; with several Drawings selected, choose a preset or edit settings, then click **Apply to N Selected**. No bulk deletion is triggered. Pen strokes cannot be filled; arrow silhouettes remain visible.
- **Selected details:** The entire **Selected Drawings** box (count, Lock/Properties/Duplicate/Edit Text/Apply/Undo actions, and selected-object list) is **below All Drawings**, so growing the selection never moves the next row you want to click. Its action buttons remain above the selected-object list.
- **One Drawing list:** Expand **All Drawings** to search, Locate, Select, add text, or Delete eligible items. A small **red lock icon** beside the name marks protected artwork. Toggle **Locked only** beside the search label to see just locked items; turn it off to show everything again. Search and Show More still work while filtered. GMs can **Locate**, **Info** (read-only) or **Unlock** locked art right in that same list. Players see only permitted visible Drawings and cannot unlock anything.
- **Arrows and text:** Arrows support Start/End/Both/No heads, plus Triangle/Diamond/Chevron silhouettes. Text uses a focused dialog. Deselect never deletes; Delete requires confirmation. **Undo Style Change** restores appearance only.
- **First-use tutorial:** A four-step walkthrough appears on a user's first Quickbar opening. **Not now** defers it until another session; **Don't Show Again** persists on that Foundry User account. **Tutorial** in the footer reopens it.

## Players and GM permissions

**GM:** Can work with all **unlocked** Scene Drawings. Locked drawings protect permanent map art, even from quick edits; use **Unlock** explicitly first.

**Players:** Once authorized through Foundry, they can create shapes, freehand paths, arrows, and text. They can select, move, style, edit, duplicate and delete **their own unlocked Drawings only**, subject to native document update/delete permissions. Another player's drawing, a GM drawing, or a locked drawing is read-only. The player inventory hides GM-hidden Drawings. The toolbar and tutorial are the same, but Lock/Unlock remain GM-only.

**To enable player use:**

1. As GM, open **Game Settings → Configure Permissions**.
2. Under **Use Drawing Tools**, enable the **Player** role (or the roles you intend to authorize).
3. Save and have players refresh or reconnect. Native Foundry permissions remain authoritative.

No world-wide permission is automatically changed by installing the module. Legacy/imported Drawings with missing author ownership are treated as read-only for players rather than reassigned.

## Install and updates

**Permanent manifest URL:** https://raw.githubusercontent.com/rebsiot/drawing-tools-plus/main/module.json

Install through **Foundry Setup → Add-on Modules → Install by Manifest URL**, or **Check Update → Update**. For manual installation, stop Foundry and extract the release ZIP contents into `Z:\Data\modules\foundry-drawing-quickbar\` (module.json at that folder's top level). Restart Foundry and enable the module in a world.

**Back up the world before testing.** No automatic Drawing imports, IDs, Scene geometry changes, or migrations occur on installation.

## Live smoke-test checklist

On a disposable Scene with copied/temporary art:

1. Confirm the first six tools fit on one row, Arrow is beneath them, **All Drawings is above Selected Drawings**, and the three sliders still have reduced vertical gaps.
2. Select **Filled**, then **Pen**. Draw a curved, open path. Confirm its endpoints are not connected, it has no filled interior and the stroke survives a refresh. Restyle the stroke with Outline or Danger.
3. Expand **All Drawings** and click Select repeatedly on at least five expendable Drawings. The clicked rows must stay in exactly the same vertical positions; none of their buttons should jump sideways or lose focus. Each selected row becomes Deselect, and the selection count/list below All Drawings grows. Deselect the middle Drawing: all other selections remain. Apply a preset using **Apply to N Selected** and verify only those Drawings change.
4. Click the main **Unselect** control: all Drawings should become deselected, but their positions and styles must not change.
5. GM: Lock three expendable Drawings. Open **All Drawings** and verify each locked name has a red lock icon. Turn on **Locked only**: only those three should remain visible, while the section heading retains the total Scene count. Search for one locked Drawing, use **Locate/Info**, then **Unlock** it and verify that it disappears from the locked-only results without changing the other two. Turn the filter off and confirm all Drawings return.
6. Player with **Use Drawing Tools** enabled: draw a shape, then style, move and delete that shape. Confirm the player cannot change GM artwork, another player's art, or a locked map gridline. Repeat with the player tutorial.
7. Check the Text dialog and arrows, Undo Style Change, a large All Drawings list, and that no selection/delete action rewrites protected gridlines.

Report the exact Foundry v14 build and the **first browser console error** if a test fails. The new code has automated/unit/mock tests and ZIP packaging checks; **the new stable-click multi-select layout and earlier GM/player/Pen behavior have not been verified live on your Foundry instance**.

## Known limits and rollback

The Quickbar uses native Drawing documents and native permissions. It does not provide custom user-named style libraries, grouping/layer replacement, advanced snapping, or a separate undo history. Background/Working groups remain planned, not implemented.

To revert module code, install [v0.1.13](https://github.com/rebsiot/drawing-tools-plus/releases/tag/v0.1.13). This does **not** undo saved Scene document changes or restore deleted Drawings—keep your matching world backup.

[Readable Changelog](CHANGELOG.md) · [Release Notes](docs/releases/v0.1.14.md) · [Tests](docs/TEST-REPORT.md) · [Development Handoff](docs/16-DRAWING-TOOLS-PLUS-HANDOFF.md)
