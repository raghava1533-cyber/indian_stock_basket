# Indian Stock Basket Management System

A comprehensive web application for managing quality Indian stock baskets with automatic rebalancing, live data, and email notifications.

## Features

### 🎯 Core Features
- **Multiple Quality Baskets**: 6 pre-configured baskets (Bluechip Giants, Midcap Momentum, Smallcap Leaders, Tech Innovators, Finance Leaders, Healthcare Growth)
- **Automatic Rebalancing**: Every 30 days at 9:30 AM IST, or manual trigger via UI
- **Live Stock Data**: Real-time prices, 52-week highs/lows using Yahoo Finance API
- **Quality Filtering**: Selection based on market cap, P/E ratio, earnings growth, and social sentiment
- **Email Notifications**: Subscribers get notified on every rebalance with detailed changes

### 📊 Dashboard Features
- **Basket Overview**: View all baskets with key metrics
- **Subscription Management**: Subscribe/unsubscribe to baskets for notifications
- **Real-time Monitoring**: Live price updates and performance metrics

### 📈 Basket Detail Page
- **Multiple Tabs**:
  - **Overview**: Summary, total value, minimum investment, benchmark comparison
  - **Stocks**: Complete stock list with prices, 52-week data, and selection rationale
  - **Changes**: Added, removed, and partially removed stocks
  - **History**: Rebalance history with dates and changes
  - **About**: Basket information and features

### 💼 Portfolio Features
- Track holdings across all baskets
- Monitor individual stock performance
- Calculate minimum investment to maintain equal weight
- Number of stocks instead of percentage weights

## System Architecture

```
indian-stock-basket/
├── backend/
│   ├── models/           # Database schemas
│   ├── services/         # Business logic
│   ├── routes/           # API endpoints
│   ├── config/           # Configuration files
│   ├── server.js         # Main server file
│   ├── package.json      # Dependencies
│   └── .env.example      # Environment variables
└── frontend/
    ├── public/           # Static files
    ├── src/
    │   ├── components/   # Reusable components
    │   ├── pages/        # Page components
    │   ├── services/     # API calls
    │   ├── App.js        # Main app component
    │   ├── App.css       # Styling
    │   └── index.js      # Entry point
    └── package.json      # Dependencies
```

## Tech Stack

**Backend:**
- Node.js with Express.js
- MongoDB for data storage
- node-cron for scheduling
- Nodemailer for email notifications
- Yahoo Finance API for stock data

**Frontend:**
- React.js
- React Router for navigation
- Axios for API calls
- CSS3 for styling

## Installation & Setup

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/indian-stock-basket

# Email Configuration (Gmail with App Password)
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password

# Server
PORT=5000
NODE_ENV=development
```

5. Start MongoDB:
```bash
# For local MongoDB
mongod
```

6. Start the backend server:
```bash
npm run dev
```

Server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

Application will open at `http://localhost:3000`

## API Endpoints

### Baskets
- `GET /api/baskets` - Get all baskets
- `GET /api/baskets/:id` - Get basket by ID
- `POST /api/baskets/:id/subscribe` - Subscribe to basket
- `POST /api/baskets/:id/unsubscribe` - Unsubscribe from basket
- `POST /api/baskets/:id/rebalance` - Trigger manual rebalance
- `GET /api/baskets/:id/rebalance-summary` - Get rebalance history
- `GET /api/baskets/:id/stocks` - Get basket stocks with live data

## Stock Selection Criteria

Stocks are selected based on:
1. **Market Cap**: Minimum threshold based on basket type (Large Cap > 10,000 Cr)
2. **P/E Ratio**: Between 0 and 40 (reasonable valuation)
3. **Price Position**: Above 110% of 52-week low (above support level)
4. **Quality Score**: Composite score based on valuation, momentum, and stability

## Rebalancing Logic

- **Frequency**: Every 30 days automatically
- **Trigger**: Manual button in UI for immediate rebalancing
- **Process**:
  1. Fetch latest stock data for the category
  2. Apply quality filters
  3. Score and rank stocks
  4. Select top 10 stocks
  5. Identify changes (added, removed, partial)
  6. Save history
  7. Send email notifications to subscribers

## Email Notification

Subscribers receive detailed emails on rebalance containing:
- Added stocks with reasoning
- Removed stocks with sale price
- Partially removed stocks
- Basket summary (total value, minimum investment, next rebalance date)

## Usage

1. **View Baskets**: Go to dashboard to see all available baskets
2. **Subscribe**: Enter your email and subscribe to baskets for notifications
3. **View Details**: Click "View Details" on any basket to see:
   - Current holdings
   - Stock details with 52-week data
   - Performance comparison
   - Rebalance history
4. **Manual Rebalance**: Click "Rebalance Now" button to trigger immediate rebalancing
5. **Monitor Changes**: Use "Changes" tab to see added/removed stocks

## Configuration

### Baskets Configuration
Baskets are pre-configured in the system:
1. **Bluechip Giants** - Large cap stocks
2. **Midcap Momentum** - Mid cap growth stocks
3. **Smallcap Leaders** - Small cap potential
4. **Tech Innovators** - IT & Technology sector
5. **Finance Leaders** - Banking & Finance sector
6. **Healthcare Growth** - Pharma & Healthcare sector

### Minimum Investment Calculation
- Equal weight = 10% per stock
- Minimum Investment = (Total Investment for Basket) / 10
- Adjust to nearest whole stock unit

## Free Operations

- ✅ View all baskets and their details
- ✅ Subscribe to email notifications
- ✅ Manual rebalancing
- ✅ View stock data and history
- ✅ Track performance
- ✅ No payment required

## Future Enhancements

- [ ] Broker API integration (Zerodha, 5Paisa, Angel)
- [ ] Automated trading on rebalance
- [ ] Advanced analytics dashboard
- [ ] Machine learning for stock scoring
- [ ] Mobile app
- [ ] Portfolio backtesting
- [ ] Advanced filtering options
- [ ] User authentication and portfolio tracking

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
# Start MongoDB service if not running
mongod
```

### Email Not Sending
```bash
# Check .env email configuration
# Use Gmail App Password (not regular password)
# Enable "Less secure app access" if needed
```

### Stock Data Not Updating
- Check internet connection
- Verify Yahoo Finance API availability
- Check API rate limits

## Support & Documentation

For more information:
- Backend API: See server.js and routes/
- Frontend Components: See src/pages/ and src/components/
- Database Models: See backend/models/

## License

MIT License - Feel free to use and modify

## Contact

For issues, improvements, or suggestions, please create an issue or pull request.

---

**Note**: This system uses live stock data from Yahoo Finance API. Make sure you have internet connectivity for real-time data updates.
