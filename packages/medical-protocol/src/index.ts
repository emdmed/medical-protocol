#!/usr/bin/env node

import { Command } from "commander";
import { version as VERSION } from "../package.json";

const program = new Command();

program
  .name("medical-protocol")
  .description("Install and manage the medical-protocol plugin for Claude Code")
  .version(`v${VERSION}`, "-v, --version");

program
  .command("install")
  .description("Install the plugin into your project")
  .option("--dir <path>", "Target project directory", process.cwd())
  .option("--force", "Overwrite existing installation")
  .option("--link", "Use symlinks to a shared repo clone instead of copying")
  .option("--source <path>", "Path to repo clone (default: ~/.medical-protocol)")
  .option("--json", "Output as JSON")
  .action((opts) => {
    import("./commands/install").then((mod) => mod.run(opts));
  });

program
  .command("check")
  .description("Check if the plugin is up-to-date")
  .option("--dir <path>", "Target project directory", process.cwd())
  .option("--json", "Output as JSON")
  .action((opts) => {
    import("./commands/check").then((mod) => mod.run(opts));
  });

program
  .command("update")
  .description("Update the plugin to the latest version")
  .option("--dir <path>", "Target project directory", process.cwd())
  .option("--force", "Overwrite locally modified files")
  .option("--json", "Output as JSON")
  .action((opts) => {
    import("./commands/update").then((mod) => mod.run(opts));
  });

program.action(() => {
  program.help();
});

program.parse();
