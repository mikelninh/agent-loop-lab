import { capabilities, SCORE_BASIS, type Capability } from './profile.js'
import type { Posting } from './postings.js'

export type Evidence = { need: string; proof: string }

export type FitResult = {
  score: number // 0–1, messbar
  verdict: 'starker Fit' | 'guter Fit' | 'schwacher Fit'
  evidence: Evidence[] // belegbar: Anforderung → mein Beweis
  matched: string[]
}

// Der „Decision-Maker" in der Mitte des Loops. Heute deterministisch
// (Keyword-Match gegen Mikels Capabilities) — damit der Fit messbar UND
// belegbar ist. Ein echtes LLM lässt sich hier 1:1 einsetzen; der Rest
// der Architektur (Loop, Skill, Orchestrator) bleibt unverändert.
export function assessFit(posting: Posting): FitResult {
  const text = `${posting.title} ${posting.description}`.toLowerCase()

  const hits: Capability[] = capabilities.filter((c) =>
    c.keywords.some((kw) => text.includes(kw)),
  )

  const weight = hits.reduce((sum, c) => sum + c.weight, 0)
  const score = Math.min(weight / SCORE_BASIS, 1)
  const verdict = score >= 0.8 ? 'starker Fit' : score >= 0.5 ? 'guter Fit' : 'schwacher Fit'

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
