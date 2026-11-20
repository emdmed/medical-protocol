import { describe, it, expect, beforeEach } from "vitest";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mergeSettings, hookIssues } from "../../packages/medical-protocol/src/settings";

const PLUGIN = join(__dirname, "../../plugin");
let dir: string;
const settings = () => JSON.parse(readFileSync(join(dir, ".claude/settings.json"), "utf8"));
const commands = () => JSON.stringify(settings().hooks);

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "settings-"));
  mkdirSync(join(dir, ".claude/hooks"), { recursive: true });
  for (const f of ["privacy-guard.mjs", "extraction-guard.mjs", "note-consent.mjs", "qa-reminder.mjs", "track-workflow.mjs"]) writeFileSync(join(dir, ".claude/hooks", f), "");
});

describe("installer settings merge", () => {
  it("registers every plugin hook in settings.json, run from the project", () => {
    mergeSettings(dir, PLUGIN);
    expect(commands()).toContain('${CLAUDE_PROJECT_DIR}/.claude/hooks/note-consent.mjs');
    expect(commands()).not.toContain("CLAUDE_PLUGIN_ROOT");
    expect(settings().hooks.PreToolUse.length).toBeGreaterThan(1);
    expect(hookIssues(dir, PLUGIN)).toEqual([]);
  });

  it("keeps the doctor's own hooks and permissions, and doesn't duplicate ours on update", () => {
    const own = { matcher: "Bash", hooks: [{ type: "command", command: "node mine.mjs" }] };
    writeFileSync(join(dir, ".claude/settings.json"), JSON.stringify({ model: "x", permissions: { allow: ["Bash(ls)"] }, hooks: { PreToolUse: [own] } }));
    mergeSettings(dir, PLUGIN);
    const once = commands();
    mergeSettings(dir, PLUGIN);
    expect(commands()).toBe(once);
    expect(settings().hooks.PreToolUse[0]).toEqual(own);
    expect(settings().permissions.allow).toContain("Bash(ls)");
    expect(settings().model).toBe("x");
  });

  it("refuses to overwrite settings it can't parse", () => {
    writeFileSync(join(dir, ".claude/settings.json"), "{ // comment\n}");
    expect(() => mergeSettings(dir, PLUGIN)).toThrow(/Can't parse/);
    expect(readFileSync(join(dir, ".claude/settings.json"), "utf8")).toBe("{ // comment\n}");
  });

  it("reports hooks that aren't active", () => {
    expect(hookIssues(dir, PLUGIN).some((i) => i.includes("note-consent.mjs"))).toBe(true);
    mergeSettings(dir, PLUGIN);
    rmSync(join(dir, ".claude/hooks/note-consent.mjs"));
    expect(hookIssues(dir, PLUGIN)).toContain("Safety hook file missing: .claude/hooks/note-consent.mjs. Run 'medical-protocol update'.");
  });
});
