import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const HOOK = join(__dirname, "../../plugin/hooks/extraction-guard.mjs");
const dir = mkdtempSync(join(tmpdir(), "guard-"));
mkdirSync(join(dir, "data/extractions"), { recursive: true });
mkdirSync(join(dir, "extractions/abc123def456"), { recursive: true });
for (const f of ["extractions/abc123def456/note.md", "extractions/abc123def456/extraction.json", "extractions/abc123def456/corrected.json", "data/extractions/abc123def456.json"]) writeFileSync(join(dir, f), "x");

const denied = (file: string) =>
  execFileSync("node", [HOOK], {
    input: JSON.stringify({ tool_name: "Write", cwd: dir, tool_input: { file_path: file } }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: dir },
  })
    .toString()
    .includes('"deny"');

describe("extraction-guard hook", () => {
  it("blocks writes to an existing first pass or note", () => {
    expect(denied("extractions/abc123def456/extraction.json")).toBe(true);
    expect(denied("extractions/abc123def456/note.md")).toBe(true);
    expect(denied(join(dir, "extractions/abc123def456/extraction.json"))).toBe(true);
  });

  it("blocks creating a note, so only --save names the folder", () => {
    expect(denied("extractions/made-up-name/note.md")).toBe(true);
    expect(denied("extractions/abc123def456/.consent")).toBe(true);
  });

  it("blocks other spellings of the same file on case-insensitive disks (macOS, Windows)", () => {
    expect(denied("Extractions/abc123def456/Note.md")).toBe(true);
    expect(denied("extractions/abc123def456/.Consent")).toBe(true);
  });

  it("allows creating them, and writing the verification files", () => {
    expect(denied("extractions/0123456789ab/extraction.json")).toBe(false);
    expect(denied("extractions/abc123def456/corrected.json")).toBe(false);
    expect(denied("extractions/abc123def456/verify.json")).toBe(false);
    expect(denied("extractions/abc123def456/artifact.html")).toBe(false);
    expect(denied("data/extractions/abc123def456.json")).toBe(false);
  });
});
