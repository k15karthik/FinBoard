"""Risk Analyst Agent — Reflection + Adversarial pattern."""

import json
import os
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0.1,  # more deterministic for critique
    openai_api_key=os.getenv("OPENAI_API_KEY"),
)

_SYSTEM_PROMPT = (
    "You are a contrarian risk analyst on a financial advisory board. Your ONLY job is to find "
    "failure modes in investment recommendations. You are not here to validate — you are here "
    "to stress-test. Be specific, be harsh, cite real market risks. Never be vague."
)

_JSON_SCHEMA = """{
  "risks": [
    {
      "name": "string",
      "description": "string (2-3 sentences)",
      "severity": <integer 1-5>,
      "mitigation": "string (1-2 sentences)"
    }
  ],
  "overall_risk_level": "LOW | MEDIUM | HIGH | CRITICAL",
  "requires_revision": <true if any severity >= 4, else false>,
  "critique_summary": "string (3-5 sentences summarizing the main concerns)"
}"""


def _build_user_prompt(investment_recommendation: str, news_briefing: str, strict: bool = False) -> str:
    strictness_note = " Return ONLY the JSON object. Do NOT include markdown code fences, explanations, or any text outside the JSON." if strict else ""
    return f"""Analyze this investment recommendation and return ONLY valid JSON. No preamble, no markdown.{strictness_note}

Recommendation:
{investment_recommendation}

Macroeconomic context:
{news_briefing[:600]}

Return this exact JSON schema:
{_JSON_SCHEMA}"""


def _parse_risk_json(raw: str) -> dict | None:
    """Try to parse JSON from the LLM response, handling common formatting issues."""
    text = raw.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove first and last fence lines
        inner = []
        in_fence = False
        for line in lines:
            if line.startswith("```") and not in_fence:
                in_fence = True
                continue
            if line.startswith("```") and in_fence:
                break
            if in_fence:
                inner.append(line)
        text = "\n".join(inner).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


async def run_risk_analyst_agent(
    investment_recommendation: str,
    news_briefing: str,
) -> dict:
    """
    Adversarial risk analysis of the investment recommendation.
    Returns parsed JSON dict. Falls back gracefully if parsing fails twice.
    Returns { "risk_critique": dict, "trace": str }
    """
    trace_lines = []

    trace_lines.append("THOUGHT: Performing adversarial stress-test of the investment recommendation.")
    trace_lines.append(f"ACTION: gpt-4o risk analysis (recommendation length={len(investment_recommendation)} chars)")

    # First attempt
    messages = [
        SystemMessage(content=_SYSTEM_PROMPT),
        HumanMessage(content=_build_user_prompt(investment_recommendation, news_briefing, strict=False)),
    ]
    response = await llm.ainvoke(messages)
    raw = response.content.strip()
    trace_lines.append(f"OBSERVATION: Raw LLM output ({len(raw)} chars)")

    parsed = _parse_risk_json(raw)

    if parsed is None:
        trace_lines.append("THOUGHT: JSON parse failed on first attempt — retrying with stricter prompt.")
        # Second attempt with stricter prompt
        messages_strict = [
            SystemMessage(content=_SYSTEM_PROMPT),
            HumanMessage(content=_build_user_prompt(investment_recommendation, news_briefing, strict=True)),
        ]
        response2 = await llm.ainvoke(messages_strict)
        raw2 = response2.content.strip()
        trace_lines.append(f"OBSERVATION: Retry raw output ({len(raw2)} chars)")
        parsed = _parse_risk_json(raw2)

        if parsed is None:
            trace_lines.append("OBSERVATION: JSON parse failed on retry — using fallback risk_critique.")
            trace_lines.append(f"RAW OUTPUT: {raw2}")
            fallback = {
                "risks": [],
                "overall_risk_level": "MEDIUM",
                "requires_revision": False,
                "critique_summary": "Risk analysis could not be parsed. Manual review recommended.",
                "_raw_output": raw2,
            }
            return {"risk_critique": fallback, "trace": "\n".join(trace_lines)}

    # Validate and enforce requires_revision logic
    risks = parsed.get("risks", [])
    has_high_severity = any(r.get("severity", 0) >= 4 for r in risks)
    parsed["requires_revision"] = has_high_severity

    trace_lines.append(
        f"OBSERVATION: Parsed {len(risks)} risks. "
        f"overall_risk_level={parsed.get('overall_risk_level')}. "
        f"requires_revision={parsed['requires_revision']}"
    )

    return {"risk_critique": parsed, "trace": "\n".join(trace_lines)}
