#!/usr/bin/env node

const VERSION = "0.4.0";

const USAGE = `medprotocol — Medical calculations from the terminal

Usage: medprotocol <command> [options]

Commands:
  bmi              Calculate Body Mass Index
  abg              Analyze arterial blood gas
  water-balance    Calculate fluid balance
  vitals           Evaluate vital signs

Global options:
  --json           Output as JSON (available on all commands)
  --help           Show help for a command
  --version        Show version

Examples:
  medprotocol bmi --weight 70 --height-m 1.75 --metric
  medprotocol abg --ph 7.25 --pco2 29 --hco3 14
  medprotocol water-balance --weight 70 --oral 1500 --iv 500 --diuresis 1200 --stools 2
  medprotocol vitals --bp 120/80 --hr 72 --temp 37.0`;

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
