import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const HOOK = join(__dirname, "../../plugin/hooks/track-workflow.mjs");
// Runs the hook in a fresh project folder and returns the marker files left in its state folder.
const markers = (command: string, { active = true, tool_name = "Bash" } = {}) => {
  const projectDir = mkdtempSync(join(tmpdir(), "track-workflow-"));
  const stateDir = join(projectDir, ".claude", "hooks-state");
  if (active) {
    mkdirSync(stateDir, { recursive: true });
    writeFileSync(join(stateDir, ".workflow_active"), "");
  }
  execFileSync("node", [HOOK], {
    input: JSON.stringify({ hook_event_name: "PostToolUse", tool_name, tool_input: { command } }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
  });
  return existsSync(stateDir) ? readdirSync(stateDir).sort() : [];
};

describe("track-workflow hook", () => {
  it("marks the dev server as up on npm run dev", () => {
    expect(markers("npm run dev")).toEqual([".dev_server_up", ".workflow_active"]);
  });

  it("marks QA as started on a type check", () => {
    expect(markers("npx tsc --noEmit")).toEqual([".qa_started", ".workflow_active"]);
  });

  it("marks QA on a CLI calculator run but not on an overlay drain", () => {
    expect(markers("node plugin/scripts/medprotocol.cjs bmi --weight 70 --height 175")).toContain(".qa_started");
    expect(markers("node plugin/scripts/medprotocol.cjs overlay drain")).toEqual([".workflow_active"]);
  });

  it("tracks PowerShell too and ignores other tools", () => {
    expect(markers("npm run dev", { tool_name: "PowerShell" })).toContain(".dev_server_up");
    expect(markers("npm run dev", { tool_name: "Read" })).toEqual([".workflow_active"]);
  });

  it("creates nothing when no workflow is active", () => {
    expect(markers("npm run dev", { active: false })).toEqual([]);
    expect(markers("npx tsc --noEmit", { active: false })).toEqual([]);
  });

  it("exits cleanly on empty or invalid stdin", () => {
    expect(() => execFileSync("node", [HOOK], { input: "" })).not.toThrow();
    expect(() => execFileSync("node", [HOOK], { input: "not json" })).not.toThrow();
  });
});
