# Changelog

One entry per release, newest first, written for the doctors and developers who use the plugin. Releases before 1.5.0 are in the git tags.

## 1.5.1 — 2026-11-24

- **Diabetes, type 1 vs type 2:** `--on-insulin` is removed. It never changed the result. Passing it now gives a one-line error.
- **Blood gas:** the summary of a compensated or overcompensated disorder reads "compensated by …" / "overcompensated by …". It used to read "with Compensated by …".
- **Internal:** unused code removed from the logic copied into your project (a few type names and exports nothing used). The quick calculator's commands share one flag parser and one table printer; what they print is unchanged, checked command by command (`scripts/compare-cli.sh`, `qa/recipes/refactor-cli.md`).

## 1.5.0 — 2026-11-24

- **Vital signs:** dangerous values are now marked as critical. `vitals --bp 190/125` used to read "High", the same as 150/95; it now reads "Hypertensive crisis, critical". The same applies to heart rate, respiratory rate and temperature, and `--json` gains `severity` and `alert`.
- **Privacy guards:** a very large command or file (over about 100 KB) could pass the privacy, extraction and note-consent guards unchecked. Fixed.
- **Quick calculator:** a mistyped flag gives a one-line error, not a crash dump.
- **Plugin only:** the clone installer and the provider layer are removed. Install from the plugin marketplace. The full privacy and quality-checklist documents now ship with every skill.
- **Internal:** shared error and sub-command helpers in the CLI, one `Severity` type, and a CLI QA recipe (`qa/recipes/cli.md`).
