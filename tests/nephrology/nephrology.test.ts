import { describe, it, expect } from "vitest";
import {
  classifyLDL,
  classifyHbA1c,
  classifyBPInCKD,
  classifyTriglycerides,
  classifyLpa,
  classifyNonHDL,
  classifyApoB,
  calculateCaPhProduct,
  calculateCorrectedCalcium,
  classifyCalcium,
  classifyPhosphorus,
  classifyPTH,
  classifyVitaminD,
  classifyCaPhProduct,
  classifyHemoglobin,
  classifyFerritin,
  classifyTSAT,
  needsIronSupplementation,
  classifyAnemiaBySex,
  checkESAEligibility,
  getPhosphateRecommendation,
  getPTHRecommendation,
  getVitaminDRecommendation,
  getCKDMBDMonitoring,
  calculateNonHDL,
  getStatinIndication,
} from "../../plugin/lib/nephrology";
import { assessPhosphate, assessPTH, classifyAnemia } from "../../plugin/lib/ckd";

describe("cardio-metabolic classifiers", () => {
  it("LDL boundaries", () => {
    expect(classifyLDL("0").label).toBe("—");
    expect(classifyLDL("69").label).toBe("Optimal");
    expect(classifyLDL("99").label).toBe("Acceptable");
    expect(classifyLDL("129").severity).toBe("warning");
    expect(classifyLDL("130").severity).toBe("critical");
  });

  it("HbA1c boundaries", () => {
    expect(classifyHbA1c("5.6").label).toBe("Normal");
    expect(classifyHbA1c("6.0").label).toBe("Prediabetes");
    expect(classifyHbA1c("7.0").label).toBe("Controlled diabetic");
    expect(classifyHbA1c("8.0").severity).toBe("critical");
  });

  it("BP in CKD (KDIGO 2021 target <120/80)", () => {
    expect(classifyBPInCKD("118", "78").label).toBe("On target");
    expect(classifyBPInCKD("135", "85").label).toBe("Above target");
    expect(classifyBPInCKD("150", "95").severity).toBe("critical");
    expect(classifyBPInCKD("0", "80").label).toBe("—");
  });

  it("triglycerides / Lp(a) / non-HDL / ApoB", () => {
    expect(classifyTriglycerides("149").label).toBe("Normal");
    expect(classifyTriglycerides("500").severity).toBe("critical");
    expect(classifyLpa("29").label).toBe("Normal");
    expect(classifyLpa("50").severity).toBe("critical");
    expect(classifyNonHDL(99).label).toBe("Optimal");
    expect(classifyNonHDL(160).severity).toBe("critical");
    expect(classifyNonHDL(0).label).toBe("—");
    expect(classifyApoB("79").label).toBe("Optimal");
    expect(classifyApoB("120").severity).toBe("critical");
  });
});

describe("phospho-calcic calculations", () => {
  it("Ca x P product (null when missing)", () => {
    expect(calculateCaPhProduct("10", "5")).toBe(50);
    expect(calculateCaPhProduct("0", "5")).toBeNull();
  });

  it("albumin-corrected calcium: Ca + 0.8*(4 - albumin)", () => {
    expect(calculateCorrectedCalcium("8", "3")).toBe(8.8);
    expect(calculateCorrectedCalcium("10", "4")).toBe(10);
    expect(calculateCorrectedCalcium("0", "4")).toBeNull();
  });

  it("calcium / phosphorus ranges", () => {
    expect(classifyCalcium("8.0").label).toBe("Hypocalcemia");
    expect(classifyCalcium("9.5").label).toBe("Normal");
    expect(classifyCalcium("11").label).toBe("Hypercalcemia");
    expect(classifyPhosphorus("2.0").label).toBe("Hypophosphatemia");
    expect(classifyPhosphorus("3.5").label).toBe("Normal");
    expect(classifyPhosphorus("5.0").label).toBe("Hyperphosphatemia");
  });

  it("PTH targets vary by CKD stage", () => {
    expect(classifyPTH("70").label).toBe("Elevated");
    expect(classifyPTH("40").label).toBe("Normal");
    // advanced CKD tolerates higher PTH
    // G4–G5 target is 2–9× ULN (130–585), matching ckd.assessPTH
    expect(classifyPTH("200", "G5").severity).toBe("normal");
    expect(classifyPTH("600", "G5").severity).toBe("critical");
    expect(classifyPTH("100", "G5").severity).toBe("warning");
    expect(classifyPTH("100", "G5").label).toMatch(/over-suppression/);
  });

  it("vitamin D and Ca x P product", () => {
    expect(classifyVitaminD("15").label).toBe("Deficiency");
    expect(classifyVitaminD("25").label).toBe("Insufficiency");
    expect(classifyVitaminD("35").label).toBe("Sufficient");
    expect(classifyCaPhProduct(50).severity).toBe("normal");
    expect(classifyCaPhProduct(55).severity).toBe("critical");
  });
});

