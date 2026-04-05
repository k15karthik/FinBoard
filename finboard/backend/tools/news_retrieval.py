"""News retrieval tools: NewsAPI fetch → ChromaDB RAG pipeline."""

import os
from pathlib import Path

import chromadb
from chromadb.utils import embedding_functions

_CHROMA_PATH = str(Path(__file__).resolve().parent.parent / "chroma_db")
_COLLECTION_NAME = "finboard_news"

_chroma_client = None
_collection = None


def _get_collection():
    global _chroma_client, _collection
    if _collection is None:
        openai_key = os.getenv("OPENAI_API_KEY")
        _chroma_client = chromadb.PersistentClient(path=_CHROMA_PATH)
        emb_fn = embedding_functions.OpenAIEmbeddingFunction(
            api_key=openai_key,
            model_name="text-embedding-3-small",
        )
        _collection = _chroma_client.get_or_create_collection(
            name=_COLLECTION_NAME,
            embedding_function=emb_fn,
        )
    return _collection


def fetch_and_store_articles(query: str, api_key: str = None, n: int = 10) -> int:
    """
    Fetches n articles from NewsAPI for the query, embeds them via OpenAI,
    and upserts into ChromaDB. Returns number of articles stored.
    Returns 0 gracefully if api_key is absent.
    """
    if not api_key:
        return 0

    try:
        from newsapi import NewsApiClient
        client = NewsApiClient(api_key=api_key)
        response = client.get_everything(q=query, language="en", page_size=n, sort_by="relevancy")
        articles = response.get("articles", [])
    except Exception:
        return 0

    if not articles:
        return 0

    collection = _get_collection()
    docs, ids, metas = [], [], []
    for i, article in enumerate(articles):
        title = article.get("title") or ""
        description = article.get("description") or ""
        text = f"{title}. {description}".strip()
        if not text or text == ".":
            continue
        doc_id = f"{query[:40].replace(' ', '_')}_{i}"
        docs.append(text)
        ids.append(doc_id)
        metas.append({"source": article.get("source", {}).get("name", ""), "url": article.get("url", "")})

    if docs:
        try:
            collection.upsert(documents=docs, ids=ids, metadatas=metas)
        except Exception:
            return 0

    return len(docs)


def retrieve_relevant_chunks(query: str, n_results: int = 5) -> list:
    """
    Embeds the query and retrieves top n_results chunks from ChromaDB.
    Returns ["No recent news articles available."] if the collection is empty.
    """
    try:
        collection = _get_collection()
        count = collection.count()
        if count == 0:
            return ["No recent news articles available."]
        results = collection.query(query_texts=[query], n_results=min(n_results, count))
        chunks = results.get("documents", [[]])[0]
        return chunks if chunks else ["No recent news articles available."]
    except Exception:
        return ["No recent news articles available."]


def get_mock_briefing() -> str:
    """
    Returns a realistic mock macroeconomic summary (~200 words).
    Used when NEWSAPI_KEY is missing.
    """
    return (
        "MOCK MACROECONOMIC BRIEFING (generated — no NewsAPI key configured)\n\n"
        "Global equity markets remain in a state of cautious optimism following the Federal "
        "Reserve's latest policy meeting, where rates were held steady amid mixed inflation signals. "
        "The Consumer Price Index rose 3.1% year-over-year, slightly above the Fed's 2% target, "
        "suggesting that monetary easing may be delayed into late 2025. U.S. labor markets remain "
        "resilient with unemployment at 3.8%, though job creation has slowed in manufacturing and "
        "technology sectors.\n\n"
        "The S&P 500 is trading near all-time highs, driven primarily by mega-cap technology stocks "
        "and AI-adjacent companies. However, valuations appear stretched with the forward P/E ratio "
        "sitting at approximately 21x, above the 10-year historical average of 18x. Bond markets "
        "are pricing in one to two rate cuts by year-end, causing the 10-year Treasury yield to "
        "drift toward 4.2%.\n\n"
        "International markets face headwinds from a stronger U.S. dollar and slowing growth in "
        "China, where the property sector continues to weigh on consumer confidence. Commodity "
        "prices have stabilized, with oil trading in the $75–$85 per barrel range. Overall, the "
        "macro environment favors diversified portfolios with a modest tilt toward quality equities "
        "and short-duration bonds."
    )
