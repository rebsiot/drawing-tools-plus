# Drawing Tools+ — v0.1.10 Beta

**Foundry VTT:** v14 · **Module ID:** foundry-drawing-quickbar · **License:** [Personal Use Only (No Redistribution)](LICENSE.md)

A compact drawing toolbar built on Foundry's native Scene Drawings. No separate drawing engine, asset pack or game-system dependency.

## What it does

- **Draw, then edit:** A newly created circle, rectangle, polygon or freehand shape becomes selected for immediate movement, resizing and styling. No second click on Select should be needed.
- **Change one Drawing:** With one unlocked Drawing selected, the four presets and stroke/fill/text controls affect that object directly.
- **Change several safely:** Multiple selections require the explicit **Apply to N Selected** control. Locked Drawings are excluded.
- **Set new-Drawing defaults:** With nothing selected, choose a preset or customize a style for future shapes. Those settings are remembered in your browser. **There is no custom named-style library to save.**
- **Add labels to shapes:** Select a circle and choose **Edit Text** to add or modify the label on that same Drawing. Text size and color are editable.
- **All Drawings list:** Expand **All Drawings (count)** beneath **Locked Drawings** to see a searchable inventory of every Drawing on the current Scene, including locked and hidden items. Use **Locate**, **Select** (or **Unlock**), or **Text** on an individual result. Large Scenes offer **Show More** to reach every item. Just opening or searching the list does not change your map.
- **Launch from Tokens or Drawings:** GMs see the **Drawing Quickbar** palette button in both Foundry control menus. Opening it from **Tokens** keeps your Token controls and selection in place. Choosing a shape/Arrow/Text switches to the native Drawings layer. From All Drawings, **Locate** and **Unlock** work without switching layers; **Select** and **Text** switch to Drawings only when clicked. There is only one Quickbar window, not two independent toolbars.
- **Protect permanent art:** Lock selected Drawings, then recover them using the Locked Drawings list. Existing artwork is never locked automatically.
- **Arrow options only when drawing arrows:** Choose the **Arrow** tool to reveal its options. Pick where arrowheads go—**End**, **Start**, **Both**, or **None**—and their filled silhouette: **Triangle**, **Diamond**, or **Chevron**. Both choices are saved in your local preferences for the next arrow. A completed arrow remains one native polygon Drawing, with no conversion of existing arrows. Thickness is set before drawing.
- **Deselect versus Delete:** **Deselect** only clears selection. **Delete** is a separate red action in Selected Drawings and All Drawings. The v0.1.9 fix correctly binds Foundry's native confirmation method, displaying the exact Drawing ID. Cancel does nothing, and locked Drawings cannot be deleted through the Quickbar.
- **Undo Style Change:** Replaces the confusing Revert Style label. It restores the last Quickbar appearance change, not movement, text, or deletions. Native Foundry undo is separate.
- **Quick first-use tutorial:** When a GM opens the Quickbar for the first time, a four-step guide explains drawing, appearance, finding/locking map Drawings, and arrows. **Not now** closes it for the current login. At the end, **Don't Show Again** saves that GM's preference in their Foundry account for future sessions and browsers in the same world. The small **Tutorial** link at the bottom reopens it anytime. Player accounts are unaffected.
- **Other controls:** Arrow, Duplicate, native Properties, and tool keyboard shortcuts outside text-entry fields.

## Install / upgrade

The permanent Foundry Manifest URL is:

https://raw.githubusercontent.com/rebsiot/drawing-tools-plus/main/module.json

In **Foundry Setup → Add-on Modules**, install using this URL or use **Check Update → Update** on Drawing Quickbar. The full ZIP is also in the [v0.1.10 GitHub release](https://github.com/rebsiot/drawing-tools-plus/releases/tag/v0.1.10).

**Back up your world before testing.** For a manual ZIP install, stop Foundry and extract the release archive contents directly into Z:\Data\modules\foundry-drawing-quickbar\ so module.json is at the top level. Restart Foundry, enable the module in a disposable test world and refresh the browser.

## First live test

1. As GM, open Drawing Quickbar for the first time after updating. Confirm the four-step guide appears. Choose **Not now**; closing and reopening Quickbar during this login must not show it again.
2. Refresh/relogin and reopen Quickbar. Test **Back**, **Next**, and last-step **Don't Show Again**. Refresh again: the guide must stay hidden for that GM account. Click the footer **Tutorial** link to reopen it. A different GM should still get their own first-use guide.
3. From **Token Controls**, select a test token and open the Quickbar. Confirm Tokens remains active and the selection stays intact.
4. Click **Circle** in the Quickbar. Verify Foundry switches to Drawings, creates the shape and selects it for editing. Afterward, return to Tokens and confirm the Quickbar remains open and token tools still work.
5. From **Token Controls**, expand **All Drawings** and use **Locate** for a test shape: Tokens should stay active. Use **Select** or **Text** for a specific unlocked Drawing and confirm Foundry switches to the Drawings layer only then.
6. Confirm **Locked Drawings → Unlock** works from Tokens on a spare locked Drawing; the original ID and geometry remain intact. Do not experiment on your painted gridlines without a world backup.
7. Return to the **Drawings** controls and use its **Drawing Quickbar** launcher to close/reopen the **same** window. Check no duplicate palette appears.
8. Select one disposable Drawing and press **Deselect**. Verify the Drawing remains at exactly the same position/size. Select it again and choose **Delete**, then **Cancel**: no data should change. Choose Delete and confirm only that single Drawing disappears.
9. Lock a disposable Drawing, verify it has no Delete action; unlock it later from Locked Drawings.
10. Confirm **Arrow options** are hidden while using Circle, Box, Text and Select, and appear only when Arrow is active. Try **Triangle**, **Diamond**, and **Chevron** with different end placements, including both ends, at two zoom levels. Confirm the preview, one native Drawing per arrow and persistence after reload. Apply Outline to an arrow and verify it remains visible.
11. Change a test Drawing's appearance and use **Undo Style Change**. Verify appearance is restored but position and text are unchanged.

If something fails, record the actual Foundry build and the **first browser console error**. The v0.1.10 tutorial state logic and UI wiring have automated/mock coverage, but the new dialog and user flag **still require a live Foundry v14 check**.

## Known limits and safety

- Presets are Outline, Danger, Highlight and Filled. There is one browser-remembered new-Drawing style, not a collection of user-named styles.
- Labels on very small ellipses may overflow; resize the native Drawing to give the text space.
- Protected background/working groups, advanced snapping, connectors and broader undo are planned, not implemented.
- The toolbar is GM-only in this beta. This GitHub release has **not** been approved for Foundry's official package directory.

Disabling the module does **not** erase native Scene Drawings. To roll back code, install the [v0.1.9 release](https://github.com/rebsiot/drawing-tools-plus/releases/tag/v0.1.9). Reverting module files does not reverse saved Scene edits; retain your world backup for that.

[Readable Changelog](CHANGELOG.md) · [Release Notes](docs/releases/v0.1.10.md) · [Tests](docs/TEST-REPORT.md) · [Handoff](docs/16-DRAWING-TOOLS-PLUS-HANDOFF.md)
