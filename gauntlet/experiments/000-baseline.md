# Experiment 000 — Baseline

**Benchmark:** Job Radar v1 · 12 frozen cases

## Result

- Verdict accuracy: **0.750** (9/12)
- Evidence recall: **0.951**
- Strong/good separation metric: **0.826**
- Composite fitness: **0.798**
- Decision: **BASELINE_ONLY**

## Failed cases

1. `trap-ai-sales` — expected `schwacher Fit`, got `starker Fit` (score 1.00).
   - Failure mode: superficial AI/tool keyword overlap hides a different job family (quota-carrying enterprise sales).
2. `trap-research-phd` — expected `schwacher Fit`, got `guter Fit` (score 0.60).
   - Failure mode: technical keyword overlap ignores unsupported research seniority / required PhD.
3. `good-workflow-ops` — expected `guter Fit`, got `schwacher Fit` (score 0.40).
   - Failure mode: the current score basis undervalues strong agent/LLM workflow fit when the job is less stack-keyword-heavy.

## Secondary evidence misses

- `good-ai-consulting`: evidence recall 0.667.
- `strong-civic-mcp`: evidence recall 0.750.

## Interpretation

The deterministic keyword scorer is a useful baseline but conflates **technology mentioned in a job** with **the job family and level actually being hired**. The next useful mutation should introduce role-family / requirement-gate reasoning rather than simply shifting a global threshold.

Source: GitHub Actions `Gauntlet CI`, successful run on the feature branch, 2026-08-09.
