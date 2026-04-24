def calculate_basket(stocks):
    total_invested = 0
    total_current = 0

    for s in stocks:
        invested = s["buy_price"] * s["qty"]
        current = s["ltp"] * s["qty"]

        total_invested += invested
        total_current += current

    pnl = total_current - total_invested
    pct = (pnl / total_invested) * 100 if total_invested else 0

    return {
        "invested": round(total_invested, 2),
        "current": round(total_current, 2),
        "pnl": round(pnl, 2),
        "pct": round(pct, 2)
    }