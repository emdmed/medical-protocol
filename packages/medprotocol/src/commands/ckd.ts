import { parseArgs } from "node:util";
import {
  calculateEGFR,
  classifyGFRCategory,
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
} from "../../../../lib/ckd";
import { formatHeader, formatTable, printResult, formatError } from "../../../../lib/format";

const USAGE = `Usage: medprotocol ckd <sub-command> [options]

Sub-commands:
  egfr         Calculate eGFR (CKD-EPI 2021)
  stage        Full CGA staging (eGFR + albuminuria + risk)
  kfre         Kidney Failure Risk Equation (4-variable)
  treatment    Treatment eligibility (RASi, SGLT2i, finerenone)
  anemia       CKD anemia assessment (Hb, iron, ESA eligibility)
  mbd          CKD-MBD assessment (phosphate, calcium, PTH, vitamin D)

eGFR options:
  --creatinine <number>    Serum creatinine mg/dL (required)
  --age <number>           Age in years (required)
  --sex <male|female>      Sex (required)

Stage options (eGFR options plus):
  --acr <number>           Urine albumin-to-creatinine ratio mg/g (required)

KFRE options:
  --age <number>           Age in years (required)
  --sex <male|female>      Sex (required)
  --egfr <number>          eGFR mL/min/1.73m² (required)
  --acr <number>           ACR mg/g (required)

Treatment options:
  --egfr <number>          eGFR mL/min/1.73m² (required)
  --acr <number>           ACR mg/g (required)
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
  medprotocol ckd anemia --hb 9.5 --sex male --ferritin 80 --tsat 15
  medprotocol ckd mbd --phosphate 5.2 --calcium 8.5 --albumin 3.2 --pth 250 --vitamin-d 18 --gfr-category G4`;

