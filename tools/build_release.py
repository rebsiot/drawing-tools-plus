#!/usr/bin/env python3
"""Build an installable Foundry module ZIP with no external dependencies."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / "module.json").read_text(encoding="utf-8"))
module_id = manifest["id"]
version = manifest["version"]
assert module_id == "foundry-drawing-quickbar", "Module ID drift"
assert version and all(character.isdigit() or character == "." for character in version)
assert (ROOT / "scripts/main.js").is_file()
assert (ROOT / "scripts/model.js").is_file()
assert (ROOT / "styles/quickbar.css").is_file()
release_dir = ROOT / "dist"
release_dir.mkdir(exist_ok=True)
archive = release_dir / f"{module_id}-{version}.zip"
selected = [ROOT / "module.json", ROOT / "package.json", ROOT / "README.md", ROOT / "CHANGELOG.md", ROOT / "LICENSE.md"]
for folder in ("scripts", "styles", "tests", "docs"):
    selected += sorted(path for path in (ROOT / folder).rglob("*") if path.is_file())
with ZipFile(archive, "w", compression=ZIP_DEFLATED) as target:
    for path in selected:
        target.write(path, arcname=path.relative_to(ROOT).as_posix())
with ZipFile(archive) as verify:
    assert verify.testzip() is None
    assert "module.json" in verify.namelist(), "Foundry manifest installer requires root-level module.json"
    assert "LICENSE.md" in verify.namelist()
    assert not any(name.startswith(f"{module_id}/") for name in verify.namelist())
    zipped_manifest = json.loads(verify.read("module.json"))
    assert zipped_manifest["version"] == version
    assert zipped_manifest["id"] == module_id
    assert zipped_manifest["manifest"] == "https://raw.githubusercontent.com/rebsiot/drawing-tools-plus/main/module.json"
    assert zipped_manifest["download"].endswith(f"/v{version}/{module_id}-{version}.zip")
print(f"Built: {archive} ({archive.stat().st_size} bytes; {len(selected)} files)")
