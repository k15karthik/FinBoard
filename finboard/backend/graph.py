"""LangGraph orchestration for FinBoard."""

import os
import operator
from typing import TypedDict, Annotated

from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from agents.economic_news import run_economic_news_agent
from agents.budget_planner import run_budget_planner_agent
from agents.investment_advisor import run_investment_advisor_agent
from agents.risk_analyst import run_risk_analyst_agent


# ─── State ────────────────────────────────────────────────────────────────────

class FinBoardState(TypedDict):
    question: str
    budget_data: dict
    news_briefing: str
    feasibility_report: str
    investment_recommendation: str
    risk_critique: dict
    revision_count: int
    requires_revision: bool
    final_verdict: str
    agent_traces: Annotated[dict, operator.or_]
    error: str | None


# ─── LLM (synthesizer) ────────────────────────────────────────────────────────

_synthesizer_llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0.3,
    openai_api_key=os.getenv("OPENAI_API_KEY"),
)


# ─── Nodes ────────────────────────────────────────────────────────────────────

async def economic_news_node(state: FinBoardState) -> dict:
    try:
        result = await run_economic_news_agent(state["question"])
        return {
            "news_briefing": result["briefing"],
            "agent_traces": {"economic_news": result["trace"]},
        }
    except Exception as e:
        return {
            "news_briefing": "News briefing unavailable due to an error.",
            "agent_traces": {"economic_news": f"ERROR: {e}"},
            "error": str(e),
        }


async def budget_planner_node(state: FinBoardState) -> dict:
    try:
        result = await run_budget_planner_agent(
            question=state["question"],
            budget_data=state.get("budget_data") or {},
            news_briefing=state.get("news_briefing", ""),
        )
        return {
            "feasibility_report": result["feasibility_report"],
            "agent_traces": {"budget_planner": result["trace"]},
        }
    except Exception as e:
        return {
            "feasibility_report": "VERDICT: UNKNOWN — Budget analysis failed.",
            "agent_traces": {"budget_planner": f"ERROR: {e}"},
            "error": str(e),
        }


async def investment_advisor_node(state: FinBoardState) -> dict:
    try:
        result = await run_investment_advisor_agent(
            question=state["question"],
            news_briefing=state.get("news_briefing", ""),
            feasibility_report=state.get("feasibility_report", ""),
            risk_critique=state.get("risk_critique") or {},
            revision_count=state.get("revision_count", 0),
        )
        return {
            "investment_recommendation": result["recommendation"],
            "agent_traces": {"investment_advisor": result["trace"]},
        }
    except Exception as e:
        return {
            "investment_recommendation": "Investment recommendation unavailable due to an error.",
            "agent_traces": {"investment_advisor": f"ERROR: {e}"},
            "error": str(e),
        }


async def risk_analyst_node(state: FinBoardState) -> dict:
    try:
        result = await run_risk_analyst_agent(
            investment_recommendation=state.get("investment_recommendation", ""),
            news_briefing=state.get("news_briefing", ""),
        )
        parsed = result["risk_critique"]
        new_revision_count = state.get("revision_count", 0) + 1
        return {
            "risk_critique": parsed,
            "requires_revision": parsed.get("requires_revision", False),
            "revision_count": new_revision_count,
            "agent_traces": {"risk_analyst": result["trace"]},
        }
    except Exception as e:
        return {
            "risk_critique": {"requires_revision": False, "overall_risk_level": "UNKNOWN"},
            "requires_revision": False,
            "revision_count": state.get("revision_count", 0) + 1,
            "agent_traces": {"risk_analyst": f"ERROR: {e}"},
            "error": str(e),
        }


async def synthesizer_node(state: FinBoardState) -> dict:
    try:
        revision_note = ""
        if state.get("revision_count", 0) > 0:
            revision_note = (
                f"\n\nNOTE: The Investment Advisor revised their recommendation "
                f"{state['revision_count']} time(s) after Risk Analyst critique."
            )

        risk_critique = state.get("risk_critique") or {}
        risks_text = ""
        if risk_critique.get("risks"):
            risks_text = "\n".join(
                f"  - [{r.get('severity', '?')}/5] {r.get('name', '')}: {r.get('description', '')}"
                for r in risk_critique["risks"][:5]
            )

        prompt = f"""Synthesize a final, unified recommendation for the following financial question.

USER QUESTION:
{state['question']}

ECONOMIC NEWS BRIEFING:
{state.get('news_briefing', 'Not available')[:600]}

BUDGET FEASIBILITY REPORT:
{state.get('feasibility_report', 'Not available')[:400]}

INVESTMENT RECOMMENDATION:
{state.get('investment_recommendation', 'Not available')[:600]}

RISK ANALYSIS (overall level: {risk_critique.get('overall_risk_level', 'Unknown')}):
{risk_critique.get('critique_summary', 'Not available')}
Key risks:
{risks_text}
{revision_note}

Write 3–5 paragraphs. Be direct and actionable. Acknowledge where advisors disagreed. Write for a smart non-expert reader."""

        messages = [
            SystemMessage(
                content=(
                    "You are the chairperson of the FinBoard — a panel of AI financial advisors. "
                    "Synthesize a final, unified recommendation. Be direct and actionable. "
                    "Acknowledge where board members disagreed. Write for a smart non-expert reader."
                )
            ),
            HumanMessage(content=prompt),
        ]

        response = await _synthesizer_llm.ainvoke(messages)
        final_verdict = response.content.strip()

        return {
            "final_verdict": final_verdict,
            "agent_traces": {"synthesizer": f"ACTION: gpt-4o synthesis\nOBSERVATION: {len(final_verdict)} chars generated"},
        }
    except Exception as e:
        return {
            "final_verdict": "Final synthesis unavailable due to an error.",
            "agent_traces": {"synthesizer": f"ERROR: {e}"},
            "error": str(e),
        }


# ─── Conditional edge ─────────────────────────────────────────────────────────

def should_revise(state: FinBoardState) -> str:
    if state.get("requires_revision") and state.get("revision_count", 0) < 3:
        return "investment_advisor"
    return "synthesizer"


# ─── Graph assembly ───────────────────────────────────────────────────────────

builder = StateGraph(FinBoardState)

builder.add_node("economic_news", economic_news_node)
builder.add_node("budget_planner", budget_planner_node)
builder.add_node("investment_advisor", investment_advisor_node)
builder.add_node("risk_analyst", risk_analyst_node)
builder.add_node("synthesizer", synthesizer_node)

builder.set_entry_point("economic_news")
builder.add_edge("economic_news", "budget_planner")
builder.add_edge("budget_planner", "investment_advisor")
builder.add_edge("investment_advisor", "risk_analyst")
builder.add_conditional_edges("risk_analyst", should_revise)
builder.add_edge("synthesizer", END)

graph = builder.compile()

__all__ = ["graph", "FinBoardState"]
