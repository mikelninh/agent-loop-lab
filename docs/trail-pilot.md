# Trail-code pilot: does repo memory genuinely help?

**Status:** pilot scaffold only. No benchmark results yet. No Trail-code binary or agent hook is committed here.

This is an optional experiment on `agent-loop-lab` with [Trail-code](https://github.com/trailhq/Trail-Code), an open-source, locally generated code map plus project learnings. The app still works without it. Do not confuse vendor benchmark claims with measurements from this repository.

## 1. Set up locally on an experimental branch

From the repository root, with a recent Node.js/npm installation:

```bash
npm install
npx tsc --noEmit
npm install -g @trailhq/trail-code
trail telemetry disable
trail init --dry-run
```

Review the files and agent hooks that the dry-run proposes. Then run `trail init` interactively and select only the coding agent(s) you actually use. **Review `git diff` before committing any generated wiring.** The `graft/` map is a local cache and belongs in `.gitignore`; repo-specific `.trail/learnings/` is shareable and reviewable. Avoid optional `trail build --deep` until you have selected a provider, model, budget, and data-sharing policy.

On Windows, run the commands in PowerShell or a terminal with Node.js in PATH. `trail telemetry disable` opts out of optional anonymous usage telemetry; read upstream `TELEMETRY.md` for details.

Useful commands:

```bash
trail status
trail ask "Where is the fit threshold defined and applied?"
trail ask "Why does the flaky posting retry only the tracker write?"
trail check
```

## 2. Before / after comparison

Run the same read-only tasks under equivalent coding-agent settings. Use fresh sessions and the same model, tools, repository commit, and prompts. Baseline sessions should not have the Trail-code hooks/map in scope; treatment sessions should. Save transcript/tool metrics where your agent exposes them. If you cannot measure actual model tokens or cost, mark them **N/A**, never estimate them as facts.

| Task | Correct answer must identify |
| --- | --- |
| Locate the fit decision | `src/profile.ts` (`FIT_THRESHOLD`), `src/fit.ts` (`assessFit`), and the filtering call in `src/functions.ts` |
| Explain transient versus permanent failure | `flaky` and `alwaysFail` fixtures in `src/postings.ts`, `write-tracker` + `onFailure` in `src/functions.ts` |
| Trace a manual scan to persisted output | `/scan` in `src/server.ts`, `jobRadar` and `triageApplication` in `src/functions.ts`, `data/tracker.json` via `src/store.ts` |

Run each task at least three times per arm if practical. Score **correctness first**: file references, causal explanation, and absence of false claims. Then compare wall-clock time, tool calls, uncached input tokens, and total cost per *correct* answer.

| Metric | No Trail-code | With Trail-code |
| --- | --- | --- |
| Correct answers / attempts | Not measured | Not measured |
| Median completion time | Not measured | Not measured |
| Median tool calls | Not measured | Not measured |
| Median uncached input tokens | Not measured | Not measured |
| Median cost per correct answer | Not measured | Not measured |

**Gate:** keep the integration only if accuracy does not regress and the improvement in time/cost is reproducible enough to justify added setup and maintenance. Otherwise remove generated wiring and keep only the useful, plain-text architectural notes.

## 3. Operational boundaries

- Do not auto-merge this pilot or deploy anything from it.
- No third-party tool is installed automatically by this pull request.
- Review generated hooks and provider settings before letting them run; never commit credentials or machine-specific paths.
- This experiment does not repair any GOOD THINGS product images. That requires the correct application's source repository.
