import { Inngest } from 'inngest'

// Layer 3 — der Orchestrator-Client. Im Dev-Modus spricht die SDK
// automatisch mit dem lokalen Inngest Dev-Server (localhost:8288).
export const inngest = new Inngest({ id: 'agent-loop-lab' })
