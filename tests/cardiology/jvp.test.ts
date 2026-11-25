import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { calculateJVPcmH2O, getJVPCategory, getJVPSeverity } from "../../plugin/lib/cardiology";
import { run } from "../../packages/medprotocol/src/commands/cardiology";

describe("JVP (McGee: Elevated strictly above 8 cmH2O to the right atrium)", () => {
  it("8 cmH2O is Normal", () => {
    expect(getJVPCategory(8)).toBe("Normal");
    expect(getJVPSeverity(8)).toBe("normal");
  });

  it("9 cmH2O is Elevated", () => {
    expect(getJVPCategory(9)).toBe("Elevated");
    expect(getJVPSeverity(9)).toBe("elevated");
  });

  it("4 cm above the sternal angle is 9 cmH2O, Elevated", () => {
    const cmH2O = calculateJVPcmH2O("4", "sternal-angle");
    expect(cmH2O).toBe(9);
    expect(getJVPCategory(cmH2O!)).toBe("Elevated");
  });

  it("returns null for non-numbers and implausible heights", () => {
    expect(calculateJVPcmH2O("", "right-atrium")).toBeNull();
    expect(calculateJVPcmH2O("abc", "right-atrium")).toBeNull();
    expect(calculateJVPcmH2O("-1", "right-atrium")).toBeNull();
    expect(calculateJVPcmH2O("41", "right-atrium")).toBeNull();
  });
});

describe("medprotocol cardiology jvp", () => {
  let stdout: string;
  let stderr: string;
  beforeEach(() => {
    stdout = "";
    stderr = "";
    vi.spyOn(process.stdout, "write").mockImplementation((s: any) => { stdout += s; return true; });
    vi.spyOn(process.stderr, "write").mockImplementation((s: any) => { stderr += s; return true; });
    process.exitCode = undefined;
  });
  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
  });

  it("--cmh2o 8 is Normal", () => {
    run(["jvp", "--cmh2o", "8", "--json"]);
    expect(JSON.parse(stdout).category).toBe("Normal");
  });

  it("--sternal-angle 4 is 9 cmH2O, Elevated", () => {
    run(["jvp", "--sternal-angle", "4", "--json"]);
    const out = JSON.parse(stdout);
    expect(out).toMatchObject({ cmH2O: 9, reference: "sternal-angle", category: "Elevated" });
  });

  it("refuses with no flag", () => {
    run(["jvp"]);
    expect(stderr).toContain("Give exactly one of --cmh2o or --sternal-angle");
    expect(process.exitCode).toBe(1);
  });

  it("refuses with both flags", () => {
    run(["jvp", "--cmh2o", "9", "--sternal-angle", "4"]);
    expect(process.exitCode).toBe(1);
  });

  it("refuses an implausible height", () => {
    run(["jvp", "--cmh2o", "50"]);
    expect(stderr).toContain("Could not classify JVP");
    expect(process.exitCode).toBe(1);
  });
});
