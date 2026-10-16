# Drawing Tools+ — v0.1.18 Beta

**Foundry:** v14 · **Module ID:** `foundry-drawing-quickbar` · **License:** [Personal Use Only (No Redistribution)](LICENSE.md)

A small floating toolbar for **native Foundry Scene Drawings**. No extra drawing engine or World of Darkness dependency.

**Launcher icon:** Both Token Controls and Drawing Controls now show the same **pen-and-ruler** symbol as the Drawing Quickbar header—not Foundry's generic Palette icon. This is a visual change only; both buttons still open the same toolbar.

## Core workflow

- **Multi-Delete:** In **All Drawings**, select two or more editable Drawings. Under **Selected Drawings**, click **Delete N Selected**. A native confirmation lists *every* Drawing that will be deleted by name, type and ID and identifies skipped locked/unauthorized ones. Cancel creates no changes. The operation uses one native Scene Drawing delete; the selection and permissions are checked again before deletion. **Undo Style Change cannot recover deleted artwork.** One-object Delete remains available on each Drawing.

- **Return to Tokens:** Click **Tokens** in the Quickbar header to resume native Token Controls without closing the panel. Closing the Quickbar from the Drawings layer also returns to Tokens. Canceling an unfinished Arrow, Line, Route or new Text returns to Tokens. Successfully created shapes remain selected so you can style and resize them, until you choose Tokens or close.

- **Two compact tool rows:** Select, Pen, Box, Circle, Polygon and Text stay in row one. Row two has **Line, Arrow, Route and Callout**. A Line is a single straight stroke; a Route follows clicked waypoints; a Callout links a point of interest to an editable text label. Each uses native Foundry Drawings—no new drawing layer. Pen continues to use Foundry's native freehand workflow.
- **Fast, stable multi-select:** **All Drawings** now sits above the entire **Selected Drawings** box. Click **Select** down the list—earlier selections stay selected, the list does not jump or rebuild, and the clicked button turns into **Deselect** in place. Deselect removes only that Drawing. The main **Unselect** button releases all controlled Drawings, and `V` still activates native Select without clearing it.
- **Appearance:** Stroke/Fill/Text colors and Line width, Fill opacity, Text size sliders. Slider rows are closer together. One selected unlocked Drawing is styled immediately; with several Drawings selected, choose a preset or edit settings, then click **Apply to N Selected**. Styling never initiates deletion; batch deletion is a separate, confirmed action. Pen strokes cannot be filled; arrow silhouettes remain visible.
- **Selected details:** The entire **Selected Drawings** box (count, Lock/Properties/Duplicate/Edit Text/Apply/Undo/Multi-Delete actions, and selected-object list) is **below All Drawings**, so growing the selection never moves the next row you want to click. Its action buttons remain above the selected-object list.
- **One Drawing list:** **All Drawings shows the current Scene Drawing count immediately, even while collapsed.** Expand it to search, Locate, Select, add text, or Delete eligible items. A small **red lock icon** beside the name marks protected artwork. Toggle **Locked only** beside the search label to see just locked items; turn it off to show everything again. Search and Show More still work while filtered. GMs can **Locate**, **Info** (read-only) or **Unlock** locked art right in that same list. Players see only permitted visible Drawings and cannot unlock anything.
- **Arrowheads:** Choose Start, End, Both or None. **Triangle** remains a solid tip; **Diamond** is a filled diamond; **Chevron** is now a visibly notched V-shaped polygon, not the previous nearly identical filled tip. New arrows change, not existing art.
- **Route:** Click two or more map points. Double-click, press Enter, or use **Finish Route** to save one native polygon ribbon. Escape or right-click cancels an unfinished route.
- **Callout:** Drag from the point of interest to the label location, then type text in the familiar dialog. Saving creates a pointer and text label as **two native Drawings** in one creation operation; edit/move them separately with the native tools. The module doesn't silently relink them or delete one when the other changes.
- **Text and safety:** Text uses a focused dialog. Deselect never deletes; Delete requires confirmation. **Undo Style Change** restores appearance only.
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

**Public beta release:** v0.1.18 is published on GitHub as a complete installable module ZIP. The permanent Foundry update manifest is `https://raw.githubusercontent.com/rebsiot/drawing-tools-plus/main/module.json`. Use **Check Update → Update** when this manifest points to v0.1.18, or install the versioned ZIP manually. No Drawing data migration occurs during installation.

