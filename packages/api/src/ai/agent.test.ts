import { describe, expect, it } from "vitest";

import { runAgent as runAiSdkAgent } from "./agent";
import { runAgent as runLangGraphAgent } from "./langgraph-example";

describe("AI Agents", () => {
  describe("AI SDK Agent", () => {
    it("should generate a text response", async () => {
      const result = await runAiSdkAgent("Say hello in one word", 3);

      expect(result.text).toBeDefined();
      expect(result.text.length).toBeGreaterThan(0);
    });

    it("should use tools when asked for calculations", async () => {
      const result = await runAiSdkAgent(
        "Use the calculate tool to compute 42 * 17 + 123 and tell me the result",
        3
      );

      expect(result.text).toBeDefined();
      // Either the result contains 837, or a tool was called
      const toolWasCalled = result.toolCalls.length > 0;
      const resultContains837 = result.text.includes("837");
      expect(toolWasCalled || resultContains837).toBe(true);
    });
  });

  describe("LangGraph Agent", () => {
    it("should generate a response", async () => {
      const result = await runLangGraphAgent("Say hello in one word");

      expect(result.response).toBeDefined();
      expect(result.response.length).toBeGreaterThan(0);
    });

    it("should perform calculations using the calculate tool", async () => {
      const result = await runLangGraphAgent(
        "Use the calculate tool to compute 42 * 17 + 123"
      );

      expect(result.response).toBeDefined();
      // 42 * 17 + 123 = 837
      expect(result.response).toContain("837");
    });
  });
});
