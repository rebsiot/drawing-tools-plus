# Drawing Tools+ — Changelog

## v0.1.18 — Multi-Delete (public beta; 2026-10-16)
- **Added:** **Delete N Selected** under Selected Drawings, available with at least two deletable native Drawings in the current selection. Its button is distinct from per-object Deselect/Delete.
- **Safety:** Native Foundry DialogV2 confirms an explicit list of targets (name, kind, native ID) and indicates locked or unauthorized exclusions. Cancel and dialog dismissal make no changes. Confirmed deletion aborts if Scene, selection, document identity, author, lock or deletion permission changed. Deletion uses one native Scene Drawing operation for the exact authorized IDs.
- **Permission preservation:** Players can delete only their own unlocked Drawings when Foundry permits deleting. GMs cannot bulk-delete locked gridlines without deliberately unlocking them first. No select-all, mass import, migration or changes to existing Scene documents on install.
- **Distribution:** Published as a complete versioned public GitHub beta ZIP through the existing repository and permanent Foundry update manifest; no Free/Plus split is implemented. Previous v0.1.17 ZIP remains available for rollback.
- **Verification:** Node/unit/mock/static checks plus package verification. Live Foundry v14 Multi-Delete is unverified; earlier player reports confirmed basic creation, styling, single removal and locked-object discoverability in v0.1.17.


Short summaries of changes you can see in Foundry. See the [test report](docs/TEST-REPORT.md) for technical verification.

## v0.1.17 — Return to Tokens from Drawing Quickbar
- **Fixed:** Closing the Quickbar while using Drawings returns to native Token Controls.
- **Added:** Compact Tokens button in the header restores Token selection without closing the Quickbar.
- **Improved:** Canceling unfinished custom annotations and new text placement returns to Tokens. Canceling Edit Text on an existing Drawing preserves its selection.
- **Preserved:** Completed shapes remain selected for immediate styling, resizing and moving; no changes to Scene Drawing IDs, permissions, locks or existing art.
- **Verification:** Static/mock checks; live Foundry v14 pending.

## v0.1.16 — Lines, Routes, Callouts and First-Open Drawing Count
- **New:** A compact second row has **Line, Arrow, Route and Callout**, with the original six drawing tools unchanged in row one.
- **New:** Straight Line uses one narrow native polygon Drawing; Route records multiple clicked waypoints into one native editable polygon. Finish with double-click, Enter or Finish; cancel with Esc/right-click.
- **New:** Callout draws a leader to an editable native text label. It creates two separate native Drawings, one for the pointer and one for text, so editing either does not silently overwrite the other.
- **Changed:** New Chevron arrowheads have a conspicuous V-shaped notch, so they no longer look the same as filled triangles. All three head styles remain v14-valid native polygon shapes; existing arrow geometry stays intact.
- **Fixed:** All Drawings count is initialized when the Quickbar opens, not only on first expansion, and updates on Scene Drawing create/delete.
- **Preserved:** Player-authored Drawing permissions, GM locks, native Scene IDs, selected list positions, quick styles, launcher buttons and all previous art. No migration.
- **Testing:** Automated/mock model and source wiring checks plus packaged ZIP; live Foundry v14 verification remains pending.

## v0.1.15 — Clear Drawing Quickbar Launcher Icon
- **Improved:** Both Token Controls and Drawing Controls now use the **pen-and-ruler** launcher icon, matching the Drawing Quickbar header instead of looking like Foundry's existing Palette control.
- **Unchanged:** One shared Quickbar, Token/Drawing layer switching, author permissions, selected Drawings, locked protections, Scene data and existing module ID. No migration or user action is needed beyond updating.
- **Testing:** Automated/mock regression and ZIP packaging checks; visual placement in a live Foundry v14 client still needs confirmation.

## v0.1.14 — Stable Multi-Select, No Jumping
- **Fixed:** **All Drawings** remains above the entire **Selected Drawings** box. Growing the selection no longer pushes the next Select button down the screen.
- **Fixed:** Selecting or deselecting updates existing All Drawings buttons/highlights **in place** rather than rebuilding every row and losing button focus.
- **Improved:** Select/Deselect buttons have a stable minimum width, and the selection highlight uses an inset marker that doesn't shift row geometry.
- **Preserved:** Native additive selection, Selected Drawings count/actions, Locked only, text search, player ownership and locked-gridline protections. Search and real Scene Drawing changes still refresh the inventory while preserving scroll.
- **Testing:** Node/static/mock regressions and installable ZIP checks; live Foundry v14 verification remains pending.

