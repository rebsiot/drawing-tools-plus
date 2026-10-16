# Drawing Tools+ — Changelog

Short summaries of changes you can see in Foundry. See the [test report](docs/TEST-REPORT.md) for technical verification.

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