describe("anemia classifiers", () => {
  it("hemoglobin ranges", () => {
    expect(classifyHemoglobin("6").label).toBe("Severe anemia");
    expect(classifyHemoglobin("9").label).toBe("Below ESA target");
    expect(classifyHemoglobin("11").label).toBe("Within ESA target");
    expect(classifyHemoglobin("12.5").severity).toBe("warning");
    expect(classifyHemoglobin("14").severity).toBe("critical");
  });

  it("ferritin and TSAT", () => {
    expect(classifyFerritin("90").label).toBe("Absolute deficiency");
    expect(classifyFerritin("150").label).toBe("Low stores");
    expect(classifyFerritin("900").label).toBe("Overload");
    expect(classifyTSAT("15").label).toBe("Functional deficiency");
    expect(classifyTSAT("60").label).toBe("Oversaturation");
    expect(classifyTSAT("30").label).toBe("Adequate");
  });

  it("iron supplementation need", () => {
    expect(needsIronSupplementation("90", "30").needed).toBe(true); // ferritin <100
    expect(needsIronSupplementation("300", "15").needed).toBe(true); // TSAT <20
    expect(needsIronSupplementation("150", "25").needed).toBe(true); // <200 & <30
    expect(needsIronSupplementation("300", "40").needed).toBe(false);
    expect(needsIronSupplementation("0", "0").needed).toBe(false);
  });

  it("sex-specific anemia thresholds", () => {
    expect(classifyAnemiaBySex("12.5", "male").anemic).toBe(true);
    expect(classifyAnemiaBySex("12.5", "female").anemic).toBe(false);
    expect(classifyAnemiaBySex("8", "male").label).toBe("Moderate anemia");
    expect(classifyAnemiaBySex("6", "female").label).toBe("Severe anemia");
  });

  it("ESA eligibility: Hb <10 with replete iron", () => {
    expect(checkESAEligibility("9", "150", "25", "male").eligible).toBe(true);
    expect(checkESAEligibility("9", "90", "25", "male").eligible).toBe(false); // iron deficient
    expect(checkESAEligibility("11", "150", "25", "male").eligible).toBe(false); // Hb >=10
    expect(checkESAEligibility("14", "150", "25", "male").eligible).toBe(false); // not anemic
  });
});

describe("phospho-calcic recommendations", () => {
  it("phosphate recommendation by stage", () => {
    expect(getPhosphateRecommendation("3.5", "G4").status).toBe("normal");
    expect(getPhosphateRecommendation("5.0", "G4").status).toBe("high");
    expect(getPhosphateRecommendation("2.0", "G4").status).toBe("low");
    expect(getPhosphateRecommendation("0").status).toBe("unknown");
  });

  it("PTH recommendation: 2-9x UNL acceptable in G4/G5", () => {
    expect(getPTHRecommendation("100").status).toBe("high");
    expect(getPTHRecommendation("50").status).toBe("normal");
    expect(getPTHRecommendation("300", "G5").status).toBe("acceptable"); // between 130 and 585
    expect(getPTHRecommendation("100", "G5").status).toBe("low"); // below 2x UNL
    expect(getPTHRecommendation("600", "G5").status).toBe("high"); // above 9x UNL
  });

  it("vitamin D recommendation", () => {
    expect(getVitaminDRecommendation("15").status).toBe("deficient");
    expect(getVitaminDRecommendation("25").status).toBe("insufficient");
    expect(getVitaminDRecommendation("35").status).toBe("sufficient");
  });

  it("CKD-MBD monitoring frequency by stage", () => {
    expect(getCKDMBDMonitoring("G5").pth).toBe("Every 3–6 months");
    expect(getCKDMBDMonitoring("G4").phosphate).toBe("Every 6–12 months");
    expect(getCKDMBDMonitoring("G2").phosphate).toBe("Not routinely monitored");
  });
});

