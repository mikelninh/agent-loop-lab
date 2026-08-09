# Portfolio Gauntlet Contract

The Gauntlet is an experiment loop for agents and agent-producing systems:

`frozen tasks -> baseline -> diagnose -> ONE mutation -> full rerun -> keep/revert -> log`

## Non-negotiables

1. **Freeze the benchmark before optimizing.** Never change labels, checks or rubrics because a mutation failed.
2. **One coherent mutation per experiment.** If five things change, we learn nothing.
3. **Objective checks outrank judge vibes.** Deterministic correctness, safety and source checks are hard gates.
4. **A judge cannot be its own only fitness signal.** `judge-mcp` is calibrated against human-labelled cases separately.
5. **Keep/revert is mechanical.** A hard-gate regression always reverts. Otherwise the candidate must beat baseline.
6. **Log every experiment.** Hypothesis, changed surface, before/after metrics and decision belong in Git history.

## Reference implementation: Job Radar

```bash
npm run gauntlet
npm run gauntlet:example
```

Optional second-stage note quality judging:

```bash
# in judge-mcp
pip install -e .

# in agent-loop-lab
GAUNTLET_USE_JUDGE=1 npm run gauntlet
```

The Job Radar benchmark intentionally contains role traps such as AI sales and senior research roles. A system that only keyword-matches AI terminology should fail these cases.

## Adapter contract used across the portfolio

Each participating repository gets a `gauntlet/program.json` describing:

- the frozen benchmark source;
- objective metrics;
- hard gates;
- mutable surfaces;
- forbidden mutations;
- the command or workflow that evaluates a candidate.

Each also gets `gauntlet/OPTIMIZER.md`: the agent instruction for running experiments in that domain.

The common philosophy is deliberately boring: **measure first, mutate narrowly, never move the goalposts.**
