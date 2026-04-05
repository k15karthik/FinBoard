"""Market data tools using yfinance — never raises, always returns error field."""

import yfinance as yf


_GOAL_TICKER_MAP = {
    "index fund": ["SPY", "VTI", "QQQ"],
    "index": ["SPY", "VTI", "QQQ"],
    "retirement": ["VTI", "BND", "VXUS"],
    "growth": ["QQQ", "VUG", "ARKK"],
    "safe": ["BND", "VTIP", "SHY"],
    "bond": ["BND", "AGG", "TLT"],
    "dividend": ["VYM", "SCHD", "DVY"],
    "international": ["VXUS", "EFA", "VWO"],
    "tech": ["QQQ", "VGT", "XLK"],
    "real estate": ["VNQ", "SCHH", "IYR"],
    "healthcare": ["VHT", "XLV", "IBB"],
    "energy": ["XLE", "VDE", "USO"],
    "balanced": ["VTI", "BND", "VXUS"],
    "conservative": ["BND", "SHY", "VTIP"],
    "aggressive": ["QQQ", "ARKK", "VUG"],
}

_DEFAULT_TICKERS = ["SPY", "VTI", "BND"]


def get_ticker_summary(ticker: str) -> dict:
    """
    Returns a summary dict for the given ticker symbol.
    Never raises — sets 'error' field on failure.
    """
    result = {
        "ticker": ticker,
        "name": None,
        "current_price": None,
        "52w_high": None,
        "52w_low": None,
        "pe_ratio": None,
        "beta": None,
        "market_cap": None,
        "sector": None,
        "error": None,
    }
    try:
        t = yf.Ticker(ticker)
        info = t.info
        if not info or (info.get("regularMarketPrice") is None and info.get("currentPrice") is None):
            # Try fast_info as fallback
            fast = t.fast_info
            current_price = getattr(fast, "last_price", None)
            result["current_price"] = current_price
            result["52w_high"] = getattr(fast, "year_high", None)
            result["52w_low"] = getattr(fast, "year_low", None)
            result["name"] = ticker
        else:
            result["name"] = info.get("longName") or info.get("shortName") or ticker
            result["current_price"] = info.get("currentPrice") or info.get("regularMarketPrice")
            result["52w_high"] = info.get("fiftyTwoWeekHigh")
            result["52w_low"] = info.get("fiftyTwoWeekLow")
            result["pe_ratio"] = info.get("trailingPE") or info.get("forwardPE")
            result["beta"] = info.get("beta")
            result["market_cap"] = info.get("marketCap")
            result["sector"] = info.get("sector")
    except Exception as e:
        result["error"] = str(e)
    return result


def get_multiple_tickers(tickers: list) -> list:
    """Calls get_ticker_summary for each ticker and returns a list of dicts."""
    return [get_ticker_summary(t) for t in tickers]


def suggest_tickers_for_goal(goal_keywords: str) -> list:
    """
    Returns a list of ticker symbols relevant to the goal keywords.
    Hardcoded mapping — falls back to SPY/VTI/BND if no match found.
    """
    keywords_lower = goal_keywords.lower()
    for keyword, tickers in _GOAL_TICKER_MAP.items():
        if keyword in keywords_lower:
            return tickers
    return _DEFAULT_TICKERS
