import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { FIELDS, EPISODES, checkExtraction, noteSegments, toInputs, type ExtractedItem } from "../../../../plugin/lib/extraction";
import { formatHeader, formatTable, printResult, formatError } from "../../../../plugin/lib/format";
import { EXTRACT_ARTIFACT_HTML } from "../extract-artifact";

const USAGE = `Usage: medprotocol extract --note <file> --items <file> [options]
       medprotocol extract --save <file>

Checks an extraction against its note: is each quote in the note verbatim, and does it state the value?
No clinical interpretation.

Options:
  --save <file>     Store a raw note as extractions/<hash>/note.md and print the folder. The hash is the first
                    12 hex of the SHA-256 of the note with line endings and trailing whitespace evened out,
                    so the same note always lands in the same folder. A <file> directly in extractions/
                    is a staging copy and is deleted once saved.
  --note <file>     The clinical note (plain text)
  --items <file>    JSON array of { field, value, unit?, quote, episode, key?, time? }
                    episode: "current" (this illness) or "history" (before it)
  --artifact <file> Also write a page showing the note beside the extraction (HTML)
  --json            Output as JSON
  --help            Show this help

Output: each item's status, plus "inputs" (verified numbers by key, for the calculators) and
"review" (keyed items held back, with the reason). Keys: ${Object.keys(FIELDS).join(", ")}

Statuses: quoted (exact) · edited (case/accents differ) · approximate (within 5 characters)
          · reordered (same words, another order, within 5 characters) · mismatched (span found, value not in it) · unverified (not in note) · none (no quote)
          edited, approximate and reordered are lower confidence: highlighted, but held back from "inputs".

Example:
  medprotocol extract --note note.txt --items extraction.json --json`;

export const run = (argv: string[]): void => {
  const { values } = parseArgs({
    args: argv,
    options: {
      save: { type: "string" },
      note: { type: "string" },
      items: { type: "string" },
      artifact: { type: "string" },
      json: { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
    strict: true,
  });

  if (values.help) {
    process.stdout.write(USAGE + "\n");
    return;
  }

  if (values.save) {
    if (values.note || values.items || values.artifact) {
      process.stderr.write(formatError("--save takes no other options but --json") + "\n");
      process.exitCode = 1;
      return;
    }
    let raw: Buffer;
    try {
      raw = readFileSync(values.save);
    } catch (e) {
      process.stderr.write(formatError((e as Error).message) + "\n");
      process.exitCode = 1;
      return;
    }
    // CRLF vs LF or a trailing newline must not split one note into two folders; note.md keeps the raw bytes
    const canonical = raw.toString("utf8").replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trimEnd();
    const dir = join("extractions", createHash("sha256").update(canonical).digest("hex").slice(0, 12));
    const existed = existsSync(join(dir, "note.md"));
    if (!existed) {
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "note.md"), raw);
    }
    // a pasted note staged at extractions/<file> is patient data; don't leave it behind
    if (dirname(resolve(values.save)) === resolve("extractions")) rmSync(values.save);
    printResult({ dir, existed }, values.json!, () => dir + (existed ? "  (already saved)" : ""));
    return;
  }

  if (!values.note || !values.items) {
    process.stderr.write(formatError("--note and --items are required") + "\n\n" + USAGE + "\n");
    process.exitCode = 1;
    return;
  }

  let note: string;
  let items: ExtractedItem[];
  try {
    note = readFileSync(values.note, "utf8");
    items = JSON.parse(readFileSync(values.items, "utf8"));
  } catch (e) {
    process.stderr.write(formatError((e as Error).message) + "\n");
    process.exitCode = 1;
    return;
  }

  if (!Array.isArray(items) || items.some((i) => typeof i?.field !== "string" || typeof i?.value !== "string" || typeof i?.quote !== "string")) {
    process.stderr.write(formatError("--items must be a JSON array of { field, value, unit?, quote } strings") + "\n");
    process.exitCode = 1;
    return;
  }

  const badEpisode = items.find((i) => !(EPISODES as readonly string[]).includes(i.episode));
  if (badEpisode) {
    process.stderr.write(formatError(`"${badEpisode.field}" needs episode "current" or "history"`) + "\n");
    process.exitCode = 1;
    return;
  }

  const badKey = items.find((i) => i.key !== undefined && !Object.hasOwn(FIELDS, i.key));
  if (badKey) {
    process.stderr.write(formatError(`unknown key "${badKey.key}" — use one of: ${Object.keys(FIELDS).join(", ")}`) + "\n");
    process.exitCode = 1;
    return;
  }

  const checked = checkExtraction(note, items);
  const counts = Object.fromEntries(
    (["quoted", "edited", "approximate", "reordered", "mismatched", "unverified", "none"] as const).map((s) => [s, checked.filter((c) => c.status === s).length]),
  );

  const { inputs, review } = toInputs(checked);

  if (values.artifact) {
    // extractions/<hash>/note.md is named by its folder
    const name = basename(values.note) === "note.md" ? basename(dirname(resolve(values.note))) : basename(values.note, extname(values.note));
    const data = { name, checkedAt: new Date().toLocaleDateString("sv"), items: checked, segments: noteSegments(note, checked) };
    // \u003c keeps "</script>" in a note from closing the data block
    const html = EXTRACT_ARTIFACT_HTML.replace("__TITLE__", () => `${name.replace(/[<&]/g, "")} extraction`).replace("__DATA__", () => JSON.stringify(data).replace(/</g, "\\u003c"));
    try {
      writeFileSync(values.artifact, html);
    } catch (e) {
      process.stderr.write(formatError((e as Error).message) + "\n");
      process.exitCode = 1;
      return;
    }
  }

  printResult({ items: checked, counts, inputs, review }, values.json!, () =>
    [
      formatHeader("Extraction vs note"),
      formatTable(checked.map((c) => [c.field, `${c.value}${c.unit ? ` ${c.unit}` : ""}  (${c.episode})  [${c.status}${c.distance ? `, ${c.distance} chars off` : ""}${c.ambiguous ? ", ambiguous" : ""}]  "${c.quote}"`])),
      "",
      formatTable(Object.entries(counts).map(([s, n]) => [s, String(n)])),
      ...(Object.keys(inputs).length ? [formatHeader("Inputs for calculators"), formatTable(Object.entries(inputs).map(([k, v]) => [k, `${v!.value}${v!.unit ? ` ${v!.unit}` : ""}`]))] : []),
      ...(review.length ? [formatHeader("Held back"), formatTable(review.map((r) => [r.item.key!, `${r.item.value}  [${r.reason}]`]))] : []),
    ].join("\n"),
  );
};
