from fastapi import APIRouter

router = APIRouter()

# Sample data for demonstration
stocks_data = {
    "tech": [
        {"symbol": "AAPL", "name": "Apple Inc.", "price": 150.0},
        {"symbol": "MSFT", "name": "Microsoft Corp.", "price": 250.0}
    ],
    "health": [
        {"symbol": "JNJ", "name": "Johnson & Johnson", "price": 160.0},
        {"symbol": "PFE", "name": "Pfizer Inc.", "price": 50.0}
    ]
}

@router.get("/stocks/{theme}")
async def list_stocks_by_theme(theme: str):
    return stocks_data.get(theme, [])

@router.get("/stocks/details/{symbol}")
async def get_stock_details(symbol: str):
    # Dummy details for demonstration
    stock_details = {
        "symbol": symbol,
        "name": "Sample Stock",
        "price": 100.0,
        "week52_high": 120.0,
        "week52_low": 80.0,
        "sentiment_score": 0.75
    }
    return stock_details

# Example of how to include the router in your main app
# from fastapi import FastAPI
# app = FastAPI()
# app.include_router(router, prefix="/api")
