/**
 * LangGraph TypeScript Agent Example
 *
 * This module demonstrates how to build an AI agent using LangGraph.js,
 * the TypeScript implementation of LangGraph.
 *
 * LangGraph allows you to build stateful, multi-step agents as graphs where:
 * - Nodes represent functions or actions
 * - Edges define the flow between nodes
 * - State is passed through the graph and can be modified by nodes
 *
 * Usage:
 *   import { runAgent } from './ai/langgraph-example';
 *   const response = await runAgent("What time is it?");
 *
 * Environment:
 *   ANTHROPIC_API_KEY: Required for the Anthropic LLM
 */

import { ChatAnthropic } from "@langchain/anthropic";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { z } from "zod/v3";

// --- State Definition ---

/**
 * Define the state schema using LangGraph's Annotation system.
 * Messages accumulate throughout the conversation.
 */
const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),
});

type AgentStateType = typeof AgentState.State;

// --- Tools ---

/**
 * Tool to get the current time.
 * Using the tool() wrapper function for proper type inference.
 */
// @ts-expect-error - LangChain tool types cause deep instantiation with Zod
const getCurrentTime = tool(
  async (_input) => {
    return new Date().toISOString();
  },
  {
    name: "getCurrentTime",
    description: "Get the current time in ISO format",
    schema: z.object({
      timezone: z
        .string()
        .optional()
        .describe("Optional timezone (defaults to UTC)"),
    }),
  },
);

/**
 * Tool to evaluate a mathematical expression.
 * The input type is inferred from the Zod schema.
 */
// @ts-expect-error - LangChain tool types cause deep instantiation with Zod
const calculate = tool(
  async (input) => {
    const { expression } = input;
    const allowed = new Set("0123456789+-*/(). ".split(""));
    if (![...expression].every((c) => allowed.has(c))) {
      return "Error: Invalid characters in expression";
    }

    try {
      const result = new Function(`return ${expression}`)();
      return String(result);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  },
  {
    name: "calculate",
    description: "Evaluate a simple mathematical expression",
    schema: z.object({
      expression: z
        .string()
        .describe("The mathematical expression to evaluate"),
    }),
  },
);

const tools = [getCurrentTime, calculate];

// --- Agent Node ---

/**
 * Create the agent node that calls the LLM.
 * The LLM will decide whether to use tools or provide a final answer.
 */
function createAgentNode(llm: ChatAnthropic) {
  const llmWithTools = llm.bindTools(tools);

  return async (state: AgentStateType): Promise<Partial<AgentStateType>> => {
    const response = await llmWithTools.invoke(state.messages);
    return { messages: [response] };
  };
}

/**
 * Determine whether to continue to tools or end the conversation.
 * If the last message has tool calls, route to tools. Otherwise, end.
 */
function shouldContinue(state: AgentStateType): "tools" | typeof END {
  const lastMessage = state.messages[state.messages.length - 1];

  // Check if the message has tool calls
  if (
    lastMessage &&
    "tool_calls" in lastMessage &&
    Array.isArray(lastMessage.tool_calls) &&
    lastMessage.tool_calls.length > 0
  ) {
    return "tools";
  }

  return END;
}

// --- Graph Construction ---

/**
 * Build and compile the agent graph.
 *
 * Graph structure:
 *   START -> agent -> (conditional) -> tools -> agent -> ... -> END
 *                  └-> END (if no tool calls)
 */
export function createAgentGraph() {
  const llm = new ChatAnthropic({
    model: "claude-sonnet-4-20250514",
    temperature: 0,
  });

  // @ts-expect-error - LangGraph StateGraph types cause deep instantiation with Zod
  const graph = new StateGraph(AgentState)
    .addNode("agent", createAgentNode(llm))
    // @ts-expect-error - LangGraph ToolNode types cause deep instantiation
    .addNode("tools", new ToolNode(tools))
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue)
    .addEdge("tools", "agent");

  return graph.compile();
}

// --- Agent Runner ---

export interface AgentResult {
  response: string;
  messages: BaseMessage[];
}

/**
 * Run the agent with a user message.
 *
 * @param userMessage - The user's input message
 * @returns The agent's final response and full message history
 */
export async function runAgent(userMessage: string): Promise<AgentResult> {
  const agent = createAgentGraph();

  const result = await agent.invoke({
    messages: [new HumanMessage(userMessage)],
  });

  const lastMessage = result.messages[result.messages.length - 1];
  const response = lastMessage
    ? lastMessage instanceof AIMessage
      ? (lastMessage.content as string)
      : String(lastMessage.content)
    : "";

  return {
    response,
    messages: result.messages,
  };
}

// --- Example Usage ---

/**
 * Example demonstrating how to use the LangGraph agent.
 */
export async function example(): Promise<void> {
  console.log("=== LangGraph TypeScript Agent Example ===\n");

  // Test with a time question
  console.log("Q: What time is it right now?");
  const timeResult = await runAgent("What time is it right now?");
  console.log(`A: ${timeResult.response}\n`);

  // Test with a calculation
  console.log("Q: What is 42 * 17 + 123?");
  const calcResult = await runAgent("What is 42 * 17 + 123?");
  console.log(`A: ${calcResult.response}\n`);
}

// --- Graph Visualization ---

/**
 * LangGraph Key Concepts:
 *
 * 1. STATE: The graph maintains state that flows through nodes.
 *    - Defined using Annotation.Root with typed fields
 *    - Reducers define how state updates are merged
 *
 * 2. NODES: Functions that process state and return updates.
 *    - "agent" node: Calls the LLM to generate responses
 *    - "tools" node: Executes tool calls from the LLM
 *
 * 3. EDGES: Define flow between nodes.
 *    - Regular edges: Always follow this path
 *    - Conditional edges: Choose path based on state
 *
 * 4. FLOW:
 *    START
 *      ↓
 *    agent (LLM decides: use tool or respond)
 *      ↓
 *    [conditional]
 *      ├─ tool_calls? → tools → agent (loop back)
 *      └─ no tools? → END
 *
 * This pattern is called a "ReAct" agent (Reasoning + Acting):
 * The LLM reasons about what to do, acts by calling tools,
 * observes the results, and continues until it can answer.
 */
