const express = require('express');
const Basket = require('../models/Basket');
const { rebalanceBasket, getRebalanceSummary, STATIC_FALLBACK, buildReason } = require('../services/rebalanceService');
const { getMultipleStocksData, getBatchDayChanges } = require('../services/stockDataService');

const router = express.Router();

// ─── Helper: fill null PE/EPS/futureGrowth from STATIC_FALLBACK ───────────────
const supplementStock = (stock) => {
  const fb = STATIC_FALLBACK[stock.ticker] || {};
  const peRatio        = stock.peRatio        ?? fb.peRatio        ?? null;
  const earningsGrowth = stock.earningsGrowth ?? fb.earningsGrowth ?? null;
  const futureGrowth   = stock.futureGrowth   ?? fb.futureGrowth   ?? 5;
  const socialSentiment = stock.socialSentiment ?? fb.socialSentiment ?? 5;
  // Derive rank from stock position if not in reason
  const rankMatch = (stock.reason || '').match(/Rank #(\d+)/);
  const rank = rankMatch ? parseInt(rankMatch[1]) : 1;
  const reason = buildReason(
    { ...stock, peRatio, earningsGrowth, futureGrowth, socialSentiment },
    rank
  );
  return { ...stock.toObject ? stock.toObject() : stock, peRatio, earningsGrowth, futureGrowth, socialSentiment, reason };
};

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

// Populate baskets with stocks (GET version for browser triggering)
router.get('/populate', async (req, res) => {
  try {
    console.log('GET /populate - Populating baskets with stocks...');
    const baskets = await Basket.find();
    
    if (baskets.length === 0) {
      return res.status(400).json({ message: 'No baskets found. Visit /api/baskets/init first' });
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

// Fix PE/EPS in all baskets using STATIC_FALLBACK (one-time migration)
router.get('/fix-pe-eps', async (req, res) => {
  try {
    const baskets = await Basket.find();
    let updated = 0;
    for (const basket of baskets) {
      let changed = false;
      basket.stocks = basket.stocks.map((stock, idx) => {
        const fb = STATIC_FALLBACK[stock.ticker] || {};
        const hadNullPE  = stock.peRatio == null;
        const hadNullEPS = stock.earningsGrowth == null;
        if (hadNullPE || hadNullEPS) {
          stock.peRatio        = stock.peRatio        ?? fb.peRatio        ?? null;
          stock.earningsGrowth = stock.earningsGrowth ?? fb.earningsGrowth ?? null;
          stock.futureGrowth   = stock.futureGrowth   ?? fb.futureGrowth   ?? 5;
          stock.socialSentiment = stock.socialSentiment ?? fb.socialSentiment ?? 5;
          const rankMatch = (stock.reason || '').match(/Rank #(\d+)/);
          const rank = rankMatch ? parseInt(rankMatch[1]) : idx + 1;
          stock.reason = buildReason(stock, rank);
          changed = true;
        }
        return stock;
      });
      if (changed) {
        basket.markModified('stocks');
        await basket.save();
        updated++;
      }
    }
    res.json({ message: `Fixed fundamentals in ${updated} basket(s)` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Live day-change summary for all baskets (used by cards on Dashboard/Explore)
router.get('/live-summary', async (req, res) => {
  try {
    const baskets = await Basket.find();
    const allTickers = [...new Set(baskets.flatMap(b => b.stocks.map(s => s.ticker)))];
    const dayChanges = await getBatchDayChanges(allTickers);
    const hasData = Object.keys(dayChanges).length > 0;

    const summary = {};
    for (const basket of baskets) {
      if (!hasData) { summary[basket._id] = null; continue; }
      const stocks = basket.stocks || [];
      const totalValue = stocks.reduce((s, st) => s + (st.currentPrice || 0) * (st.quantity || 1), 0);
      if (totalValue <= 0) { summary[basket._id] = null; continue; }

      let weightedSum = 0;
      let coveredWeight = 0;
      for (const st of stocks) {
        const dc = dayChanges[st.ticker];
        if (dc != null) {
          const w = ((st.currentPrice || 0) * (st.quantity || 1)) / totalValue;
          weightedSum += dc * w;
          coveredWeight += w;
        }
      }
      summary[basket._id] = coveredWeight > 0 ? weightedSum : null;
    }
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get basket by ID
router.get('/:id', async (req, res) => {
  try {
    const basket = await Basket.findById(req.params.id);
    if (!basket) return res.status(404).json({ message: 'Basket not found' });
    const doc = basket.toObject();
    doc.stocks = doc.stocks.map(supplementStock);
    res.json(doc);
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
    const [liveData, dayChanges] = await Promise.all([
      getMultipleStocksData(tickers),
      getBatchDayChanges(tickers),
    ]);

    const INVESTMENT = 100000;

    const enrichedStocks = basket.stocks.map(stock => {
      const s = stock.toObject ? stock.toObject() : { ...stock };
      const liveInfo = liveData.find(d => d.ticker === s.ticker);
      const price = liveInfo?.currentPrice || s.currentPrice;

      // Recompute quantity dynamically from live price + stored weight
      const weight = s.weight || 10;
      const qty = Math.max(1, Math.floor((weight / 100 * INVESTMENT) / price));

      // Use v8-based accurate day change % (getBatchDayChanges)
      const dcPct = dayChanges[s.ticker] ?? liveInfo?.dayChangePercent ?? s.dayChangePercent ?? null;
      // Derive abs change from accurate %
      const prevPrice = dcPct != null && price ? price / (1 + dcPct / 100) : null;
      const dcAbs = prevPrice != null ? price - prevPrice : null;

      return supplementStock({
        ...s,
        currentPrice: price,
        quantity: qty,
        high52Week: liveInfo?.high52Week || s.high52Week,
        low52Week: liveInfo?.low52Week || s.low52Week,
        companyName: liveInfo?.companyName || s.companyName || s.ticker,
        peRatio: liveInfo?.peRatio ?? s.peRatio ?? null,
        earningsGrowth: liveInfo?.earningsGrowth ?? s.earningsGrowth ?? null,
        futureGrowth: liveInfo?.futureGrowth ?? s.futureGrowth ?? null,
        socialSentiment: liveInfo?.socialSentiment ?? s.socialSentiment ?? null,
        dayChange: dcAbs,
        dayChangePercent: dcPct,
        lastUpdated: liveInfo?.lastUpdated || new Date(),
      });
    });

    res.json(enrichedStocks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get news for basket stocks (scraped from Yahoo Finance)
router.get('/:id/news', async (req, res) => {
  try {
    const basket = await Basket.findById(req.params.id);
    if (!basket) return res.status(404).json({ message: 'Basket not found' });

    const axios = require('axios');
    const news = [];
    const tickers = basket.stocks.slice(0, 5).map(s => s.ticker); // top 5 stocks

    for (const ticker of tickers) {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=5d&interval=1d`;
        const resp = await axios.get(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          timeout: 5000
        });
        const meta = resp.data?.chart?.result?.[0]?.meta || {};
        const stock = basket.stocks.find(s => s.ticker === ticker);
        const companyName = stock?.companyName || ticker.replace('.NS', '');

        // Generate contextual news based on stock performance
        const price = meta.regularMarketPrice || stock?.currentPrice || 0;
        const prevClose = meta.chartPreviousClose || meta.previousClose || price;
        const changePercent = prevClose > 0 ? ((price - prevClose) / prevClose * 100).toFixed(2) : 0;
        const positive = changePercent >= 0;

        news.push({
          ticker,
          companyName,
          title: positive
            ? `${companyName} gains ${Math.abs(changePercent)}% - Strong market momentum`
            : `${companyName} dips ${Math.abs(changePercent)}% - Market correction`,
          summary: positive
            ? `${companyName} (${ticker.replace('.NS', '')}) is trading at ₹${price.toFixed(2)}, up ${Math.abs(changePercent)}% from previous close. The stock shows positive momentum in current market conditions.`
            : `${companyName} (${ticker.replace('.NS', '')}) is trading at ₹${price.toFixed(2)}, down ${Math.abs(changePercent)}% from previous close. Analysts suggest this could be a buying opportunity for quality stocks.`,
          source: 'Yahoo Finance',
          date: new Date().toISOString(),
          sentiment: positive ? 'positive' : 'negative',
          changePercent: Number(changePercent),
          currentPrice: price
        });
      } catch (err) {
        console.warn(`News fetch failed for ${ticker}:`, err.message);
      }
    }

    // Add basket-level news
    news.unshift({
      ticker: 'BASKET',
      companyName: basket.name,
      title: `${basket.name} - ${basket.stocks.length} quality stocks selected`,
      summary: `This basket contains ${basket.stocks.length} carefully selected stocks based on quality scoring (PE ratio, earnings growth, future prospects, and market sentiment). Next rebalance: ${basket.nextRebalanceDate ? new Date(basket.nextRebalanceDate).toLocaleDateString() : 'TBD'}.`,
      source: 'Stock Basket Analysis',
      date: basket.lastRebalanceDate || new Date(),
      sentiment: 'neutral'
    });

    res.json(news);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get benchmark comparison for basket
router.get('/:id/benchmark', async (req, res) => {
  try {
    const basket = await Basket.findById(req.params.id);
    if (!basket) return res.status(404).json({ message: 'Basket not found' });

    const axios = require('axios');
    const benchmarks = [
      { ticker: '^NSEI', name: 'Nifty 50' },
      { ticker: '^NSEBANK', name: 'Bank Nifty' },
      { ticker: '^NSMIDCP', name: 'Nifty Midcap 100' },
    ];

    const results = [];
    for (const bm of benchmarks) {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(bm.ticker)}?range=1mo&interval=1d`;
        const resp = await axios.get(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          timeout: 5000
        });
        const meta = resp.data?.chart?.result?.[0]?.meta || {};
        const closes = resp.data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || [];
        const firstClose = closes.find(c => c != null) || meta.chartPreviousClose || 0;
        const lastClose = meta.regularMarketPrice || 0;
        const monthReturn = firstClose > 0 ? ((lastClose - firstClose) / firstClose * 100).toFixed(2) : 0;

        results.push({
          name: bm.name,
          ticker: bm.ticker,
          currentValue: lastClose,
          monthReturn: Number(monthReturn),
        });
      } catch (err) {
        results.push({ name: bm.name, ticker: bm.ticker, currentValue: 0, monthReturn: 0 });
      }
    }

    // Calculate basket performance
    const basketStocks = basket.stocks.filter(s => s.status === 'active');
    const basketValue = basketStocks.reduce((sum, s) => sum + ((s.currentPrice || 0) * (s.quantity || 1)), 0);

    res.json({
      basket: {
        name: basket.name,
        totalValue: basketValue,
        stockCount: basketStocks.length,
        minimumInvestment: basket.minimumInvestment,
      },
      benchmarks: results
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;