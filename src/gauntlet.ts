import fs from 'node:fs'
import { spawnSync } from 'node:child_process'

import { assessFit, draftNote, type FitPolicy, type FitResult } from './fit.js'
import type { Posting } from './postings.js'

type Verdict = FitResult['verdict']

type Task = {
  id: string
  posting: Posting
  expectedVerdict: Verdict
  requiredEvidence: string[]
}

type Benchmark = {
  version: number
  description: string
  tasks: Task[]
}

type Mutation =
  | { id: string; hypothesis: string; kind: 'score_basis'; value: number }
  | { id: string; hypothesis: string; kind: 'threshold'; target: 'good' | 'strong'; value: number }
  | { id: string; hypothesis: string; kind: 'capability_weight'; capability: string; value: number }
  | { id: string; hypothesis: string; kind: 'requirement_gates'; value: boolean }

type Row = {
  id: string
  expected: Verdict
  actual: Verdict
  verdictPass: boolean
  evidenceRecall: number
  score: number
  judgeScore?: number
}

type Metrics = {
  verdictAccuracy: number
  evidenceRecall: number
  strongGoodSeparation: number
  judgeMean?: number
  composite: number
}

function loadJson<T>(path: string): T {
  return JSON.parse(fs.readFileSync(path, 'utf8')) as T
}

function policyFromMutation(mutation?: Mutation): FitPolicy {
  if (!mutation) return {}
  if (mutation.kind === 'score_basis') return { scoreBasis: mutation.value }
  if (mutation.kind === 'threshold') {
    return mutation.target === 'good'
      ? { goodThreshold: mutation.value }
      : { strongThreshold: mutation.value }
  }
  if (mutation.kind === 'requirement_gates') return { requirementGates: mutation.value }
  return { capabilityWeightOverrides: { [mutation.capability]: mutation.value } }
}

function judgeNote(note: string): number | undefined {
  if (process.env.GAUNTLET_USE_JUDGE !== '1') return undefined

  const bin = process.env.JUDGE_ARTIFACT_BIN || 'judge-artifact'
  const rubricFile = process.env.JUDGE_RUBRIC_FILE || 'gauntlet/application-note-rubric.json'
  const result = spawnSync(bin, ['--rubric-file', rubricFile], {
    input: note,
    encoding: 'utf8',
    env: process.env,
  })

  if (result.status !== 0) {
    throw new Error(`judge-mcp bridge failed: ${result.stderr || result.stdout}`)
  }

  const parsed = JSON.parse(result.stdout) as { overall?: number }
  return typeof parsed.overall === 'number' ? parsed.overall : undefined
}

function evaluate(benchmark: Benchmark, policy: FitPolicy): { rows: Row[]; metrics: Metrics } {
  const rows = benchmark.tasks.map((task): Row => {
    const fit = assessFit(task.posting, policy)
    const found = new Set(fit.evidence.map((e) => e.need))
    const required = task.requiredEvidence
    const evidenceRecall = required.length === 0
      ? 1
      : required.filter((need) => found.has(need)).length / required.length

    const note = draftNote(task.posting, fit)
    const judgeScore = judgeNote(note)

    return {
      id: task.id,
      expected: task.expectedVerdict,
      actual: fit.verdict,
      verdictPass: fit.verdict === task.expectedVerdict,
      evidenceRecall,
      score: fit.score,
      judgeScore,
    }
  })

  const verdictAccuracy = rows.filter((r) => r.verdictPass).length / rows.length
  const evidenceRecall = rows.reduce((sum, r) => sum + r.evidenceRecall, 0) / rows.length

  const positives = rows.filter((r) => r.expected !== 'schwacher Fit')
  const negatives = rows.filter((r) => r.expected === 'schwacher Fit')
  const positiveMean = positives.reduce((sum, r) => sum + r.score, 0) / Math.max(1, positives.length)
  const negativeMean = negatives.reduce((sum, r) => sum + r.score, 0) / Math.max(1, negatives.length)
  const strongGoodSeparation = Math.max(0, Math.min(1, positiveMean - negativeMean + 0.5))

  const judged = rows.flatMap((r) => (r.judgeScore === undefined ? [] : [r.judgeScore]))
  const judgeMean = judged.length
    ? judged.reduce((sum, score) => sum + score, 0) / judged.length
    : undefined

  // Objective benchmark dominates. Judge quality is reported separately and never
  // gets to rescue a regression in the frozen gold labels.
  const composite = 0.7 * verdictAccuracy + 0.2 * evidenceRecall + 0.1 * strongGoodSeparation

  return {
    rows,
    metrics: {
      verdictAccuracy: round(verdictAccuracy),
      evidenceRecall: round(evidenceRecall),
      strongGoodSeparation: round(strongGoodSeparation),
      judgeMean: judgeMean === undefined ? undefined : round(judgeMean / 10),
      composite: round(composite),
    },
  }
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000
}

function parseArg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag)
  return i >= 0 ? process.argv[i + 1] : undefined
}

const benchmarkPath = parseArg('--tasks') || 'gauntlet/tasks.json'
const mutationPath = parseArg('--mutation')
const benchmark = loadJson<Benchmark>(benchmarkPath)
const mutation = mutationPath ? loadJson<Mutation>(mutationPath) : undefined

const baseline = evaluate(benchmark, {})
const candidate = mutation ? evaluate(benchmark, policyFromMutation(mutation)) : undefined

const decision = candidate
  ? candidate.metrics.verdictAccuracy < baseline.metrics.verdictAccuracy
    ? 'REVERT'
    : candidate.metrics.composite > baseline.metrics.composite
      ? 'KEEP'
      : 'REVERT'
  : 'BASELINE_ONLY'

const output = {
  benchmarkVersion: benchmark.version,
  mutation: mutation || null,
  baseline,
  candidate: candidate || null,
  decision,
  rule: 'Never keep a mutation that lowers frozen-label accuracy; otherwise require a higher composite score.',
}

console.log(JSON.stringify(output, null, 2))
