import { appendFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const DATA = join(process.cwd(), 'data')
mkdirSync(DATA, { recursive: true })

const STEPS = join(DATA, 'steps.log')
const TRACKER = join(DATA, 'tracker.json')

// Jeder Step protokolliert sich hier. Weil step.run einen erfolgreichen
// Step memoisiert, taucht er beim Retry NICHT erneut auf — genau so wird
// Durability sichtbar (kein doppelter LLM-Call, keine doppelte Notiz).
export function recordStep(step: string, runId: string, extra: Record<string, unknown> = {}) {
  const line = JSON.stringify({ t: new Date().toISOString(), runId: runId.slice(0, 8), step, ...extra })
  appendFileSync(STEPS, line + '\n')
}

export type TrackerEntry = {
  id: string
  company: string
  role: string
  url: string
  score: number
  verdict: string
  evidence: { need: string; proof: string }[]
  note: string
  stage: string
  addedAt: string
}

export function writeTracker(entry: TrackerEntry) {
  const list: TrackerEntry[] = existsSync(TRACKER)
    ? JSON.parse(readFileSync(TRACKER, 'utf8'))
    : []
  const next = [...list.filter((e) => e.id !== entry.id), entry]
  next.sort((a, b) => b.score - a.score) // beste zuerst
  writeFileSync(TRACKER, JSON.stringify(next, null, 2))
}

export function readTracker(): TrackerEntry[] {
  return existsSync(TRACKER) ? JSON.parse(readFileSync(TRACKER, 'utf8')) : []
}

export function readSteps(): string {
  return existsSync(STEPS) ? readFileSync(STEPS, 'utf8') : ''
}
