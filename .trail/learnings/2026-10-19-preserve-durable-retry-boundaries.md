---
title: Preserve durable triage step boundaries and intentional failure fixtures
author: Repo pilot (source-grounded)
date: 2026-10-19
touches:
  - src/functions.ts
  - src/postings.ts
  - src/store.ts
---

## Decided (existing code behaviour)

- `triageApplication` separates `fetch-details`, `draft-note`, `write-tracker` and `notify` as distinct Inngest `step.run` operations. Do not collapse them: preserving successful steps across a retry is the point of this demo.
- The `flaky` fixture deliberately throws on the first `write-tracker` attempt and then succeeds on retry. The `alwaysFail` fixture deliberately fails every write and exercises the `onFailure` handler after retries are exhausted.
- `writeTracker` replaces an entry with the same posting ID and sorts the tracker by descending fit score, so retries should not create duplicate shortlist entries.

## Watch out

- `src/postings.ts` is an offline fixture list, not a live jobs feed.
- `data/steps.log` and `data/tracker.json` are generated locally and must remain uncommitted.
- Typechecking cannot prove correct Inngest checkpoint/retry behaviour; exercise both the transient and permanent failure cases when editing this workflow.

## Source and provenance

Recorded from the existing `src/functions.ts`, `src/postings.ts`, and `src/store.ts` implementation. This note is **not** evidence that a benchmark has run or that Trail-code generated the learning.
