"""Economic News Agent — RAG pattern."""

import asyncio
import logging
import os
import time
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from tools.news_retrieval import fetch_and_store_articles, retrieve_relevant_chunks, get_mock_briefing

log = logging.getLogger("finboard.economic_news")

llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0.3,
    openai_api_key=os.getenv("OPENAI_API_KEY"),
    request_timeout=30,
)


async def run_economic_news_agent(question: str) -> dict:
    """
    RAG pipeline:
    1. Fetch + store articles via NewsAPI
    2. Retrieve relevant chunks from ChromaDB
    3. Synthesize macroeconomic briefing via gpt-4o
    Returns { "briefing": str, "trace": str }
    """
    newsapi_key = os.getenv("NEWSAPI_KEY", "")
    has_newsapi = bool(newsapi_key.strip())
    trace_lines = []
    t0 = time.perf_counter()

    log.info("START  newsapi_key_set=%s  question=%r", has_newsapi, question[:60])
    trace_lines.append(f"QUERY: {question}")

    # Step 1: Fetch and store articles (blocking I/O — 10s timeout)
    log.info("STEP1  calling fetch_and_store_articles ...")
    try:
        n_stored = await asyncio.wait_for(
            asyncio.to_thread(fetch_and_store_articles, question, newsapi_key.strip(), 10),
            timeout=10.0,
        )
        log.info("STEP1  done — %d articles stored  (%.1fs)", n_stored, time.perf_counter() - t0)
    except asyncio.TimeoutError:
        n_stored = 0
        log.warning("STEP1  TIMEOUT after 10s — skipping NewsAPI")
        trace_lines.append("OBSERVATION: NewsAPI fetch timed out — skipping")
    except Exception as exc:
        n_stored = 0
        log.error("STEP1  ERROR: %s", exc)
    trace_lines.append(f"ACTION: fetch_and_store_articles(query={question!r}, n=10)")
    trace_lines.append(f"OBSERVATION: {n_stored} articles fetched and stored in ChromaDB")

    # Step 2: Retrieve relevant chunks (blocking ChromaDB + embeddings — 10s timeout)
    log.info("STEP2  calling retrieve_relevant_chunks ...")
    try:
        chunks = await asyncio.wait_for(
            asyncio.to_thread(retrieve_relevant_chunks, question, 5),
            timeout=10.0,
        )
        log.info("STEP2  done — %d chunks  (%.1fs)", len(chunks), time.perf_counter() - t0)
    except asyncio.TimeoutError:
        chunks = ["No recent news articles available."]
        log.warning("STEP2  TIMEOUT after 10s — falling back to mock")
        trace_lines.append("OBSERVATION: ChromaDB retrieval timed out — falling back to mock")
    except Exception as exc:
        chunks = ["No recent news articles available."]
        log.error("STEP2  ERROR: %s", exc)
    trace_lines.append(f"ACTION: retrieve_relevant_chunks(query={question!r}, n_results=5)")
    trace_lines.append(f"OBSERVATION: {len(chunks)} chunks retrieved")

    # Step 3: Fallback to mock briefing if no real chunks
    if not chunks or chunks == ["No recent news articles available."]:
        log.info("STEP3  no real chunks — using mock briefing  (%.1fs)", time.perf_counter() - t0)
        briefing = get_mock_briefing()
        trace_lines.append("OBSERVATION: No real chunks available — using mock macroeconomic briefing")
        return {"briefing": briefing, "trace": "\n".join(trace_lines)}

    context = "\n\n".join(chunks)
    prompt = (
        f"Synthesize a macroeconomic briefing (300–500 words) relevant to this financial question, "
        f"based only on the following news summaries:\n\n{context}"
    )

    trace_lines.append(f"ACTION: gpt-4o synthesis prompt (length={len(prompt)} chars)")
    log.info("STEP3  calling gpt-4o LLM ...")

    messages = [
        SystemMessage(content="You are a macroeconomic analyst providing concise financial briefings."),
        HumanMessage(content=prompt),
    ]

    response = await llm.ainvoke(messages)
    briefing = response.content.strip()

    log.info("STEP3  LLM done — %d chars  (%.1fs total)", len(briefing), time.perf_counter() - t0)
    trace_lines.append(f"OBSERVATION: LLM returned briefing ({len(briefing)} chars)")

    return {"briefing": briefing, "trace": "\n".join(trace_lines)}
