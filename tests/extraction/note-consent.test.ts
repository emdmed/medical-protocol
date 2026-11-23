import { describe, it, expect, beforeEach } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { EXTRACT_ARTIFACT_HTML } from "../../packages/medprotocol/src/extract-artifact";

const HOOK = join(__dirname, "../../plugin/hooks/note-consent.mjs");
const dir = mkdtempSync(join(tmpdir(), "consent-"));
const folder = join(dir, "extractions", "abc123def456");
mkdirSync(folder, { recursive: true });
mkdirSync(join(dir, "other"));
mkdirSync(join(dir, "src"));
writeFileSync(join(folder, "note.md"), "TA 90/60 mmHg");
writeFileSync(join(folder, "extraction.json"), "[]");
// a link to the folder, not the file: a junction needs no admin on Windows (POSIX ignores the type)
symlinkSync(folder, join(dir, "other", "link"), "junction");

const hook = (input: object, args = ["--all"]) => {
  const out = execFileSync("node", [HOOK, ...args], { input: JSON.stringify({ cwd: dir, ...input }), env: { ...process.env, CLAUDE_PROJECT_DIR: dir } }).toString();
  return out ? JSON.parse(out) : null;
};
const decision = (tool_name: string, tool_input: object) => hook({ hook_event_name: "PreToolUse", tool_name, tool_input })?.hookSpecificOutput.permissionDecision;
const asks = (tool_name: string, tool_input: object) => decision(tool_name, tool_input) === "ask";
const denies = (tool_name: string, tool_input: object) => decision(tool_name, tool_input) === "deny";
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

  it("holds back notes with identifiers or loosely written vitals", () => {
    const blocked = (prompt: string) => hook({ hook_event_name: "UserPromptSubmit", prompt })?.decision === "block";
    expect(blocked("extract the values from this note: " + NOTE)).toBe(true);
    expect(blocked("Juan Perez, DNI 30123456, diabetic on metformin, admitted with pneumonia")).toBe(true);
    expect(blocked("Historia clínica: 998877. Neumonía, inicia ceftriaxona")).toBe(true);
    expect(blocked("Pt febrile 38.5, pulse 120, sats 88%, pressure 90 over 60, creatinine 2.1")).toBe(true);
    expect(blocked("54 years old, admitted 12/03, discharged 19/03")).toBe(true);
    expect(blocked("bump coverage to 80% and fix issue 123 in HCO3 parsing")).toBe(false);
    expect(blocked("here is the note [Image #1]")).toBe(true);
    expect(hook({ hook_event_name: "UserPromptSubmit", prompt: "not real data [Image #1]" })).toBeNull();
  });

  it("stops anything reaching a pending note, however the path is written: Read and Grep are sent to Bash, Bash asks", () => {
    expect(denies("Read", { file_path: "extractions/abc123def456/note.md" })).toBe(true);
    expect(denies("Read", { file_path: "./extractions/abc123def456/../abc123def456/note.md" })).toBe(true);
    expect(denies("Read", { file_path: "other/link/note.md" })).toBe(true);
    expect(denies("Read", { file_path: "extractions/abc123def456/extraction.json" })).toBe(true);
    expect(denies("Grep", { pattern: "TA", path: "extractions" })).toBe(true);
    expect(denies("Grep", { pattern: "TA" })).toBe(true);
    expect(asks("Bash", { command: "cd extractions/abc123def456 && cat note.*" })).toBe(true);
    expect(asks("Bash", { command: "ls" })).toBe(true);
  });

  it("asks for a PowerShell command as for Bash, and a yes to one naming the folder clears it", () => {
    expect(asks("PowerShell", { command: "Get-ChildItem" })).toBe(true);
    hook({ hook_event_name: "PostToolUse", tool_name: "PowerShell", tool_input: { command: "Get-Content extractions\\abc123def456\\note.md" } });
    expect(existsSync(join(folder, ".consent"))).toBe(true);
    expect(decision("PowerShell", { command: "Get-ChildItem" })).toBeUndefined();
    rmSync(join(folder, ".consent"));
    hook({ hook_event_name: "PostToolUse", tool_name: "PowerShell", tool_input: { command: "Get-Content extractions/abc123def456/note.md" } });
    expect(existsSync(join(folder, ".consent"))).toBe(true);
  });

  // backslashes separate folders only on Windows
  it.skipIf(process.platform !== "win32")("denies a Read whose path is written with backslashes", () => {
    expect(denies("Read", { file_path: "extractions\\abc123def456\\note.md" })).toBe(true);
  });

  it("leaves unrelated files alone", () => {
    expect(decision("Read", { file_path: "package.json" })).toBeUndefined();
    expect(decision("Grep", { pattern: "TA", path: "src" })).toBeUndefined();
  });

  it("a yes to a command naming the note's folder clears it; a yes to an unrelated command does not", () => {
    hook({ hook_event_name: "PostToolUse", tool_name: "Bash", tool_input: { command: "ls" } });
    expect(existsSync(join(folder, ".consent"))).toBe(false);
    hook({ hook_event_name: "PostToolUse", tool_name: "Bash", tool_input: { command: "cat extractions/abc123def456/note.md" } });
    expect(existsSync(join(folder, ".consent"))).toBe(true);
    expect(decision("Bash", { command: "cat extractions/*/note.md" })).toBeUndefined();
    expect(decision("Read", { file_path: "other/link/note.md" })).toBeUndefined();
  });

  it("never lets an extraction page be published, even a cleared one or a copy", () => {
    writeFileSync(join(folder, ".consent"), "x");
    expect(denies("Artifact", { file_path: "extractions/abc123def456/artifact.html" })).toBe(true);
    expect(decision("Artifact", { file_path: "docs/page.html" })).toBeUndefined();
    writeFileSync(join(dir, "other", "copy.html"), EXTRACT_ARTIFACT_HTML);
    expect(denies("Artifact", { file_path: "other/copy.html" })).toBe(true);
    // the live page as `extract --serve` sends it
    writeFileSync(join(dir, "other", "live.html"), EXTRACT_ARTIFACT_HTML.replace("__TITLE__", "Note extraction").replace("__DATA__", '{"live":true}'));
    expect(denies("Artifact", { file_path: "other/live.html" })).toBe(true);
  });
});