## v0.1.13 — Locked Filter in All Drawings
- **Simplified:** Removed the duplicate **Locked Drawings** panel. All objects, including locked Drawings, remain in one expandable **All Drawings** inventory.
- **Clear at a glance:** Locked objects show a small, red **lock icon** alongside the name rather than repeating “Locked” on a second line.
- **New:** A compact **Locked only** toggle sits beside the search label. It combines with text search and Show More, and can be switched off at any time.
- **Preserved:** GM **Locate**, **Unlock**, and read-only **Info** for protected map artwork in the same list. Player permissions, native lock states, selection, Undo, Drawing geometry and IDs remain unchanged.
- **No migration:** This is UI-only; it never automatically unlocks, imports, edits, or deletes Drawings. Live Foundry v14 browser testing is pending.

## v0.1.12 — Multi-Select from All Drawings
- **Fixed:** Clicking **Select** on another All Drawings row adds it to the current native selection instead of clearing previously selected Drawings.
- **Simpler:** Each selected row changes to **Deselect**, which releases only that Drawing; main **Unselect** clears all selected Drawings. No separate mode or modifier keys.
- **Works with:** Existing **Apply to N Selected** styling, GM-only Lock, and native drawing move/resize where Foundry allows it.
- **Protected:** Player-owned, locked and hidden Drawing permissions remain enforced. List selection never modifies Scene documents or performs deletion.
- **Testing:** Native Foundry PlaceableObject control/release API and Node/mock regression checks; live Foundry v14 verification is still required.

## v0.1.11 — Player Drawings, Pen Fix and a Smaller Toolbar
- **New:** Player-accessible Quickbar when the GM enables Foundry's **Use Drawing Tools** permission. A player can manage **their own unlocked** Drawings only; all writes recheck native author and update/delete permissions. GM control remains.
- **Fixed:** Pen paths remain **unfilled open freehand strokes**. The Quickbar ignores fill presets for freehand shapes and disables Fill controls on selected Pen paths.
- **Changed:** Six creation/selection tools now share **one compact row**; Arrow is immediately below.
- **Changed:** The **Select** button highlights and reads **Unselect** while a Drawing is selected; clicking it releases the native selection, never deletes or restyles. `V` remains Select.
- **Changed:** Selected-Drawing details appear **below** their action buttons. **Line width, Fill opacity and Text size** use much tighter vertical spacing.
- **Improved:** The GM can **Locate** or view read-only **Info** for locked Drawings without unlocking or modifying map artwork.
- **Preserved:** Module ID, native Drawing data, immutable author IDs, locked gridlines, first-use tutorial, and all existing release artifacts.
- **Testing:** Node/mock/static checks only until separately verified in Foundry v14.

## v0.1.10 — Quick First-Use Tutorial
- **New:** Four short steps appear the first time a GM opens Drawing Quickbar—not simply when they log into Foundry.
- **New:** **Don't Show Again** at the end saves the preference on that GM's Foundry User account, across future sessions and browsers in the same world.
- **Simple:** Back, Next, Not now and Escape. Not now postpones the reminder to a later login rather than nagging during the current session.
- **Always available:** A small **Tutorial** link in the Quickbar footer reopens the guide on demand.
- **Safe:** No changes to Scenes, Drawings, Tokens, module permissions or existing settings. No automatic migrations.

## v0.1.9 — Delete Confirmation and Arrowhead Shapes
- **Fixed:** Delete confirmation no longer errors with `Cannot read properties of undefined (reading 'wait')`; the Foundry v14 dialog method is called with its required class context.
- **Improved:** Arrow options are hidden until the **Arrow** tool is active; they disappear when switching tools or selecting a completed arrow.
- **New:** Three filled arrowhead shapes: **Triangle**, **Diamond**, and **Chevron**. Combine with Start/End/Both/None placement. All remain one native Drawing per arrow.
- **Preserved:** Existing arrow geometry/flags, Scene IDs, locks, and data. Confirmation still deletes only one explicitly selected unlocked Drawing.
- **Testing:** Static/mock/Node tests and release ZIP verification; requires live Foundry v14 confirmation.

