const express = require('express');
const Basket = require('../models/Basket');
const { rebalanceBasket, getRebalanceSummary } = require('../services/rebalanceService');
const { getMultipleStocksData } = require('../services/stockDataService');

const router = express.Router();

// Get all baskets
router.get('/', async (req, res) => {
  try {
    const baskets = await Basket.find();
    res.json(baskets);
  } catch (error) {
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

// Initialize default baskets with auto-rebalance (must come before /:id routes)
router.get('/init', async (req, res) => {
  try {
    const basketDefs = [
      { name: 'Bluechip Giants', description: 'Top 10 large-cap companies with strong market presence', category: 'Market Cap Based', theme: 'Large Cap' },
      { name: 'Midcap Momentum', description: 'Promising mid-cap companies with growth potential', category: 'Market Cap Based', theme: 'Mid Cap' },
      { name: 'Smallcap Leaders', description: 'Quality small-cap companies with high growth prospects', category: 'Market Cap Based', theme: 'Small Cap' },
      { name: 'Tech Innovators', description: 'Best tech and IT companies driving digital transformation', category: 'Thematic', theme: 'Technology' },
      { name: 'Finance Leaders', description: 'Top financial institutions with strong ROE', category: 'Thematic', theme: 'Finance' },
      { name: 'Healthcare Growth', description: 'Healthcare and pharma companies with strong growth', category: 'Thematic', theme: 'Healthcare' },
      { name: 'Renewable Energy', description: 'Green energy companies leading the clean energy transition', category: 'Thematic', theme: 'Renewable' },
      { name: 'Consumer Brands', description: 'Top FMCG and consumer brands with strong market share', category: 'Thematic', theme: 'Consumer' },
      { name: 'Infrastructure Surge', description: 'Infrastructure companies benefiting from India growth story', category: 'Thematic', theme: 'Infrastructure' },
    ].map(b => ({
      ...b,
      stocks: [],
      subscribers: [],
      nextRebalanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }));

    await Basket.deleteMany({});
    const createdBaskets = await Basket.insertMany(basketDefs);
    console.log(`Created ${createdBaskets.length} baskets, starting rebalance...`);

    const rebalanceResults = [];
    for (const basket of createdBaskets) {
      try {
        console.log(`Rebalancing: ${basket.name}`);
        await rebalanceBasket(basket._id.toString(), false);
        rebalanceResults.push({ name: basket.name, success: true });
      } catch (err) {
        console.error(`Rebalance failed for ${basket.name}:`, err.message);
        rebalanceResults.push({ name: basket.name, success: false, error: err.message });
      }
    }

    const updatedBaskets = await Basket.find();
    res.json({
      message: 'Baskets initialized and populated with stocks successfully',
      count: updatedBaskets.length,
      rebalanceResults,
      baskets: updatedBaskets,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Populate baskets with stocks (admin endpoint)
router.post('/populate', async (req, res) => {
  try {
    console.log('Populating baskets with stocks...');
    const baskets = await Basket.find();
    
    if (baskets.length === 0) {
      return res.status(400).json({ message: 'No baskets found. Run /init first' });
    }

    const results = [];
    for (const basket of baskets) {
      try {
        console.log(`Rebalancing basket: ${basket.name}`);
        const result = await rebalanceBasket(basket._id, false);
        results.push({
          basketId: basket._id,
          basketName: basket.name,
          status: 'success',
          stocksAdded: result?.changes?.added?.length || 0
        });
      } catch (error) {
        console.error(`Error rebalancing ${basket.name}:`, error.message);
        results.push({
          basketId: basket._id,
          basketName: basket.name,
          status: 'error',
          error: error.message
        });
      }
    }

    res.json({
      message: 'Basket population completed',
      results
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

    if (!basket.stocks || basket.stocks.length === 0) {
      return res.json([]);
    }

    const tickers = basket.stocks.map(s => s.ticker);
    const liveData = await getMultipleStocksData(tickers);

    const enrichedStocks = basket.stocks.map(stock => {
      const s = stock.toObject ? stock.toObject() : { ...stock };
      const liveInfo = liveData.find(d => d.ticker === s.ticker);
      return {
        ...s,
        currentPrice: liveInfo?.currentPrice || s.currentPrice,
        high52Week: liveInfo?.high52Week || s.high52Week,
        low52Week: liveInfo?.low52Week || s.low52Week,
        companyName: liveInfo?.companyName || s.companyName || s.ticker,
        lastUpdated: liveInfo?.lastUpdated || new Date(),
      };
    });

    res.json(enrichedStocks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;