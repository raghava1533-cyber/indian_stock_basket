# Project Files Reference

## Quick File Navigator

### 📚 Documentation Files
```
README.md                    # Main project documentation
QUICKSTART.md               # Quick start guide (start here!)
SETUP_GUIDE.md              # Detailed setup with troubleshooting
DEPLOYMENT.md               # Deployment options & guides
DEVELOPER.md                # Developer docs & extension guide
FILES.md                    # This file - file reference
```

### 🔧 Backend Structure

#### Configuration & Entry Point
```
backend/
├── server.js               # Main Express server - START HERE
├── package.json            # Dependencies & scripts
├── .env.example            # Environment template - COPY & EDIT THIS
└── Dockerfile              # Container image definition
```

#### Database Models (`backend/models/`)
```
├── Basket.js               # Basket schema (stocks, subscribers, rebalance dates)
├── User.js                 # User schema (portfolio, subscriptions)
├── StockData.js            # Stock data schema (prices, metrics)
└── RebalanceHistory.js     # Rebalancing history tracking
```

#### Business Logic Services (`backend/services/`)
```
├── stockDataService.js     # Live stock data fetching from Yahoo Finance
├── rebalanceService.js     # Main rebalancing logic & stock selection
└── emailService.js         # Email notifications (Nodemailer)
```

#### API Routes (`backend/routes/`)
```
└── baskets.js              # All basket endpoints (GET, POST, PATCH, etc.)
```

#### Configuration & Middleware
```
backend/
├── config/
│   └── database.js         # MongoDB connection setup
├── middleware/
│   └── errorHandler.js     # Error handling middleware
└── scripts/
    └── initializeData.js   # Database initialization with sample data
```

### 🎨 Frontend Structure

#### Main Application (`frontend/src/`)
```
├── App.js                  # Main app component with routing
├── App.css                 # Global styles & responsive design
└── index.js                # React entry point
```

#### Pages (`frontend/src/pages/`)
```
├── Dashboard.js            # Main dashboard - view all baskets
└── BasketDetail.js         # Detailed basket view with multiple tabs
```

#### Services & API (`frontend/src/services/`)
```
└── api.js                  # Axios API client & endpoints
```

#### Frontend Configuration
```
frontend/
├── package.json            # Frontend dependencies
├── public/
│   └── index.html          # HTML template
└── Dockerfile              # Frontend container image
```

### 🐳 Containerization
```
docker-compose.yml         # Multi-container orchestration
backend/Dockerfile         # Backend Node.js container
frontend/Dockerfile        # Frontend React container
```

### 📁 Project Layout
```
indian-stock-basket/
├── backend/                # Node.js Express API
├── frontend/               # React UI
├── .gitignore              # Git ignore patterns
└── README.md               # Documentation
```

---

## File Purposes & Contents

### Backend Files (Detailed)

#### `server.js` (Main Server)
- Starts Express server on port 5000
- Connects to MongoDB
- Sets up routes and middleware
- Initializes rebalancing scheduler (cron job)
- Sets up email service
- **Functions**:
  - `initializeBaskets()` - Creates default baskets
  - `scheduleRebalancing()` - Sets up 9:30 AM daily check
  - Error handling middleware

#### `models/Basket.js`
- MongoDB schema for stock baskets
- **Fields**:
  - `name`: Basket identifier
  - `stocks`: Array of 10 stocks with metadata
  - `subscribers`: Email list for notifications
  - `benchmark`: Comparison data
  - `rebalanceHistory`: Previous changes
- **Methods**: None (basic schema)

#### `services/stockDataService.js`
- Fetches live stock data from Yahoo Finance API
- **Key Functions**:
  - `getStockData(ticker)` - Single stock data
  - `getMultipleStocksData(tickers)` - Batch fetch
  - `calculateStockScore()` - Quality metric
  - `getStocksByCategory()` - Category-based stocks
- **Data Source**: Yahoo Finance API (free, no auth)

#### `services/rebalanceService.js`
- Core rebalancing logic
- **Key Functions**:
  - `rebalanceBasket()` - Main rebalance process
  - `selectTopStocks()` - Chooses 10 best stocks
  - `isQualityStock()` - Filters by criteria
