# AFT Drawing Tools+ - User Guide

## Draw, select and style

Use **Box**, **Circle**, **Pen**, **Polygon**, or **Text** in the first Quickbar row, and **Line**, **Arrow**, **Route**, or **Callout** in the second. The module creates native Foundry Scene Drawing documents rather than maintaining a separate drawing engine. **Tokens** in the header switches back to native Token Controls without closing the toolbar.

A newly created shape remains selected for immediate editing. Click **Select** to control an object, **Unselect** to release all, or expand **All Drawings** and use the Select/Deselect buttons. Multiple selected Drawings stay selected as you add others; the All Drawings list is not rebuilt during selection toggling.

The style controls edit one selected unlocked Drawing immediately. For several selected Drawings, set colors, width, fill and fonts, then click **Apply to N Selected**. The **Undo Style Change** button reverses appearance changes only, not movement, text edits or deletion.

### Customize or restore a preset button

1. Click **Customize Presets** below the four preset buttons.
2. Choose **Outline**, **Danger**, **Highlight**, or **Filled**. The preset editor highlights that button and loads its current style into the familiar controls.
3. Change stroke color, fill color, text color, line width, fill opacity, text size or Fill shapes. **Nothing is written to the Scene Drawing while customization is open.**
4. Click **Save Outline / Save Danger / Save Highlight / Save Filled** to keep that button's new settings. The new style is saved in your existing Foundry client preferences, independently for each button. It persists across browser reloads on that client.
5. Click **Restore [name]** to return that button to its original factory preset. **Discard Edits** abandons unsaved changes; **Done Customizing** exits once no unsaved edits remain.

While customizing, clicking a preset chooses which button to edit; outside customization, clicking applies that button's style normally. Saving or restoring the button does **not** recolor any old Drawing automatically. To apply a custom style to an existing Drawing, exit customization, select your target and click the preset.

Custom presets are per client/browser. They do not grant players access to other users' artwork, do not create a compendium, and are not saved on Scenes. Back up client settings separately if moving browsers/devices.

## Find and protect artwork

Use **All Drawings** to view native Scene Drawings, including lock indicators, shape/name search and pagination. **Locate** pans to the selected Drawing, frames its full dimensions and provides a temporary client-side outline. It does not ping other clients. Exceptionally large shapes may exceed Foundry's minimum zoom; a caption remains near their center.

Use **Locked only** to filter without moving, editing or deleting any Drawing. GMs can **Lock** unlocked Drawing artwork and later **Unlock** it from the same list. Locked line art and hand-painted map grids remain protected until deliberately unlocked.

Players require Foundry **Use Drawing Tools** permission. They may only modify their own unlocked Drawings when native document permissions allow it. Hidden GM artwork is not disclosed by the player list.

## Remove drawings safely

For one Drawing, **Delete** asks for confirmation. For several, select two or more editable Drawing objects and click **Delete N Selected**. Review each name/type/native ID, and any locked or unauthorized items excluded, before confirming. The module checks the Scene, selection and native permissions again before sending the exact target IDs to Foundry. Deletion is not covered by **Undo Style Change**.

## Lines and annotations

**Line:** Drag from start to end; stored as one thin native polygon ribbon. **Arrow:** Choose start/end/both/none and triangle/diamond/notched-chevron arrowheads; the geometry is created as a native polygon. **Route:** Click consecutive waypoints; finish with double-click, Enter or **Finish Route**; Esc/right-click cancels. **Callout:** Drag a pointer and type a label; the pointer and editable text label become two independent native Drawings, not an auto-linked object pair.

**Text:** Use the focused popup to create new text or use Edit Text for one unlocked text Drawing. New text/annotation flows can be cancelled. Existing shapes and locks are not migrated on update.

## Troubleshooting and beta checks

If an update appears to retain an old header: confirm Foundry Setup shows the current module version, restart Foundry and hard-refresh the browser. The module ID remains `foundry-drawing-quickbar`, so an install into a different folder creates confusion rather than upgrading the original.

For a live beta smoke test on a backed-up disposable Scene: customize Danger, save, close/reopen and reselect it; restore it. With a Drawing selected, change custom colors and confirm that object stays untouched until explicitly applying the preset. Then test drawing/selection, large and rotated Locate, locked GM art protection, and Multi-Delete with Cancel followed by Confirm. Record the actual Foundry build and first browser console error if any step fails.

Use [GitHub Issues](https://github.com/rebsiot/drawing-tools-plus/issues) for feedback. More exact automated history is in [TEST-REPORT.md](TEST-REPORT.md).
