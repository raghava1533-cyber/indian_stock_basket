# Indian Stock Basket - Setup Guide

## Overview
Indian Stock Basket is a platform for creating and managing quality Indian stock portfolios with automatic rebalancing every 30 days.

## Features
✅ Multiple themed baskets (Tech, Finance, Healthcare, Energy, etc.)
✅ Automatic rebalancing based on market conditions and sentiment analysis
✅ Real-time stock data via yfinance
✅ Email notifications for rebalancing events
✅ Broker integration for automated trading
✅ Comprehensive analytics dashboard
✅ Free to use and deploy

## Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 13+
- Redis (optional, for caching)

## Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/raghava1533-cyber/indian_stock_basket.git
cd indian_stock_basket
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Create Environment File
```bash
cp .env.example .env
# Edit .env with your API keys and database URL
```

### 4. Database Setup
```bash
# Make sure PostgreSQL is running
python -m alembic upgrade head
```

### 5. Run Backend
```bash
uvicorn main:app --reload
# API available at http://localhost:8000
```

### 6. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
# Frontend available at http://localhost:3000
```

## Using Docker Compose

```bash
docker-compose up -d
```

This will start:
- PostgreSQL (port 5432)
- Redis (port 6379)
- Backend API (port 8000)
- Frontend (port 3000)

## API Endpoints

### Baskets
- `GET /api/baskets` - List all baskets
- `POST /api/baskets` - Create new basket
- `GET /api/baskets/{id}` - Get basket details
- `POST /api/baskets/{id}/rebalance` - Trigger rebalancing

### Stocks
- `GET /api/stocks/{symbol}` - Get stock data
- `GET /api/stocks/{symbol}/52week` - Get 52-week high/low
- `GET /api/stocks/{symbol}/history` - Get price history

### Subscribers
- `POST /api/subscribers` - Subscribe to notifications
- `DELETE /api/subscribers/{id}` - Unsubscribe

## Configuration

### Free Tier APIs Used
- **Stock Data**: yfinance (free, no key needed)
- **News/Sentiment**: NewsAPI (free tier: 100 req/day)
- **Email**: SendGrid (free tier: 100 emails/day)
- **Database**: PostgreSQL (free hosted options)
- **Deployment**: 
  - Frontend: Vercel (free tier available)
  - Backend: Railway or Render (free tier available)

## Deployment

### Frontend (Vercel)
```bash
npm i -g vercel
vercel login
vercel
```

### Backend (Railway)
```bash
npm i -g @railway/cli
railway login
railway up
```

## Environment Variables

```
DATABASE_URL=postgresql://user:password@host:5432/indian_stock_basket
SENDGRID_API_KEY=your_sendgrid_api_key
NEWS_API_KEY=your_newsapi_key
NEXT_PUBLIC_API_URL=http://localhost:8000 (or production URL)
```

## Project Structure
```
indian_stock_basket/
├── backend/
│   ├── models/           # Database models
│   ├── routes/           # API endpoints
│   ├── services/         # Business logic
│   ├── config.py         # Configuration
│   └── main.py           # FastAPI app
├── frontend/
│   ├── pages/            # Next.js pages
│   ├── components/       # React components
│   └── next.config.js    # Next.js config
└── documentation/        # Guides
```

## Support
For issues or questions, please create a GitHub issue.

---
Happy investing! 📈