/**
 * AI Module Exports
 *
 * This module provides AI agent implementations using two different approaches:
 *
 * 1. Vercel AI SDK (agent.ts)
 *    - Simpler API, great for quick integrations
 *    - Built-in streaming support
 *    - Works well with Next.js and other Vercel products
 *
 * 2. LangGraph (langgraph-example.ts)
 *    - More control over agent behavior
 *    - Graph-based workflow definition
 *    - Better for complex, multi-step agents
 */

export { runAgent as runVercelAgent, type AgentResult as VercelAgentResult } from "./agent";
export {
  runAgent as runLangGraphAgent,
  createAgentGraph,
  type AgentResult as LangGraphAgentResult,
} from "./langgraph-example";

