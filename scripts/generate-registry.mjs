#!/usr/bin/env node

/**
 * Generates shadcn-compatible registry JSON files from manifest.json and source files.
 *
 * Usage: node scripts/generate-registry.mjs
 *
 * Output: public/medical-protocol/r/{component}.json for each component in manifest.json
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const COMPONENTS_DIR = join(ROOT, "public/medical-protocol/components");
const OUTPUT_DIR = join(ROOT, "public/medical-protocol/r");
const CDN_BASE = "https://medical-protocol.vercel.app/medical-protocol";

mkdirSync(OUTPUT_DIR, { recursive: true });

const manifest = JSON.parse(readFileSync(join(COMPONENTS_DIR, "manifest.json"), "utf-8"));

// Component metadata for titles/descriptions that go beyond what manifest has
const componentMeta = {
  "vital-signs": { title: "Vital Signs Monitor", registryName: "vital-signs" },
  "acid-base": { title: "Acid-Base Analyzer", registryName: "acid-base" },
  "bmi": { title: "BMI Calculator", registryName: "bmi-calculator" },
  "water-balance": { title: "Water Balance Calculator", registryName: "water-balance" },
  "telemonitoring": { title: "Pulse Oximetry Telemonitoring", registryName: "telemonitoring" },
  "timeline": { title: "Clinical Timeline", registryName: "timeline" },
  "clinical-notes": { title: "Clinical Notes Editor", registryName: "clinical-notes" },
  "pafi": { title: "PaFi Calculator", registryName: "pafi" },
  "dka": { title: "DKA Monitor", registryName: "dka" },
};

const sharedMeta = {
  "medical-disclaimer": { title: "Medical Disclaimer", registryName: "medical-disclaimer" },
  "layout-disclaimer": { title: "Layout Disclaimer Banner", registryName: "layout-disclaimer" },
  "error-boundary": { title: "Error Boundary", registryName: "error-boundary" },
};

// Components that import MedicalDisclaimer (need it as a registryDependency)
const NEEDS_MEDICAL_DISCLAIMER = new Set([
  "vital-signs", "acid-base", "bmi", "water-balance", "telemonitoring",
  "timeline", "clinical-notes", "pafi", "dka",
]);

/**
 * Read a component source file and return its content.
 */
