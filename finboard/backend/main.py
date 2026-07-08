"""FastAPI entry point with SSE streaming for FinBoard."""

import json
import asyncio
import logging
import os
import time
from typing import AsyncGenerator

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("finboard")

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
from sqlalchemy.orm import Session as DBSession
from dotenv import load_dotenv

load_dotenv()

from database import get_db, init_db
from models import Session as SessionModel, AgentOutput
from graph import graph, FinBoardState


app = FastAPI(title="FinBoard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


# ─── Request / Response schemas ───────────────────────────────────────────────

class QueryRequest(BaseModel):
    question: str
    budget_data: dict | None = None


# ─── SSE helpers ──────────────────────────────────────────────────────────────

def _sse(event: str, data: dict) -> dict:
    return {"event": event, "data": json.dumps(data)}


# node name → agent key used in state dicts
_NODE_TO_AGENT = {
    "economic_news": "economic_news",
    "budget_planner": "budget_planner",
    "investment_advisor": "investment_advisor",
    "risk_analyst": "risk_analyst",
    "synthesizer": "synthesizer",
}

_OUTPUT_KEYS = {
    "economic_news": "news_briefing",
    "budget_planner": "feasibility_report",
    "investment_advisor": "investment_recommendation",
    "risk_analyst": "risk_critique",
    "synthesizer": "final_verdict",
}


async def _stream_graph(request: QueryRequest) -> AsyncGenerator[dict, None]:
    log.info("─── NEW QUERY: %r", request.question[:80])
    initial_state: FinBoardState = {
        "question": request.question,
        "budget_data": request.budget_data or {},
        "news_briefing": "",
        "feasibility_report": "",
        "investment_recommendation": "",
        "risk_critique": {},
        "revision_count": 0,
        "requires_revision": False,
        "final_verdict": "",
        "agent_traces": {},
        "error": None,
    }

    # Track how many times investment_advisor has fired (for revision status)
    advisor_fire_count = 0
    final_state: FinBoardState = {}
    t0 = time.perf_counter()

    try:
        log.info("graph.astream — starting")
        async for chunk in graph.astream(initial_state, stream_mode="updates"):
            elapsed = time.perf_counter() - t0
            log.debug("chunk keys: %s  (%.1fs elapsed)", list(chunk.keys()), elapsed)
            for node_name, node_output in chunk.items():
                agent_key = _NODE_TO_AGENT.get(node_name)
                log.info("NODE COMPLETE: %-22s  (%.1fs)", node_name, elapsed)
                if agent_key is None:
                    log.warning("  unknown node %r — skipping", node_name)
                    continue

                error_in_output = node_output.get("error")
                if error_in_output:
                    log.error("  node %s reported error: %s", node_name, error_in_output)

                # Merge into final_state
                final_state.update(node_output)

                trace = (node_output.get("agent_traces") or {}).get(agent_key, "")
                output_key = _OUTPUT_KEYS[agent_key]
                raw_output = node_output.get(output_key, "")
                log.debug("  output_key=%s  len=%d", output_key, len(str(raw_output)))

                if agent_key == "risk_analyst":
                    # Serialize dict for the frontend
                    raw_output = json.dumps(node_output.get("risk_critique", {}))

                if agent_key == "investment_advisor":
                    advisor_fire_count += 1
                    revision_num = node_output.get("revision_count", advisor_fire_count) - 1
                    status = "revised" if advisor_fire_count > 1 else "complete"
                    yield _sse("agent_update", {
                        "agent": agent_key,
                        "status": status,
                        "revision": revision_num if status == "revised" else 0,
                        "output": raw_output,
                        "trace": trace,
                    })
                elif agent_key == "synthesizer":
                    # Emit board_verdict instead of agent_update
                    overall_risk = (final_state.get("risk_critique") or {}).get("overall_risk_level", "UNKNOWN")
                    yield _sse("board_verdict", {
                        "final_verdict": raw_output,
                        "overall_risk_level": overall_risk,
                        "revision_count": final_state.get("revision_count", 0),
                    })
                else:
                    yield _sse("agent_update", {
                        "agent": agent_key,
                        "status": "complete",
                        "output": raw_output,
                        "trace": trace,
                    })
                log.info("  SSE emitted for %s", agent_key)

    except Exception as exc:
        log.exception("GRAPH ERROR after %.1fs: %s", time.perf_counter() - t0, exc)
        yield _sse("error", {"message": str(exc)})
        return

    log.info("─── QUERY DONE in %.1fs", time.perf_counter() - t0)
    yield _sse("done", {})

    # ── Persist to DB (best-effort) ──
    try:
        db: DBSession = next(get_db())
        risk_critique = final_state.get("risk_critique") or {}
        session_row = SessionModel(
            question=request.question,
            final_verdict=final_state.get("final_verdict", ""),
            overall_risk_level=risk_critique.get("overall_risk_level"),
        )
        db.add(session_row)
        db.flush()  # get session_row.id

        traces = final_state.get("agent_traces") or {}
        agent_outputs = [
            ("economic_news",      final_state.get("news_briefing", ""),              0),
            ("budget_planner",     final_state.get("feasibility_report", ""),         0),
            ("investment_advisor", final_state.get("investment_recommendation", ""),  final_state.get("revision_count", 0)),
            ("risk_analyst",       json.dumps(risk_critique),                         0),
            ("synthesizer",        final_state.get("final_verdict", ""),              0),
        ]
        for agent_name, output_text, revision_number in agent_outputs:
            db.add(AgentOutput(
                session_id=session_row.id,
                agent_name=agent_name,
                output_text=output_text,
                trace_text=str(traces.get(agent_name, "")),
                revision_number=revision_number,
            ))

        db.commit()
        db.close()
    except Exception:
        pass  # DB failure must not surface to the client


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.post("/api/query")
async def query(request: QueryRequest):
    return EventSourceResponse(
        _stream_graph(request),
        headers={"X-Accel-Buffering": "no"},
    )


@app.get("/api/history")
def get_history(db: DBSession = Depends(get_db)):
    sessions = (
        db.query(SessionModel)
        .order_by(SessionModel.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "id": s.id,
            "created_at": s.created_at.isoformat() + "Z",
            "question": s.question,
            "final_verdict": s.final_verdict,
            "overall_risk_level": s.overall_risk_level,
        }
        for s in sessions
    ]


@app.get("/api/session/{session_id}")
def get_session(session_id: int, db: DBSession = Depends(get_db)):
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "id": session.id,
        "created_at": session.created_at.isoformat(),
        "question": session.question,
        "final_verdict": session.final_verdict,
        "overall_risk_level": session.overall_risk_level,
        "agent_outputs": [
            {
                "id": ao.id,
                "agent_name": ao.agent_name,
                "output_text": ao.output_text,
                "trace_text": ao.trace_text,
                "revision_number": ao.revision_number,
            }
            for ao in session.agent_outputs
        ],
    }
