# medprotocol CLI

## What It Is

`medprotocol` is a zero-dependency command-line medical calculator. It runs clinical calculations from the terminal and outputs human-readable tables or structured JSON. It lives at `packages/medprotocol/`.

It's designed for two consumers:
1. **AI agents** — Claude Code runs commands with `--json` in the background, parses results, and translates them into clinical language for the doctor.
2. **Clinicians** — Direct terminal usage for quick calculations without launching a full UI.

## What It's For

Each command wraps pure calculation functions from `plugin/lib/` with argument parsing, validation, and formatted output.

Current commands (12):

| Command | Sub-commands | Lib file | Description |
|---------|-------------|----------|-------------|
| `bmi` | — | `plugin/lib/bmi.ts` | Body Mass Index |
| `abg` | — | `plugin/lib/acid-base/` | Arterial blood gas analysis |
| `water-balance` | — | `plugin/lib/water-balance.ts` | Fluid intake/output balance |
| `vitals` | — | `plugin/lib/vital-signs-validations/` | Vital signs evaluation |
| `pafi` | — | `plugin/lib/pafi.ts` | PaO2/FiO2 ratio (Berlin oxygenation range) |
| `dka` | — | `plugin/lib/dka.ts` | DKA assessment |
| `cardiology` | `ascvd`, `heart`, `chadsvasc` | `plugin/lib/cardiology.ts` | Cardiology risk scores |
| `sepsis` | `sofa`, `qsofa`, `lactate` | `plugin/lib/sepsis.ts` | Sepsis assessment |
| `ckd` | `egfr`, `stage`, `kfre`, `treatment`, `anemia`, `mbd` | `plugin/lib/ckd.ts` | CKD evaluation |
| `diabetes` | `diagnose`, `t1d-stage`, `t1-vs-t2`, `t2d-screen`, `gdm` | `plugin/lib/diabetes-dx.ts`, `plugin/lib/endocrine.ts` | Diabetes diagnosis and classification |
| `extract` | — | `plugin/lib/extraction.ts` | Check extracted values against the note they came from |
| `overlay` | — | — | Drain the dev overlay work-order queue |

## Architecture

```
packages/medprotocol/
├── src/
│   ├── index.ts              # Entry point: command registry + routing
│   ├── cli.ts                # Shared helpers: parseFlags, printTable, requireFlags, fail, runSubcommand
│   └── commands/             # One file per command
├── package.json
└── tsconfig.json

plugin/lib/                   # Pure calculation functions (copied into doctor projects as lib/medprotocol/)
plugin/lib/format.ts          # Output helpers: formatTable, formatHeader, printResult
plugin/scripts/medprotocol.cjs  # The built CLI, committed; `npm run build` rewrites it
tests/cli/                    # CLI-specific tests (vitest)
```

## How to Invoke

```bash
# From the repo root
node plugin/scripts/medprotocol.cjs <command> [flags]
node plugin/scripts/medprotocol.cjs bmi --weight 70 --height-m 1.75 --metric
node plugin/scripts/medprotocol.cjs pafi --pao2 60 --fio2 40 --json

# Sub-commands
node plugin/scripts/medprotocol.cjs cardiology ascvd --age 55 --sex male --tc 213 --hdl 50 --sbp 120

# Help
node plugin/scripts/medprotocol.cjs --help            # Global
node plugin/scripts/medprotocol.cjs bmi --help        # Per-command
node plugin/scripts/medprotocol.cjs --version
```

## Command Anatomy

Every command file exports a single `run(argv: string[]): void` function that follows this pattern:

```
1. Parse args     → parseFlags(argv, options, USAGE); it adds --json and --help
2. Handle --help  → parseFlags printed the usage and returned null: return
3. Validate       → requireFlags() or fail(); errors go to stderr with exitCode = 1
4. Calculate      → call pure function from plugin/lib/
5. Handle error   → null result = invalid inputs: fail()
6. Output         → printTable(data, values.json, title, rows)
```

### Conventions

- **Arguments**: `parseFlags()` from `cli.ts`. It is strict: a mistyped flag is reported by `index.ts` as a short error
- **Required flags**: `requireFlags()` reports all missing flags together
- **Output**: `--json` for structured data, human-readable table by default
- **Errors**: `fail()`: always to `stderr`, always sets `process.exitCode = 1`
- **No side effects**: Commands are pure read-calculate-print pipelines (`extract` and `overlay` are the exceptions: they read and write files)
- **Formatting**: `printTable()` for a title and one table. For anything else, `printResult()` with `formatHeader()` and `formatTable()` from `plugin/lib/format.ts`

## How to Add a New Command

### Step 1: Pure logic in `plugin/lib/`

Create (or reuse) a `plugin/lib/<name>.ts` with pure calculation functions. These are shared with the generated UI screens in doctor projects — the CLI is just another consumer.

