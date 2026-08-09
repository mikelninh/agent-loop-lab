# Experiment 001 — Raise good-fit threshold

**Hypothesis:** A higher `guter Fit` threshold will reduce false positives caused by superficial AI keyword overlap.

## Single mutation

```json
{
  "kind": "threshold",
  "target": "good",
  "value": 0.6
}
```

Baseline threshold: `0.5`.

## Result

| Metric | Baseline | Candidate |
|---|---:|---:|
| Verdict accuracy | 0.750 | **0.667** |
| Evidence recall | 0.951 | 0.951 |
| Separation | 0.826 | 0.826 |
| Composite fitness | 0.798 | **0.740** |

**Decision: REVERT**

## Why it failed

The global threshold did not solve the real false positives:

- `trap-ai-sales` remained `starker Fit` because keyword overlap already produced score 1.00.
- `trap-research-phd` remained `guter Fit` at score 0.60.

It also created a new false negative:

- `good-ai-frontend` moved from correct `guter Fit` to incorrect `schwacher Fit` at score 0.50.

## Learning

The root problem is **not threshold calibration**. It is missing semantic structure around role family, hard requirements and unsupported seniority/credentials.

A better next hypothesis is to add a small deterministic requirement-gate layer before capability scoring, while keeping the frozen benchmark unchanged.

Source: GitHub Actions `Gauntlet CI`, successful run on the feature branch, 2026-08-09.
