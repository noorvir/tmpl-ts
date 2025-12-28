/**
 * AI Module Exports
 *
 * This module provides AI agent implementations using two different approaches:
 *
 * 1. AI SDK (agent.ts)
 *    - Simpler API, great for quick integrations
 *    - Built-in streaming support
 *    - Uses AI Gateway for provider abstraction
 *
 * 2. LangGraph (langgraph-example.ts)
 *    - More control over agent behavior
 *    - Graph-based workflow definition
 *    - Better for complex, multi-step agents
 */

export {
  runAgent as runAiSdkAgent,
  type AgentResult as AiSdkAgentResult,
} from "./agent";
export {
  runAgent as runLangGraphAgent,
  createAgentGraph,
  type AgentResult as LangGraphAgentResult,
} from "./langgraph-example";
