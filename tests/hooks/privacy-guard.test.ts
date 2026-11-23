import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const HOOK = join(__dirname, "../../plugin/hooks/privacy-guard.mjs");
const decision = (tool_name: string, command: string) => {
  const out = execFileSync("node", [HOOK], { input: JSON.stringify({ hook_event_name: "PreToolUse", tool_name, tool_input: { command } }) }).toString();
  return out ? JSON.parse(out).hookSpecificOutput.permissionDecision : undefined;
};

describe("privacy-guard hook", () => {
  it("denies git push from Bash and from PowerShell", () => {
    expect(decision("Bash", "git push origin main")).toBe("deny");
    expect(decision("PowerShell", "git push origin main")).toBe("deny");
  });

  it("lets safe commands and other tools through", () => {
    expect(decision("PowerShell", "git status")).toBeUndefined();
    expect(decision("Read", "git push")).toBeUndefined();
  });
});
