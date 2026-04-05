"""Investment Advisor Agent — ReAct pattern with revision support."""

import os
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from tools.market_data import suggest_tickers_for_goal, get_multiple_tickers

llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0.3,
    openai_api_key=os.getenv("OPENAI_API_KEY"),
)


def _format_ticker_data(ticker_data: list) -> str:
    lines = []
    for t in ticker_data:
        if t.get("error"):
            lines.append(f"  {t['ticker']}: ERROR — {t['error']}")
            continue
        price = t.get("current_price")
        beta = t.get("beta")
        pe = t.get("pe_ratio")
        name = t.get("name") or t["ticker"]
        lines.append(
            f"  {t['ticker']} ({name}): price=${price}, beta={beta}, P/E={pe}, sector={t.get('sector')}"
        )
    return "\n".join(lines)


async def run_investment_advisor_agent(
    question: str,
    news_briefing: str,
    feasibility_report: str,
    risk_critique: dict,
    revision_count: int,
) -> dict:
    """
    ReAct loop:
      THOUGHT 1: Parse goal → suggest tickers
      ACTION: fetch market data
      THOUGHT 2: Reason about allocation
      THOUGHT 3: Produce structured recommendation (with revision awareness)
    Returns { "recommendation": str, "trace": str }
    """
    trace_lines = []

    # THOUGHT 1
    trace_lines.append("THOUGHT: Parsing user goal from question to identify relevant asset classes.")
    trace_lines.append(f"ACTION: suggest_tickers_for_goal(goal_keywords={question!r})")
    suggested_tickers = suggest_tickers_for_goal(question)
    trace_lines.append(f"OBSERVATION: suggested_tickers={suggested_tickers}")

    trace_lines.append(f"ACTION: get_multiple_tickers({suggested_tickers})")
    ticker_data = get_multiple_tickers(suggested_tickers)
    ticker_summary = _format_ticker_data(ticker_data)
    trace_lines.append(f"OBSERVATION:\n{ticker_summary}")

    # THOUGHT 2
    trace_lines.append(
        "THOUGHT: Analyzing market data in context of macroeconomic briefing and budget feasibility."
    )

    # Build revision context if this is a revision pass
    revision_context = ""
    if revision_count > 0 and risk_critique:
        critique_summary = risk_critique.get("critique_summary", "")
        risks = risk_critique.get("risks", [])
        risk_list = "\n".join(
            f"  - [{r.get('severity', '?')}/5] {r.get('name', '')}: {r.get('description', '')}"
            for r in risks
        )
        revision_context = f"""
PREVIOUS RISK CRITIQUE (you MUST address each point explicitly):
{critique_summary}

Specific risks flagged:
{risk_list}

ADDRESS each flagged risk explicitly. Revise your allocation accordingly."""

    prompt = f"""You are an investment advisor on a financial advisory board.

USER QUESTION: {question}

BUDGET FEASIBILITY:
{feasibility_report[:400]}

MACROECONOMIC CONTEXT:
{news_briefing[:500]}

MARKET DATA:
{ticker_summary}
{revision_context}

Provide a structured investment recommendation that includes:
1. Suggested allocations as percentages (e.g., SPY: 60%, BND: 30%, Cash: 10%)
2. Rationale per asset class
3. Recommended time horizon
4. Confidence level: LOW | MEDIUM | HIGH

Be specific and actionable."""

    trace_lines.append(f"ACTION: gpt-4o investment recommendation (prompt length={len(prompt)} chars)")

    messages = [
        SystemMessage(content="You are a rigorous investment advisor who gives specific, percentage-based recommendations."),
        HumanMessage(content=prompt),
    ]

    response = await llm.ainvoke(messages)
    recommendation = response.content.strip()

    trace_lines.append(f"OBSERVATION: LLM returned recommendation ({len(recommendation)} chars)")

    # Prefix revision output
    if revision_count > 0:
        recommendation = f"REVISED (v{revision_count}) — addressing Risk Analyst critique:\n\n{recommendation}"

    return {"recommendation": recommendation, "trace": "\n".join(trace_lines)}
