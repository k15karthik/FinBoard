# FinBoard — Personal Finance AI Board of Advisors

## Team Members

- Karthik Kesavarapu (krk7) — project lead, agentic design
- Shanmukh Chebrolu (scheb2) — backend development, LangGraph orchestration
- Rahul Gowda (rgowd3) — agent implementation, tools
- Nathan Thokkudubiyyapu (nthok2) — frontend development, testing, documentation
- Sri Sirikonda (ssiri5) — backend development, API integration

## Description

FinBoard is a multi-agent personal finance advisory platform. A user submits a financial question (e.g., "Should I invest $5,000 right now?") and receives a synthesized recommendation from a board of four AI agents, each with a distinct reasoning strategy: an Economic News Agent (RAG), a Budget Planner (ReAct), an Investment Advisor (ReAct), and a Risk Analyst (adversarial reflection). The Risk Analyst can trigger a revision loop, forcing the Investment Advisor to revise its recommendation before a final synthesized verdict is produced.

## Requirements

- Python 3.10+
- Node.js 18+
- OpenAI API key (required)
- NewsAPI key (optional — app degrades gracefully to a mock briefing)
- Packages: see `backend/requirements.txt` and `frontend/package.json`

## Installation

```bash
git clone https://github.com/<team-repo>/finboard.git
cd finboard
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY (and optionally NEWSAPI_KEY)
```

Install backend dependencies:

```bash
cd backend
pip install -r requirements.txt
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

## Running the Project

**Backend** (runs on `http://localhost:8000`):

```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Frontend** (runs on `http://localhost:5173`):

```bash
cd frontend
npm run dev
```

**Integration test** (requires `OPENAI_API_KEY`):

```bash
cd backend
python test_graph.py
```

## Results / Demo

FinBoard streams agent outputs progressively to the UI as each agent completes. The four-agent board produces a final synthesized verdict with risk-level badges, percentage-based asset allocations, and a full reasoning trace per agent. The Risk Analyst's adversarial reflection loop triggers automatic revision of the Investment Advisor's recommendation when any risk severity reaches 4/5 or higher.
