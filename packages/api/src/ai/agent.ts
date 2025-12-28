/**
 * Minimal Vercel AI SDK Agent Example
 *
 * This module demonstrates a clean, minimal implementation of an AI agent
 * using the Vercel AI SDK with tool calling capabilities.
 *
 * Usage:
 *   import { runAgent } from './ai/agent';
 *   const response = await runAgent("What time is it?");
 *
 * Environment:
 *   OPENAI_API_KEY: Required for the OpenAI provider
 */

import { generateText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod/v4";

// --- Tools ---

/**
 * Tool to get the current time in ISO format.
 */
const getCurrentTime = tool({
  description: "Get the current time in ISO format",
  parameters: z.object({}),
  execute: async () => {
    return new Date().toISOString();
  },
});

/**
 * Tool to evaluate a mathematical expression.
 */
const calculate = tool({
  description: "Evaluate a simple mathematical expression like '2 + 2' or '10 * 5'",
  parameters: z.object({
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
 * @returns The agent's response and any tool calls made
 */
export async function runAgent(userMessage: string): Promise<AgentResult> {
  const { text, toolCalls, toolResults } = await generateText({
    model: openai("gpt-4o-mini"),
    tools,
    maxSteps: 5, // Allow up to 5 tool calls
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
  console.log("=== Vercel AI SDK Agent Example ===\n");

  // Test with a time question
  console.log("Q: What time is it right now?");
  const timeResult = await runAgent("What time is it right now?");
  console.log(`A: ${timeResult.text}\n`);

  // Test with a calculation
  console.log("Q: What is 42 * 17 + 123?");
  const calcResult = await runAgent("What is 42 * 17 + 123?");
  console.log(`A: ${calcResult.text}\n`);
}

