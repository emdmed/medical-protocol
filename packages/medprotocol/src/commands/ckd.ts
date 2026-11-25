import {
  type ACRUnit,
  calculateEGFR,
  classifyGFRCategory,
  acrInMgPerG,
  classifyAlbuminuriaCategory,
  getGFRCategoryLabel,
  getAlbuminuriaCategoryLabel,
  getCKDRiskLevel,
  getMonitoringFrequency,
  calculateKFRE,
  assessReferralNeed,
  checkRASiEligibility,
  checkSGLT2iEligibility,
  checkFinerenoneEligibility,
  getCKDSeverity,
  classifyAnemia,
  assessIronStatus,
  checkESAEligibility,
  assessPhosphate,
  correctCalcium,
  assessPTH,
  assessVitaminD,
  getCKDMBDMonitoring,
} from "../../../../plugin/lib/ckd";
import { fail, parseFlags, printTable, requireFlags, runSubcommand } from "../cli";

const USAGE = `Usage: medprotocol ckd <sub-command> [options]

Sub-commands:
  egfr         Calculate eGFR (CKD-EPI 2021)
  stage        Full CGA staging (eGFR + albuminuria + risk)
  kfre         Kidney Failure Risk Equation (4-variable)
  treatment    Guideline criteria met (RASi, SGLT2i, finerenone)
  anemia       CKD anemia assessment (Hb, iron, ESA criteria)
  mbd          CKD-MBD assessment (phosphate, calcium, PTH, vitamin D)

eGFR options:
  --creatinine <number>    Serum creatinine mg/dL (required)
  --age <number>           Age in years (required)
  --sex <male|female>      Sex (required)

Stage options (eGFR options plus):
  --acr <number>           Urine albumin-to-creatinine ratio (required)
  --acr-unit <mg/g|mg/mmol>  Unit of --acr (default mg/g). mg/mmol is read against KDIGO's cut-offs for that unit

KFRE options:
  --age <number>           Age in years (required)
  --sex <male|female>      Sex (required)
  --egfr <number>          eGFR mL/min/1.73m² (required)
  --acr <number>           ACR (required)
  --acr-unit <mg/g|mg/mmol>  Unit of --acr (default mg/g)

Treatment options:
  --egfr <number>          eGFR mL/min/1.73m² (required)
  --acr <number>           ACR (required)
  --acr-unit <mg/g|mg/mmol>  Unit of --acr (default mg/g)
  --diabetes               Has diabetes
  --heart-failure          Has heart failure
  --on-rasi                On maximum tolerated RASi
  --potassium-normal       Serum potassium is normal

Anemia options:
  --hb <number>            Hemoglobin g/dL (required)
  --sex <male|female>      Sex (required)
  --ferritin <number>      Serum ferritin ng/mL
  --tsat <number>          Transferrin saturation %

MBD options:
  --phosphate <number>     Serum phosphate mg/dL
  --calcium <number>       Serum calcium mg/dL
  --albumin <number>       Serum albumin g/dL
  --pth <number>           Intact PTH pg/mL
  --vitamin-d <number>     25-OH vitamin D ng/mL
  --gfr-category <G1-G5>  GFR category (required)

Global options:
  --json                   Output as JSON
  --help                   Show this help

Examples:
  medprotocol ckd egfr --creatinine 1.2 --age 55 --sex male
  medprotocol ckd stage --creatinine 1.2 --age 55 --sex male --acr 45
  medprotocol ckd kfre --age 65 --sex female --egfr 35 --acr 300
  medprotocol ckd treatment --egfr 35 --acr 300 --diabetes
  medprotocol ckd treatment --egfr 35 --acr 30 --acr-unit mg/mmol --diabetes
  medprotocol ckd anemia --hb 9.5 --sex male --ferritin 80 --tsat 15
  medprotocol ckd mbd --phosphate 5.2 --calcium 8.5 --albumin 3.2 --pth 250 --vitamin-d 18 --gfr-category G4`;

// calculateEGFR returns 0 when it cannot calculate; staging that 0 would report G5.
const failNotCalculated = (): void => fail("eGFR not calculated: CKD-EPI 2021 needs age 18 or older and creatinine above 0");

// an unknown unit is refused, never read as mg/g
const badAcrUnit = (unit: string): boolean => {
  if (unit === "mg/g" || unit === "mg/mmol") return false;
  fail(`--acr-unit must be mg/g or mg/mmol, got "${unit}"`);
  return true;
};

