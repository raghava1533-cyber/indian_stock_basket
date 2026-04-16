# Developer Documentation

## Architecture Overview

The Indian Stock Basket system is a full-stack MERN application with the following components:

```
┌─────────────────────────────────────────┐
│         React Frontend (3000)            │
├─────────────────────────────────────────┤
│      API Gateway / Axios Calls          │
├─────────────────────────────────────────┤
│   Express.js Backend API (5000)         │
│  ├─ Routes                              │
│  ├─ Services                            │
│  └─ Middleware                          │
├─────────────────────────────────────────┤
│    MongoDB Database                      │
│  ├─ Baskets                             │
│  ├─ Users                               │
│  ├─ StockData                           │
│  └─ RebalanceHistory                    │
└─────────────────────────────────────────┘
```

## Core Concepts

### 1. Baskets
A basket is a collection of 10 quality-filtered Indian stocks. Each basket has:
- **Name & Description**: Identifies the basket
- **Stocks**: Array of 10 stocks with metadata
- **Subscribers**: Email list for notifications
- **Rebalance Schedule**: 30-day cycle with manual override

### 2. Stock Selection Criteria
Stocks are chosen based on:
- **Market Cap**: Threshold varies by basket type
- **P/E Ratio**: Should be between 0-40 (reasonable valuation)
- **Price Position**: Above 110% of 52-week low
- **Quality Score**: Composite metric of above factors

### 3. Rebalancing Process
```
1. Fetch Latest Data → 2. Filter Quality Stocks → 3. Score & Rank
→ 4. Select Top 10 → 5. Compare with Current → 6. Identify Changes
→ 7. Update Basket → 8. Save History → 9. Send Emails
```

### 4. Email Notifications
Sent on every rebalance containing:
- Added stocks with reasoning
- Removed stocks with sale prices
- Partially removed stocks
- Summary with key metrics

## Data Models

### Basket Schema
```javascript
{
  name: String (unique),
  description: String,
  category: String (Market Cap Based | Thematic),
  theme: String,
  stocks: [{
    ticker: String,
    symbol: String,
    quantity: Number,
    buyPrice: Number,
    currentPrice: Number,
    weight: Number (10% each),
    reason: String,
    status: String (active | removed | partial),
    high52Week: Number,
    low52Week: Number,
    // ... more fields
  }],
  subscribers: [String], // Email addresses
  lastRebalanceDate: Date,
  nextRebalanceDate: Date,
  benchmark: {
    name: String,
    value: Number,
    performance: Number
  }
}
```

### User Schema
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  subscribedBaskets: [{
    basketId: ObjectId,
    subscribedDate: Date,
    notificationEmail: Boolean
  }],
  portfolio: {
    brokerName: String,
    connected: Boolean
  },
  investmentAmount: Number,
  holdings: [{
    basketId: ObjectId,
    stocks: [{
      ticker: String,
      quantity: Number,
      buyPrice: Number
    }]
  }]
}
```

## API Endpoints

### Baskets
```
GET    /api/baskets                    # Get all baskets
GET    /api/baskets/:id                # Get basket by ID
POST   /api/baskets/:id/subscribe      # Subscribe to basket
POST   /api/baskets/:id/unsubscribe    # Unsubscribe from basket
POST   /api/baskets/:id/rebalance      # Manual rebalance
GET    /api/baskets/:id/rebalance-summary  # Rebalance history
GET    /api/baskets/:id/stocks         # Get stocks with live data
```

## Key Services

### 1. Stock Data Service (`services/stockDataService.js`)
**Purpose**: Fetch and manage live stock data

**Key Functions**:
- `getStockData(ticker)`: Get live data for single stock
- `getMultipleStocksData(tickers)`: Batch fetch multiple stocks
- `calculateStockScore(stockData)`: Calculate quality score
- `getStocksByCategory(category)`: Get stocks by category

**Data Source**: Yahoo Finance API (free, no authentication)

**Example**:
```javascript
const data = await getStockData('RELIANCE.NS');
// Returns: {
//   ticker: 'RELIANCE.NS',
//   currentPrice: 2850,
//   high52Week: 3300,
//   low52Week: 2200,
//   marketCap: 15500000000000,
//   lastUpdated: Date
// }
```

### 2. Rebalancing Service (`services/rebalanceService.js`)
**Purpose**: Handle basket rebalancing logic

**Key Functions**:
- `rebalanceBasket(basketId, manualTrigger)`: Main rebalancing function
- `selectTopStocks(category)`: Select best 10 stocks
- `isQualityStock(stockData)`: Filter by quality criteria
- `getRebalanceSummary(basketId)`: Get recent changes

**Rebalancing Logic**:
1. Get all stocks in category
2. Fetch live data for all
3. Apply quality filters (market cap, P/E, price > support)
4. Calculate score for each
5. Sort by score and select top 10
6. Compare with current basket
7. Generate changes report
8. Update database
9. Send notifications

**Example**:
```javascript
const result = await rebalanceBasket('basket-id', true);
// Returns: {
//   success: true,
//   basket: {...},
//   changes: {
//     added: [...],
//     removed: [...],
//     partialRemoved: [...]
//   },
//   emailsSent: 5
// }
```

### 3. Email Service (`services/emailService.js`)
**Purpose**: Send email notifications

**Key Functions**:
- `sendRebalanceNotification(email, basket, changes)`: Send rebalance alert
- `sendSubscriptionConfirmation(email, basketName)`: Confirm subscription
- `testEmailConnection()`: Verify email setup

**Email Types**:
1. **Rebalance Notification**: Detailed changes with stock info
2. **Subscription Confirmation**: Welcome email
3. **Alert Emails**: For important events (future)

## Extending the System

### Add New Basket Type

1. **Add to Database**:
```javascript
// In backend/scripts/initializeData.js
{
  name: 'My New Basket',
  description: 'Description here',
  theme: 'Custom Theme',
  category: 'Thematic',
  // ... rest of basket config
}
```

2. **Add Stocks to Category**:
```javascript
// In services/stockDataService.js
const INDIAN_STOCKS = {
  // ... existing
  myCategory: ['TICKER1.NS', 'TICKER2.NS', ...]
}
```

3. **Update Selection Logic** (if needed):
```javascript
// In services/rebalanceService.js
if (basket.name.includes('My New')) {
  category = 'myCategory';
}
```

### Add Broker Integration

1. **Create Broker Service**:
```javascript
// services/brokerService.js
const executeTrade = async (brokerId, action, quantity, price) => {
  // Implement broker API call
}
```

2. **Update Portfolio Rebalancing**:
```javascript
// Modify rebalanceService.js
if (user.portfolio.connected) {
  await executeTrade(user.portfolio.brokerId, 'BUY', quantity, price);
}
```

### Add Advanced Analytics

1. **Create Analytics Service**:
```javascript
// services/analyticsService.js
const calculateMetrics = (basket) => {
  return {
    sharpeRatio: calculate(),
    maxDrawdown: calculate(),
    volatility: calculate()
  }
}
```

2. **Add Analytics Endpoint**:
```javascript
router.get('/:id/analytics', async (req, res) => {
  const metrics = await calculateMetrics(req.params.id);
  res.json(metrics);
});
```

### Add ML-Based Stock Scoring

1. **Create ML Service**:
```javascript
// services/mlService.js
const predictStockScore = async (stockData) => {
  // Use ML model to predict score
  return mlModel.predict(stockData);
}
```

2. **Integrate into Selection**:
```javascript
// Modify selectTopStocks()
for (const stock of qualityStocks) {
  stock.score = await predictStockScore(stock);
}
```

### Add Mobile App

1. **Use React Native**:
```bash
npx react-native init StockBasketApp
```

2. **Reuse Backend API**:
- Same API endpoints
- Add mobile-specific endpoints if needed

3. **Mobile-Specific Features**:
- Push notifications
- Offline mode
- Quick actions

## Testing

### Unit Tests
```javascript
// tests/services/rebalanceService.test.js
describe('rebalanceService', () => {
  it('should select top 10 stocks', async () => {
    const result = await selectTopStocks('largeCap');
    expect(result).toHaveLength(10);
  });
});
```

### Integration Tests
```javascript
// tests/api/baskets.test.js
describe('Basket API', () => {
  it('should rebalance basket', async () => {
    const response = await request(app)
      .post('/api/baskets/:id/rebalance')
      .expect(200);
    expect(response.body.success).toBe(true);
  });
});
```

### Run Tests
```bash
cd backend
npm test
```

## Performance Optimization

### 1. Database Optimization
```javascript
// Create indexes
basket.collection.createIndex({ subscribers: 1 });
stock.collection.createIndex({ ticker: 1, createdDate: -1 });
```

### 2. API Caching
```javascript
// Cache stock data for 1 hour
const redis = require('redis');
const cache = redis.createClient();

