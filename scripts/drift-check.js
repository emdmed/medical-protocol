#!/usr/bin/env node
/**
 * drift-check — guard against the core lib/ and the medprotocol-ui vendored
 * copies silently diverging.
 *
 * lib/ in this repo is the single source of truth for clinical calculation
 * logic. The UI repo (shadcn-style delivery) ships its own *copies* of that
 * logic as per-component `lib.ts` files, because components are copied into
 * doctor projects and cannot import an external package at runtime. Those
 * copies are adapted for the component folder layout (different import paths,
 * `safeFloat` instead of `safeParseFloatOrNull`, no citation comments), so a
 * plain file diff is all noise. This script normalizes that cosmetic delta
 * away and compares the actual logic, per exported function.
 *
 * Exit code: 0 = in sync, 1 = drift found (missing or divergent functions),
 * 2 = setup problem (e.g. a mapped file is gone). When the UI repo isn't
 * checked out next to this one, it skips with exit 0 so pre-push hooks on
 * machines without the sibling repo don't break.
 *
 * Usage:
 *   node scripts/drift-check.js [--ui <path-to-medprotocol-ui>]
 *   MEDPROTOCOL_UI_DIR=/path node scripts/drift-check.js
 */

const fs = require("fs");
const path = require("path");

const CORE_ROOT = path.resolve(__dirname, "..");

function resolveUiDir() {
  const flagIdx = process.argv.indexOf("--ui");
  if (flagIdx !== -1 && process.argv[flagIdx + 1]) {
    return path.resolve(process.argv[flagIdx + 1]);
  }
  if (process.env.MEDPROTOCOL_UI_DIR) {
    return path.resolve(process.env.MEDPROTOCOL_UI_DIR);
  }
  return path.resolve(CORE_ROOT, "..", "medprotocol-ui");
}

const UI_ROOT = resolveUiDir();

// Explicit pair table: core lib file -> UI vendored copy.
// Only files that are meant to hold the *same* clinical logic appear here.
// UI-only components (base, hepatology, nephrology) and core-only plumbing
// (format, index, *-types) are intentionally absent.
const PAIRS = [
  ["lib/acid-base/analyze.ts", "components/acid-base/analyze.ts"],
  ["lib/bmi.ts", "components/bmi/lib.ts"],
  ["lib/cardiology.ts", "components/cardiology/lib.ts"],
  ["lib/ckd.ts", "components/ckd/lib.ts"],
  ["lib/diabetes-dx.ts", "components/diabetes-dx/lib.ts"],
  ["lib/dka.ts", "components/dka/lib.ts"],
  ["lib/endocrine.ts", "components/endocrine/lib.ts"],
  ["lib/pafi.ts", "components/pafi/lib.ts"],
  ["lib/sepsis.ts", "components/sepsis/lib.ts"],
  ["lib/water-balance.ts", "components/water-balance/lib.ts"],
  ["lib/vital-signs-validations/blood-oxygen-validations.ts", "components/vital-signs/validations/blood-oxygen-validations.tsx"],
  ["lib/vital-signs-validations/blood-pressure-validations.ts", "components/vital-signs/validations/blood-pressure-validations.tsx"],
  ["lib/vital-signs-validations/heart-rate-validations.ts", "components/vital-signs/validations/heart-rate-validations.tsx"],
  ["lib/vital-signs-validations/respiratory-rate-validations.ts", "components/vital-signs/validations/respiratory-rate-validations.tsx"],
  ["lib/vital-signs-validations/temperature-validations.ts", "components/vital-signs/validations/temperature-validations.tsx"],
];

/**
 * Reviewed-benign baseline. The two copies live on opposite sides of a
 * CLI(string) ↔ React(typed) boundary, so some divergence is *intentional*
 * and must not fail the check — otherwise it cries wolf and gets ignored.
 * Keyed by the core file path. Each entry is human-reviewed:
 *   coreOnly  — functions that exist only in core on purpose (e.g. a feature
 *               the UI component doesn't surface). The UI must not import them.
 *   boundary  — shared functions whose bodies differ ONLY at the type contract
 *               (string parsing / null handling), with identical clinical math.
 * Anything NOT listed here still fails — that's the point: new, unreviewed
 * drift trips the alarm; acknowledged differences stay quiet.
 */
