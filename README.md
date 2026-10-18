# AFT Drawing Tools+ (Foundry v14 Beta)

A compact, movable toolbar for **native Foundry Scene Drawings**. Draw a shape, select it, change its appearance, and find it again with **Locate**. Works without a particular game system.

**Module Manager name:** AFT Drawing Tools+  
**Internal module ID:** `foundry-drawing-quickbar` (unchanged across upgrades)  
**License:** [Personal Use Only - No Redistribution](LICENSE.md). Public GitHub access does **not** grant permission to redistribute the module.

## First five steps

1. In **Foundry Setup > Add-on Modules**, install the [module manifest](https://raw.githubusercontent.com/rebsiot/drawing-tools-plus/main/module.json), then enable **AFT Drawing Tools+** in your world.
2. Open **AFT Drawing Tools+** from either **Tokens** or **Drawing Controls**; both launch the same floating toolbar.
3. Click **Box**, **Circle**, **Pen**, **Text**, or another drawing tool. Your new native Drawing can be selected and resized.
4. Select a Drawing, then use the **Stroke**, **Fill**, **Line width**, **Text** and **Style Presets** controls. Select multiple objects and use **Apply to N Selected** when appropriate.
5. Expand **All Drawings** to search, **Locate** a large/rotated Drawing, or select artwork for deliberate edits.

## Style presets and safety

- **Outline**, **Danger**, **Highlight**, and **Filled** work immediately as factory presets. To change a button: click **Customize Presets**, select that preset button, adjust the regular style controls, and click **Save [preset]**. Click **Restore [preset]** to restore only that button to its factory settings. Unsaved edits can be discarded. These customizations are stored in your local Foundry client preferences, not on Scene Drawing documents or in a shared world library.
- **While customizing**, slider changes do not edit selected artwork. Exit customization and click a preset normally to apply it. Restoring a preset does not undo changes already made to Drawings.
- **Locate** highlights an existing Drawing's actual border and may zoom out to frame large shapes. It changes no Drawing documents. Some exceptionally large shapes cannot fit within Foundry's minimum zoom.
- **Delete N Selected** lists all eligible Drawings and requires explicit confirmation. Deletion cannot be undone by **Undo Style Change**; keep a recoverable world backup.
- Players may change only their **own unlocked Drawings**, subject to native Foundry permissions. Locked GM artwork, including hand-painted gridlines, stays protected. GMs explicitly unlock artwork before modifying it.

## Requirements and beta status

- **Foundry VTT v14**; system-independent, no WoD20 dependency and no required companion module.
- Players require the GM to grant Foundry's **Use Drawing Tools** permission. The module does not change permissions automatically.
- **v0.1.22 is a GitHub prerelease**, not a stable package. Unit/static and clean-package tests do not establish live Foundry GM/player reliability; real GM/player, locked-artwork, Locate, Multi-Delete and new preset controls need in-world testing.

## Updating, rollback and support

Use Foundry's normal **Check Update > Update** mechanism after backing up your world and module folder. Alternatively stop the Foundry server and extract the complete versioned ZIP into `Data/modules/foundry-drawing-quickbar/` (with `module.json` at its root). Restart Foundry and hard-refresh the browser. The original module ID, settings, Scene records and enable/disable identity remain unchanged.

The current beta ZIP and release notes are on [GitHub Releases](https://github.com/rebsiot/drawing-tools-plus/releases/tag/v0.1.22); the previous [v0.1.21 beta](https://github.com/rebsiot/drawing-tools-plus/releases/tag/v0.1.21) is the rollback build. A code rollback cannot restore Drawings edited/deleted in the world.

[Usage guide](docs/USER-GUIDE.md) | [Changelog](CHANGELOG.md) | [Test report](docs/TEST-REPORT.md) | [Report an issue](https://github.com/rebsiot/drawing-tools-plus/issues)