const runEGFR = (argv: string[], json: boolean): void => {
  const { values } = parseArgs({
    args: argv,
    options: {
      creatinine: { type: "string" },
      age: { type: "string" },
      sex: { type: "string" },
      json: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
    strict: true,
  });

  if (values.help) {
    process.stdout.write(USAGE + "\n");
    return;
  }

  const missing: string[] = [];
  if (!values.creatinine) missing.push("--creatinine");
  if (!values.age) missing.push("--age");
  if (!values.sex) missing.push("--sex");

  if (missing.length > 0) {
    process.stderr.write(
      formatError(`Missing required flags: ${missing.join(", ")}`) + "\n\n" + USAGE + "\n",
    );
    process.exitCode = 1;
    return;
  }

  const egfr = calculateEGFR(values.creatinine!, values.age!, values.sex!);
  const gfrCategory = classifyGFRCategory(String(egfr));
  const gfrLabel = getGFRCategoryLabel(gfrCategory);
  const severity = getCKDSeverity(gfrCategory);

  const data = { egfr, gfrCategory, gfrLabel, severity };

  printResult(data, json, () => {
    return [
      formatHeader("eGFR (CKD-EPI 2021)"),
      formatTable([
        ["eGFR", `${egfr} mL/min/1.73m²`],
        ["GFR Category", `${gfrCategory} — ${gfrLabel}`],
        ["Severity", severity],
      ]),
    ].join("\n");
  });
};

const runStage = (argv: string[], json: boolean): void => {
  const { values } = parseArgs({
    args: argv,
    options: {
      creatinine: { type: "string" },
      age: { type: "string" },
      sex: { type: "string" },
      acr: { type: "string" },
      json: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
    strict: true,
  });

  if (values.help) {
    process.stdout.write(USAGE + "\n");
    return;
  }

  const missing: string[] = [];
  if (!values.creatinine) missing.push("--creatinine");
  if (!values.age) missing.push("--age");
  if (!values.sex) missing.push("--sex");
  if (!values.acr) missing.push("--acr");

  if (missing.length > 0) {
    process.stderr.write(
      formatError(`Missing required flags: ${missing.join(", ")}`) + "\n\n" + USAGE + "\n",
    );
    process.exitCode = 1;
    return;
  }

  const egfr = calculateEGFR(values.creatinine!, values.age!, values.sex!);
  const gfrCategory = classifyGFRCategory(String(egfr));
  const gfrLabel = getGFRCategoryLabel(gfrCategory);
  const albCategory = classifyAlbuminuriaCategory(values.acr!);
  const albLabel = getAlbuminuriaCategoryLabel(albCategory);
  const riskLevel = getCKDRiskLevel(gfrCategory, albCategory);
  const monitoring = getMonitoringFrequency(gfrCategory, albCategory);
  const severity = getCKDSeverity(gfrCategory);

  const data = {
    egfr, gfrCategory, gfrLabel,
    acr: parseFloat(values.acr!), albCategory, albLabel,
    riskLevel, monitoringPerYear: monitoring, severity,
  };

  printResult(data, json, () => {
    return [
      formatHeader("CKD CGA Staging (KDIGO)"),
      formatTable([
        ["eGFR", `${egfr} mL/min/1.73m²`],
        ["GFR Category", `${gfrCategory} — ${gfrLabel}`],
        ["ACR", `${values.acr} mg/g`],
        ["Albuminuria", `${albCategory} — ${albLabel}`],
        ["Risk Level", riskLevel],
        ["Monitoring", `${monitoring}×/year`],
        ["Severity", severity],
      ]),
    ].join("\n");
  });
};

const runKFRE = (argv: string[], json: boolean): void => {
  const { values } = parseArgs({
    args: argv,
    options: {
      age: { type: "string" },
      sex: { type: "string" },
      egfr: { type: "string" },
      acr: { type: "string" },
      json: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
    strict: true,
  });

  if (values.help) {
    process.stdout.write(USAGE + "\n");
    return;
  }

  const missing: string[] = [];
  if (!values.age) missing.push("--age");
  if (!values.sex) missing.push("--sex");
  if (!values.egfr) missing.push("--egfr");
  if (!values.acr) missing.push("--acr");

  if (missing.length > 0) {
    process.stderr.write(
      formatError(`Missing required flags: ${missing.join(", ")}`) + "\n\n" + USAGE + "\n",
    );
    process.exitCode = 1;
    return;
  }

  const kfre = calculateKFRE(values.age!, values.sex!, values.egfr!, values.acr!);
  const referral = assessReferralNeed(String(kfre.fiveYear));

  const data = {
    twoYearRisk: kfre.twoYear,
    fiveYearRisk: kfre.fiveYear,
    referral,
  };

  printResult(data, json, () => {
    return [
      formatHeader("Kidney Failure Risk (KFRE 4-var)"),
      formatTable([
        ["2-Year Risk", `${kfre.twoYear}%`],
        ["5-Year Risk", `${kfre.fiveYear}%`],
        ["Referral", referral],
      ]),
    ].join("\n");
  });
};

const runTreatment = (argv: string[], json: boolean): void => {
  const { values } = parseArgs({
    args: argv,
    options: {
      egfr: { type: "string" },
      acr: { type: "string" },
      diabetes: { type: "boolean", default: false },
      "heart-failure": { type: "boolean", default: false },
      "on-rasi": { type: "boolean", default: false },
      "potassium-normal": { type: "boolean", default: false },
      json: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
    strict: true,
  });

  if (values.help) {
    process.stdout.write(USAGE + "\n");
    return;
  }

  const missing: string[] = [];
  if (!values.egfr) missing.push("--egfr");
  if (!values.acr) missing.push("--acr");

  if (missing.length > 0) {
    process.stderr.write(
      formatError(`Missing required flags: ${missing.join(", ")}`) + "\n\n" + USAGE + "\n",
    );
    process.exitCode = 1;
    return;
  }

  const gfrCategory = classifyGFRCategory(values.egfr!);
  const albCategory = classifyAlbuminuriaCategory(values.acr!);

  const rasi = checkRASiEligibility(gfrCategory, albCategory, values.diabetes!);
  const sglt2i = checkSGLT2iEligibility(values.egfr!, values.acr!, values["heart-failure"]!);
  const finerenone = checkFinerenoneEligibility(
    values.egfr!, values.acr!, values.diabetes!,
    values["on-rasi"]!, values["potassium-normal"]!,
  );

  const data = {
    gfrCategory, albCategory,
    rasi, sglt2i, finerenone,
  };

  const eligible = (r: { eligible: boolean; grade: string }) =>
    r.eligible ? `Yes (Grade ${r.grade})` : "No";

  printResult(data, json, () => {
    return [
      formatHeader("CKD Treatment Eligibility"),
      formatTable([
        ["GFR Category", gfrCategory],
        ["Albuminuria", albCategory],
        ["ACEi/ARB (RASi)", eligible(rasi)],
        ["SGLT2i", eligible(sglt2i)],
        ["Finerenone", eligible(finerenone)],
      ]),
    ].join("\n");
  });
};

const runAnemia = (argv: string[], json: boolean): void => {
  const { values } = parseArgs({
    args: argv,
    options: {
      hb: { type: "string" },
      sex: { type: "string" },
      ferritin: { type: "string" },
      tsat: { type: "string" },
      json: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
    strict: true,
  });

  if (values.help) {
    process.stdout.write(USAGE + "\n");
    return;
  }

  const missing: string[] = [];
  if (!values.hb) missing.push("--hb");
  if (!values.sex) missing.push("--sex");

  if (missing.length > 0) {
    process.stderr.write(
      formatError(`Missing required flags: ${missing.join(", ")}`) + "\n\n" + USAGE + "\n",
    );
    process.exitCode = 1;
    return;
  }

  const anemia = classifyAnemia(values.hb!, values.sex!);
  const iron = values.ferritin && values.tsat
    ? assessIronStatus(values.ferritin, values.tsat)
    : null;
  const esa = values.ferritin && values.tsat
    ? checkESAEligibility(values.hb!, values.ferritin, values.tsat, values.sex!)
    : null;

  const data = { anemia, iron, esa };

  printResult(data, json, () => {
    const rows: [string, string][] = [
      ["Anemic", anemia.anemic ? "Yes" : "No"],
      ["Severity", anemia.severity],
    ];
    if (iron) {
      rows.push(["Iron Deficient", iron.ironDeficient ? "Yes" : "No"]);
      rows.push(["Iron Recommendation", iron.recommendation]);
    }
    if (esa) {
      rows.push(["ESA Eligible", esa.eligible ? "Yes" : "No"]);
      rows.push(["ESA Reason", esa.reason]);
    }
    return [
      formatHeader("CKD Anemia Assessment"),
      formatTable(rows),
    ].join("\n");
  });
};

const runMBD = (argv: string[], json: boolean): void => {
  const { values } = parseArgs({
    args: argv,
    options: {
      phosphate: { type: "string" },
      calcium: { type: "string" },
      albumin: { type: "string" },
      pth: { type: "string" },
      "vitamin-d": { type: "string" },
      "gfr-category": { type: "string" },
      json: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
    strict: true,
  });

  if (values.help) {
    process.stdout.write(USAGE + "\n");
    return;
  }

  if (!values["gfr-category"]) {
    process.stderr.write(
      formatError("Missing required flag: --gfr-category") + "\n\n" + USAGE + "\n",
    );
    process.exitCode = 1;
    return;
  }

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

  printResult(data, json, () => {
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
    return [
      formatHeader("CKD-MBD Assessment"),
      formatTable(rows),
    ].join("\n");
  });
};

export const run = (argv: string[]): void => {
  const subcommand = argv[0];
  const subArgs = argv.slice(1);

  const json = subArgs.includes("--json");

  if (!subcommand || subcommand === "--help" || subcommand === "-h") {
    process.stdout.write(USAGE + "\n");
    return;
  }

  switch (subcommand) {
    case "egfr":
      runEGFR(subArgs, json);
      break;
    case "stage":
      runStage(subArgs, json);
      break;
    case "kfre":
      runKFRE(subArgs, json);
      break;
    case "treatment":
      runTreatment(subArgs, json);
      break;
    case "anemia":
      runAnemia(subArgs, json);
      break;
    case "mbd":
      runMBD(subArgs, json);
      break;
    default:
      process.stderr.write(
        formatError(`Unknown sub-command: ${subcommand}`) +
          "\n\nAvailable: egfr, stage, kfre, treatment, anemia, mbd\n",
      );
      process.exitCode = 1;
  }
};
