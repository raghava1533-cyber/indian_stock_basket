const express = require('express');
const Basket = require('../models/Basket');
const { rebalanceBasket, getRebalanceSummary } = require('../services/rebalanceService');
const { getMultipleStocksData } = require('../services/stockDataService');

const router = express.Router();

// Get all baskets
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/baskets called');
    const baskets = await Basket.find();
    console.log(`Found ${baskets.length} baskets`);
    res.json(baskets);
  } catch (error) {
    console.error('Error fetching baskets:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create basket
router.post('/', async (req, res) => {
  const basket = new Basket(req.body);
  try {
    const savedBasket = await basket.save();
    res.status(201).json(savedBasket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Initialize default baskets (admin endpoint - must come before /:id routes)
router.get('/init', async (req, res) => {
  try {
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
      }
    ];

    // Delete existing baskets and insert new ones
    await Basket.deleteMany({});
    const createdBaskets = await Basket.insertMany(baskets);
    
    res.json({
      message: 'Baskets initialized successfully',
      count: createdBaskets.length,
      baskets: createdBaskets
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get basket by ID
router.get('/:id', async (req, res) => {
  try {
    const basket = await Basket.findById(req.params.id);
    if (!basket) return res.status(404).json({ message: 'Basket not found' });
    res.json(basket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update basket
router.patch('/:id', async (req, res) => {
  try {
    const basket = await Basket.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(basket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Subscribe to basket
router.post('/:id/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    const basket = await Basket.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { subscribers: email } },
      { new: true }
    );
    res.json({ message: 'Subscribed successfully', basket });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Unsubscribe from basket
router.post('/:id/unsubscribe', async (req, res) => {
  try {
    const { email } = req.body;
    const basket = await Basket.findByIdAndUpdate(
      req.params.id,
      { $pull: { subscribers: email } },
      { new: true }
    );
    res.json({ message: 'Unsubscribed successfully', basket });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Rebalance basket (manual trigger)
router.post('/:id/rebalance', async (req, res) => {
  try {
    const result = await rebalanceBasket(req.params.id, true);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get rebalance summary
router.get('/:id/rebalance-summary', async (req, res) => {
  try {
    const summary = await getRebalanceSummary(req.params.id);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get basket stocks with live data
router.get('/:id/stocks', async (req, res) => {
  try {
    const basket = await Basket.findById(req.params.id);
    if (!basket) return res.status(404).json({ message: 'Basket not found' });

    const tickers = basket.stocks.map(s => s.ticker);
    const liveData = await getMultipleStocksData(tickers);

    const enrichedStocks = basket.stocks.map(stock => {
      const liveInfo = liveData.find(d => d.ticker === stock.ticker);
      return {
        ...stock,
        currentPrice: liveInfo?.currentPrice || stock.currentPrice,
        high52Week: liveInfo?.high52Week || stock.high52Week,
        low52Week: liveInfo?.low52Week || stock.low52Week,
        lastUpdated: liveInfo?.lastUpdated
      };
    });

    res.json(enrichedStocks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