const ACK = {
  "lib/ckd.ts": {
    // CKD-MBD / anemia management block — CLI-only, no UI surface (verified:
    // ckd-evaluator.tsx imports none of these).
    coreOnly: [
      "classifyAnemia", "assessIronStatus", "checkESAEligibility",
      "assessPhosphate", "correctCalcium", "assessPTH", "assessVitaminD",
      "getCKDMBDMonitoring",
    ],
    // Identical clinical math (-5 slope, >0.2 change, same regression); differ
    // only in string-vs-number inputs and number|null vs number returns.
    boundary: ["calculateEGFRSlope", "isRapidDecline", "hasSignificantEGFRChange"],
  },
  "lib/dka.ts": {
    coreOnly: [],
    // All identical logic; core uses named constants, UI inlined the same
    // literal values (verified equal: ketone 0.5, bicarb 3.0, urine 0.5,
    // GCS drop 2, K 3/4/5/6, glucose 11.1/200 & 14/252, target 3.0/54).
    boundary: [
      "isGlucoseOnTarget", "isKetoneOnTarget", "isBicarbonateOnTarget",
      "classifyPotassium", "getPotassiumSeverity", "isUrineOutputOnTarget",
      "isGCSDecreasing", "suggestInsulinAdjustment",
    ],
  },
  "lib/endocrine.ts": {
    coreOnly: [],
    // Identical GDM/screening thresholds; UI uses a local `sf` parse helper
    // instead of imported safeParseFloat, and dropped ADA citation comments.
    boundary: ["getT2DScreeningRecommendation", "classifyGDM_OneStep", "classifyGDM_TwoStep"],
  },
  "lib/vital-signs-validations/temperature-validations.ts": {
    // CLI-only status helper; the React component doesn't surface it.
    coreOnly: ["getTemperatureStatusCli"],
    // Same thresholds; differs only in icon representation (CLI string
    // "thermometer"/"triangle-alert" vs React Lucide component).
    boundary: ["getTemperatureStatus"],
    // NOTE: validateTemperatureInput and parseTemperatureValue are NOT
    // acknowledged — they are genuine drift (see triage), left failing on
    // purpose until the UI repo is fixed.
  },
  // NOTE: blood-oxygen is intentionally absent — the UI's calculateRatio drops
  // the FiO2 /100 conversion (S/F ratio off by 100x). Real bug; keep it red.
};

/** Strip line + block comments without touching string contents we care about. */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "");
}

/**
 * Normalize a chunk of logic so cosmetic, repo-specific differences don't
 * register as drift: comments gone, all whitespace collapsed, and known
 * cross-repo identifier aliases folded to a canonical form.
 */
function normalize(body) {
  let out = stripComments(body);
  // Identifier aliases: the UI copies renamed the safe-parse helper.
  out = out.replace(/safeParseFloatOrNull/g, "safeFloat");
  out = out.replace(/safeParseFloat\b/g, "safeFloat");
  // Semicolons are not semantically meaningful here (ASI); the loose-typed
  // .tsx copies often omit them where the typed core keeps them.
  out = out.replace(/;/g, "");
  // Collapse all whitespace.
  out = out.replace(/\s+/g, "");
  return out;
}

/**
 * Extract exported functions as { name -> normalizedBody }.
 * Handles `export const NAME = (...) => { ... }` (brace body or single
 * expression) and `export function NAME(...) { ... }`. Brace-matched so an
 * interleaved interface/type between exports never leaks into a body.
 */
