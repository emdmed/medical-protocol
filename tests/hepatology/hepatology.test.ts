import { describe, it, expect } from "vitest";
import {
  calculateFIB4,
  getMASLDRiskStratification,
  getMASLDTreatmentRecommendation,
  countRiskFactors,
} from "../../plugin/lib/hepatology";

describe("calculateFIB4", () => {
  it("returns a neutral result for incomplete inputs", () => {
    expect(calculateFIB4("0", "40", "30", "200")).toEqual({ score: 0, tier: "low", severity: "normal" });
    expect(calculateFIB4("50", "0", "30", "200").tier).toBe("low");
  });

  it("computes the score = (age x AST) / (platelets x sqrt(ALT))", () => {
    // 50 * 40 / (200 * sqrt(25)) = 2000 / 1000 = 2.0
    const r = calculateFIB4("50", "40", "25", "200");
    expect(r.score).toBeCloseTo(2.0, 2);
  });

  it("uses age <65 cutoffs: <1.3 low, >=2.67 high", () => {
    expect(calculateFIB4("40", "10", "40", "300").tier).toBe("low"); // score well under 1.3
    const high = calculateFIB4("60", "120", "20", "60"); // large score
    expect(high.tier).toBe("high");
    expect(high.severity).toBe("critical");
  });

  it("uses raised low cutoff (2.0) for age >=65", () => {
    // age 60: score ~1.75 -> indeterminate; age 66: score ~1.93 -> low (under the 2.0 cutoff)
    expect(calculateFIB4("60", "40", "30", "250").tier).toBe("indeterminate");
    expect(calculateFIB4("66", "40", "30", "250").tier).toBe("low");
  });
});

describe("getMASLDRiskStratification", () => {
  it("high FIB-4 tier refers immediately", () => {
    const r = getMASLDRiskStratification(3.0, "high", "55");
    expect(r.referral).toBe(true);
    expect(r.severity).toBe("critical");
  });

  it("low FIB-4 tier reassesses, no referral", () => {
    const r = getMASLDRiskStratification(0.8, "low", "55");
    expect(r.referral).toBe(false);
    expect(r.severity).toBe("normal");
  });

  it("indeterminate + LSM < 8.0 is low risk", () => {
    expect(getMASLDRiskStratification(1.8, "indeterminate", "55", "6.0").severity).toBe("normal");
  });

  it("indeterminate + LSM >= 8.0 refers", () => {
    expect(getMASLDRiskStratification(1.8, "indeterminate", "55", "9.0").referral).toBe(true);
  });

  it("indeterminate + ELF >= 9.8 refers", () => {
    expect(getMASLDRiskStratification(1.8, "indeterminate", "55", undefined, "10.5").referral).toBe(true);
  });

  it("indeterminate without phase-2 data needs workup", () => {
    const r = getMASLDRiskStratification(1.8, "indeterminate", "55");
    expect(r.severity).toBe("warning");
    expect(r.referral).toBe(false);
  });
});

describe("getMASLDTreatmentRecommendation", () => {
  it("escalates for referral / critical", () => {
    expect(getMASLDTreatmentRecommendation(true, "normal").mash).toContain("resmetirom");
    expect(getMASLDTreatmentRecommendation(false, "critical").mash).toContain("resmetirom");
  });

  it("intermediate guidance for warning", () => {
    expect(getMASLDTreatmentRecommendation(false, "warning").obesity).toContain("5–7%");
  });

  it("routine guidance otherwise", () => {
    expect(getMASLDTreatmentRecommendation(false, "normal").mash).toContain("Routine");
  });
});

describe("countRiskFactors", () => {
  it("counts truthy flags", () => {
    expect(countRiskFactors({ obesity: true, t2dm: true, htn: false })).toBe(2);
    expect(countRiskFactors({})).toBe(0);
  });
});
