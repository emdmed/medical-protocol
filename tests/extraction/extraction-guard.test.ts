import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const HOOK = join(__dirname, "../../plugin/hooks/extraction-guard.mjs");
const dir = mkdtempSync(join(tmpdir(), "guard-"));
mkdirSync(join(dir, "data/extractions"), { recursive: true });
mkdirSync(join(dir, "extractions"));
for (const f of ["extractions/note.md", "extractions/note.json", "extractions/note.corrected.json", "data/extractions/note.json"]) writeFileSync(join(dir, f), "x");

const denied = (file: string) =>
  execFileSync("node", [HOOK], {
    input: JSON.stringify({ tool_name: "Write", cwd: dir, tool_input: { file_path: file } }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: dir },
  })
    .toString()
    .includes('"deny"');

describe("extraction-guard hook", () => {
  it("blocks writes to an existing first pass or note", () => {
    expect(denied("extractions/note.json")).toBe(true);
    expect(denied("extractions/note.md")).toBe(true);
    expect(denied(join(dir, "extractions/note.json"))).toBe(true);
  });

  it("allows creating them, and writing the verification files", () => {
    expect(denied("extractions/new.json")).toBe(false);
    expect(denied("extractions/note.corrected.json")).toBe(false);
    expect(denied("extractions/note.verify.json")).toBe(false);
    expect(denied("data/extractions/note.json")).toBe(false);
  });
});
