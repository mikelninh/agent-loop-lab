import { createServer as httpServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { timingSafeEqual } from 'node:crypto'

// Deliberately deterministic: a connection and trust pilot, not a general AI.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const MAX_BODY = 64 * 1024

function read(root, filename) {
  try { return readFileSync(resolve(root, filename), 'utf8') }
  catch { return null }
}

function lastQuestion(messages) {
  if (!Array.isArray(messages)) return ''
  const last = [...messages].reverse().find(message => message?.role === 'user')
  if (typeof last?.content === 'string') return last.content.slice(0, 2000).toLowerCase()
  if (Array.isArray(last?.content)) {
    return last.content.filter(p => typeof p?.text === 'string')
      .map(p => p.text).join(' ').slice(0, 2000).toLowerCase()
  }
  return ''
}

// Reads six fixed files only. User text never becomes a file path or command.
export function answer(input, root = ROOT) {
  const files = {
    fit: read(root, 'src/fit.ts'),
    profile: read(root, 'src/profile.ts'),
    functions: read(root, 'src/functions.ts'),
    postings: read(root, 'src/postings.ts'),
    store: read(root, 'src/store.ts'),
    server: read(root, 'src/server.ts'),
  }
  if (Object.values(files).some(content => content === null)) {
    return 'Source files are unavailable. No repository facts were inferred.'
  }
  const q = lastQuestion(input?.messages)
  const preface = '**Repo Scout — read-only source inspection**\n\n'
  const caveat = '\n\nOffline source inspection only. No job search, workflow execution, messages or applications were performed.'
  const yes = (condition, claim) => (condition ? '✓ ' : '⚠ Not found: ') + claim
  if (/retry|flaky|fail|onfailure|checkpoint|durab/.test(q)) {
    return preface + [
      yes(files.functions.includes("step.run('write-tracker'"), 'a separate write-tracker checkpoint (src/functions.ts)'),
      yes(files.postings.includes('flaky: true'), 'a transient failure fixture (src/postings.ts)'),
      yes(files.postings.includes('alwaysFail: true'), 'a permanent failure fixture (src/postings.ts)'),
      yes(files.functions.includes('onFailure:'), 'an onFailure handler (src/functions.ts)'),
      'These are code checks, not proof of successful runtime retries.'
    ].join('\n') + caveat
  }
  if (/fit|threshold|score|match|evidence/.test(q)) {
    const threshold = files.profile.match(/export const FIT_THRESHOLD\s*=\s*([\d.]+)/)?.[1]
    return preface + [
      'Fit uses assessFit in src/fit.ts, capabilities and FIT_THRESHOLD in src/profile.ts.',
      'Configured threshold: ' + (threshold ?? 'unknown') + ' (from source).',
      yes(files.fit.includes('export function assessFit'), 'assessFit implementation (src/fit.ts)'),
      yes(files.functions.includes('export const jobRadar'), 'jobRadar orchestration (src/functions.ts)'),
      'src/postings.ts contains offline fixtures, not verified live vacancies.'
    ].join('\n') + caveat
  }
  if (/scan|route|trace|tracker|store|where|flow|architecture/.test(q)) {
    return preface + [
      'Manual scan flow:',
      yes(files.server.includes("app.post('/scan'"), 'POST /scan entry point (src/server.ts)'),
      yes(files.functions.includes('export const jobRadar'), 'jobRadar execution (src/functions.ts)'),
      yes(files.functions.includes('export const triageApplication'), 'triageApplication skill (src/functions.ts)'),
      yes(files.store.includes('e.id !== entry.id'), 'tracker deduplication (src/store.ts)'),
      yes(files.server.includes("app.get('/tracker'"), 'GET /tracker result endpoint (src/server.ts)'),
      'No scan was triggered by this answer.'
    ].join('\n') + caveat
  }
  return preface + [
    'Try: "Where is the fit threshold?"',
    'Or: "Why does the flaky fixture retry?"',
    'Or: "Trace a scan to the tracker"',
    'This coworker has no model, browser, shell, email or write capabilities.'
  ].join('\n') + caveat
}

function authorised(header, token) {
  const input = typeof header === 'string' && header.startsWith('Bearer ')
    ? header.slice(7) : ''
  const a = Buffer.from(input)
  const b = Buffer.from(token)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function makeServer({ token, root = ROOT } = {}) {
  if (typeof token !== 'string' || token.length < 24) {
    throw new Error('OPENBOT_PILOT_TOKEN must contain at least 24 characters.')
  }
  return httpServer(async (req, res) => {
    const path = new URL(req.url ?? '/', 'http://127.0.0.1').pathname
    if (path === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' })
      res.end(JSON.stringify({ status: 'ok', mode: 'read-only', protocol: 'ag-ui' }))
      return
    }
    if (path !== '/ag-ui' || req.method !== 'POST') {
      res.writeHead(404).end('Not found')
      return
    }
    if (!authorised(req.headers.authorization, token)) {
      res.writeHead(401).end('Unauthorized')
      return
    }
    let body = ''
    for await (const chunk of req) {
      body += chunk.toString('utf8')
      if (Buffer.byteLength(body, 'utf8') > MAX_BODY) {
        res.writeHead(413).end('Request too large')
        return
      }
    }
    let input
    try { input = JSON.parse(body) }
    catch { res.writeHead(400).end('Invalid JSON'); return }
    if (!input || typeof input.threadId !== 'string' ||
        typeof input.runId !== 'string' || input.threadId.length > 128 ||
        input.runId.length > 128 || !Array.isArray(input.messages)) {
      res.writeHead(400).end('Invalid AG-UI input')
      return
    }
    res.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      'connection': 'keep-alive'
    })
    const send = event => res.write('data: ' + JSON.stringify(event) + '\n\n')
    const messageId = 'msg_' + input.runId
    send({ type: 'RUN_STARTED', threadId: input.threadId, runId: input.runId })
    try {
      const reply = answer(input, root)
      send({ type: 'TEXT_MESSAGE_START', messageId, role: 'assistant' })
      send({ type: 'TEXT_MESSAGE_CONTENT', messageId, delta: reply })
      send({ type: 'TEXT_MESSAGE_END', messageId })
      send({ type: 'RUN_FINISHED', threadId: input.threadId, runId: input.runId })
    } catch {
      send({ type: 'RUN_ERROR', message: 'Source inspection failed.' })
    }
    res.end()
  })
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  const server = makeServer({ token: process.env.OPENBOT_PILOT_TOKEN })
  const port = Number(process.env.OPENBOT_PILOT_PORT ?? 4300)
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error('OPENBOT_PILOT_PORT must be between 1024 and 65535')
  }
  server.listen(port, '127.0.0.1', () =>
    console.info('Repo Scout on http://127.0.0.1:' + port + '/ag-ui (loopback only)'))
}
