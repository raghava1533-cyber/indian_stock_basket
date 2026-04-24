import yfinance as yf
import time
import threading

INDIA = {
    "NIFTY": "^NSEI",
    "BANKNIFTY": "^NSEBANK"
}

US = {
    "S&P 500": "^GSPC",
    "NASDAQ": "^IXIC",
    "DOW": "^DJI"
}

def fetch_index(symbol):
    t = yf.Ticker(symbol)
    d = t.info

    price = d.get("regularMarketPrice", 0)
    prev = d.get("regularMarketPreviousClose", 1)

    change = round(price - prev, 2)
    pct = round((change / prev) * 100, 2)

    return {
        "price": price,
        "change": change,
        "pct": pct
    }

def stream_loop(socketio):
    while True:
        try:
            data = {
                "INDIA": {},
                "US": {}
            }

            for name, sym in INDIA.items():
                data["INDIA"][name] = fetch_index(sym)

            for name, sym in US.items():
                data["US"][name] = fetch_index(sym)

            socketio.emit("market_update", data)

        except Exception as e:
            print("Stream error:", e)

        time.sleep(5)  # 🔥 real-time interval (change to 1 for faster)

def start_stream(socketio):
    thread = threading.Thread(target=stream_loop, args=(socketio,))
    thread.daemon = True
    thread.start()