#!/usr/bin/env node
// Syncs reference docs from public/ (source of truth) into each skill's reference/ dir.
// Synced into plugin/ itself, since the marketplace installs plugin/ directly.
// Cross-platform: pure Node (no bash), runs identically on Windows, macOS, Linux.
import { cpSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(DIR, "../public/medical-protocol");
const PLUGIN = join(DIR, "../plugin");
const ref = (skill) => join(PLUGIN, "skills", skill, "reference");
const copyTo = (src, skills) => {
  for (const skill of skills) cpSync(src, join(ref(skill), src.split(/[\\/]/).pop()));
};

const UI_SKILLS = ["start", "bmi", "pafi", "acid-base", "dka", "vital-signs", "water-balance", "dashboard", "modify", "extract"];
copyTo(join(PUBLIC, "context/extraction.md"), ["extract"]);
copyTo(join(PUBLIC, "context/classification.md"), ["start"]);
copyTo(join(PUBLIC, "context/cli.md"), ["calc"]);
copyTo(join(PUBLIC, "context/components.md"), UI_SKILLS);
copyTo(join(PUBLIC, "context/composition.md"), UI_SKILLS);

// building.md, patient-privacy.md, quality-checklist.md → every skill that has a copy
const withCopy = (name) => readdirSync(join(PLUGIN, "skills")).filter((s) => existsSync(join(ref(s), name)));
copyTo(join(PUBLIC, "context/building.md"), withCopy("building.md"));
for (const wf of ["patient-privacy.md", "quality-checklist.md"]) {
  copyTo(join(PUBLIC, "workflows", wf), withCopy(wf));
}

// Module docs (Screen specs) → one shared copy, at the path on each skill's `Module docs:` line.
// In a subfolder because cardiology.md, nephrology.md and sepsis.md are also workflow file names.
const SHARED_DOCS = ["building.md", "classification.md", "cli.md", "components.md", "composition.md"];
for (const doc of readdirSync(join(PUBLIC, "context")).filter((f) => !SHARED_DOCS.includes(f))) {
  cpSync(join(PUBLIC, "context", doc), join(ref("start"), "context", doc));
}

// Workflow files → start (for domain routing)
copyTo(join(PUBLIC, "workflows/initial-clarification.md"), ["start"]);
for (const wf of ["nephrology", "cardiology", "sepsis"]) {
  copyTo(join(PUBLIC, `workflows/${wf}.md`), ["start"]);
}
copyTo(join(PUBLIC, "workflows/troubleshoot.md"), ["troubleshoot"]);
copyTo(join(PUBLIC, "workflows/agent-qa.md"), ["qa", ...UI_SKILLS]);

console.log("Reference docs synced into plugin/skills");
