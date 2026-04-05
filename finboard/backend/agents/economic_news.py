"""Economic News Agent — RAG pattern."""

import os
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from tools.news_retrieval import fetch_and_store_articles, retrieve_relevant_chunks, get_mock_briefing

llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0.3,
    openai_api_key=os.getenv("OPENAI_API_KEY"),
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
    trace_lines = []

    trace_lines.append(f"QUERY: {question}")

    # Step 1: Fetch and store articles
    n_stored = fetch_and_store_articles(query=question, api_key=newsapi_key, n=10)
    trace_lines.append(f"ACTION: fetch_and_store_articles(query={question!r}, n=10)")
    trace_lines.append(f"OBSERVATION: {n_stored} articles fetched and stored in ChromaDB")

    # Step 2: Retrieve relevant chunks
    chunks = retrieve_relevant_chunks(query=question, n_results=5)
    trace_lines.append(f"ACTION: retrieve_relevant_chunks(query={question!r}, n_results=5)")
    trace_lines.append(f"OBSERVATION: {len(chunks)} chunks retrieved")

    # Step 3: Fallback to mock briefing if no real chunks
    if not chunks or chunks == ["No recent news articles available."]:
        briefing = get_mock_briefing()
        trace_lines.append("OBSERVATION: No real chunks available — using mock macroeconomic briefing")
        return {"briefing": briefing, "trace": "\n".join(trace_lines)}

    context = "\n\n".join(chunks)
    prompt = (
        f"Synthesize a macroeconomic briefing (300–500 words) relevant to this financial question, "
        f"based only on the following news summaries:\n\n{context}"
    )

    trace_lines.append(f"ACTION: gpt-4o synthesis prompt (length={len(prompt)} chars)")

    messages = [
        SystemMessage(content="You are a macroeconomic analyst providing concise financial briefings."),
        HumanMessage(content=prompt),
    ]

    response = await llm.ainvoke(messages)
    briefing = response.content.strip()

    trace_lines.append(f"OBSERVATION: LLM returned briefing ({len(briefing)} chars)")

    return {"briefing": briefing, "trace": "\n".join(trace_lines)}