const getCachedStocks = async (category) => {
  const cached = await cache.get(`stocks:${category}`);
  if (cached) return JSON.parse(cached);
  // ... fetch fresh data
};
```

### 3. Batch Operations
```javascript
// Instead of multiple API calls
const getAllStocks = async (tickers) => {
  return await StockData.find({ ticker: { $in: tickers } });
};
```

### 4. Pagination
```javascript
// For large result sets
GET /api/baskets?page=1&limit=10
```

## Security Best Practices

1. **Authentication**
```javascript
// Add JWT authentication
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  // Verify token
};
```

2. **Input Validation**
```javascript
// Validate all inputs
const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
```

3. **Rate Limiting**
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100 // 100 requests per 15 minutes
});
app.use('/api/', limiter);
```

4. **CORS Configuration**
```javascript
const cors = require('cors');
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

## Debugging Tips

### Backend Debugging
```bash
# Enable verbose logging
DEBUG=* npm run dev

# Use Node debugger
node --inspect server.js
# Visit chrome://inspect in Chrome
```

### Frontend Debugging
```bash
# React DevTools
# Redux DevTools (if using Redux)
# Network tab in browser
# Console for errors
```

### Database Debugging
```bash
# MongoDB shell
mongosh
use indian-stock-basket
db.baskets.find()
db.baskets.updateOne({}, { $set: { ... } })
```

## Common Issues & Solutions

### Stock Data Not Updating
- Check internet connectivity
- Verify Yahoo Finance API availability
- Check API rate limits
- Add error handling and retries

### Rebalancing Not Triggered
- Verify cron job is running
- Check server logs for errors
- Verify MongoDB connection
- Test manually via API

### Emails Not Sending
- Verify Gmail credentials
- Check email configuration in .env
- Test email service separately
- Check spam folder

### Performance Issues
- Add database indexes
- Implement caching
- Optimize queries
- Use load balancing

## Contributing Guidelines

1. Create feature branch:
```bash
git checkout -b feature/feature-name
```

2. Make changes and test:
```bash
npm test
npm run lint
```

3. Commit with clear message:
```bash
git commit -m "Add new feature description"
```

4. Push and create pull request:
```bash
git push origin feature/feature-name
```

## Resources

- [Express.js Docs](https://expressjs.com/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [React Docs](https://react.dev/)
- [Axios Docs](https://axios-http.com/)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

## Support

For technical questions or issues:
1. Check existing documentation
2. Review code comments
3. Check error logs
4. Create GitHub issue with details

---

Happy coding! 🚀
