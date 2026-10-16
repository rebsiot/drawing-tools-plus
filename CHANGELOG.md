# Drawing Quickbar — Changelog

## v0.1.0 — 2026-10-16

- **Added:** GM-facing Drawing Quickbar in Foundry v14 Drawing controls.
- **Added:** Native Select, Freehand, Rectangle, Ellipse, Polygon and Text shortcuts.
- **Added:** Experimental drag-to-create Arrow, persisted as a single native Drawing document, not a Tile or Region.
- **Added:** Four style presets; stroke, fill, text, width, opacity and font-size controls; client-local saved preferences.
- **Added:** Optional style-on-create hook for local, new Drawing documents while Quickbar is open.
- **Added:** Apply style to selected unlocked drawings and one-level manual style revert.
- **Preserved:** Native Drawing document IDs, selection, movement, resizing, permissions, and scene persistence. No world migrations or core patches.
- **Compatibility:** Foundry v14 API targeted; system independent; live version verification pending.
- **Automated tests:** 11 Node unit/mock tests passed; JavaScript syntax checked; module manifest validated. See `docs/TEST-REPORT.md`.
- **Live test:** Not run. Test on a disposable Scene before enabling in an established world.
- **Known issues:** Preview styles may differ until save; Arrow coordinate conversion and native geometry require live confirmation; no published update URL; GM-only beta.
- **Upgrade / rollback:** See `README.md`; back up the world, install complete module folder, disable to roll back without deleting persisted drawings.

### GitHub source import (documentation/packaging, no runtime feature changes)

- Linked the existing module ID to `rebsiot/drawing-tools-plus`; kept all Drawing document behavior and test cases unchanged.
- Added test/build automation and handoff documentation. No GitHub Release, Foundry package listing, or live compatibility claim is implied.
