import yfinance as yf

INDIA_INDICES = {
    "NIFTY": "^NSEI",
    "BANKNIFTY": "^NSEBANK"
}

US_INDICES = {
    "S&P 500": "^GSPC",
    "NASDAQ": "^IXIC",
    "DOW": "^DJI"
}


def format_index(data):
    current = data["regularMarketPrice"]
    prev = data["regularMarketPreviousClose"]

    change = current - prev
    pct = (change / prev) * 100

    return {
        "price": round(current, 2),
        "change": round(change, 2),
        "pct": round(pct, 2),
        "time": data["regularMarketTime"]
    }


def get_indices(market):
    indices = INDIA_INDICES if market == "INDIA" else US_INDICES

    result = {}
    for name, symbol in indices.items():
        ticker = yf.Ticker(symbol)
        data = ticker.info
        result[name] = format_index(data)

    return result


def get_top_movers(market):
    tickers = ["RELIANCE.NS", "TCS.NS", "INFY.NS"] if market == "INDIA" else ["AAPL", "TSLA", "NVDA"]

    movers = []

    for t in tickers:
        stock = yf.Ticker(t)
        d = stock.info

        change = d["regularMarketPrice"] - d["regularMarketPreviousClose"]

        movers.append({
            "symbol": t,
            "price": d["regularMarketPrice"],
            "change": round(change, 2)
        })

    return movers