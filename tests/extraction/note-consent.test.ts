import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const HOOK = join(__dirname, "../../plugin/hooks/note-consent.mjs");
const dir = mkdtempSync(join(tmpdir(), "consent-"));
mkdirSync(join(dir, "extractions/abc123def456"), { recursive: true });

const hook = (input: object, args = ["--all"]) => {
  const out = execFileSync("node", [HOOK, ...args], { input: JSON.stringify({ cwd: dir, ...input }), env: { ...process.env, CLAUDE_PROJECT_DIR: dir } }).toString();
  return out ? JSON.parse(out) : null;
};
const NOTE = "Ingresa con TA 90/60 mmHg, FC 120 lpm, SatO2 88%, Temp 38.5 °C.";

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

  it("asks before the first read of a saved note, then stops asking once allowed", () => {
    const read = { tool_name: "Read", tool_input: { file_path: join(dir, "extractions/abc123def456/note.md") } };
    expect(hook({ hook_event_name: "PreToolUse", ...read }).hookSpecificOutput.permissionDecision).toBe("ask");
    hook({ hook_event_name: "PostToolUse", ...read });
    expect(existsSync(join(dir, "extractions/abc123def456/.consent"))).toBe(true);
    expect(hook({ hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: "node cli extract --note extractions/abc123def456/note.md --items x" } })).toBeNull();
  });

  it("asks every time an extraction page is published", () => {
    const pub = { hook_event_name: "PreToolUse", tool_name: "Artifact", tool_input: { file_path: "extractions/abc123def456/artifact.html" } };
    expect(hook(pub).hookSpecificOutput.permissionDecision).toBe("ask");
    expect(hook({ ...pub, tool_input: { file_path: "docs/page.html" } })).toBeNull();
  });

  it("asks for a note read through Bash, and ignores other files", () => {
    expect(hook({ hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: "cat extractions/0123456789ab/note.md" } }).hookSpecificOutput.permissionDecision).toBe("ask");
    expect(hook({ hook_event_name: "PreToolUse", tool_name: "Read", tool_input: { file_path: join(dir, "extractions/abc123def456/extraction.json") } })).toBeNull();
  });
});
