#!/usr/bin/env python3
"""Build a complete installable Foundry module ZIP without any external dependencies."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / "module.json").read_text(encoding="utf-8"))
module_id, version = manifest["id"], manifest["version"]
assert module_id == "foundry-drawing-quickbar", "Module ID drift"
assert version and all(c.isdigit() or c == "." for c in version)
assert (ROOT / "scripts/main.js").is_file()
assert (ROOT / "scripts/model.js").is_file()
assert (ROOT / "styles/quickbar.css").is_file()
release_dir = ROOT / "dist"
release_dir.mkdir(exist_ok=True)
archive = release_dir / f"{module_id}-{version}.zip"
selected = [ROOT / "module.json", ROOT / "package.json", ROOT / "README.md", ROOT / "CHANGELOG.md", ROOT / "LICENSE.md"]
for folder in ("scripts", "styles", "tests", "docs"):
    selected += sorted(p for p in (ROOT / folder).rglob("*") if p.is_file())
# A handoff is a private development artifact, not a module installation requirement.
selected = [p for p in selected if p.name != "16-DRAWING-TOOLS-PLUS-HANDOFF.md"]
with ZipFile(archive, "w", compression=ZIP_DEFLATED) as target:
    for p in selected:
        target.write(p, arcname=p.relative_to(ROOT).as_posix())
with ZipFile(archive) as verify:
    assert verify.testzip() is None
    assert "module.json" in verify.namelist()
    assert "LICENSE.md" in verify.namelist()
    assert "docs/USER-GUIDE.md" in verify.namelist()
    assert not any(name.startswith(module_id + "/") for name in verify.namelist())
    assert not any("HANDOFF" in name for name in verify.namelist())
    zipped_manifest = json.loads(verify.read("module.json"))
    assert zipped_manifest["version"] == version
    assert zipped_manifest["id"] == module_id
    assert zipped_manifest["title"] == "AFT Drawing Tools+"
    assert zipped_manifest["manifest"] == "https://raw.githubusercontent.com/rebsiot/drawing-tools-plus/main/module.json"
    assert zipped_manifest["download"].endswith(f"/v{version}/{module_id}-{version}.zip")
print(f"Built {archive} ({archive.stat().st_size} bytes; {len(selected)} files)")
