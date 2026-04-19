# medprotocol CLI

## What It Is

`medprotocol` is a zero-dependency command-line medical calculator. It runs clinical calculations from the terminal and outputs human-readable tables or structured JSON. It lives at `packages/medprotocol/`.

It's designed for two consumers:
1. **AI agents** — Claude Code runs commands with `--json` in the background, parses results, and translates them into clinical language for the doctor.
2. **Clinicians** — Direct terminal usage for quick calculations without launching a full UI.

## What It's For

Each command wraps pure calculation functions from `lib/` with argument parsing, validation, and formatted output.

Current commands (7):

| Command | Sub-commands | Lib file | Description |
|---------|-------------|----------|-------------|
| `bmi` | — | `lib/bmi.ts` | Body Mass Index |
| `abg` | — | `lib/acid-base.ts` | Arterial blood gas analysis |
| `water-balance` | — | `lib/water-balance.ts` | Fluid intake/output balance |
| `vitals` | — | `lib/vital-signs.ts` | Vital signs evaluation |
| `pafi` | — | `lib/pafi.ts` | PaO2/FiO2 ratio (ARDS) |
| `dka` | — | `lib/dka.ts` | DKA assessment |
| `cardiology` | `ascvd`, `heart`, `chadsvasc` | `lib/cardiology.ts` | Cardiology risk scores |

## Architecture

```
packages/medprotocol/
├── src/
│   ├── index.ts              # Entry point: command registry + routing
│   ├── format.ts             # Output helpers: formatTable, formatHeader, printResult
│   └── commands/             # One file per command
│       ├── bmi.ts
│       ├── abg.ts
│       ├── water-balance.ts
│       ├── vitals.ts
│       ├── pafi.ts
│       ├── dka.ts
│       └── cardiology.ts
├── dist/
│   └── index.js              # Compiled bundle (tsup, CJS, node18)
├── package.json              # bin: { "medprotocol": "./dist/index.js" }
└── tsconfig.json

lib/                          # Pure calculation functions (shared with React components)
tests/cli/                    # CLI-specific tests (vitest)
```

## How to Invoke

```bash
# From repo root (development)
npm run medprotocol -- <command> [flags]
npm run medprotocol -- bmi --weight 70 --height-m 1.75 --metric
npm run medprotocol -- pafi --pao2 60 --fio2 40 --json

# Sub-commands (cardiology)
npm run medprotocol -- cardiology ascvd --age 55 --sex male --tc 213 --hdl 50 --sbp 120
npm run medprotocol -- cardiology heart --history 1 --ecg 0 --age 2 --risk-factors 1 --troponin 0

# Help
npm run medprotocol -- --help            # Global
npm run medprotocol -- bmi --help        # Per-command
npm run medprotocol -- --version
```

## Command Anatomy

Every command file exports a single `run(argv: string[]): void` function that follows this pattern:

```
1. Parse args     → node:util parseArgs() with strict: true
2. Handle --help  → write USAGE to stdout, return
3. Validate       → check required flags, write errors to stderr, set exitCode = 1
4. Calculate      → call pure function from lib/
5. Handle error   → null result = invalid inputs, stderr + exitCode = 1
6. Output         → printResult(data, isJson, humanFormatFn)
```

### Conventions

- **Arguments**: `parseArgs()` from `node:util`, always `strict: true`
- **Required flags**: Collect all missing into an array, report them together
- **Output**: `--json` for structured data, human-readable table by default
- **Errors**: Always to `stderr`, always set `process.exitCode = 1`
- **No side effects**: Commands are pure read-calculate-print pipelines
- **Formatting**: Use `formatHeader()`, `formatTable()`, `printResult()` from `format.ts`

## How to Add a New Command

### Step 1: Pure logic in `lib/`

Create (or reuse) a `lib/<name>.ts` with pure calculation functions. These are shared with the React component — the CLI is just another consumer.

```typescript
// lib/my-metric.ts
export const calculateMyMetric = (input1: string, input2: string): string | null => {
  // ... returns null on invalid input
};
export const getMyMetricCategory = (result: string | null): string => { /* ... */ };
```

### Step 2: Command file

Create `packages/medprotocol/src/commands/<name>.ts`:

```typescript
import { parseArgs } from "node:util";
import { calculateMyMetric, getMyMetricCategory } from "../../../../lib/my-metric";
import { formatHeader, formatTable, printResult, formatError } from "../format";

const USAGE = `Usage: medprotocol my-metric [options]

Options:
  --input1 <number>   Description (required)
  --input2 <number>   Description (required)
  --json              Output as JSON
  --help              Show this help

Examples:
  medprotocol my-metric --input1 100 --input2 50`;

export const run = (argv: string[]): void => {
  const { values } = parseArgs({
    args: argv,
    options: {
      input1: { type: "string" },
      input2: { type: "string" },
      json: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
    strict: true,
  });

  if (values.help) {
    process.stdout.write(USAGE + "\n");
    return;
  }

  const missing: string[] = [];
  if (!values.input1) missing.push("--input1");
  if (!values.input2) missing.push("--input2");

  if (missing.length > 0) {
    process.stderr.write(
      formatError(`Missing required flags: ${missing.join(", ")}`) + "\n\n" + USAGE + "\n",
    );
    process.exitCode = 1;
    return;
  }

  const result = calculateMyMetric(values.input1!, values.input2!);

  if (!result) {
    process.stderr.write(formatError("Could not calculate — check input values") + "\n");
    process.exitCode = 1;
    return;
  }

  const category = getMyMetricCategory(result);

  const data = {
    result: parseFloat(result),
    category,
    input1: parseFloat(values.input1!),
    input2: parseFloat(values.input2!),
  };

  printResult(data, values.json!, () => {
    return [
      formatHeader("My Metric"),
      formatTable([
        ["Result", result],
        ["Category", category],
        ["Input 1", values.input1!],
        ["Input 2", values.input2!],
      ]),
    ].join("\n");
  });
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

### Step 5: Verify

```bash
npx vitest run tests/cli/<name>-cli    # New CLI tests pass
npm test                                # Full suite still passes
```

### Sub-command Pattern (optional)

For commands with multiple calculators (like `cardiology`), use a router in the `run()` function:

```typescript
export const run = (argv: string[]): void => {
  const subcommand = argv[0];
  const subArgs = argv.slice(1);
  const json = subArgs.includes("--json");

  switch (subcommand) {
    case "sub1": runSub1(subArgs, json); break;
    case "sub2": runSub2(subArgs, json); break;
    default:
      process.stderr.write(formatError(`Unknown sub-command: ${subcommand}`) + "\n");
      process.exitCode = 1;
  }
};
```

## Checklist: Adding a Command

- [ ] Pure logic exists in `lib/<name>.ts` (with unit tests in `tests/<name>/`)
- [ ] Command file at `packages/medprotocol/src/commands/<name>.ts`
- [ ] Exports `run(argv: string[]): void`
- [ ] `--json` and `--help` flags supported
- [ ] Errors go to `stderr` with `process.exitCode = 1`
- [ ] Registered in `packages/medprotocol/src/index.ts` (commands record + USAGE)
- [ ] CLI tests at `tests/cli/<name>-cli.test.ts`
- [ ] `npm test` passes
