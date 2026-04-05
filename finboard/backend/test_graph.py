"""Phase 3 integration test for the FinBoard LangGraph pipeline."""

import asyncio
from dotenv import load_dotenv

load_dotenv()

from graph import graph  # noqa: E402


async def test():
    result = await graph.ainvoke({
        "question": "Should I invest $5,000 in index funds right now?",
        "budget_data": {
            "income": 5000,
            "expenses": 3200,
            "savings": 8000,
            "debt": 12000,
            "emergency_fund": 6400,
        },
        "revision_count": 0,
        "requires_revision": False,
        "agent_traces": {},
        "error": None,
    })

    assert result["news_briefing"], "news_briefing is empty"
    assert "VERDICT:" in result["feasibility_report"], "No verdict in feasibility_report"
    assert "%" in result["investment_recommendation"], "No allocation % in recommendation"
    assert isinstance(result["risk_critique"], dict), "risk_critique not parsed as dict"
    assert result["final_verdict"], "final_verdict is empty"

    print("All assertions passed")
    print(f"   Revision count: {result['revision_count']}")
    print(f"   Risk level: {result['risk_critique'].get('overall_risk_level')}")
    print(f"   Requires revision: {result['risk_critique'].get('requires_revision')}")
    print(f"\n--- Final Verdict (first 300 chars) ---")
    print(result["final_verdict"][:300])


if __name__ == "__main__":
    asyncio.run(test())
