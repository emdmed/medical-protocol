import {
  calculateASCVD,
  getASCVDCategory,
  getASCVDSeverity,
  calculateHEARTScore,
  getHEARTCategory,
  getHEARTAction,
  getHEARTSeverity,
  calculateCHADSVASc,
  getCHADSVAScCategory,
  getCHADSVAScAction,
  getCHADSVAScSeverity,
  calculateJVPcmH2O,
  getJVPCategory,
  getJVPSeverity,
  JVP_LIMITS,
} from "../../../../plugin/lib/cardiology";
import type {
  ASCVDInputs,
  HEARTInputs,
  CHADSVAScInputs,
} from "../../../../plugin/lib/cardiology-types";
import { fail, parseFlags, printTable, requireFlags, runSubcommand } from "../cli";

const USAGE = `Usage: medprotocol cardiology <sub-command> [options]

Sub-commands:
  ascvd        10-year ASCVD risk (Pooled Cohort Equations 2013, superseded by PREVENT)
  heart        HEART Score for chest pain triage
  chadsvasc    CHA₂DS₂-VASc stroke risk in atrial fibrillation
  jvp          Jugular venous pressure: a measured height, Normal or Elevated

ASCVD options:
  --age <number>           Age 40-79 (required)
  --sex <male|female>      Sex (required)
  --race <white|aa|other>  Race (default: white)
  --tc <number>            Total cholesterol mg/dL (required)
  --hdl <number>           HDL cholesterol mg/dL (required)
  --sbp <number>           Systolic BP mmHg (required)
  --bp-treatment           On BP treatment
  --diabetes               Has diabetes
  --smoker                 Current smoker

HEART options:
  --history <0|1|2>        History suspicion (required)
  --ecg <0|1|2>            ECG findings (required)
  --age <0|1|2>            Age category (required)
  --risk-factors <0|1|2>   Risk factors (required)
  --troponin <0|1|2>       Troponin level (required)

CHA₂DS₂-VASc options:
  --chf                    CHF / LV dysfunction (+1)
  --hypertension           Hypertension (+1)
  --age75                  Age ≥ 75 (+2)
  --diabetes               Diabetes (+1)
  --stroke                 Stroke/TIA/TE (+2)
  --vascular               Vascular disease (+1)
  --age65                  Age 65-74 (+1)
  --female                 Female sex (+1)

JVP options (exactly one):
  --cmh2o <number>          Height in cmH2O above the right atrium
  --sternal-angle <number>  Height in cm above the sternal angle (+5 cm to the right atrium)

Global options:
  --json                   Output as JSON
  --help                   Show this help

Examples:
  medprotocol cardiology ascvd --age 55 --sex male --tc 213 --hdl 50 --sbp 120
  medprotocol cardiology heart --history 1 --ecg 0 --age 2 --risk-factors 1 --troponin 0
  medprotocol cardiology chadsvasc --hypertension --age75 --diabetes
  medprotocol cardiology jvp --cmh2o 9`;

const runASCVD = (argv: string[]): void => {
  const values = parseFlags(argv, {
    age: { type: "string" },
    sex: { type: "string" },
    race: { type: "string", default: "white" },
    tc: { type: "string" },
    hdl: { type: "string" },
    sbp: { type: "string" },
    "bp-treatment": { type: "boolean", default: false },
    diabetes: { type: "boolean", default: false },
    smoker: { type: "boolean", default: false },
  }, USAGE);
  if (!values) return;

  if (!requireFlags(values, ["age", "sex", "tc", "hdl", "sbp"], USAGE)) return;

  const inputs: ASCVDInputs = {
    age: values.age!,
    sex: values.sex as "male" | "female",
    race: (values.race || "white") as "white" | "aa" | "other",
    totalCholesterol: values.tc!,
    hdlCholesterol: values.hdl!,
    systolicBP: values.sbp!,
    bpTreatment: values["bp-treatment"]!,
    diabetes: values.diabetes!,
    smoker: values.smoker!,
  };

  const risk = calculateASCVD(inputs);

  if (!risk) return fail("Could not calculate ASCVD risk — check input values (age 40-79, cholesterol/BP > 0)");

  const category = getASCVDCategory(risk);
  const severity = getASCVDSeverity(risk);

  const data = {
    risk: parseFloat(risk),
    category,
    severity,
    inputs: {
      age: parseFloat(inputs.age),
      sex: inputs.sex,
      race: inputs.race,
      totalCholesterol: parseFloat(inputs.totalCholesterol),
      hdlCholesterol: parseFloat(inputs.hdlCholesterol),
      systolicBP: parseFloat(inputs.systolicBP),
      bpTreatment: inputs.bpTreatment,
      diabetes: inputs.diabetes,
      smoker: inputs.smoker,
    },
  };

  printTable(data, values.json, "ASCVD 10-Year Risk (Pooled Cohort Equations 2013, superseded by PREVENT)", [
    ["Risk", `${risk}%`],
    ["Category", category],
    ["Severity", severity],
    ["Age", inputs.age],
    ["Sex", inputs.sex],
    ["Race", inputs.race],
    ["Total Cholesterol", `${inputs.totalCholesterol} mg/dL`],
    ["HDL Cholesterol", `${inputs.hdlCholesterol} mg/dL`],
    ["Systolic BP", `${inputs.systolicBP} mmHg`],
    ["BP Treatment", inputs.bpTreatment ? "Yes" : "No"],
    ["Diabetes", inputs.diabetes ? "Yes" : "No"],
    ["Smoker", inputs.smoker ? "Yes" : "No"],
  ]);
};

