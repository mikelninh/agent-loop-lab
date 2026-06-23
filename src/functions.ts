import { inngest } from './inngest.js'
import { POSTINGS, type Posting } from './postings.js'
import { assessFit, draftNote, type FitResult } from './fit.js'
import { recordStep, writeTracker, readTracker } from './store.js'
import { FIT_THRESHOLD } from './profile.js'

// ─────────────────────────────────────────────────────────────────────────
// LAYER 1 — DER LOOP: Trigger (Event oder Cron) + Decision-Maker in der Mitte.
// Holt Stellen, bewertet den Fit, und ruft für Treffer das Skill auf.
// ─────────────────────────────────────────────────────────────────────────
export const jobRadar = inngest.createFunction(
  { id: 'job-radar' },
  [{ event: 'radar/scan.requested' }, { cron: '0 8 * * *' }], // manuell + täglich 8 Uhr
  async ({ step, runId }) => {
    const postings = (await step.run('fetch-postings', async () => {
      recordStep('fetch-postings', runId, { count: POSTINGS.length })
      return POSTINGS // ← später: echte Job-Quellen statt Fixtures
    })) as Posting[]

    const assessed = (await step.run('assess-fit', async () => {
      recordStep('assess-fit', runId)
      return postings.map((p) => ({ posting: p, fit: assessFit(p) }))
    })) as { posting: Posting; fit: FitResult }[]

    const shortlist = assessed
      .filter((a) => a.fit.score >= FIT_THRESHOLD)
      .sort((a, b) => b.fit.score - a.fit.score)

    // Parallel + isoliert: ein failendes Skill blockiert die anderen nicht.
    const settled = await Promise.allSettled(
      shortlist.map((item) =>
        step.invoke(`triage-${item.posting.id}`, {
          function: triageApplication,
          data: { posting: item.posting, fit: item.fit },
        }),
      ),
    )
    const results = settled.map((s, i) =>
      s.status === 'fulfilled'
        ? s.value
        : { posting: shortlist[i].posting.id, failed: true, error: String(s.reason?.message ?? s.reason) },
    )

    return {
      scanned: postings.length,
      shortlisted: shortlist.length,
      best: shortlist.map((s) => ({ id: s.posting.id, score: s.fit.score })),
      results,
    }
  },
)

// ─────────────────────────────────────────────────────────────────────────
// LAYER 2 — DAS SKILL: durabler, retry-barer Multi-Step-Workflow.
// Bei erschöpften Retries greift onFailure — nichts geht verloren.
// ─────────────────────────────────────────────────────────────────────────
export const triageApplication = inngest.createFunction(
  {
    id: 'triage-application',
    retries: 2, // → bis zu 3 Versuche
    onFailure: async ({ error, event }) => {
      const posting = (event as any)?.data?.event?.data?.posting as Posting | undefined
      recordStep('ONFAILURE', 'failed___', {
        posting: posting?.id ?? 'unbekannt',
        error: error.message,
      })
      // Hier würde z.B. eine Slack-/Ops-Nachricht rausgehen.
      console.log(`⚠️  triage failed: ${posting?.id} — ${error.message} (Event bleibt erhalten)`)
    },
  },
  { event: 'radar/triage.requested' },
  async ({ event, step, runId, attempt }) => {
    const posting = event.data.posting as Posting
    const fit = event.data.fit as FitResult

    const details = await step.run('fetch-details', async () => {
      recordStep('fetch-details', runId, { posting: posting.id, attempt })
      return { ...posting, fetchedAt: new Date().toISOString() }
    })

    const note = await step.run('draft-note', async () => {
      recordStep('draft-note', runId, { posting: posting.id, attempt })
      return draftNote(posting, fit)
    })

    await step.run('write-tracker', async () => {
      recordStep('write-tracker', runId, { posting: posting.id, attempt })
      // Fehler-Injektion für die Durability-Demo:
      if (posting.flaky && attempt === 0) throw new Error('transient: tracker store timeout')
      if (posting.alwaysFail) throw new Error('permanent: tracker store unreachable')
      writeTracker({
        id: posting.id,
        company: posting.company,
        role: posting.title,
        url: posting.url,
        score: fit.score,
        verdict: fit.verdict,
        evidence: fit.evidence,
        note,
        stage: 'radar: vorgeschlagen',
        addedAt: new Date().toISOString(),
      })
    })

    await step.run('notify', async () => {
      recordStep('notify', runId, { posting: posting.id })
      console.log(`✅ shortlist: ${posting.company} — ${posting.title} (${Math.round(fit.score * 100)}%)`)
    })

    return { posting: posting.id, stage: 'radar: vorgeschlagen', score: fit.score }
  },
)

// ─────────────────────────────────────────────────────────────────────────
// REVIEW-LOOP: liest die eigene Historie (hier: den Tracker) und bewertet,
// ob die Schwelle stimmt — die „hill climbing machine" aus dem Artikel.
// ─────────────────────────────────────────────────────────────────────────
export const reviewRadar = inngest.createFunction(
  { id: 'review-radar' },
  [{ event: 'radar/review.requested' }, { cron: '0 10 * * 5' }],
  async ({ step, runId }) => {
    const summary = await step.run('analyze-shortlist', async () => {
      recordStep('analyze-shortlist', runId)
      const list = readTracker()
      const avg = list.length ? list.reduce((s, e) => s + e.score, 0) / list.length : 0
      return {
        total: list.length,
        avgScore: Math.round(avg * 100) / 100,
        best: list[0]?.id ?? null,
        suggestion:
          avg > 0.85
            ? 'Schwelle könnte höher — fast alle sind starke Fits.'
            : 'Schwelle passt.',
      }
    })
    return summary
  },
)

export const functions = [jobRadar, triageApplication, reviewRadar]
