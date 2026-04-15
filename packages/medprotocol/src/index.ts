#!/usr/bin/env node

import { version as VERSION } from "../package.json";

const USAGE = `medprotocol — Medical calculations from the terminal

Usage: medprotocol <command> [options]

Commands:
  bmi              Calculate Body Mass Index
  abg              Analyze arterial blood gas
  water-balance    Calculate fluid balance
  vitals           Evaluate vital signs
  pafi             Calculate PaO2/FiO2 ratio (ARDS classification)
  dka              Assess DKA parameters and resolution
  cardiology       Cardiology risk scores (ASCVD, HEART, CHA₂DS₂-VASc)
  sepsis           Sepsis assessment (SOFA, qSOFA, lactate clearance)
  ckd              CKD evaluation (eGFR, staging, KFRE, treatment)

Global options:
  --json           Output as JSON (available on all commands)
  --help           Show help for a command
  --version        Show version

Examples:
  medprotocol bmi --weight 70 --height-m 1.75 --metric
  medprotocol abg --ph 7.25 --pco2 29 --hco3 14
  medprotocol water-balance --weight 70 --oral 1500 --iv 500 --diuresis 1200 --stools 2
  medprotocol vitals --bp 120/80 --hr 72 --temp 37.0
  medprotocol pafi --pao2 60 --fio2 40
  medprotocol dka --glucose 400 --prev-glucose 460 --hours 2 --unit mgdl
  medprotocol cardiology ascvd --age 55 --sex male --tc 213 --hdl 50 --sbp 120
  medprotocol cardiology heart --history 1 --ecg 0 --age 2 --risk-factors 1 --troponin 0
  medprotocol cardiology chadsvasc --hypertension --age75 --diabetes
  medprotocol sepsis sofa --pao2 80 --fio2 40 --platelets 90 --gcs 13
  medprotocol sepsis qsofa --rr 24 --sbp 90 --gcs 13
  medprotocol sepsis lactate --initial 4.2 --repeat 2.1
  medprotocol ckd egfr --creatinine 1.2 --age 55 --sex male
  medprotocol ckd stage --creatinine 1.2 --age 55 --sex male --acr 45
  medprotocol ckd kfre --age 65 --sex female --egfr 35 --acr 300
  medprotocol ckd treatment --egfr 35 --acr 300 --diabetes`;

const command = process.argv[2];
const commandArgs = process.argv.slice(3);

if (command === "--version" || command === "-v") {
  process.stdout.write(`medprotocol v${VERSION}\n`);
  process.exit(0);
}

if (!command || command === "--help" || command === "-h") {
  process.stdout.write(USAGE + "\n");
  process.exit(0);
}

const commands: Record<string, () => Promise<{ run: (argv: string[]) => void }>> = {
  bmi: () => import("./commands/bmi"),
  abg: () => import("./commands/abg"),
  "water-balance": () => import("./commands/water-balance"),
  vitals: () => import("./commands/vitals"),
  pafi: () => import("./commands/pafi"),
  dka: () => import("./commands/dka"),
  cardiology: () => import("./commands/cardiology"),
  sepsis: () => import("./commands/sepsis"),
  ckd: () => import("./commands/ckd"),
};

const loader = commands[command];

if (!loader) {
  process.stderr.write(
    `Unknown command: ${command}\n\nAvailable commands: ${Object.keys(commands).join(", ")}\n`,
  );
  process.exitCode = 1;
} else {
  loader().then((mod) => mod.run(commandArgs));
}
