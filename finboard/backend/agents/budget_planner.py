"""Budget Planner Agent — manual ReAct loop."""

import os
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from tools.budget_math import (
    calculate_disposable_income,
    check_emergency_fund_adequacy,
    calculate_debt_to_income_ratio,
)

llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.3,
    openai_api_key=os.getenv("OPENAI_API_KEY"),
)


async def run_budget_planner_agent(question: str, budget_data: dict, news_briefing: str) -> dict:
    """
    Manual ReAct loop:
      THOUGHT 1 → ACTION (disposable income) → OBSERVATION
      THOUGHT 2 → ACTION (emergency fund + DTI) → OBSERVATION
      THOUGHT 3 → LLM reasoning → feasibility_report
    Returns { "feasibility_report": str, "trace": str }
    """
    trace_lines = []

    if not budget_data:
        return {
            "feasibility_report": "VERDICT: UNKNOWN — No budget data provided.",
            "trace": "OBSERVATION: budget_data was empty or null — skipping analysis.",
        }

    income = float(budget_data.get("income", 0))
    expenses = float(budget_data.get("expenses", 0))
    emergency_fund = float(budget_data.get("emergency_fund", 0))
    debt = float(budget_data.get("debt", 0))

    # THOUGHT 1
    trace_lines.append("THOUGHT: I need to evaluate the user's budget. Let me check disposable income first.")
    trace_lines.append(f"ACTION: calculate_disposable_income(income={income}, expenses={expenses})")
    disp_result = calculate_disposable_income(income, expenses)
    trace_lines.append(f"OBSERVATION: {disp_result}")

    # THOUGHT 2
    trace_lines.append("THOUGHT: Now let me check emergency fund adequacy and debt-to-income ratio.")
    trace_lines.append(f"ACTION: check_emergency_fund_adequacy(emergency_fund={emergency_fund}, expenses={expenses})")
    emerg_result = check_emergency_fund_adequacy(emergency_fund, expenses)
    trace_lines.append(f"OBSERVATION: {emerg_result}")

    trace_lines.append(f"ACTION: calculate_debt_to_income_ratio(debt={debt}, income={income})")
    dti_result = calculate_debt_to_income_ratio(debt, income)
    trace_lines.append(f"OBSERVATION: {dti_result}")

    # THOUGHT 3
    trace_lines.append("THOUGHT: I now have enough data to reason about financial feasibility.")

    prompt = f"""You are a personal finance advisor. Based on the budget data below, determine whether the user's financial question is feasible.

USER QUESTION: {question}

BUDGET METRICS:
- Disposable income: ${disp_result['disposable']:.2f}/month (savings rate: {disp_result['savings_rate_pct']:.1f}%)
- Emergency fund: {emerg_result['months_covered']:.1f} months covered — STATUS: {emerg_result['status']}
- Debt-to-income ratio: {dti_result['dti_ratio']:.2%} — STATUS: {dti_result['status']}

MACROECONOMIC CONTEXT:
{news_briefing[:600]}

Respond with one of these exact verdict lines first, then 3–5 sentences of reasoning:
VERDICT: FEASIBLE
VERDICT: PARTIALLY FEASIBLE
VERDICT: NOT FEASIBLE"""

    trace_lines.append(f"ACTION: gpt-4o feasibility reasoning (prompt length={len(prompt)} chars)")

    messages = [
        SystemMessage(content="You are a careful personal finance advisor who gives clear, actionable verdicts."),
        HumanMessage(content=prompt),
    ]

    response = await llm.ainvoke(messages)
    feasibility_report = response.content.strip()

    trace_lines.append(f"OBSERVATION: LLM returned feasibility report ({len(feasibility_report)} chars)")

    # Ensure the verdict line is present
    if "VERDICT:" not in feasibility_report:
        feasibility_report = "VERDICT: PARTIALLY FEASIBLE\n\n" + feasibility_report

    return {"feasibility_report": feasibility_report, "trace": "\n".join(trace_lines)}