## v0.1.8 — Clear Deletion, Arrow Ends, and Appearance Undo
- **Clarified:** The old **Remove** button was actually Deselect. It is now labeled **Deselect** and never changes a Drawing's geometry or visibility.
- **New:** **Delete** permanently removes exactly one unlocked native Drawing, but only after a Foundry confirmation identifying that object; no automatic bulk deletion.
- **New:** Choose arrowheads on the **Start**, **End**, **Both**, or **Neither** end. One arrow is still one native polygon Drawing.
- **Fixed:** Quickbar arrow styling preserves its filled silhouette, even when an outline preset would otherwise remove its visible fill. Existing arrow geometry is not rewritten.
- **Renamed:** **Revert Style** → **Undo Style Change**, clarifying that it only restores the last Quickbar appearance change.
- **Unchanged:** Module ID, native Drawings/locks/scene data, selection and Token launcher. A real Foundry v14 regression test is still needed.

## v0.1.7 — Drawing Quickbar from Token Controls
- **New:** Drawing Quickbar appears in the **Tokens** controls as well as **Drawings** for the GM.
- **Improved:** Opening from Tokens keeps the Token layer and selected tokens in place. Picking a Drawing tool switches to Drawings only when necessary.
- **Improved:** **All Drawings → Locate** and **Unlock** work without switching away from Tokens; selecting or editing a Drawing switches only on request.
- **Unchanged:** One shared Quickbar, native Scene Drawings, GM-only access and the existing module ID. No migrations or automatic changes to Tokens or gridlines.

## v0.1.6 — All Drawings at a Glance
- **New:** A collapsed **All Drawings** list sits directly beneath Locked Drawings, with a total count and search.
- **Improved:** Generic shapes show their type, a short ID and map coordinates to distinguish similar objects.
- **Retained:** Locate, Select, Unlock and Text actions are available in the list.
- **Fixed:** Large Scenes no longer stop at the first 60 results; **Show More** reveals additional Drawings in batches.
- **Unchanged:** Native Drawing data, locking behavior, Quick Styles and appearance controls.

## v0.1.5 — Draw, Then Edit
- **New:** Shapes become selected after creation so you can move/resize them immediately.
- **Changed:** Presets and style controls directly change **one selected Drawing**.
- **Changed:** Multiple selected Drawings require an explicit **Apply to N Selected**; locked Drawings are excluded.
- **Fixed:** Edit Text can add a visible label to a circle even when it had no text before.
- **Simplified:** The four presets are built in. New-Drawing defaults are remembered locally; there is no separate style-saving step.

## v0.1.4 — Find Drawings
- Search Scene Drawings, including tiny text and locked items.
- **Locate** pans and highlights an object locally; **Select** replaces the current selection.
- Edit Text now opens a focused dialog rather than unreliable inline editing.

## v0.1.3 — Visible Drawing Actions
- Selected-object details and Lock, Duplicate, Edit Text and Properties appear beneath the tool buttons.
- Inactive controls collapse so the quickbar stays compact.

## v0.1.2 — Text and Locking
- Text placement opens a popup with font size and color; letter shortcuts no longer hijack typing.
- Added selected-object list, explicit native Lock and unlock recovery.

## v0.1.1 — Arrow and Duplicate
- Fixed the Foundry v14 validation error on Arrow creation.
- Added Duplicate and the first Edit Text control, refined in v0.1.4.

## v0.1.0 — First Beta
- Added the Drawing Quickbar, shape shortcuts, four presets, Arrow and selected styling.
- Set up GitHub releases and manifest-based installation/update.

### Status
Source is a GitHub beta targeting Foundry v14. New v0.1.5 features still need a live test; automated tests and ZIP checks alone do not establish live compatibility. Keep a world backup before testing.

[Installation and rollback](README.md) · [Personal Use Only License](LICENSE.md)
