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
} from "../../../../lib/ckd";
import { formatHeader, formatTable, printResult, formatError } from "../format";

const USAGE = `Usage: medprotocol ckd <sub-command> [options]

Sub-commands:
  egfr         Calculate eGFR (CKD-EPI 2021)
  stage        Full CGA staging (eGFR + albuminuria + risk)
  kfre         Kidney Failure Risk Equation (4-variable)
  treatment    Treatment eligibility (RASi, SGLT2i, finerenone)

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

Global options:
  --json                   Output as JSON
  --help                   Show this help

Examples:
  medprotocol ckd egfr --creatinine 1.2 --age 55 --sex male
  medprotocol ckd stage --creatinine 1.2 --age 55 --sex male --acr 45
  medprotocol ckd kfre --age 65 --sex female --egfr 35 --acr 300
  medprotocol ckd treatment --egfr 35 --acr 300 --diabetes`;

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
    default:
      process.stderr.write(
        formatError(`Unknown sub-command: ${subcommand}`) +
          "\n\nAvailable: egfr, stage, kfre, treatment\n",
      );
      process.exitCode = 1;
  }
};