const runEGFR = (argv: string[]): void => {
  const values = parseFlags(argv, {
    creatinine: { type: "string" },
    age: { type: "string" },
    sex: { type: "string" },
  }, USAGE);
  if (!values) return;

  if (!requireFlags(values, ["creatinine", "age", "sex"], USAGE)) return;

  const egfr = calculateEGFR(values.creatinine!, values.age!, values.sex!);
  if (egfr === 0) return failNotCalculated();
  const gfrCategory = classifyGFRCategory(String(egfr));
  const gfrLabel = getGFRCategoryLabel(gfrCategory);
  const severity = getCKDSeverity(gfrCategory);

  const data = { egfr, gfrCategory, gfrLabel, severity };

  printTable(data, values.json, "eGFR (CKD-EPI 2021)", [
    ["eGFR", `${egfr} mL/min/1.73m²`],
    ["GFR Category", `${gfrCategory} — ${gfrLabel}`],
    ["Severity", severity],
  ]);
};

const runStage = (argv: string[]): void => {
  const values = parseFlags(argv, {
    creatinine: { type: "string" },
    age: { type: "string" },
    sex: { type: "string" },
    acr: { type: "string" },
    "acr-unit": { type: "string", default: "mg/g" },
  }, USAGE);
  if (!values) return;

  if (!requireFlags(values, ["creatinine", "age", "sex", "acr"], USAGE)) return;
  if (badAcrUnit(values["acr-unit"]!)) return;
  const acrUnit = values["acr-unit"] as ACRUnit;

  const egfr = calculateEGFR(values.creatinine!, values.age!, values.sex!);
  if (egfr === 0) return failNotCalculated();
  const gfrCategory = classifyGFRCategory(String(egfr));
  const gfrLabel = getGFRCategoryLabel(gfrCategory);
  const albCategory = classifyAlbuminuriaCategory(values.acr!, acrUnit);
  const albLabel = getAlbuminuriaCategoryLabel(albCategory);
  const riskLevel = getCKDRiskLevel(gfrCategory, albCategory);
  const monitoring = getMonitoringFrequency(gfrCategory, albCategory);
  const severity = getCKDSeverity(gfrCategory);

  const data = {
    egfr, gfrCategory, gfrLabel,
    acr: parseFloat(values.acr!), albCategory, albLabel,
    riskLevel, monitoringPerYear: monitoring, severity,
  };

  printTable(data, values.json, "CKD CGA Staging (KDIGO)", [
    ["eGFR", `${egfr} mL/min/1.73m²`],
    ["GFR Category", `${gfrCategory} — ${gfrLabel}`],
    ["ACR", `${values.acr} ${acrUnit}`],
    ["Albuminuria", `${albCategory} — ${albLabel}`],
    ["Risk Level", riskLevel],
    ["Monitoring", `${monitoring}×/year`],
    ["Severity", severity],
  ]);
};

const runKFRE = (argv: string[]): void => {
  const values = parseFlags(argv, {
    age: { type: "string" },
    sex: { type: "string" },
    egfr: { type: "string" },
    acr: { type: "string" },
    "acr-unit": { type: "string", default: "mg/g" },
  }, USAGE);
  if (!values) return;

  if (!requireFlags(values, ["age", "sex", "egfr", "acr"], USAGE)) return;

  if (badAcrUnit(values["acr-unit"]!)) return;
  // the equation takes mg/g
  const kfre = calculateKFRE(values.age!, values.sex!, values.egfr!, String(acrInMgPerG(values.acr!, values["acr-unit"] as ACRUnit)));
  const referral = assessReferralNeed(String(kfre.fiveYear));

  const data = {
    twoYearRisk: kfre.twoYear,
    fiveYearRisk: kfre.fiveYear,
    referral,
  };

  printTable(data, values.json, "Kidney Failure Risk (KFRE 4-var)", [
    ["2-Year Risk", `${kfre.twoYear}%`],
    ["5-Year Risk", `${kfre.fiveYear}%`],
    ["Referral", referral],
  ]);
};

