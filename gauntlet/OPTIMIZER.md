# Job Radar Gauntlet Optimizer

You are optimizing the Job Radar's **selection policy**, not trying to make every job look attractive.

1. Run `npm run gauntlet` and save the baseline.
2. Inspect every failed frozen case.
3. Classify the largest general failure mode: superficial keyword overlap, missing role-family signal, seniority/credential mismatch, capability weighting, thresholding or missing evidence.
4. State one falsifiable hypothesis.
5. Change one coherent policy surface only.
6. Rerun the complete frozen benchmark and held-out additions.
7. Never edit benchmark labels/cases because a mutation failed.
8. `REVERT` any mutation that lowers frozen-label accuracy.
9. Otherwise `KEEP` only when the aggregate objective fitness improves.
10. If `GAUNTLET_USE_JUDGE=1`, use judge-mcp only as a secondary note-quality signal; it must never rescue a bad job-selection decision.
11. Record hypothesis, diff, metrics and decision in Git.

Priorities: do not miss unusually strong opportunities; reject roles that merely contain AI keywords but demand a fundamentally different job family or unsupported seniority; ground positive fit claims in actual project evidence.
