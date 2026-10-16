# Drawing Tools+ — v0.1.5 Beta

**Foundry VTT:** v14 · **Module ID:** foundry-drawing-quickbar · **License:** [Personal Use Only (No Redistribution)](LICENSE.md)

A compact drawing toolbar built on Foundry's native Scene Drawings. No separate drawing engine, asset pack or game-system dependency.

## What it does

- **Draw, then edit:** A newly created circle, rectangle, polygon or freehand shape becomes selected for immediate movement, resizing and styling. No second click on Select should be needed.
- **Change one Drawing:** With one unlocked Drawing selected, the four presets and stroke/fill/text controls affect that object directly.
- **Change several safely:** Multiple selections require the explicit **Apply to N Selected** control. Locked Drawings are excluded.
- **Set new-Drawing defaults:** With nothing selected, choose a preset or customize a style for future shapes. Those settings are remembered in your browser. **There is no custom named-style library to save.**
- **Add labels to shapes:** Select a circle and choose **Edit Text** to add or modify the label on that same Drawing. Text size and color are editable.
- **Find missing Drawings:** Search all Scene Drawings, **Locate** to pan and briefly highlight, or **Select** an unlocked result without keeping unrelated Drawings selected.
- **Protect permanent art:** Lock selected Drawings, then recover them using the Locked Drawings list. Existing artwork is never locked automatically.
- **Other controls:** Arrow, Duplicate, native Properties, Revert Style, and tool keyboard shortcuts outside text-entry fields.

## Install / upgrade

The permanent Foundry Manifest URL is:

https://raw.githubusercontent.com/rebsiot/drawing-tools-plus/main/module.json

In **Foundry Setup → Add-on Modules**, install using this URL or use **Check Update → Update** on Drawing Quickbar. The full ZIP is also in the [v0.1.5 GitHub release](https://github.com/rebsiot/drawing-tools-plus/releases/tag/v0.1.5).

**Back up your world before testing.** For a manual ZIP install, stop Foundry and extract the release archive contents directly into Z:\Data\modules\foundry-drawing-quickbar\ so module.json is at the top level. Restart Foundry, enable the module in a disposable test world and refresh the browser.

## First live test

1. On a test Scene, draw a Circle. Verify that it becomes selected immediately and its native handles let you move or resize it.
2. While the circle remains selected, change to **Danger**, then change Stroke and Fill. The circle should update without **Style Selected**.
3. Choose **Edit Text**, enter **Room 7**, set a readable text color/size and save. The label should appear inside the same circle and persist after refreshing.
4. Select two temporary Drawings. Choose **Highlight** and verify neither changes until **Apply to 2 Selected** is clicked. Verify locked gridlines are never modified.
5. Use **Find Drawing → Locate** on a stray label and check the temporary marker.

If something fails, record the actual Foundry build and the **first browser console error**. The new v0.1.5 interactions have automated/mock coverage but have **not yet been live verified**.

## Known limits and safety

- Presets are Outline, Danger, Highlight and Filled. There is one browser-remembered new-Drawing style, not a collection of user-named styles.
- Labels on very small ellipses may overflow; resize the native Drawing to give the text space.
- Protected background/working groups, advanced snapping, connectors and broader undo are planned, not implemented.
- The toolbar is GM-only in this beta. This GitHub release has **not** been approved for Foundry's official package directory.

Disabling the module does **not** erase native Scene Drawings. To roll back code, install the [v0.1.4 release](https://github.com/rebsiot/drawing-tools-plus/releases/tag/v0.1.4). Reverting module files does not reverse saved Scene edits; retain your world backup for that.

[Readable Changelog](CHANGELOG.md) · [Release Notes](docs/releases/v0.1.5.md) · [Tests](docs/TEST-REPORT.md) · [Handoff](docs/16-DRAWING-TOOLS-PLUS-HANDOFF.md)
