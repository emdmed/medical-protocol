import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// Runs the built installer end to end, the way a doctor's machine does.
const INSTALLER = join(__dirname, "../../scripts/medical-protocol.cjs");
const OUR_HOOKS = readdirSync(join(__dirname, "../../plugin/hooks")).filter((f) => f.endsWith(".mjs"));
let dir: string;
const run = (...args: string[]) => execFileSync(process.execPath, [INSTALLER, "-y", ...args, "--dir", dir, "--json"], { encoding: "utf8" });
const settingsText = () => readFileSync(join(dir, ".claude", "settings.json"), "utf8");

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "mp-update-"));
  run("install");
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("installer paths (Windows-safe)", () => {
  it("writes manifest keys with / only", () => {
    const keys = Object.keys(JSON.parse(readFileSync(join(dir, ".claude", "skills", ".manifest.json"), "utf8")).files);
    expect(keys.some((k) => k.split("/").length > 2)).toBe(true); // nested files are covered
    expect(keys.filter((k) => k.includes("\\"))).toEqual([]);
  });

  it("writes hook commands with / only", () => {
    const commands = Object.values(JSON.parse(settingsText()).hooks as Record<string, { hooks: { command: string }[] }[]>)
      .flat()
      .flatMap((g) => g.hooks.map((h) => h.command));
    expect(commands.length).toBeGreaterThan(0);
    expect(commands.filter((c) => c.includes("\\"))).toEqual([]);
  });

  it("leaves each of our hooks registered once after two updates", () => {
    const count = (script: string) => settingsText().split(`/.claude/hooks/${script}`).length - 1;
    const before = Object.fromEntries(OUR_HOOKS.map((h) => [h, count(h)]));
    run("update");
    run("update");
    expect(Object.fromEntries(OUR_HOOKS.map((h) => [h, count(h)]))).toEqual(before);
    expect(JSON.parse(run("check")).issues ?? []).toEqual([]);
  });
});