1. Back up your entire Foundry world and `Z:\Data\modules\foundry-drawing-quickbar\` folder.
2. Stop Foundry. Extract the ZIP contents into `Z:\Data\modules\foundry-drawing-quickbar\` (the `module.json` file must be directly in that folder).
3. Restart Foundry, check v0.1.18 is shown, and hard-refresh the browser. The module remains enabled under the same ID.
4. Test on a disposable Scene before using Multi-Delete on real map artwork.

**Future repository split:** This preview retains the existing module ID and known settings/flags. GitHub/premium distribution is deferred until a new repository and release channel are ready.

**Back up the world before testing.** No automatic Drawing imports, IDs, Scene geometry changes, or migrations occur on installation.

## Live smoke-test checklist

**Multi-Delete first test:** On a disposable backed-up Scene, create four expendable Drawings and lock one. Select three unlocked Drawings using **All Drawings → Select**; confirm **Delete 3 Selected** displays all three names/IDs. **Cancel** first and confirm nothing is removed. Confirm a second time and check exactly those three Drawings are deleted. Then select two owned drawings as a player with the GM's artwork present: only owned, unlocked Drawings must be deletable. Verify locked gridlines, other players' Drawings, and Locate remain unchanged. Multi-Delete has **not yet been live-tested in Foundry v14**.

On a disposable Scene with copied/temporary art:

1. Open Quickbar on a test Scene containing several Drawings. **All Drawings must immediately show their count while still collapsed.** Verify row one has six basic tools, and row two has **Line, Arrow, Route and Callout**. Both Token and Drawing launchers must still open the same toolbar without changing ownership.
2. Select **Filled**, then **Pen**. Draw a curved, open path. Confirm its endpoints are not connected, it has no filled interior and the stroke survives a refresh. Restyle the stroke with Outline or Danger.
3. Expand **All Drawings** and click Select repeatedly on at least five expendable Drawings. The clicked rows must stay in exactly the same vertical positions; none of their buttons should jump sideways or lose focus. Each selected row becomes Deselect, and the selection count/list below All Drawings grows. Deselect the middle Drawing: all other selections remain. Apply a preset using **Apply to N Selected** and verify only those Drawings change.
4. Click the main **Unselect** control: all Drawings should become deselected, but their positions and styles must not change.
5. GM: Lock three expendable Drawings. Open **All Drawings** and verify each locked name has a red lock icon. Turn on **Locked only**: only those three should remain visible, while the section heading retains the total Scene count. Search for one locked Drawing, use **Locate/Info**, then **Unlock** it and verify that it disappears from the locked-only results without changing the other two. Turn the filter off and confirm all Drawings return.
6. Player with **Use Drawing Tools** enabled: draw a shape, then style, move and delete that shape. Confirm the player cannot change GM artwork, another player's art, or a locked map gridline. Repeat with the player tutorial.
7. Draw **Line** by dragging. Click three or more Route waypoints; finish with double-click or Finish and verify one editable Drawing survives reload. Try **Route → Esc** and verify nothing is created.
8. Create a Callout by dragging from a point of interest and entering text. Verify two editable native Drawings appear (pointer and label), only the text label changes when using Edit Text, and neither creation nor cancel changes existing map artwork.
9. Draw two equal-sized arrows using filled Triangle and Notched Chevron at the same map zoom. Confirm they are visibly different, both survive refresh, and Start/End/Both choices remain functional. Check Undo Style Change, search, protected gridlines, and player ownership as regressions.

Report the exact Foundry v14 build and the **first browser console error** if a test fails. The new code has automated/unit/mock tests and ZIP packaging checks; **the new Line/Route/Callout rendering, Chevron shape and initial count require live Foundry v14 verification, along with earlier GM/player/Pen behavior**.

## Known limits and rollback

The Quickbar uses native Drawing documents and native permissions. It does not provide custom user-named style libraries, grouping/layer replacement, advanced snapping, or a separate undo history. Background/Working groups remain planned, not implemented.

To revert module code, restore your backed-up v0.1.17 folder or install [v0.1.17](https://github.com/rebsiot/drawing-tools-plus/releases/tag/v0.1.17). This does **not** undo saved Scene document changes or restore deleted Drawings—keep your matching world backup.

[Readable Changelog](CHANGELOG.md) · [Release Notes](docs/releases/v0.1.18.md) · [Tests](docs/TEST-REPORT.md) · [Development Handoff](docs/16-DRAWING-TOOLS-PLUS-HANDOFF.md)