- **Process**:
  1. Fetch all stocks in category
  2. Filter quality stocks
  3. Score each stock
  4. Select top 10
  5. Compare with current basket
  6. Generate changes
  7. Update database
  8. Send emails

#### `services/emailService.js`
- Sends email notifications using Nodemailer
- **Functions**:
  - `sendRebalanceNotification()` - Rebalance alert
  - `sendSubscriptionConfirmation()` - Welcome email
  - `testEmailConnection()` - Verify setup
- **Email Types**: Rebalance alerts, subscription confirmations

#### `routes/baskets.js`
- All basket API endpoints
- **Endpoints**:
  - `GET /api/baskets` - All baskets
  - `GET /api/baskets/:id` - Single basket
  - `POST /api/baskets/:id/subscribe` - Subscribe
  - `POST /api/baskets/:id/rebalance` - Manual rebalance
  - `GET /api/baskets/:id/stocks` - Stocks with live data

#### `config/database.js`
- MongoDB connection function
- **Exports**: `connectDB()` async function
- **Configuration**: Uses `MONGODB_URI` from `.env`

#### `scripts/initializeData.js`
- Run: `npm run init-db`
- Creates initial baskets with sample data
- Populates stock information
- Called automatically on server startup if no baskets exist

### Frontend Files (Detailed)

#### `App.js`
- Main React component
- Sets up routing with React Router
- Header with navigation
- Routes to Dashboard and BasketDetail pages
- **State**: 
  - `baskets` - List of all baskets
  - `loading` - Loading state

#### `App.css`
- Global styles for entire application
- **Includes**:
  - Header & footer styling
  - Card designs
  - Tab styling
  - Button styles (primary, secondary, danger)
  - Responsive media queries
  - Tables and forms

#### `pages/Dashboard.js`
- Main dashboard page
- **Features**:
  - View all baskets in grid
  - Email subscription form
  - Subscribe/Unsubscribe buttons
  - Basket metrics (stocks count, subscribers, rebalance dates)
  - Links to detailed views
- **State**: Email, subscribed baskets, message alerts

#### `pages/BasketDetail.js`
- Detailed view for individual basket
- **Tabs**:
  1. **Overview**: Summary, total value, benchmark comparison
  2. **Stocks**: Table with stock details, 52-week data, why picked
  3. **Changes**: Added/removed/partially removed stocks
  4. **History**: Rebalancing history
  5. **About**: Basket information and features
- **Features**: Manual rebalance button, live data updates

#### `services/api.js`
- Axios API client configuration
- **Exports**: `basketAPI` object with functions:
  - `getAllBaskets()`
  - `getBasketById(id)`
  - `subscribeToBasket(id, email)`
  - `rebalanceBasket(id)`
  - `getBasketStocks(id)`
  - etc.

### Configuration Files

#### `.env.example`
- Template for environment variables
- **Key Variables**:
  - `MONGODB_URI` - Database connection string
  - `EMAIL_USER` - Gmail address
  - `EMAIL_PASSWORD` - Gmail app password
  - `JWT_SECRET` - Authentication secret
  - `PORT` - Server port
- **Usage**: Copy to `.env` and customize

#### `docker-compose.yml`
- Defines 3 services:
  1. **mongodb** - Database container
  2. **backend** - API server container
  3. **frontend** - React UI container
- **Usage**: `docker-compose up -d`

#### `package.json` (Backend)
- Dependencies and scripts
- **Key Scripts**:
  - `npm run dev` - Development mode with reload
  - `npm start` - Production mode
  - `npm run init-db` - Initialize database
- **Dependencies**: Express, Mongoose, Nodemailer, etc.

#### `package.json` (Frontend)
- React dependencies
- **Key Scripts**:
  - `npm start` - Dev server on port 3000
  - `npm build` - Production build
- **Dependencies**: React, React Router, Axios, etc.

---

## How Files Work Together

### Data Flow
```
1. User opens http://localhost:3000
   ↓
2. React App loads (App.js)
   ↓
3. Dashboard.js fetches baskets via api.js
   ↓
4. API call hits backend routes/baskets.js
   ↓
5. Routes call services (stockDataService, rebalanceService)
   ↓
6. Services interact with MongoDB models
   ↓
7. Data returned and displayed in UI
```

