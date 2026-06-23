import express from 'express'
import { serve } from 'inngest/express'
import { inngest } from './inngest.js'
import { functions } from './functions.js'
import { readTracker, readSteps } from './store.js'

const app = express()
app.use(express.json())

// Inngest-Endpoint: hier registriert/triggert der Orchestrator die Funktionen.
app.use('/api/inngest', serve({ client: inngest, functions }))

// Loop manuell anstoßen (statt auf den Cron zu warten).
app.post('/scan', async (_req, res) => {
  const r = await inngest.send({ name: 'radar/scan.requested', data: {} })
  res.json({ triggered: true, ...r })
})

app.post('/review', async (_req, res) => {
  const r = await inngest.send({ name: 'radar/review.requested', data: {} })
  res.json({ triggered: true, ...r })
})

// Ergebnisse einsehen.
app.get('/tracker', (_req, res) => res.json(readTracker()))
app.get('/steps', (_req, res) => res.type('text/plain').send(readSteps()))

app.listen(3000, () => console.log('▶ agent-loop-lab on http://localhost:3000'))
