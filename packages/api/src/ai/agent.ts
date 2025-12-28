/**
 * Minimal AI SDK Agent Example
 *
 * This module demonstrates a clean, minimal implementation of an AI agent
 * using the AI SDK v6 with tool calling capabilities.
 *
 * Usage:
 *   import { runAgent } from './ai/agent';
 *   const response = await runAgent("What time is it?");
 *
 * Environment:
 *   ANTHROPIC_API_KEY: Required for the Anthropic provider
 *
 * @see https://ai-sdk.dev/docs/reference/ai-sdk-core/tool
 */

import { anthropic } from "@ai-sdk/anthropic";
import { generateText, tool } from "ai";
import { z } from "zod";

// --- Tools ---

/**
 * Tool to get the current time in ISO format.
 */
const getCurrentTime = tool({
  description: "Get the current time in ISO format",
  inputSchema: z.object({
    timezone: z
      .string()
      .optional()
      .describe("Optional timezone (defaults to UTC)"),
  }),
  execute: async () => {
    return new Date().toISOString();
  },
});

/**
 * Tool to evaluate a mathematical expression.
 */
const calculate = tool({
  description:
    "Evaluate a simple mathematical expression like '2 + 2' or '10 * 5'",
  inputSchema: z.object({
    expression: z.string().describe("The mathematical expression to evaluate"),
  }),
  execute: async ({ expression }) => {
    // Only allow safe characters for basic math
    const allowed = new Set("0123456789+-*/(). ".split(""));
    if (![...expression].every((c) => allowed.has(c))) {
      return "Error: Invalid characters in expression";
    }

    try {
      // Use Function constructor for safer evaluation than eval
      const result = new Function(`return ${expression}`)();
      return String(result);
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  },
});

// --- Agent Configuration ---

const tools = {
  getCurrentTime,
  calculate,
};

// --- Agent Runner ---

export interface AgentResult {
  text: string;
  toolCalls: Array<{
    toolName: string;
    args: unknown;
    result: unknown;
  }>;
}

/**
 * Run the agent with a user message.
 *
 * The agent will use tools as needed to answer the user's question,
 * then provide a final response.
 *
 * @param userMessage - The user's input message
 * @param maxSteps - Maximum number of tool-calling steps (default: 3)
 * @returns The agent's response and any tool calls made
 */
export async function runAgent(
  userMessage: string,
  maxSteps = 3,
): Promise<AgentResult> {
  const { text, toolCalls, toolResults } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    tools,
    maxSteps,
    system: `You are a helpful assistant. Use the available tools when needed to answer questions accurately.`,
    prompt: userMessage,
  });

  return {
    text,
    toolCalls: toolCalls.map((call, index) => ({
      toolName: call.toolName,
      args: call.args,
      result: toolResults[index]?.result,
    })),
  };
}

// --- Example Usage ---

/**
 * Example demonstrating how to use the agent.
 */
export async function example(): Promise<void> {
  console.log("=== AI SDK Agent Example ===\n");

  // Test with a time question
  console.log("Q: What time is it right now?");
  const timeResult = await runAgent("What time is it right now?");
  console.log(`A: ${timeResult.text}\n`);

  // Test with a calculation
  console.log("Q: What is 42 * 17 + 123?");
  const calcResult = await runAgent("What is 42 * 17 + 123?");
  console.log(`A: ${calcResult.text}\n`);
}
