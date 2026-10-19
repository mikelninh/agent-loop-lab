# OpenBot Repo Scout — one safe coworker

**Pilot only.** A tiny AG-UI HTTP service you can register as a remote coworker in [OpenBot](https://github.com/CopilotKit/OpenBot). It answers three *source-grounded* questions about the existing `agent-loop-lab` TypeScript code. This first experiment validates the protocol, isolation and usability, **not** autonomous job finding.

It is deliberately deterministic: no LLM, no user-supplied file paths, no shell/browser, no exposed tools, no Inngest events, no emails, no GitHub writes, no outbound HTTP, and no credentials or personal data stored. It reads only six allowlisted local repository source files. It will say when the files are unavailable. `GET /health` and authenticated `POST /ag-ui` are the only exposed routes.

## Run locally

Requirements: Node.js 22+; no npm install needed for the pilot.

In a terminal from this repo root:

```bash
node --test tests/openbot-pilot.test.mjs
export OPENBOT_PILOT_TOKEN="$(openssl rand -hex 32)" # keep this private
node tools/openbot-pilot/index.mjs
```

The endpoint binds **only** to `127.0.0.1:4300` by default. It requires `Authorization: Bearer <OPENBOT_PILOT_TOKEN>` on every AG-UI request, using a constant-time comparison. It has a 64-KiB request limit; malformed inputs are refused.

In another terminal with the same token exported, try:

```bash
curl -sS http://127.0.0.1:4300/health
curl -N -sS http://127.0.0.1:4300/ag-ui \
  -H "Authorization: Bearer $OPENBOT_PILOT_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"threadId":"test-thread","runId":"test-run","messages":[{"id":"u1","role":"user","content":"Trace a scan to the tracker"}],"tools":[],"context":[],"state":{}}'
```

Expected streamed event types: `RUN_STARTED`, `TEXT_MESSAGE_START`, `TEXT_MESSAGE_CONTENT`, `TEXT_MESSAGE_END`, `RUN_FINISHED`. **No `TOOL_CALL` events** are emitted. The process can be stopped with Ctrl+C.

## Connect it to OpenBot (local only)

1. Set up OpenBot separately using its *current* [README](https://github.com/CopilotKit/OpenBot/blob/main/README.md). It currently requires Docker, Bun 1.3+, CopilotKit Intelligence setup and a model credential for its shipped AI coworkers. The Repo Scout endpoint itself makes no model calls and does not require those credentials.
2. In OpenBot's `.env`, permit the specific private endpoint:

   ```env
   AGENT_ENDPOINT_ALLOWED_HOSTS=127.0.0.1:4300
   ```

   If the variable already contains entries, append `,127.0.0.1:4300` to it instead of overwriting them. Restart the OpenBot server after changes.
3. Start Repo Scout **in the same network namespace as the OpenBot API server** (e.g. both from the same WSL2 distribution for local source startup). `127.0.0.1` inside a separate Docker container is **not** the host; this loopback-only proof of concept will not work across that boundary without a carefully reviewed private-network arrangement.
4. Open OpenBot `/bots` → create a coworker, and configure its remote AG-UI endpoint as `http://127.0.0.1:4300/ag-ui`. Set the write-only authorization header to `Bearer <your token>`. Name: `Repo Scout`. Suggested role: `Read-only source inspection of agent-loop-lab. Never claim a runtime test, live job availability, or performed actions.`
5. Try: `Where is the fit threshold?`, `Why does the flaky fixture retry?`, `Trace a scan to the tracker`. Inspect `/admin/audit` for unexpected action attempts and confirm no writes occurred.

**Do not share or publicly host this demo.** OpenBot's default `OPENBOT_SINGLE_USER=true` treats every request as administrator. Enable authentication and review its security and deployment docs before remote/team access. Never paste secrets into chat or commit them to Git.

## Acceptance criteria

- [x] Local endpoint unit/integration tests pass in Node 22 (5 tests).
- [x] Rejects missing/wrong tokens, malformed JSON and oversized input.
- [x] Emits well-formed AG-UI SSE event sequence, no tool calls.
- [x] Uses source-grounded statements only; fails closed if source files are missing.
- [ ] Running OpenBot instance connects to the endpoint and returns answers in a real channel.
- [ ] Verify policy/audit in OpenBot UI and confirm no unexpected tool grants.
- [ ] Get an actual user's verdict: Was the coworker useful? What task should it own next?

**Decision gate:** Do not add a browser, shell, model or application-submission capability until the transport and safety checks have been completed. When expanding, switch from a proof-of-connection bot to a genuinely useful single workflow, with explicit approvals and measurable outcomes.