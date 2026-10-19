import test from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { answer, makeServer } from '../tools/openbot-pilot/index.mjs'

const TOKEN = 'local-demo-token-must-be-long-enough'
const request = { threadId: 't1', runId: 'r1', messages: [
  { role: 'user', content: 'Explain the flaky retries' }
], tools: [{ name: 'delete_everything', parameters: {} }] }

function fixtures() {
  const root = mkdtempSync(join(tmpdir(), 'repo-scout-'))
  const files = {
    'src/fit.ts': 'export function assessFit() {}',
    'src/profile.ts': 'export const FIT_THRESHOLD = 0.5',
    'src/functions.ts': "export const jobRadar = 1; export const triageApplication = 1; step.run('write-tracker', () => {}); onFailure: () => {}",
    'src/postings.ts': 'flaky: true; alwaysFail: true',
    'src/store.ts': 'list.filter((e) => e.id !== entry.id)',
    'src/server.ts': "app.post('/scan', fn); app.get('/tracker', fn)"
  }
  for (const [path, body] of Object.entries(files)) {
    const full = join(root, path)
    mkdirSync(dirname(full), { recursive: true })
    writeFileSync(full, body)
  }
  return root
}

async function withServer(callback) {
  const root = fixtures()
  const server = makeServer({ token: TOKEN, root })
  try {
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')
    await callback('http://127.0.0.1:' + server.address().port)
  } finally {
    await new Promise(resolve => server.close(resolve))
    rmSync(root, { recursive: true, force: true })
  }
}

test('token cannot be omitted or weak', () => {
  assert.throws(() => makeServer(), /24 characters/)
  assert.throws(() => makeServer({ token: 'short' }), /24 characters/)
})

test('three source-grounded answers and ignored offered tools', () => {
  const root = fixtures()
  try {
    assert.match(answer(request, root), /separate write-tracker checkpoint/)
    assert.doesNotMatch(answer(request, root), /delete_everything/)
    assert.match(answer({ ...request, messages: [{ role: 'user', content: 'fit threshold' }] }, root), /0.5/)
    assert.match(answer({ ...request, messages: [{ role: 'user', content: 'trace scan' }] }, root), /No scan was triggered/)
  } finally { rmSync(root, { recursive: true, force: true }) }
})

test('missing source fails closed', () => {
  const root = mkdtempSync(join(tmpdir(), 'repo-scout-empty-'))
  try { assert.match(answer(request, root), /Source files are unavailable/) }
  finally { rmSync(root, { recursive: true, force: true }) }
})

test('health, bearer authentication, valid AG-UI SSE', async () => {
  await withServer(async base => {
    const health = await fetch(base + '/health')
    assert.equal(health.status, 200)
    assert.equal((await health.json()).mode, 'read-only')
    const unauthorised = await fetch(base + '/ag-ui', { method: 'POST', body: JSON.stringify(request) })
    assert.equal(unauthorised.status, 401)
    const ok = await fetch(base + '/ag-ui', { method: 'POST',
      headers: { authorization: 'Bearer ' + TOKEN, 'content-type': 'application/json' },
      body: JSON.stringify(request) })
    assert.equal(ok.status, 200)
    assert.match(ok.headers.get('content-type'), /text\/event-stream/)
    const lines = (await ok.text()).split('\n\n').filter(Boolean)
    const events = lines.map(s => JSON.parse(s.slice(6)))
    assert.deepEqual(events.map(e => e.type), [
      'RUN_STARTED', 'TEXT_MESSAGE_START', 'TEXT_MESSAGE_CONTENT', 'TEXT_MESSAGE_END', 'RUN_FINISHED'
    ])
    assert.equal(events[0].runId, 'r1')
    assert.ok(!lines.some(x => x.includes('TOOL_CALL_START')))
  })
})

test('malformed, oversized and irrelevant requests are refused', async () => {
  await withServer(async base => {
    const headers = { authorization: 'Bearer ' + TOKEN }
    assert.equal((await fetch(base + '/ag-ui', { method: 'POST', headers, body: '{' })).status, 400)
    assert.equal((await fetch(base + '/ag-ui', { method: 'POST', headers, body: '{}' })).status, 400)
    assert.equal((await fetch(base + '/ag-ui', { method: 'POST', headers,
      body: JSON.stringify({ ...request, padding: 'x'.repeat(70000) }) })).status, 413)
    assert.equal((await fetch(base + '/tracker')).status, 404)
  })
})