### Rebalancing Flow
```
1. Manual trigger: User clicks "Rebalance Now"
   OR
   Automatic: Cron job runs at 9:30 AM
   ↓
2. rebalanceService.js starts process
   ↓
3. stockDataService.js fetches live data
   ↓
4. Quality filters applied
   ↓
5. Top 10 stocks selected
   ↓
6. Changes compared with current basket
   ↓
7. Basket updated in MongoDB
   ↓
8. RebalanceHistory created
   ↓
9. emailService.js sends notifications
   ↓
10. User receives email with changes
```

### API Call Flow
```
Frontend (api.js) 
  ↓
Axios HTTP Request
  ↓
Backend (routes/baskets.js)
  ↓
Services (rebalanceService, stockDataService)
  ↓
Models (Basket, StockData, etc.)
  ↓
MongoDB
  ↓
Response back through layers
  ↓
Frontend State Update
  ↓
UI Render
```

---

## File Modification Guide

### To Add New Basket Type
1. Edit `backend/scripts/initializeData.js` - Add basket config
2. Edit `backend/services/stockDataService.js` - Add stocks list
3. Edit `backend/services/rebalanceService.js` - Add category logic

### To Add New Stock Column
1. Edit `backend/models/Basket.js` - Add field to schema
2. Edit `backend/services/rebalanceService.js` - Populate field
3. Edit `frontend/pages/BasketDetail.js` - Display in table

### To Add New Dashboard Feature
1. Edit `frontend/pages/Dashboard.js` - Add component
2. Edit `frontend/src/services/api.js` - Add API call if needed
3. Edit `frontend/App.css` - Add styling

### To Add New Email Template
1. Edit `backend/services/emailService.js` - Create new function
2. Add HTML template for email body
3. Call function where appropriate

---

## Important Constants & Configurations

### Stock Categories (in stockDataService.js)
- `largeCap` - Top companies > 10,000 Cr market cap
- `midCap` - Mid-sized companies
- `smallCap` - Smaller companies
- `tech` - IT & Technology
- `finance` - Banking & Finance
- `healthcare` - Pharma & Healthcare

### Basket Names (Fixed)
1. Bluechip Giants
2. Midcap Momentum
3. Smallcap Leaders
4. Tech Innovators
5. Finance Leaders
6. Healthcare Growth

### Quality Criteria (in rebalanceService.js)
- P/E Ratio: 0 - 40
- Price above 52-week low: 110% minimum
- Market Cap: Category dependent

### Rebalance Schedule
- **Frequency**: Every 30 days
- **Check Time**: 9:30 AM IST (configured in node-cron)
- **Manual**: Anytime via UI button

---

## Quick Reference Commands

### Backend
```bash
cd backend
npm install                 # Install dependencies
npm run dev                 # Run with auto-reload
npm run init-db            # Initialize database
npm start                  # Production run
```

### Frontend
```bash
cd frontend
npm install                # Install dependencies
npm start                  # Dev server on 3000
npm run build             # Production build
```

### Docker
```bash
docker-compose up -d      # Start all services
docker-compose down       # Stop all services
docker-compose logs -f    # View logs
```

### Database
```bash
npm run init-db           # Initialize with sample data
# Connect to MongoDB directly
mongosh
use indian-stock-basket
```

---

## File Sizes & Estimated Complexity

| File | Lines | Complexity | Purpose |
|------|-------|-----------|---------|
| server.js | 150 | Medium | Entry point |
| rebalanceService.js | 250 | High | Core logic |
| stockDataService.js | 200 | Medium | Data fetching |
| emailService.js | 150 | Medium | Notifications |
| BasketDetail.js | 300 | High | Complex UI |
| App.css | 400+ | Medium | Styling |
| Models (4 files) | 400 | Low-Medium | Schema |

---

## Getting Help

**For specific file questions:**
1. Check file comments and docstrings
2. Review DEVELOPER.md for architecture details
3. Look at similar functions for patterns
4. Check the specific section below

**By Component:**
- Frontend Issues → Check DEVELOPER.md Frontend section
- API Issues → Check routes/ and server.js
- Database Issues → Check models/
- Email Issues → Check emailService.js
- Stock Data Issues → Check stockDataService.js

---

You now have a complete reference to all project files! 📖