function extractFunctions(src) {
  const clean = stripComments(src);
  const out = new Map();
  const re = /export\s+(?:const|function)\s+([A-Za-z0-9_]+)/g;
  let m;
  while ((m = re.exec(clean)) !== null) {
    const name = m[1];
    let i = re.lastIndex;
    // Walk to the first brace or, for expression-bodied arrows, capture to `;`.
    let braceStart = clean.indexOf("{", i);
    let semiStart = clean.indexOf(";", i);
    // Bound the search so we don't run past the next export.
    const nextExport = clean.indexOf("export", i);
    const limit = nextExport === -1 ? clean.length : nextExport;

    if (braceStart !== -1 && braceStart < limit && (semiStart === -1 || braceStart < semiStart)) {
      // Brace-matched body.
      let depth = 0;
      let j = braceStart;
      for (; j < clean.length; j++) {
        const ch = clean[j];
        if (ch === "{") depth++;
        else if (ch === "}") {
          depth--;
          if (depth === 0) { j++; break; }
        }
      }
      out.set(name, normalize(clean.slice(braceStart, j)));
    } else {
      // Expression-bodied (e.g. `export const x = (a) => a + 1;`).
      const end = semiStart === -1 ? limit : Math.min(semiStart + 1, limit);
      out.set(name, normalize(clean.slice(i, end)));
    }
  }
  return out;
}

function readOrNull(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
}

function main() {
  if (!fs.existsSync(UI_ROOT)) {
    console.log(`drift-check: UI repo not found at ${UI_ROOT} — skipping.`);
    console.log("  (set --ui <path> or MEDPROTOCOL_UI_DIR to point at medprotocol-ui)");
    process.exit(0);
  }

  let drift = false;
  let setupError = false;
  const cleanPairs = [];

  for (const [coreRel, uiRel] of PAIRS) {
    const coreSrc = readOrNull(path.join(CORE_ROOT, coreRel));
    const uiSrc = readOrNull(path.join(UI_ROOT, uiRel));

    if (coreSrc === null || uiSrc === null) {
      setupError = true;
      console.log(`\n✗ ${coreRel}`);
      if (coreSrc === null) console.log(`    missing core file: ${coreRel}`);
      if (uiSrc === null) console.log(`    missing UI file:   ${uiRel}`);
      continue;
    }

    const core = extractFunctions(coreSrc);
    const ui = extractFunctions(uiSrc);
    const ack = ACK[coreRel] || { coreOnly: [], boundary: [] };

    const missingInUi = [...core.keys()].filter(
      (k) => !ui.has(k) && !ack.coreOnly.includes(k),
    );
    const extraInUi = [...ui.keys()].filter((k) => !core.has(k));
    const diverged = [...core.keys()].filter(
      (k) => ui.has(k) && core.get(k) !== ui.get(k) && !ack.boundary.includes(k),
    );
    const ackCount = ack.coreOnly.length + ack.boundary.length;

    if (missingInUi.length === 0 && diverged.length === 0) {
      const notes = [
        extraInUi.length ? `+${extraInUi.length} UI-only` : "",
        ackCount ? `${ackCount} acknowledged` : "",
      ].filter(Boolean).join(", ");
      cleanPairs.push(`${coreRel}  (${core.size} fns${notes ? `, ${notes}` : ""})`);
      continue;
    }

    drift = true;
    console.log(`\n✗ DRIFT  ${coreRel}`);
    console.log(`         ↔ ${uiRel}`);
    if (missingInUi.length) {
      console.log(`    missing in UI (${missingInUi.length}): ${missingInUi.join(", ")}`);
    }
    if (diverged.length) {
      console.log(`    logic differs (${diverged.length}): ${diverged.join(", ")}`);
    }
    if (extraInUi.length) {
      console.log(`    UI-only (${extraInUi.length}): ${extraInUi.join(", ")}`);
    }
  }

  if (cleanPairs.length) {
    console.log(`\n✓ in sync (${cleanPairs.length}):`);
    for (const c of cleanPairs) console.log(`    ${c}`);
  }

  console.log("");
  if (setupError) {
    console.log("drift-check: setup error — a mapped file is missing (see ✗ above).");
    process.exit(2);
  }
  if (drift) {
    console.log("drift-check: FAILED — core lib/ and the UI copies have diverged.");
    console.log("Reconcile the flagged functions, then re-run. lib/ is the source of truth.");
    process.exit(1);
  }
  console.log("drift-check: OK — all mapped clinical logic is in sync.");
  process.exit(0);
}

main();
