"""
Minimal LangGraph Agent Example

This module demonstrates a clean, minimal implementation of an AI agent
using LangGraph with tool calling capabilities.

Usage:
    python ai.py
    
Environment:
    OPENAI_API_KEY: Required for the OpenAI LLM
"""

from typing import Annotated

from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from typing_extensions import TypedDict


# --- State Definition ---


class AgentState(TypedDict):
    """The state of the agent, containing the message history."""

    messages: Annotated[list, add_messages]


# --- Tools ---


def get_current_time() -> str:
    """Get the current time in ISO format."""
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()


def calculate(expression: str) -> str:
    """
    Evaluate a simple mathematical expression.

    Args:
        expression: A mathematical expression like "2 + 2" or "10 * 5"
    """
    # Only allow safe characters for basic math
    allowed = set("0123456789+-*/(). ")
    if not all(c in allowed for c in expression):
        return "Error: Invalid characters in expression"

    try:
        result = eval(expression)  # noqa: S307
        return str(result)
    except Exception as e:
        return f"Error: {e}"


# List of tools available to the agent
tools = [get_current_time, calculate]


# --- Agent Node ---


def create_agent_node(llm: ChatOpenAI):
    """Create the agent node that calls the LLM."""
    llm_with_tools = llm.bind_tools(tools)

    def agent(state: AgentState) -> AgentState:
        """Process messages and generate a response."""
        response = llm_with_tools.invoke(state["messages"])
        return {"messages": [response]}

    return agent


# --- Graph Construction ---


def create_agent_graph() -> StateGraph:
    """
    Build the agent graph with tool calling capabilities.

    The graph follows this flow:
    START -> agent -> (tools_condition) -> tools -> agent -> ... -> END
    """
    # Initialize the LLM
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

    # Create the graph
    graph = StateGraph(AgentState)

    # Add nodes
    graph.add_node("agent", create_agent_node(llm))
    graph.add_node("tools", ToolNode(tools))

    # Add edges
    graph.add_edge(START, "agent")
    graph.add_conditional_edges("agent", tools_condition)
    graph.add_edge("tools", "agent")

    return graph.compile()


# --- Main Execution ---


def run_agent(user_message: str) -> str:
    """
    Run the agent with a user message and return the final response.

    Args:
        user_message: The user's input message

    Returns:
        The agent's final response
    """
    agent = create_agent_graph()

    result = agent.invoke({"messages": [("user", user_message)]})

    # Return the last AI message content
    return result["messages"][-1].content


if __name__ == "__main__":
    # Example usage
    print("=== LangGraph Agent Example ===\n")

    # Test with a simple question
    response = run_agent("What time is it right now?")
    print(f"Q: What time is it right now?\nA: {response}\n")

    # Test with a calculation
    response = run_agent("What is 42 * 17 + 123?")
    print(f"Q: What is 42 * 17 + 123?\nA: {response}\n")

