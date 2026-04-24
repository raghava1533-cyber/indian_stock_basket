def get_news(symbol):
    return {
        "google": f"https://news.google.com/search?q={symbol}",
        "yahoo": f"https://finance.yahoo.com/quote/{symbol}/news",
        "moneycontrol": f"https://www.moneycontrol.com/news/tags/{symbol}.html"
    }