const runHEART = (argv: string[]): void => {
  const values = parseFlags(argv, {
    history: { type: "string" },
    ecg: { type: "string" },
    age: { type: "string" },
    "risk-factors": { type: "string" },
    troponin: { type: "string" },
  }, USAGE);
  if (!values) return;

  if (!requireFlags(values, ["history", "ecg", "age", "risk-factors", "troponin"], USAGE)) return;

  const parseScore = (v: string): 0 | 1 | 2 => {
    const n = parseInt(v, 10);
    if (n === 0 || n === 1 || n === 2) return n;
    return 0;
  };

  const inputs: HEARTInputs = {
    history: parseScore(values.history!),
    ecg: parseScore(values.ecg!),
    age: parseScore(values.age!),
    riskFactors: parseScore(values["risk-factors"]!),
    troponin: parseScore(values.troponin!),
  };

  const score = calculateHEARTScore(inputs);
  const category = getHEARTCategory(score);
  const action = getHEARTAction(score);
  const severity = getHEARTSeverity(score);

  const data = {
    score,
    category,
    action,
    severity,
    inputs,
  };

  printTable(data, values.json, "HEART Score", [
    ["Score", `${score}/10`],
    ["Category", category],
    ["Guideline", action],
    ["History", `${inputs.history}`],
    ["ECG", `${inputs.ecg}`],
    ["Age", `${inputs.age}`],
    ["Risk Factors", `${inputs.riskFactors}`],
    ["Troponin", `${inputs.troponin}`],
  ]);
};

const runCHADSVASc = (argv: string[]): void => {
  const values = parseFlags(argv, {
    chf: { type: "boolean", default: false },
    hypertension: { type: "boolean", default: false },
    age75: { type: "boolean", default: false },
    diabetes: { type: "boolean", default: false },
    stroke: { type: "boolean", default: false },
    vascular: { type: "boolean", default: false },
    age65: { type: "boolean", default: false },
    female: { type: "boolean", default: false },
  }, USAGE);
  if (!values) return;

  const inputs: CHADSVAScInputs = {
    chf: values.chf!,
    hypertension: values.hypertension!,
    age75: values.age75!,
    diabetes: values.diabetes!,
    stroke: values.stroke!,
    vascularDisease: values.vascular!,
    age65: values.age65!,
    sexFemale: values.female!,
  };

  const score = calculateCHADSVASc(inputs);
  const category = getCHADSVAScCategory(score, inputs.sexFemale);
  const action = getCHADSVAScAction(score, inputs.sexFemale);
  const severity = getCHADSVAScSeverity(score, inputs.sexFemale);

  const data = {
    score,
    category,
    action,
    severity,
    inputs,
  };

  const factors = Object.entries(inputs)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(", ");

  printTable(data, values.json, "CHA₂DS₂-VASc Score", [
    ["Score", `${score}/9`],
    ["Category", category],
    ["Guideline", action],
    ["Factors", factors || "None"],
  ]);
};

const runJVP = (argv: string[]): void => {
  const values = parseFlags(argv, {
    cmh2o: { type: "string" },
    "sternal-angle": { type: "string" },
  }, USAGE);
  if (!values) return;

  if ((values.cmh2o === undefined) === (values["sternal-angle"] === undefined)) {
    return fail("Give exactly one of --cmh2o or --sternal-angle", USAGE);
  }

  const reference = values.cmh2o !== undefined ? "right-atrium" : "sternal-angle";
  const raw = (values.cmh2o ?? values["sternal-angle"])!;
  const cmH2O = calculateJVPcmH2O(raw, reference);
  if (cmH2O === null) {
    return fail(`Could not classify JVP — expected a height giving ${JVP_LIMITS.min}-${JVP_LIMITS.max} cmH2O above the right atrium`);
  }

  const category = getJVPCategory(cmH2O);
  const data = {
    cmH2O,
    reference,
    input: parseFloat(raw),
    category,
    severity: getJVPSeverity(cmH2O),
    elevatedAboveCmH2O: JVP_LIMITS.elevatedAboveCmH2O,
  };

  printTable(data, values.json, "Jugular Venous Pressure", [
    ["JVP", `${cmH2O} cmH2O above the right atrium`],
    ...(reference === "sternal-angle" ? [["Measured", `${raw} cm above the sternal angle`] as [string, string]] : []),
    ["Category", category],
    ["Elevated above", `${JVP_LIMITS.elevatedAboveCmH2O} cmH2O`],
  ]);
};

export const run = (argv: string[]): void =>
  runSubcommand(argv, USAGE, {
    ascvd: runASCVD,
    heart: runHEART,
    chadsvasc: runCHADSVASc,
    jvp: runJVP,
  });