function readSourceFile(componentKey, filePath) {
  const entry = manifest[componentKey] || manifest.shared?.[componentKey];
  const target = entry?.target;

  let fullPath;
  if (target) {
    // target is like "components/vital-signs" (project path), strip "components/" prefix
    // to get the CDN directory name relative to COMPONENTS_DIR
    const cdnDir = target.replace(/^components\//, "");
    fullPath = join(COMPONENTS_DIR, cdnDir, filePath);
  } else {
    // Shared components live directly under components/
    fullPath = join(COMPONENTS_DIR, filePath);
  }

  try {
    return readFileSync(fullPath, "utf-8");
  } catch (err) {
    console.error(`  WARNING: Could not read ${fullPath}: ${err.message}`);
    return null;
  }
}

/**
 * Map file path to registry file type using shadcn conventions:
 * - hooks/ → registry:hook
 * - types/ → registry:file (preserves exact path)
 * - .ts (non-tsx) → registry:lib
 * - .tsx → registry:component
 */
function getFileType(filePath) {
  if (filePath.includes("hooks/")) return "registry:hook";
  if (filePath.includes("types/")) return "registry:file";
  const ext = extname(filePath);
  if (ext === ".ts" && !filePath.endsWith(".tsx")) return "registry:lib";
  return "registry:component";
}

/**
 * Build the target path for a file in the registry (where it lands in the user's project).
 */
function buildTargetPath(componentKey, filePath) {
  const entry = manifest[componentKey] || manifest.shared?.[componentKey];
  const target = entry?.target;
  if (target) {
    return `${target}/${filePath}`;
  }
  // Shared components go to components/
  return `components/${filePath}`;
}

/**
 * Generate a registry JSON for a component.
 */
function generateRegistry(componentKey, entry, meta) {
  const registryName = meta.registryName;
  const files = (entry.files || []).map((filePath) => {
    const content = readSourceFile(componentKey, filePath);
    return {
      path: buildTargetPath(componentKey, filePath),
      content: content || "",
      type: getFileType(filePath),
      target: "",
    };
  }).filter((f) => f.content !== "");

  if (files.length === 0) {
    console.error(`  ERROR: No files found for ${componentKey}, skipping`);
    return null;
  }

  // Build registryDependencies from shadcn array
  const registryDeps = [...(entry.shadcn || [])];

  // Add externalComponents that are shadcn hooks (e.g., use-mobile)
  if (entry.externalComponents) {
    for (const ext of entry.externalComponents) {
      if (ext.startsWith("@/hooks/")) {
        registryDeps.push(ext.replace("@/hooks/", ""));
      }
    }
  }

  // Add medical-disclaimer as a URL dependency for components that import it
  if (NEEDS_MEDICAL_DISCLAIMER.has(componentKey)) {
    registryDeps.push(`${CDN_BASE}/r/medical-disclaimer.json`);
  }

  // Add cross-component dependencies as registry URLs
  if (entry.dependencies) {
    for (const dep of entry.dependencies) {
      const depMeta = componentMeta[dep] || sharedMeta[dep];
      if (depMeta) {
        registryDeps.push(`${CDN_BASE}/r/${depMeta.registryName}.json`);
      }
    }
  }

  const registry = {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: registryName,
    type: "registry:block",
    title: meta.title,
    description: entry.description,
    registryDependencies: registryDeps,
    files,
  };

  return registry;
}

// Track generated files for the meta-registry
const generated = [];

// Generate registries for shared components
console.log("Generating shared component registries...");
for (const [key, entry] of Object.entries(manifest.shared || {})) {
  const meta = sharedMeta[key];
  if (!meta) {
    console.error(`  No metadata for shared component: ${key}`);
    continue;
  }
  console.log(`  ${meta.registryName}`);
  const registry = generateRegistry(key, entry, meta);
  if (registry) {
    const outPath = join(OUTPUT_DIR, `${meta.registryName}.json`);
    writeFileSync(outPath, JSON.stringify(registry, null, 2) + "\n");
    generated.push({ name: meta.registryName, url: `${CDN_BASE}/r/${meta.registryName}.json` });
  }
}

// Generate registries for main components
console.log("Generating component registries...");
const mainComponents = Object.entries(manifest).filter(
  ([key]) => key !== "shared" && key !== "version" && key !== "description" && key !== "context"
);

for (const [key, entry] of mainComponents) {
  const meta = componentMeta[key];
  if (!meta) {
    console.error(`  No metadata for component: ${key}`);
    continue;
  }
  console.log(`  ${meta.registryName}`);
  const registry = generateRegistry(key, entry, meta);
  if (registry) {
    const outPath = join(OUTPUT_DIR, `${meta.registryName}.json`);
    writeFileSync(outPath, JSON.stringify(registry, null, 2) + "\n");
    generated.push({ name: meta.registryName, url: `${CDN_BASE}/r/${meta.registryName}.json` });
  }
}

// Generate the meta-registry as an installable block (matches POC format)
// Embeds COMPOSITION.md and manifest.json so a single install delivers all docs + components
console.log("Generating meta-registry...");
const compositionContent = readFileSync(join(COMPONENTS_DIR, "COMPOSITION.md"), "utf-8");
const manifestContent = readFileSync(join(COMPONENTS_DIR, "manifest.json"), "utf-8");

const metaRegistry = {
  $schema: "https://ui.shadcn.com/schema/registry-item.json",
  name: "medical-protocol",
  type: "registry:block",
  title: "Medical Protocol",
  description: "Complete medical protocol component suite with documentation",
  registryDependencies: generated.map((g) => g.url),
  files: [
    { path: "medical-protocol/COMPOSITION.md", content: compositionContent, type: "registry:file", target: "" },
    { path: "medical-protocol/manifest.json", content: manifestContent, type: "registry:file", target: "" },
  ],
};
const metaPath = join(OUTPUT_DIR, "medical-protocol.json");
writeFileSync(metaPath, JSON.stringify(metaRegistry, null, 2) + "\n");

console.log(`\nDone! Generated ${generated.length + 1} registry files in public/medical-protocol/r/`);
