/**
 * Test script for AI agents
 * Run with: bun run packages/api/src/ai/test-agents.ts
 */

import { runAgent as runVercelAgent } from "./agent";
import { runAgent as runLangGraphAgent } from "./langgraph-example";

async function testVercelAgent() {
  console.log("=== Testing Vercel AI SDK Agent ===\n");

  console.log("Q: What time is it right now?");
  const timeResult = await runVercelAgent("What time is it right now?", 3);
  console.log(`A: ${timeResult.text}`);
  console.log(`Tool calls: ${JSON.stringify(timeResult.toolCalls, null, 2)}\n`);

  console.log("Q: What is 42 * 17 + 123?");
  const calcResult = await runVercelAgent("What is 42 * 17 + 123?", 3);
  console.log(`A: ${calcResult.text}`);
  console.log(`Tool calls: ${JSON.stringify(calcResult.toolCalls, null, 2)}\n`);
}

async function testLangGraphAgent() {
  console.log("=== Testing LangGraph TypeScript Agent ===\n");

  console.log("Q: What time is it right now?");
  const timeResult = await runLangGraphAgent("What time is it right now?");
  console.log(`A: ${timeResult.response}\n`);

  console.log("Q: What is 42 * 17 + 123?");
  const calcResult = await runLangGraphAgent("What is 42 * 17 + 123?");
  console.log(`A: ${calcResult.response}\n`);
}

async function main() {
  try {
    await testVercelAgent();
    await testLangGraphAgent();
    console.log("✅ All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

main();

