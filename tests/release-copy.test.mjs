import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

test("each published version has distinct, readable release notes", async () => {
  for (let patch = 0; patch <= 18; patch++) {
    const version = "v0.1." + patch;
    const text = await readFile(new URL("../docs/releases/" + version + ".md", import.meta.url), "utf8");
    assert.ok(text.includes(version));
    assert.ok(text.includes("**New:**") || text.includes("**Fixed:**") ||
      text.includes("**Improved:**") || text.includes("## New") || text.includes("## Fixed") || text.includes("## Improved"));
    assert.ok(!text.includes("No gameplay script changes from the v0.1.0 baseline"));
  }
  // The installed module ZIP intentionally excludes repository-only CI workflows.
  const optionalWorkflow = async path => readFile(new URL(path, import.meta.url), "utf8")
    .catch(error => {if (error.code === "ENOENT") return null; throw error;});
  const workflow = await optionalWorkflow("../.github/workflows/release.yml");
  const sync = await optionalWorkflow("../.github/workflows/sync-release-notes.yml");
  assert.equal(Boolean(workflow), Boolean(sync), "Either include both repository workflows or neither");
  if (workflow) {
    assert.ok(workflow.includes('--notes-file "docs/releases/v$version.md"'));
    assert.ok(sync.includes('gh release edit "$tag" --notes-file "$note"'));
  }
});
