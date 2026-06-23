# agent-loop-lab

A **durable agent loop** — the *Loop · Skill · Orchestrator* pattern, running for real.

A scheduled loop scores incoming job postings against my profile, and for each match invokes a durable skill that drafts a tailored note and writes it to a tracker. Every step is checkpointed on [Inngest](https://www.inngest.com), so a crash or restart **resumes from the last successful step** instead of re-running everything (no duplicate LLM calls, no duplicate writes).

## The three layers

- **Loop** (`jobRadar`) — cron + event trigger. Fetches postings → scores fit → `step.invoke`s the skill for each match.
- **Skill** (`triageApplication`, `retries: 2`, `onFailure`) — durable multi-step workflow: fetch details → draft note → write tracker → notify. On exhausted retries the `onFailure` hook fires; the event is preserved, nothing is lost.
- **Orchestrator** — the Inngest dev/cloud engine: schedules, checkpoints, retries, and gives full step-level observability.

## Durability, proven

The fixtures include a `flaky` posting (fails once) and an `alwaysFail` posting. Running a scan produces this in `data/steps.log`:

```
triage flaky      → fetch-details(0) draft-note(0) write-tracker(0,fail)
                                       write-tracker(1)  ← only this step re-ran
triage alwaysFail → write-tracker(0,fail)(1,fail)(2,fail) → ONFAILURE (nothing written)
```

Completed steps are memoized and skipped on retry — that's the whole point.

## Fit scoring — measurable + explainable

`src/fit.ts` scores each posting against a set of capabilities (RAG, MCP, FastAPI, agents, LLM, Document AI, GovTech…), each with a **proof** (which project demonstrates it). Output: a 0–1 score, a verdict, and the evidence behind it.

## Run it

```bash
npm install
npm start                                   # serves functions on :3000
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest   # orchestrator + dashboard
curl -X POST localhost:3000/scan            # trigger a scan
curl localhost:3000/tracker                 # see the shortlist (best first, with evidence)
```

Open the Inngest dashboard at `localhost:8288` to watch every step, retry, and `onFailure` live.

## Stack

TypeScript · Inngest · Express · deterministic offline fit scoring (swap in any LLM via `OPENAI_API_KEY`).
