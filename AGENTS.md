# Coding agent guide — agent-loop-lab

This repository demonstrates a durable job-radar workflow with **fixture data**, not a production job-search or application system. Prioritise correctness, traceability, and small reversible changes.

## Start here

- `src/server.ts`: HTTP entry points (`/scan`, `/review`, `/tracker`, `/steps`) and Inngest adapter.
- `src/functions.ts`: scheduled/event-driven radar, durable triage skill, review loop, and deliberate retry/failure behaviour.
- `src/fit.ts` + `src/profile.ts`: deterministic, evidence-backed fit scoring and threshold.
- `src/postings.ts`: offline job fixtures, including the intentional `flaky` and `alwaysFail` cases.
- `src/store.ts`: local, ID-deduplicated tracker and step log under gitignored `data/`.

## Behaviour to preserve

1. Keep successful Inngest `step.run` calls separate and memoizable across retries. Never collapse all triage steps into one step to make the code appear shorter.
2. The `flaky` fixture must fail `write-tracker` once and succeed on retry; `alwaysFail` must exhaust the configured retries and invoke `onFailure`.
3. Tracker entries are replaced by posting ID rather than appended as duplicates, then sorted by decreasing fit score.
4. Never describe fixture postings as current, verified live job vacancies. Do not send real applications, notifications, or external requests without explicit approval.
5. Keep personal settings, credentials, logs, and `data/` output out of commits.

## Trail-code pilot (optional local CLI)

This repository includes a documented Trail-code experiment in `docs/trail-pilot.md` and a source-grounded learning in `.trail/learnings/`. **Trail-code is not required to run this app.**

When Trail-code is installed locally:

- Run `trail ask "<task>"` to orient before broad manual searching; confirm its pointers against the source.
- Review relevant `.trail/learnings/` before changing implicated files.
- Run `trail check` before proposing a commit or pull request; assess warnings rather than blindly overriding them.
- Save a short, factual learning only after discovering a *new* architectural decision or pitfall. Never fabricate time/token savings.

If it is not installed, read the source and `.trail/learnings/` directly and continue normally.

## Verification

- `npm install` and `npx tsc --noEmit` for a TypeScript check.
- For changes to workflow semantics, use the local Inngest dev server and check `/steps` and `/tracker` as described in the README.
- A passing typecheck alone does **not** establish retry correctness: retain the flaky/permanent-failure demo.
