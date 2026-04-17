require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const connectDB = require('./config/database');
const basketRoutes = require('./routes/baskets');
const authRoutes = require('./routes/auth');
const { rebalanceBasket } = require('./services/rebalanceService');
const { testEmailConnection } = require('./services/emailService');
const { getEnrichedUniverseData } = require('./services/stockDataService');
const axios = require('axios');
const Basket = require('./models/Basket');

// ── Dedicated index fetcher (v8 chart — accurate prevClose) ───────────────
const YF_HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };

const fetchIndexQuote = async (ticker) => {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`;
  const resp = await axios.get(url, {
    params: { interval: '1d', range: '5d' },
    headers: YF_HEADERS,
    timeout: 12000,
  });
  const result = resp.data?.chart?.result?.[0];
  if (!result) throw new Error(`No result for ${ticker}`);
  const meta   = result.meta || {};
  // Read actual daily closes from chart data — more reliable than meta.chartPreviousClose
  const closes = (result.indicators?.quote?.[0]?.close || []).filter(c => c != null);
  const price  = meta.regularMarketPrice ?? (closes.length ? closes[closes.length - 1] : 0);
  // Previous close = second-to-last actual recorded close
  const prev   = closes.length >= 2
    ? closes[closes.length - 2]
    : (meta.chartPreviousClose ?? meta.previousClose ?? null);
  const change    = prev ? price - prev : null;
  const changePct = prev && prev > 0 ? ((price - prev) / prev) * 100 : null;
  return { price, dayChange: change, dayChangePercent: changePct };
};

const app = express();
const PORT = process.env.PORT || 5000;

// Request logging middleware - log ALL requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes (will be started after DB connection)
app.use('/api/baskets', basketRoutes);
app.use('/api/auth', authRoutes);

// Root endpoint - API documentation
app.get('/', (req, res) => {
  res.json({
    message: 'Indian Stock Basket API',
    version: '1.0.0',
    status: 'Active',
    endpoints: {
      health: '/health',
      baskets: {
        getAll: 'GET /api/baskets',
        getById: 'GET /api/baskets/:id',
        subscribe: 'POST /api/baskets/:id/subscribe',
        unsubscribe: 'POST /api/baskets/:id/unsubscribe',
        rebalance: 'POST /api/baskets/:id/rebalance',
        rebalanceSummary: 'GET /api/baskets/:id/rebalance-summary',
        getStocks: 'GET /api/baskets/stocks?category=value'
      },
      documentation: 'https://github.com/raghava1533-cyber/indian_stock_basket',
      frontend: process.env.FRONTEND_URL || 'https://indian-stock-basket.vercel.app'
    },
    timestamp: new Date()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// ── Live Market Indices (Nifty 50, Bank Nifty) ─────────────────────────────
let _indicesCache = null;
let _indicesCacheTime = 0;
const INDICES_CACHE_TTL = 60 * 1000; // 1 minute

app.get('/api/market/indices', async (req, res) => {
  try {
    const now = Date.now();
    if (_indicesCache && now - _indicesCacheTime < INDICES_CACHE_TTL) {
      return res.json(_indicesCache);
    }
    const [nifty, bank] = await Promise.all([
      fetchIndexQuote('^NSEI'),
      fetchIndexQuote('^NSEBANK'),
    ]);
    const payload = {
      nifty50:   { name: 'NIFTY 50',   ...nifty },
      bankNifty: { name: 'BANK NIFTY', ...bank },
      updatedAt: new Date(),
    };
    _indicesCache = payload;
    _indicesCacheTime = now;
    res.json(payload);
  } catch (err) {
    console.error('[indices]', err.message);
    res.status(500).json({ message: 'Could not fetch indices' });
  }
});

// API Health check (separate endpoint for frontend monitoring)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'API is running', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Initialize baskets on startup (if they don't exist)
const initializeBaskets = async () => {
  try {
    const basketCount = await Basket.countDocuments();
    if (basketCount === 0) {
      const baskets = [
        {
          name: 'Bluechip Giants',
          description: 'Top 10 large-cap companies with strong market presence',
          category: 'Market Cap Based',
          theme: 'Large Cap',
          stocks: [],
          subscribers: [],
          nextRebalanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          name: 'Midcap Momentum',
          description: 'Promising mid-cap companies with growth potential',
          category: 'Market Cap Based',
          theme: 'Mid Cap',
          stocks: [],
          subscribers: [],
          nextRebalanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          name: 'Smallcap Leaders',
          description: 'Quality small-cap companies with high growth prospects',
          category: 'Market Cap Based',
          theme: 'Small Cap',
          stocks: [],
          subscribers: [],
          nextRebalanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          name: 'Tech Innovators',
          description: 'Best tech and IT companies driving digital transformation',
          category: 'Thematic',
          theme: 'Technology',
          stocks: [],
          subscribers: [],
          nextRebalanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          name: 'Finance Leaders',
          description: 'Top financial institutions with strong ROE',
          category: 'Thematic',
          theme: 'Finance',
          stocks: [],
          subscribers: [],
          nextRebalanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          name: 'Healthcare Growth',
          description: 'Healthcare and pharma companies with strong growth',
          category: 'Thematic',
          theme: 'Healthcare',
          stocks: [],
          subscribers: [],
          nextRebalanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          name: 'Renewable Energy',
          description: 'Green energy companies leading the clean energy transition',
          category: 'Thematic',
          theme: 'Renewable',
          stocks: [],
          subscribers: [],
          nextRebalanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          name: 'Consumer Brands',
          description: 'Top FMCG and consumer brands with strong market share',
          category: 'Thematic',
          theme: 'Consumer',
          stocks: [],
          subscribers: [],
          nextRebalanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        {
          name: 'Infrastructure Surge',
          description: 'Infrastructure companies benefiting from India growth story',
          category: 'Thematic',
          theme: 'Infrastructure',
          stocks: [],
          subscribers: [],
          nextRebalanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      ];

      const createdBaskets = await Basket.insertMany(baskets);
      console.log(`Baskets initialized (${createdBaskets.length}), populating stocks...`);
      for (const basket of createdBaskets) {
        try {
          await rebalanceBasket(basket._id.toString(), false);
          console.log(`Stocked basket: ${basket.name}`);
        } catch (err) {
          console.error(`Failed to rebalance ${basket.name}:`, err.message);
        }
      }
      console.log('All baskets initialized and stocked');
    }
  } catch (error) {
    console.error('Error initializing baskets:', error);
  }
};

// Populate baskets with stocks (only if stocks array is empty)
const populateBaskets = async () => {
  try {
    const baskets = await Basket.find();
    const needsPopulation = baskets.filter(b => b.stocks.length === 0);
    
    if (needsPopulation.length === 0) {
      console.log('All baskets already populated with stocks');
      return;
    }

    console.log(`Populating ${needsPopulation.length} baskets with stocks...`);
    for (const basket of needsPopulation) {
      try {
        await rebalanceBasket(basket._id, false);
        console.log(`✓ Populated: ${basket.name}`);
      } catch (error) {
        console.error(`Error populating ${basket.name}:`, error.message);
      }
    }
    console.log('Basket population completed');
  } catch (error) {
    console.error('Error in populateBaskets:', error);
  }
};

// Scheduler for automatic rebalancing (every 30 days at 9:30 AM)
const scheduleRebalancing = () => {
  // Run every day at 9:30 AM IST to check if rebalancing is needed
  cron.schedule('30 9 * * *', async () => {
    console.log('Running scheduled rebalance check...');
    try {
      const baskets = await Basket.find();
      for (const basket of baskets) {
        if (new Date() >= basket.nextRebalanceDate) {
          console.log(`Rebalancing basket: ${basket.name}`);
          await rebalanceBasket(basket._id, false);
        }
      }
    } catch (error) {
      console.error('Error in scheduled rebalance:', error);
    }
  });

  console.log('Rebalance scheduler initialized (9:30 AM daily check)');
};

// Migrate: replace stocks that have no reliable data source with working alternatives
const migrateReplaceUnfetchableStocks = async () => {
  const REPLACEMENTS = [
    {
      oldTicker: 'CENTURYTEX.NS',
      newTicker: 'TATACONSUM.NS',
      newCompanyName: 'Tata Consumer Products',
      newPrice: 1113,
    },
    {
      oldTicker: 'WEBSOL.NS',
      newTicker: 'IREDA.NS',
      newCompanyName: 'Indian Renewable Energy Development Agency',
      newPrice: 133,
    },
    {
      oldTicker: 'ORIENTGREEN.NS',
      newTicker: 'RPOWER.NS',
      newCompanyName: 'Reliance Power',
      newPrice: 29,
    },
    {
      oldTicker: 'KALPATPOWR.NS',
      newTicker: 'KPIL.NS',
      newCompanyName: 'Kalpataru Projects International',
      newPrice: 1232,
    },
  ];

  for (const rep of REPLACEMENTS) {
    try {
      const baskets = await Basket.find({ 'stocks.ticker': rep.oldTicker });
      for (const basket of baskets) {
        let modified = false;
        for (const stock of basket.stocks) {
          if (stock.ticker === rep.oldTicker) {
            const investValue = (stock.buyPrice || rep.newPrice) * (stock.quantity || 1);
            const newQty = Math.max(1, Math.floor(investValue / rep.newPrice));
            stock.ticker      = rep.newTicker;
            stock.companyName = rep.newCompanyName;
            stock.buyPrice    = rep.newPrice;
            stock.currentPrice = rep.newPrice;
            stock.quantity    = newQty;
            stock.addedDate   = new Date();
            modified = true;
          }
        }
        if (modified) {
          basket.markModified('stocks');
          await basket.save();
          console.log(`[migration] Replaced ${rep.oldTicker} → ${rep.newTicker} in basket: ${basket.name}`);
        }
      }
      if (!baskets.length) console.log(`[migration] ${rep.oldTicker} not found in any basket — skipping`);
    } catch (err) {
      console.warn(`[migration] Failed replacing ${rep.oldTicker}:`, err.message);
    }
  }
};

// Start server
const startServer = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('MongoDB connection established');

    console.log('Initializing baskets...');
    await initializeBaskets();

    console.log('Running stock replacement migration...');
    await migrateReplaceUnfetchableStocks();
    
    console.log('Populating baskets with stocks...');
    await populateBaskets();
    
    console.log('Setting up rebalance scheduler...');
    scheduleRebalancing();
    
    console.log('Testing email connection...');
    await testEmailConnection();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

// 404 Handler - log all unmatched requests
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    message: 'Route not found',
    method: req.method,
    path: req.originalUrl,
    availableEndpoints: {
      GET: ['/api/baskets', '/api/baskets/:id', '/api/baskets/:id/rebalance-summary', '/api/baskets/:id/stocks', '/api/health', '/health', '/'],
      POST: ['/api/baskets', '/api/baskets/init', '/api/baskets/:id/subscribe', '/api/baskets/:id/unsubscribe', '/api/baskets/:id/rebalance']
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message });
});

module.exports = app;
