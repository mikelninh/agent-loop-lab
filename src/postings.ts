// Fixture-Stellen (offline, deterministisch). „Später" ersetzt nur der
// fetch-postings-Step diese Liste durch echte Quellen (APIs / Scraping).
// Zwei Felder steuern die Durability-Demo:
//   flaky      → der write-tracker-Step failt beim 1. Versuch, klappt beim Retry
//   alwaysFail → failt immer → onFailure-Hook greift, nichts geht verloren

export type Posting = {
  id: string
  title: string
  company: string
  location: string
  description: string
  url: string
  flaky?: boolean
  alwaysFail?: boolean
}

export const POSTINGS: Posting[] = [
  {
    id: 'aconium-ai-eng',
    title: 'AI Engineer (m/w/d)',
    company: 'aconium GmbH',
    location: 'Berlin',
    description:
      'Document AI als agentisches Verarbeitungs-Tool. Du baust agentische RAG-Chatbots, ' +
      'MCP-Integration, Workflow-Automatisierung. FastAPI, LLM-APIs (OpenAI, open-source), ' +
      'Python, produktionsnah. GovTech / öffentlicher Sektor.',
    url: 'https://aconium.jobs.personio.de/job/2647793',
  },
  {
    id: 'telekom-consultant-ki',
    title: 'Consultant KI (m/w/d) — befristet',
    company: 'Deutsche Telekom MMS',
    location: 'Berlin / verschiedene Standorte',
    description:
      'KI-, Daten- und Digitalstrategien beraten. Use-Case-Portfolios für KI und AI-Agents, ' +
      'Einbettung von AI Agents in IT-Landschaften. Python-Grundverständnis, Storytelling, ' +
      'Generative KI. Verhandlungssicheres Deutsch und Englisch.',
    url: 'https://www.finest-jobs.com/bewerbung/Consultant-Ki-D-Befristet-1269191',
    flaky: true,
  },
  {
    id: 'platform-rag-llm',
    title: 'AI Platform Engineer (RAG/LLM)',
    company: 'Beispiel GmbH',
    location: 'Berlin / remote',
    description:
      'RAG-Pipelines, Vektor-Datenbanken, LLM-Serving, Python, Kubernetes. Agentic workflows ' +
      'und Embedding-Stores im Fokus.',
    url: 'https://example.com/jobs/platform-rag-llm',
    alwaysFail: true,
  },
  {
    id: 'java-backend',
    title: 'Senior Java Backend Engineer',
    company: 'Legacy AG',
    location: 'München',
    description:
      'Java, Spring Boot, Oracle, Microservices. Wartung bestehender Enterprise-Systeme. ' +
      'Keine KI im Fokus.',
    url: 'https://example.com/jobs/java-backend',
  },
  {
    id: 'marketing-manager',
    title: 'Marketing Manager (m/w/d)',
    company: 'Brand Co',
    location: 'Hamburg',
    description: 'Kampagnen, Social Media, Content-Strategie, Markenführung.',
    url: 'https://example.com/jobs/marketing-manager',
  },
]
