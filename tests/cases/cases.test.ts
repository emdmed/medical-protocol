import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const CLI = join(__dirname, "../../plugin/scripts/medprotocol.cjs");
const CASES = readFileSync(join(__dirname, "../../plugin/skills/cases/reference/cases.md"), "utf8");
const sections = CASES.split(/^## /m).slice(1);
const commands = [...CASES.matchAll(/^\*\*Command:\*\* `medprotocol (.+)`$/gm)].map((m) => m[1]);

describe("synthetic cases", () => {
  it("has one command per case, and each case is labelled synthetic", () => {
    expect(commands.length).toBe(sections.length);
    for (const s of sections) expect(s).toContain("Synthetic case.");
  });

  it.each(commands)("the CLI accepts: %s", (cmd) => {
    const out = JSON.parse(execFileSync("node", [CLI, ...cmd.split(" "), "--json"]).toString());
    expect(out).toBeTypeOf("object");
  });
});