```typescript
// plugin/lib/my-metric.ts
export const calculateMyMetric = (input1: string, input2: string): string | null => {
  // ... returns null on invalid input
};
export const getMyMetricCategory = (result: string | null): string => { /* ... */ };
```

### Step 2: Command file

Create `packages/medprotocol/src/commands/<name>.ts`:

```typescript
import { calculateMyMetric, getMyMetricCategory } from "../../../../plugin/lib/my-metric";
import { fail, parseFlags, printTable, requireFlags } from "../cli";

const USAGE = `Usage: medprotocol my-metric [options]

Options:
  --input1 <number>   Description (required)
  --input2 <number>   Description (required)
  --json              Output as JSON
  --help              Show this help

Examples:
  medprotocol my-metric --input1 100 --input2 50`;

export const run = (argv: string[]): void => {
  const values = parseFlags(argv, {
    input1: { type: "string" },
    input2: { type: "string" },
  }, USAGE);
  if (!values) return;

  if (!requireFlags(values, ["input1", "input2"], USAGE)) return;

  const result = calculateMyMetric(values.input1!, values.input2!);

  if (!result) return fail("Could not calculate — check input values");

  const category = getMyMetricCategory(result);

  const data = {
    result: parseFloat(result),
    category,
    input1: parseFloat(values.input1!),
    input2: parseFloat(values.input2!),
  };

  printTable(data, values.json, "My Metric", [
    ["Result", result],
    ["Category", category],
    ["Input 1", values.input1!],
    ["Input 2", values.input2!],
  ]);
};
```

### Step 3: Register in `index.ts`

Add to the `commands` record and update the `USAGE` string:

```typescript
// In the commands record:
"my-metric": () => import("./commands/my-metric"),

// In the USAGE string:
//   my-metric        Description here

// In the examples section:
//   medprotocol my-metric --input1 100 --input2 50
```

### Step 4: CLI tests

Create `tests/cli/<name>-cli.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { run } from '../../packages/medprotocol/src/commands/my-metric';

let stdout: string;
let stderr: string;

beforeEach(() => {
  stdout = '';
  stderr = '';
  vi.spyOn(process.stdout, 'write').mockImplementation((s: any) => { stdout += s; return true; });
  vi.spyOn(process.stderr, 'write').mockImplementation((s: any) => { stderr += s; return true; });
  process.exitCode = undefined;
});

afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

describe('medprotocol my-metric', () => {
  it('calculates for valid inputs', () => {
    run(['--input1', '100', '--input2', '50']);
    expect(stdout).toContain('My Metric');
  });

  it('outputs JSON with --json', () => {
    run(['--input1', '100', '--input2', '50', '--json']);
    const result = JSON.parse(stdout);
    expect(result.result).toBeDefined();
  });

  it('shows help with --help', () => {
    run(['--help']);
    expect(stdout).toContain('Usage: medprotocol my-metric');
  });

  it('errors on missing required flags', () => {
    run(['--input1', '100']);
    expect(stderr).toContain('--input2');
    expect(process.exitCode).toBe(1);
  });
});
```

### Step 5: Build and verify

```bash
npm run build                           # Rewrites plugin/scripts/medprotocol.cjs; commit it with the source
npx vitest run tests/cli/<name>-cli    # New CLI tests pass
npm test                                # Full suite still passes
npx tsc --noEmit                        # Types pass
```

Add the command to `scripts/compare-cli.sh` too, so a later refactor is checked against it.

### Sub-command Pattern (optional)

For commands with several calculators (like `cardiology`), write one function per sub-command and route with `runSubcommand()`. It prints the usage for `--help` or no name, and reports an unknown name:

```typescript
const runSub1 = (argv: string[]): void => {
  const values = parseFlags(argv, { input1: { type: "string" } }, USAGE);
  if (!values) return;
  // ... validate, calculate, printTable
};

export const run = (argv: string[]): void =>
  runSubcommand(argv, USAGE, {
    sub1: runSub1,
    sub2: runSub2,
  });
```

## Checklist: Adding a Command

- [ ] Pure logic exists in `plugin/lib/<name>.ts` (with unit tests in `tests/<name>/`)
- [ ] Command file at `packages/medprotocol/src/commands/<name>.ts`
- [ ] Exports `run(argv: string[]): void`
- [ ] Flags parsed with `parseFlags` (gives `--json` and `--help`)
- [ ] Errors go to `stderr` with `process.exitCode = 1`
- [ ] Registered in `packages/medprotocol/src/index.ts` (commands record + USAGE)
- [ ] CLI tests at `tests/cli/<name>-cli.test.ts`
- [ ] `npm run build` run and `plugin/scripts/medprotocol.cjs` committed
- [ ] `npm test` and `npx tsc --noEmit` pass
