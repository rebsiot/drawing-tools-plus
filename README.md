# Drawing Tools+ — v0.1.7 Beta

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
- **Other controls:** Arrow, Duplicate, native Properties, Revert Style, and tool keyboard shortcuts outside text-entry fields.

## Install / upgrade

The permanent Foundry Manifest URL is:

https://raw.githubusercontent.com/rebsiot/drawing-tools-plus/main/module.json

In **Foundry Setup → Add-on Modules**, install using this URL or use **Check Update → Update** on Drawing Quickbar. The full ZIP is also in the [v0.1.7 GitHub release](https://github.com/rebsiot/drawing-tools-plus/releases/tag/v0.1.7).

**Back up your world before testing.** For a manual ZIP install, stop Foundry and extract the release archive contents directly into Z:\Data\modules\foundry-drawing-quickbar\ so module.json is at the top level. Restart Foundry, enable the module in a disposable test world and refresh the browser.

## First live test

1. As GM, open **Token Controls**, select an expendable token, and click the **Drawing Quickbar** icon. Verify Token Controls stays active, the token stays selected, and the Quickbar opens once.
2. Click **Circle** in the Quickbar. Verify Foundry switches to Drawings, creates the shape and selects it for editing. Afterward, return to Tokens and confirm the Quickbar remains open and token tools still work.
3. From **Token Controls**, expand **All Drawings** and use **Locate** for a test shape: Tokens should stay active. Use **Select** or **Text** for a specific unlocked Drawing and confirm Foundry switches to the Drawings layer only then.
4. Confirm **Locked Drawings → Unlock** works from Tokens on a spare locked Drawing; the original ID and geometry remain intact. Do not experiment on your painted gridlines without a world backup.
5. Return to the **Drawings** controls and use its **Drawing Quickbar** launcher to close/reopen the **same** window. Check no duplicate palette appears.
6. Confirm ordinary native Token selection, Drawing styles and circle text editing still behave normally.

If something fails, record the actual Foundry build and the **first browser console error**. The v0.1.7 dual-launcher controls have automated/mock coverage but have **not yet been live verified**.

## Known limits and safety

- Presets are Outline, Danger, Highlight and Filled. There is one browser-remembered new-Drawing style, not a collection of user-named styles.
- Labels on very small ellipses may overflow; resize the native Drawing to give the text space.
- Protected background/working groups, advanced snapping, connectors and broader undo are planned, not implemented.
- The toolbar is GM-only in this beta. This GitHub release has **not** been approved for Foundry's official package directory.

Disabling the module does **not** erase native Scene Drawings. To roll back code, install the [v0.1.6 release](https://github.com/rebsiot/drawing-tools-plus/releases/tag/v0.1.6). Reverting module files does not reverse saved Scene edits; retain your world backup for that.

[Readable Changelog](CHANGELOG.md) · [Release Notes](docs/releases/v0.1.7.md) · [Tests](docs/TEST-REPORT.md) · [Handoff](docs/16-DRAWING-TOOLS-PLUS-HANDOFF.md)
