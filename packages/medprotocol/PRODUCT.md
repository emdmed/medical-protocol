# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Users, at a desk, checking an AI extraction of a clinical note before they use its values. Inferred from the repo and not contested by the user (2026-11-22).

## Product Purpose

The extraction page of the `medprotocol` CLI (`extract --artifact`, `extract --serve`). It shows one clinical note and the values pulled from it, each tied to the exact words it came from, so the user can confirm or reject every value fast.

## Positioning

Every value carries its quote, and the page says how far to trust that tie: found word for word, close match, or the quote is missing or does not state the value. Extraction only: no ranges, scores or interpretation.

## Operating Context

A single local HTML file, or the same page served by a local server. It holds the full note and is never published. In live mode the user pastes a made-up or de-identified note, confirms that, waits one or two minutes for two passes (extract, second check), then accepts or rejects each proposed correction.

## Capabilities and Constraints

- One self-contained HTML string in `src/extract-artifact.ts` (String.raw, no backticks or `${`), no framework, no runtime deps.
- States: intake form, working (steps and clock), failed (retry), review (corrections to decide), done.
- Values listed in one place, grouped as needs review, current illness, history, labs; the note beside them as raw text; rows and note highlights light each other.
- Copy extraction JSON. Light and dark themes. One column under 900px.

## Product Principles

- The note is the source of truth; a value never appears without its words.
- "Found in the note" means the words are there, not that the value is right.
- What needs review comes first; what is verified stays quiet.
- Nothing leaves the computer without the user's explicit confirmation.
