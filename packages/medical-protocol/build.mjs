#!/usr/bin/env node
// Cross-platform: pure Node (no bash), runs identically on Windows, macOS, Linux.
import { execSync } from "node:child_process";
import { cpSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(DIR, "../../public/medical-protocol");
const PLUGIN = join(DIR, "../../plugin");
const ref = (skill) => join(PLUGIN, "skills", skill, "reference");
const copyTo = (src, skills) => {
  for (const skill of skills) cpSync(src, join(ref(skill), src.split(/[\\/]/).pop()));
};

// Build TypeScript into one self-contained script (dev deps are bundled in)
execSync(`npx tsup "${join(DIR, "src/index.ts")}" --format cjs --target node18 --out-dir "${join(DIR, "dist")}"`, {
  stdio: "inherit",
});
cpSync(join(DIR, "dist/index.js"), join(DIR, "../../scripts/medical-protocol.cjs"));

// Sync reference files from public/ source of truth into each skill's reference/ dir
// Synced into plugin/ itself, since the marketplace installs plugin/ directly
const UI_SKILLS = ["start", "bmi", "pafi", "acid-base", "dka", "vital-signs", "water-balance", "dashboard", "modify", "extract"];
copyTo(join(PUBLIC, "context/extraction.md"), ["extract"]);
copyTo(join(PUBLIC, "context/classification.md"), ["start"]);
copyTo(join(PUBLIC, "context/cli.md"), ["calc"]);
copyTo(join(PUBLIC, "context/components.md"), UI_SKILLS);
copyTo(join(PUBLIC, "context/composition.md"), UI_SKILLS);

// building.md → every skill that builds UI (any skill that has a copy)
const buildingSkills = readdirSync(join(PLUGIN, "skills")).filter((s) => existsSync(join(ref(s), "building.md")));
copyTo(join(PUBLIC, "context/building.md"), buildingSkills);

copyTo(join(PUBLIC, "workflows/initial-clarification.md"), ["start"]);

// Workflow files → start (for domain routing)
for (const wf of ["nephrology", "cardiology", "sepsis"]) {
  copyTo(join(PUBLIC, `providers/claude-code/workflows/${wf}.md`), ["start"]);
}
copyTo(join(PUBLIC, "providers/claude-code/workflows/troubleshoot.md"), ["troubleshoot"]);
copyTo(join(PUBLIC, "providers/claude-code/workflows/agent-qa.md"), ["qa", ...UI_SKILLS]);

console.log("Build complete — scripts/medical-protocol.cjs and plugin/ ready");