const runTreatment = (argv: string[]): void => {
  const values = parseFlags(argv, {
    egfr: { type: "string" },
    acr: { type: "string" },
    "acr-unit": { type: "string", default: "mg/g" },
    diabetes: { type: "boolean", default: false },
    "heart-failure": { type: "boolean", default: false },
    "on-rasi": { type: "boolean", default: false },
    "potassium-normal": { type: "boolean", default: false },
  }, USAGE);
  if (!values) return;

  if (!requireFlags(values, ["egfr", "acr"], USAGE)) return;

  if (badAcrUnit(values["acr-unit"]!)) return;
  const acrUnit = values["acr-unit"] as ACRUnit;

  const gfrCategory = classifyGFRCategory(values.egfr!);
  const albCategory = classifyAlbuminuriaCategory(values.acr!, acrUnit);

  const rasi = checkRASiEligibility(gfrCategory, albCategory, values.diabetes!);
  const sglt2i = checkSGLT2iEligibility(values.egfr!, values.acr!, values["heart-failure"]!, acrUnit);
  const finerenone = checkFinerenoneEligibility(
    values.egfr!, values.acr!, values.diabetes!,
    values["on-rasi"]!, values["potassium-normal"]!, acrUnit,
  );

  const data = {
    gfrCategory, albCategory,
    rasi, sglt2i, finerenone,
  };

  const eligible = (r: { eligible: boolean; grade: string }) =>
    r.eligible ? `Criteria met (Grade ${r.grade})` : "Criteria not met";

  printTable(data, values.json, "CKD Guideline Criteria", [
    ["GFR Category", gfrCategory],
    ["Albuminuria", albCategory],
    ["ACEi/ARB (RASi)", eligible(rasi)],
    ["SGLT2i", eligible(sglt2i)],
    ["Finerenone", eligible(finerenone)],
  ]);
};

const runAnemia = (argv: string[]): void => {
  const values = parseFlags(argv, {
    hb: { type: "string" },
    sex: { type: "string" },
    ferritin: { type: "string" },
    tsat: { type: "string" },
  }, USAGE);
  if (!values) return;

  if (!requireFlags(values, ["hb", "sex"], USAGE)) return;

  const anemia = classifyAnemia(values.hb!, values.sex!);
  const iron = values.ferritin && values.tsat
    ? assessIronStatus(values.ferritin, values.tsat)
    : null;
  const esa = values.ferritin && values.tsat
    ? checkESAEligibility(values.hb!, values.ferritin, values.tsat, values.sex!)
    : null;

  const data = { anemia, iron, esa };

  const rows: [string, string][] = [
    ["Anemic", anemia.anemic ? "Yes" : "No"],
    ["Severity", anemia.severity],
  ];
  if (iron) {
    rows.push(["Iron Deficient", iron.ironDeficient ? "Yes" : "No"]);
    rows.push(["Iron Criteria", iron.recommendation]);
  }
  if (esa) {
    rows.push(["ESA Criteria", esa.eligible ? "Met" : "Not met"]);
    rows.push(["ESA Reason", esa.reason]);
  }
  printTable(data, values.json, "CKD Anemia Assessment", rows);
};

const runMBD = (argv: string[]): void => {
  const values = parseFlags(argv, {
    phosphate: { type: "string" },
    calcium: { type: "string" },
    albumin: { type: "string" },
    pth: { type: "string" },
    "vitamin-d": { type: "string" },
    "gfr-category": { type: "string" },
  }, USAGE);
  if (!values) return;

  if (!values["gfr-category"]) return fail("Missing required flag: --gfr-category", USAGE);

  const gfrCat = values["gfr-category"]!;
  const phosphateResult = values.phosphate ? assessPhosphate(values.phosphate, gfrCat) : null;
  const correctedCa = values.calcium && values.albumin
    ? correctCalcium(values.calcium, values.albumin)
    : null;
  const pthResult = values.pth ? assessPTH(values.pth, gfrCat) : null;
  const vitDResult = values["vitamin-d"] ? assessVitaminD(values["vitamin-d"]) : null;
  const monitoring = getCKDMBDMonitoring(gfrCat);

  const data = {
    gfrCategory: gfrCat,
    phosphate: phosphateResult,
    correctedCalcium: correctedCa,
    pth: pthResult,
    vitaminD: vitDResult,
    monitoring,
  };

  const rows: [string, string][] = [
    ["GFR Category", gfrCat],
  ];
  if (phosphateResult) {
    rows.push(["Phosphate", `${phosphateResult.status} — ${phosphateResult.recommendation}`]);
  }
  if (correctedCa !== null) {
    rows.push(["Corrected Ca", `${correctedCa} mg/dL`]);
  }
  if (pthResult) {
    rows.push(["PTH", `${pthResult.status} — ${pthResult.recommendation}`]);
  }
  if (vitDResult) {
    rows.push(["Vitamin D", `${vitDResult.status} — ${vitDResult.recommendation}`]);
  }
  rows.push(["Monitor PO₄", monitoring.phosphate]);
  rows.push(["Monitor Ca", monitoring.calcium]);
  rows.push(["Monitor PTH", monitoring.pth]);
  rows.push(["Monitor Vit D", monitoring.vitaminD]);
  printTable(data, values.json, "CKD-MBD Assessment", rows);
};

export const run = (argv: string[]): void =>
  runSubcommand(argv, USAGE, {
    egfr: runEGFR,
    stage: runStage,
    kfre: runKFRE,
    treatment: runTreatment,
    anemia: runAnemia,
    mbd: runMBD,
  });
