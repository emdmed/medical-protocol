import { describe, it, expect, beforeEach } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const HOOK = join(__dirname, "../../plugin/hooks/note-consent.mjs");
const dir = mkdtempSync(join(tmpdir(), "consent-"));
const folder = join(dir, "extractions/abc123def456");
mkdirSync(folder, { recursive: true });
mkdirSync(join(dir, "other"));
mkdirSync(join(dir, "src"));
writeFileSync(join(folder, "note.md"), "TA 90/60 mmHg");
writeFileSync(join(folder, "extraction.json"), "[]");
symlinkSync(join(folder, "note.md"), join(dir, "other/link.md"));

const hook = (input: object, args = ["--all"]) => {
  const out = execFileSync("node", [HOOK, ...args], { input: JSON.stringify({ cwd: dir, ...input }), env: { ...process.env, CLAUDE_PROJECT_DIR: dir } }).toString();
  return out ? JSON.parse(out) : null;
};
const asks = (tool_name: string, tool_input: object) => hook({ hook_event_name: "PreToolUse", tool_name, tool_input })?.hookSpecificOutput.permissionDecision === "ask";
const NOTE = "Ingresa con TA 90/60 mmHg, FC 120 lpm, SatO2 88%, Temp 38.5 °C.";

beforeEach(() => rmSync(join(folder, ".consent"), { force: true }));

describe("note-consent hook", () => {
  it("holds back a pasted note unless it says it is not real data", () => {
    expect(hook({ hook_event_name: "UserPromptSubmit", prompt: NOTE }).decision).toBe("block");
    expect(hook({ hook_event_name: "UserPromptSubmit", prompt: "Not real data: " + NOTE })).toBeNull();
    expect(hook({ hook_event_name: "UserPromptSubmit", prompt: "fix the BP 120/80 test" })).toBeNull();
  });

  it("before the skill runs, checks only prompts that start it", () => {
    expect(hook({ hook_event_name: "UserPromptSubmit", prompt: NOTE }, [])).toBeNull();
    expect(hook({ hook_event_name: "UserPromptSubmit", prompt: "/medical-protocol:extract " + NOTE }, []).decision).toBe("block");
    expect(hook({ hook_event_name: "UserPromptSubmit", prompt: "/extract " + NOTE }, []).decision).toBe("block");
  });

  it("asks before anything reaches a pending note, however the path is written", () => {
    expect(asks("Read", { file_path: "extractions/abc123def456/note.md" })).toBe(true);
    expect(asks("Read", { file_path: "./extractions/abc123def456/../abc123def456/note.md" })).toBe(true);
    expect(asks("Read", { file_path: "other/link.md" })).toBe(true);
    expect(asks("Read", { file_path: "extractions/abc123def456/extraction.json" })).toBe(true);
    expect(asks("Grep", { pattern: "TA", path: "extractions" })).toBe(true);
    expect(asks("Grep", { pattern: "TA" })).toBe(true);
    expect(asks("Bash", { command: "cd extractions/abc123def456 && cat note.*" })).toBe(true);
    expect(asks("Bash", { command: "ls" })).toBe(true);
  });

  it("leaves unrelated files alone", () => {
    expect(asks("Read", { file_path: "package.json" })).toBe(false);
    expect(asks("Grep", { pattern: "TA", path: "src" })).toBe(false);
  });

  it("a yes to a read clears that note; a yes to an unrelated command does not", () => {
    hook({ hook_event_name: "PostToolUse", tool_name: "Bash", tool_input: { command: "ls" } });
    expect(existsSync(join(folder, ".consent"))).toBe(false);
    hook({ hook_event_name: "PostToolUse", tool_name: "Read", tool_input: { file_path: "extractions/abc123def456/note.md" } });
    expect(existsSync(join(folder, ".consent"))).toBe(true);
    expect(asks("Bash", { command: "cat extractions/*/note.md" })).toBe(false);
    expect(asks("Read", { file_path: "other/link.md" })).toBe(false);
  });

  it("asks every time an extraction page is published", () => {
    writeFileSync(join(folder, ".consent"), "x");
    expect(asks("Artifact", { file_path: "extractions/abc123def456/artifact.html" })).toBe(true);
    expect(asks("Artifact", { file_path: "docs/page.html" })).toBe(false);
  });
});
