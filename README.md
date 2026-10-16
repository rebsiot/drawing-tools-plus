# Drawing Tools+ — v0.1.12 Beta

**Foundry:** v14 · **Module ID:** `foundry-drawing-quickbar` · **License:** [Personal Use Only (No Redistribution)](LICENSE.md)

A small floating toolbar for **native Foundry Scene Drawings**. No extra drawing engine or World of Darkness dependency.

## Core workflow

- **Compact tools:** Select, Pen, Box, Circle, Polygon and Text fit on one row; Arrow sits directly below. Pen creates an **open stroke with no fill**, even when the current preset is Filled.
- **Select several Drawings:** Expand **All Drawings** and click **Select** next to each Drawing you want. Earlier selections stay selected, and each selected row changes to **Deselect**; click it to remove only that Drawing. There's no extra multi-select mode or keyboard modifier. The main **Unselect** button releases the full selection, and `V` still activates native Select without clearing it.
- **Appearance:** Stroke/Fill/Text colors and Line width, Fill opacity, Text size sliders. Slider rows are closer together. One selected unlocked Drawing is styled immediately; with several Drawings selected, choose a preset or edit settings, then click **Apply to N Selected**. No bulk deletion is triggered. Pen strokes cannot be filled; arrow silhouettes remain visible.
- **Selected details:** Lock/Properties/Duplicate/Edit Text and other actions appear **above** the selected-Drawing list, so the selected object stays near its controls.
- **Find and protect:** Expand **All Drawings** to search, Locate, Select, add text or Delete an eligible item. The GM's **Locked Drawings** list includes **Info** for read-only inspection and Locate/Unlock. Locked native Drawings cannot be selected or edited until explicitly unlocked.
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

1. Confirm the first six tools fit on one row, Arrow is beneath them, selected details follow the action buttons, and the three sliders have reduced vertical gaps.
2. Select **Filled**, then **Pen**. Draw a curved, open path. Confirm its endpoints are not connected, it has no filled interior and the stroke survives a refresh. Restyle the stroke with Outline or Danger.
3. Expand **All Drawings** and click **Select** on two or three unlocked test Drawings. Verify each remains selected, and the button in each row becomes **Deselect**. Click Deselect on the second: the others must stay selected. Choose a preset and click **Apply to N Selected**; verify only the remaining selected Drawings change.
4. Click the main **Unselect** control: all Drawings should become deselected, but their positions and styles must not change.
5. GM: lock an expendable Drawing. Use **Locked Drawings → Locate / Info** without selecting or unlocking. Verify the Info window is read-only. Unlock only when intended.
6. Player with **Use Drawing Tools** enabled: draw a shape, then style, move and delete that shape. Confirm the player cannot change GM artwork, another player's art, or a locked map gridline. Repeat with the player tutorial.
7. Check the Text dialog and arrows, Undo Style Change, a large All Drawings list, and that no selection/delete action rewrites protected gridlines.

Report the exact Foundry v14 build and the **first browser console error** if a test fails. The new code has automated/unit/mock tests and ZIP packaging checks; **the new additive selection interaction and earlier GM/player/Pen behavior have not been verified live on your Foundry instance**.

## Known limits and rollback

The Quickbar uses native Drawing documents and native permissions. It does not provide custom user-named style libraries, grouping/layer replacement, advanced snapping, or a separate undo history. Background/Working groups remain planned, not implemented.

To revert module code, install [v0.1.11](https://github.com/rebsiot/drawing-tools-plus/releases/tag/v0.1.11). This does **not** undo saved Scene document changes or restore deleted Drawings—keep your matching world backup.

[Readable Changelog](CHANGELOG.md) · [Release Notes](docs/releases/v0.1.12.md) · [Tests](docs/TEST-REPORT.md) · [Development Handoff](docs/16-DRAWING-TOOLS-PLUS-HANDOFF.md)
