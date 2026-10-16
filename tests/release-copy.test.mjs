import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

test("each published version has distinct, readable release notes", async () => {
  for (let patch = 0; patch <= 12; patch++) {
    const version = "v0.1." + patch;
    const text = await readFile(new URL("../docs/releases/" + version + ".md", import.meta.url), "utf8");
    assert.ok(text.includes(version));
    assert.ok(text.includes("**New:**") || text.includes("**Fixed:**") ||
      text.includes("**Improved:**") || text.includes("## New"));
    assert.ok(!text.includes("No gameplay script changes from the v0.1.0 baseline"));
  }
  const workflow = await readFile(new URL("../.github/workflows/release.yml", import.meta.url), "utf8");
  assert.ok(workflow.includes('--notes-file "docs/releases/v$version.md"'));
  const sync = await readFile(new URL("../.github/workflows/sync-release-notes.yml", import.meta.url), "utf8");
  assert.ok(sync.includes('gh release edit "$tag" --notes-file "$note"'));
});
