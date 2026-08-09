import { capabilities, SCORE_BASIS, type Capability } from './profile.js'
import type { Posting } from './postings.js'

export type Evidence = { need: string; proof: string }

export type FitResult = {
  score: number // 0–1, messbar
  verdict: 'starker Fit' | 'guter Fit' | 'schwacher Fit'
  evidence: Evidence[] // belegbar: Anforderung → mein Beweis
  matched: string[]
}

export type FitPolicy = {
  scoreBasis?: number
  goodThreshold?: number
  strongThreshold?: number
  capabilityWeightOverrides?: Record<string, number>
  requirementGates?: boolean
}

type RequirementMismatch = {
  kind: 'unsupported-credential' | 'different-role-family'
  reason: string
}

function detectRequirementMismatch(posting: Posting): RequirementMismatch | undefined {
  const title = posting.title.toLowerCase()
  const text = `${posting.title} ${posting.description}`.toLowerCase()

  // A required credential is a gate, not another keyword to average away.
  if (/\bph\.?d\.? required\b|\bdoctorate required\b/.test(text)) {
    return {
      kind: 'unsupported-credential',
      reason: 'Role explicitly requires a doctorate that is not represented in the capability profile.',
    }
  }

  // Technology names inside a quota-carrying sales role describe the product being
  // sold, not the work the candidate is being hired to perform.
  const salesTitle = /account executive|sales executive|enterprise sales|business development/.test(title)
  const quotaWork = /\bquota\b|pipeline generation|\bclosing\b|close deals|sales pipeline/.test(text)
  if (salesTitle && quotaWork) {
    return {
      kind: 'different-role-family',
      reason: 'Quota-carrying sales is a different role family from the engineering/AI-operations evidence profile.',
    }
  }

  return undefined
}

// Der „Decision-Maker" in der Mitte des Loops. Default bleibt deterministisch
// und identisch zum bisherigen Verhalten. Der optionale FitPolicy-Parameter ist
// absichtlich klein: Gauntlet-Experimente können genau EINE Hypothese verändern,
// ohne die Produktionslogik oder den Benchmark umzuschreiben.
export function assessFit(posting: Posting, policy: FitPolicy = {}): FitResult {
  const text = `${posting.title} ${posting.description}`.toLowerCase()

  const hits: Capability[] = capabilities.filter((c) =>
    c.keywords.some((kw) => text.includes(kw)),
  )

  const weight = hits.reduce(
    (sum, c) => sum + (policy.capabilityWeightOverrides?.[c.need] ?? c.weight),
    0,
  )
  const scoreBasis = policy.scoreBasis ?? SCORE_BASIS
  const rawScore = Math.min(weight / scoreBasis, 1)
  const mismatch = policy.requirementGates ? detectRequirementMismatch(posting) : undefined
  const score = mismatch ? Math.min(rawScore, 0.3) : rawScore
  const strongThreshold = policy.strongThreshold ?? 0.8
  const goodThreshold = policy.goodThreshold ?? 0.5
  const verdict =
    score >= strongThreshold ? 'starker Fit' : score >= goodThreshold ? 'guter Fit' : 'schwacher Fit'

  return {
    score: Math.round(score * 100) / 100,
    verdict,
    evidence: hits.map((c) => ({ need: c.need, proof: c.proof })),
    matched: hits.map((c) => c.need),
  }
}

// Tailored Notiz pro Stelle — der Entwurf, mit dem sich Mikel bewerben würde.
// Auch das wäre der Platz für ein LLM; hier deterministisch templated.
export function draftNote(posting: Posting, fit: FitResult): string {
  const top = fit.evidence
    .slice(0, 3)
    .map((e) => `• ${e.need}: ${e.proof}`)
    .join('\n')
  return (
    `Betreff: Bewerbung als ${posting.title} bei ${posting.company}\n\n` +
    `Fit-Score ${Math.round(fit.score * 100)}% (${fit.verdict}). ` +
    `Drei Belege, warum es passt:\n${top}\n\n` +
    `Am liebsten gleich mit einem Probearbeits-Tag zum Kennenlernen.`
  )
}
