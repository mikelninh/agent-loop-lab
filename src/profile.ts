// Mikels Profil als „Capabilities": jede mit Keywords (für den Match)
// und einem Beleg (welches Projekt das beweist). Genau das macht den Fit
// belegbar — nicht „passt schon", sondern „passt, weil GitLaw / INCA / …".

export type Capability = {
  need: string
  weight: number
  keywords: string[]
  proof: string
}

export const capabilities: Capability[] = [
  {
    need: 'RAG / Retrieval',
    weight: 2,
    keywords: ['rag', 'retrieval', 'vektor', 'vector', 'faiss', 'embedding'],
    proof: 'GitLaw — deutsche Gesetze als RAG über FAISS, paragraphengenau durchsuchbar',
  },
  {
    need: 'MCP-Integration',
    weight: 2,
    keywords: ['mcp', 'model context protocol', 'tool-integration', 'tools für llm'],
    proof: 'Eigene MCP-Server: AGB-Reader, Elterngeld, Fluggastrechte',
  },
  {
    need: 'FastAPI / Python-APIs',
    weight: 2,
    keywords: ['fastapi', 'python', 'rest-api', 'microservice', 'api'],
    proof: 'Standard-Stack: FastAPI + OpenAI Structured Outputs',
  },
  {
    need: 'Agenten / Workflow-Automation',
    weight: 2,
    keywords: ['agent', 'agents', 'agentic', 'workflow', 'automation', 'automatisierung', 'orchestr'],
    proof: 'INCA — Agenten-Loop mit Eval-Harness und Receipt pro Entscheidung',
  },
  {
    need: 'LLM / Generative AI',
    weight: 2,
    keywords: ['llm', 'openai', 'generative', 'gpt', 'claude', 'mistral', 'sprachmodell'],
    proof: 'Mehrere Produkte auf gpt-4o-mini mit JSON-Schema Structured Outputs',
  },
  {
    need: 'Document AI',
    weight: 1,
    keywords: ['document ai', 'dokument', 'ocr', 'document processing', 'dokumentenverarbeitung'],
    proof: 'AGB-Reader — prüft Verträge gegen §305 ff. BGB',
  },
  {
    need: 'Frontend / React',
    weight: 1,
    keywords: ['react', 'typescript', 'frontend', 'vite', 'tailwind', 'next.js'],
    proof: 'React 19 + TS + Tailwind über alle Projekte',
  },
  {
    need: 'GovTech / öffentlicher Sektor',
    weight: 1,
    keywords: ['govtech', 'public sector', 'öffentlich', 'kommune', 'behörde', 'verwaltung', 'ministerien'],
    proof: 'GitLaw (Legal-Tech) + FairEint (digitale Demokratie)',
  },
  {
    need: 'Berlin / EU / remote',
    weight: 1,
    keywords: ['berlin', 'remote', 'eu-ausland', 'deutschland', 'hybrid'],
    proof: 'Berlin-based, offen für EU / remote',
  },
]

// Summe der Top-Gewichte als Normierungs-Basis für den Fit-Score (0–1).
export const SCORE_BASIS = 10
export const FIT_THRESHOLD = 0.5