describe("iron therapy (KDIGO 2012)", () => {
  it("trial of iron when TSAT ≤30% and ferritin ≤500", () => {
    expect(needsIronSupplementation("300", "25").needed).toBe(true);
    expect(needsIronSupplementation("300", "35").needed).toBe(false);
  });
  it("not routine when ferritin >500, even with low TSAT", () => {
    expect(needsIronSupplementation("600", "15").needed).toBe(false);
  });
  it("needs both values for the trial rule", () => {
    expect(needsIronSupplementation("300", "").needed).toBe(false);
    expect(needsIronSupplementation("50", "").needed).toBe(true);
  });
});

describe("agrees with ckd.ts", () => {
  it("phosphate, PTH, anemia match the core functions", () => {
    for (const g of ["G2", "G3a", "G4", "G5"]) {
      for (const v of ["2.0", "3.5", "5.0"]) expect(getPhosphateRecommendation(v, g)).toEqual(assessPhosphate(v, g));
      for (const v of ["50", "100", "300", "700"]) expect(getPTHRecommendation(v, g)).toEqual(assessPTH(v, g));
    }
    for (const [hb, sex] of [["14", "male"], ["12.5", "male"], ["12.5", "female"], ["8", "f"], ["6", "male"]]) {
      expect(classifyAnemiaBySex(hb, sex).anemic).toBe(classifyAnemia(hb, sex).anemic);
    }
  });
});

describe("calculateNonHDL", () => {
  it("total cholesterol minus HDL", () => {
    expect(calculateNonHDL("200", "50")).toBe(150);
    expect(calculateNonHDL("", "50")).toBeNull();
    expect(calculateNonHDL("40", "50")).toBeNull();
  });
});

describe("getStatinIndication (KDIGO 2013)", () => {
  const base = { age: 55, gfrCategory: "G3a" };
  it("≥50 with eGFR <60 → statin or statin/ezetimibe (1A)", () => {
    expect(getStatinIndication(base)).toMatchObject({ indicated: true, grade: "1A" });
  });
  it("≥50 with eGFR ≥60 → statin (1B)", () => {
    expect(getStatinIndication({ ...base, gfrCategory: "G2" })).toMatchObject({ indicated: true, grade: "1B" });
  });
  it("18–49 needs a risk factor (2A)", () => {
    expect(getStatinIndication({ age: 40, gfrCategory: "G4" }).indicated).toBe(false);
    expect(getStatinIndication({ age: 40, gfrCategory: "G4", hasDiabetes: true })).toMatchObject({ indicated: true, grade: "2A" });
  });
  it("dialysis: do not initiate, continue if already on one", () => {
    expect(getStatinIndication({ ...base, gfrCategory: "G5", onDialysis: true }).indicated).toBe(false);
    expect(getStatinIndication({ ...base, gfrCategory: "G5", onDialysis: true, alreadyOnStatin: true }).indicated).toBe(true);
  });
  it("transplant recipient → statin at any adult age (2B)", () => {
    expect(getStatinIndication({ age: 30, gfrCategory: "G2", kidneyTransplant: true })).toMatchObject({ indicated: true, grade: "2B" });
  });
  it("needs age ≥18 and a GFR category", () => {
    expect(getStatinIndication({ age: null, gfrCategory: "G3a" }).indicated).toBe(false);
    expect(getStatinIndication({ age: 60, gfrCategory: "" }).indicated).toBe(false);
  });
});
