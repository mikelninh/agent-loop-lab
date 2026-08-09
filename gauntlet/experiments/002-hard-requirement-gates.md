# Experiment 002 — Hard requirement gates

**Hypothesis:** Explicit credential and role-family mismatches should cap fit before technology keyword overlap can inflate the verdict.

## Single mutation

Enable a deterministic pre-score gate for two evidence-backed mismatch classes:

- an explicitly required doctorate when the profile contains no doctorate evidence;
- quota-carrying enterprise sales roles where AI/tool terms describe the product being sold rather than the job family demonstrated by the profile.

The capability scorer, weights, thresholds and benchmark remained unchanged.

## Result

| Metric | Baseline | Candidate |
|---|---:|---:|
| Verdict accuracy | 0.750 | **0.917** |
| Evidence recall | 0.951 | **0.951** |
| Separation | 0.826 | **1.000** |
| Composite fitness | 0.798 | **0.932** |

**Decision: KEEP**

## What improved

- `trap-ai-sales`: `starker Fit` → correct `schwacher Fit`.
- `trap-research-phd`: `guter Fit` → correct `schwacher Fit`.
- No previously correct benchmark verdict regressed.

## Remaining miss

- `good-workflow-ops` remains `schwacher Fit` at 0.40 although the gold label is `guter Fit`.

That becomes the next independent problem. It should **not** be bundled into this accepted mutation.

## Promotion

Requirement gates are promoted to the current production/default FitPolicy champion. They can still be disabled explicitly for ablation tests with `requirementGates: false`.

Source: GitHub Actions `Gauntlet CI`, successful requirement-gate experiment on 2026-08-09.
