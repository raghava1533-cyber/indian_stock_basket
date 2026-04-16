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
