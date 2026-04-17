const express = require('express');
const jwt = require('jsonwebtoken');
const Basket = require('../models/Basket');
const { rebalanceBasket, getRebalanceSummary, STATIC_FALLBACK, buildReason, STOCK_UNIVERSE } = require('../services/rebalanceService');
const { getMultipleStocksData, getBatchDayChanges } = require('../services/stockDataService');
const emailService = require('../services/emailService');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme_secret';

// ─── Auth middleware (optional) ──────────────────────────────────────────────
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ message: 'Not authenticated' });
  try {
    req.user = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// ─── Helper: fill null PE/EPS/futureGrowth from STATIC_FALLBACK ───────────────
const supplementStock = (stock) => {
  const fb = STATIC_FALLBACK[stock.ticker] || {};
  const peRatio         = stock.peRatio         ?? fb.peRatio         ?? null;
  const earningsGrowth  = stock.earningsGrowth  ?? fb.earningsGrowth  ?? null;
  const futureGrowth    = stock.futureGrowth    ?? fb.futureGrowth    ?? 5;
  const socialSentiment = stock.socialSentiment ?? fb.socialSentiment ?? 5;
  // Derive rank from stock position if not in reason
  const rankMatch = (stock.reason || '').match(/Rank #(\d+)/);
  const rank = rankMatch ? parseInt(rankMatch[1]) : 1;
  const obj = stock.toObject ? stock.toObject() : stock;
  const reason = buildReason(
    { ...obj, peRatio, earningsGrowth, futureGrowth, socialSentiment },
    rank
  );
  return {
    ...obj,
    peRatio,
    earningsGrowth,
    futureGrowth,
    socialSentiment,
    newsSentiment:     stock.newsSentiment     ?? null,
    targetMeanPrice:   stock.targetMeanPrice   ?? null,
    targetHighPrice:   stock.targetHighPrice   ?? null,
    targetLowPrice:    stock.targetLowPrice    ?? null,
    recommendationKey: stock.recommendationKey ?? null,
    numberOfAnalysts:  stock.numberOfAnalysts  ?? null,
    analystBuy:        stock.analystBuy        ?? null,
    analystHold:       stock.analystHold       ?? null,
    analystSell:       stock.analystSell       ?? null,
    rsi:               stock.rsi               ?? null,
    sma20:             stock.sma20             ?? null,
    sma50:             stock.sma50             ?? null,
    sma200:            stock.sma200            ?? null,
    reason,
  };
};

// Get all baskets (optionally filter by ?country=IN or ?country=US)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.country && ['IN', 'US'].includes(req.query.country)) {
      filter.country = req.query.country;
    }
    const baskets = await Basket.find(filter);
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
    const indianBaskets = [
      { name: 'Bluechip Giants', description: 'Top 10 large-cap companies with strong market presence', category: 'Market Cap Based', theme: 'Large Cap', country: 'IN', categoryKey: 'largeCap' },
      { name: 'Midcap Momentum', description: 'Promising mid-cap companies with growth potential', category: 'Market Cap Based', theme: 'Mid Cap', country: 'IN', categoryKey: 'midCap' },
      { name: 'Smallcap Leaders', description: 'Quality small-cap companies with high growth prospects', category: 'Market Cap Based', theme: 'Small Cap', country: 'IN', categoryKey: 'smallCap' },
      { name: 'Tech Innovators', description: 'Best tech and IT companies driving digital transformation', category: 'Thematic', theme: 'Technology', country: 'IN', categoryKey: 'tech' },
      { name: 'Finance Leaders', description: 'Top financial institutions with strong ROE', category: 'Thematic', theme: 'Finance', country: 'IN', categoryKey: 'finance' },
      { name: 'Healthcare Growth', description: 'Healthcare and pharma companies with strong growth', category: 'Thematic', theme: 'Healthcare', country: 'IN', categoryKey: 'healthcare' },
      { name: 'Renewable Energy', description: 'Green energy companies leading the clean energy transition', category: 'Thematic', theme: 'Renewable', country: 'IN', categoryKey: 'renewable' },
      { name: 'Consumer Brands', description: 'Top FMCG and consumer brands with strong market share', category: 'Thematic', theme: 'Consumer', country: 'IN', categoryKey: 'consumer' },
      { name: 'Infrastructure Surge', description: 'Infrastructure companies benefiting from India growth story', category: 'Thematic', theme: 'Infrastructure', country: 'IN', categoryKey: 'infrastructure' },
    ];

    const usaBaskets = [
      { name: 'US Bluechip Giants', description: 'Top US large-cap companies dominating global markets', category: 'Market Cap Based', theme: 'Large Cap', country: 'US', categoryKey: 'usa_largeCap' },
      { name: 'US Midcap Momentum', description: 'High-growth US mid-cap tech and SaaS companies', category: 'Market Cap Based', theme: 'Mid Cap', country: 'US', categoryKey: 'usa_midCap' },
      { name: 'US Smallcap Leaders', description: 'Emerging US small-cap companies with disruptive potential', category: 'Market Cap Based', theme: 'Small Cap', country: 'US', categoryKey: 'usa_smallCap' },
      { name: 'US Tech Titans', description: 'Leading US technology and software companies', category: 'Thematic', theme: 'Technology', country: 'US', categoryKey: 'usa_tech' },
      { name: 'US Finance Leaders', description: 'Top US banks, fintech, and financial institutions', category: 'Thematic', theme: 'Finance', country: 'US', categoryKey: 'usa_finance' },
      { name: 'US Healthcare Growth', description: 'Top US pharma, biotech, and healthcare companies', category: 'Thematic', theme: 'Healthcare', country: 'US', categoryKey: 'usa_healthcare' },
      { name: 'US Renewable Energy', description: 'US clean energy and solar companies', category: 'Thematic', theme: 'Renewable', country: 'US', categoryKey: 'usa_renewable' },
      { name: 'US Consumer Brands', description: 'Top US consumer, retail, and FMCG companies', category: 'Thematic', theme: 'Consumer', country: 'US', categoryKey: 'usa_consumer' },
      { name: 'US Infrastructure', description: 'US industrial, defense, and infrastructure companies', category: 'Thematic', theme: 'Infrastructure', country: 'US', categoryKey: 'usa_infrastructure' },
    ];

    const basketDefs = [...indianBaskets, ...usaBaskets].map(b => ({
      ...b,
      stocks: [],
      subscribers: [],
      nextRebalanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }));

    await Basket.deleteMany({ isUserCreated: { $ne: true } });
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

// ─── Rebalance ALL baskets for the logged-in user ────────────────────────────
// Only rebalances baskets that are due (30+ days since last rebalance)
// Results are scoped to the user — other users' baskets are not touched
router.post('/rebalance-all', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    // Find baskets belonging to this user OR subscribed by this user
    const allBaskets = await Basket.find({
      $or: [
        { createdBy: userEmail },
        { subscribers: userEmail },
      ]
    });

    if (allBaskets.length === 0) {
      return res.json({ message: 'No baskets found for your account', results: [], rebalanced: 0, skipped: 0 });
    }

    const results = [];
    let rebalanced = 0;
    let skipped = 0;

    for (const basket of allBaskets) {
      const lastRebal = basket.lastRebalanceDate ? new Date(basket.lastRebalanceDate).getTime() : 0;
      const daysSince = Math.floor((now - lastRebal) / (24 * 60 * 60 * 1000));
      // User-created baskets: allow rebalance anytime; curated baskets: 30-day cooldown
      const isDue = basket.isUserCreated ? true : (now - lastRebal) >= THIRTY_DAYS;

      if (!isDue) {
        skipped++;
        results.push({
          basketId: basket._id,
          name: basket.name.replace(/ \(\d{13}\)$/, ''),
          status: 'skipped',
          daysSinceRebalance: daysSince,
          nextDueIn: 30 - daysSince,
          message: `Last rebalanced ${daysSince} day(s) ago — next due in ${30 - daysSince} day(s)`,
        });
        continue;
      }

      try {
        await rebalanceBasket(basket._id.toString(), true);
        rebalanced++;
        results.push({
          basketId: basket._id,
          name: basket.name.replace(/ \(\d{13}\)$/, ''),
          status: 'rebalanced',
          daysSinceRebalance: daysSince,
          message: 'Successfully rebalanced',
        });
      } catch (err) {
        results.push({
          basketId: basket._id,
          name: basket.name.replace(/ \(\d{13}\)$/, ''),
          status: 'failed',
          message: err.message,
        });
      }
    }

    res.json({
      message: `Rebalanced ${rebalanced} basket(s), skipped ${skipped} (not yet due)`,
      rebalanced,
      skipped,
      total: allBaskets.length,
      results,
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

// Subscribe to basket (auth required — uses logged-in user's email)
router.post('/:id/subscribe', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const basket = await Basket.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { subscribers: userEmail } },
      { new: true }
    );
    if (!basket) return res.status(404).json({ message: 'Basket not found' });

    // Send confirmation email
    try {
      await emailService.sendSubscriptionConfirmation(userEmail, basket.name.replace(/ \(\d{10,}\)$/, ''));
    } catch (emailErr) {
      console.warn('[subscribe] Confirmation email failed:', emailErr.message);
    }

    res.json({ message: `Subscribed! Confirmation sent to ${userEmail}`, basket });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Unsubscribe from basket (auth required)
router.post('/:id/unsubscribe', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const basket = await Basket.findByIdAndUpdate(
      req.params.id,
      { $pull: { subscribers: userEmail } },
      { new: true }
    );
    if (!basket) return res.status(404).json({ message: 'Basket not found' });
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
        newsSentiment: liveInfo?.newsSentiment ?? s.newsSentiment ?? null,
        targetMeanPrice: liveInfo?.targetMeanPrice ?? s.targetMeanPrice ?? null,
        targetHighPrice: liveInfo?.targetHighPrice ?? s.targetHighPrice ?? null,
        targetLowPrice: liveInfo?.targetLowPrice ?? s.targetLowPrice ?? null,
        recommendationKey: liveInfo?.recommendationKey ?? s.recommendationKey ?? null,
        numberOfAnalysts: liveInfo?.numberOfAnalysts ?? s.numberOfAnalysts ?? null,
        analystBuy: liveInfo?.analystBuy ?? s.analystBuy ?? null,
        analystHold: liveInfo?.analystHold ?? s.analystHold ?? null,
        analystSell: liveInfo?.analystSell ?? s.analystSell ?? null,
        rsi: liveInfo?.rsi ?? s.rsi ?? null,
        sma20: liveInfo?.sma20 ?? s.sma20 ?? null,
        sma50: liveInfo?.sma50 ?? s.sma50 ?? null,
        sma200: liveInfo?.sma200 ?? s.sma200 ?? null,
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

// ─── Create custom basket (authenticated) ─────────────────────────────────────
const SECTOR_LABELS = {
  tech: 'Technology', finance: 'Finance', healthcare: 'Healthcare',
  renewable: 'Renewable', consumer: 'Consumer', infrastructure: 'Infrastructure',
  auto: 'Automobile', metals: 'Metals & Mining', telecom: 'Telecom',
  psu: 'PSU', realty: 'Real Estate',
  chemicals: 'Chemicals', cement: 'Cement & Building', oilgas: 'Oil & Gas',
  fertilizer: 'Fertilizers & Agri', defence: 'Defence & Aerospace',
  media: 'Media & Entertainment', textile: 'Textiles & Apparel',
  undervalued: 'Undervalued Stocks',
  largeCap: 'Large Cap', midCap: 'Mid Cap', smallCap: 'Small Cap', microCap: 'Micro Cap',
  // USA sectors
  usa_tech: 'Technology', usa_finance: 'Finance', usa_healthcare: 'Healthcare',
  usa_renewable: 'Renewable', usa_consumer: 'Consumer', usa_infrastructure: 'Infrastructure',
  usa_auto: 'Automobile & EV', usa_metals: 'Metals & Mining', usa_telecom: 'Telecom',
  usa_psu: 'Utilities', usa_realty: 'Real Estate', usa_chemicals: 'Chemicals',
  usa_cement: 'Construction', usa_oilgas: 'Oil & Gas', usa_fertilizer: 'Agriculture',
  usa_defence: 'Defence & Aerospace', usa_media: 'Media & Entertainment',
  usa_textile: 'Fashion & Retail', usa_undervalued: 'Undervalued Stocks',
  usa_largeCap: 'Large Cap', usa_midCap: 'Mid Cap', usa_smallCap: 'Small Cap', usa_microCap: 'Micro Cap',
};
const MARKET_CAP_THRESHOLDS = { largeCap: 50000, midCap: 10000 };

router.post('/create-custom', authenticateToken, async (req, res) => {
  try {
    const { sector, marketCap, name, country } = req.body;
    const basketCountry = country === 'US' ? 'US' : 'IN';
    if (!sector || !marketCap)
      return res.status(400).json({ message: 'sector and marketCap are required' });

    // Determine base universe key (prefix with usa_ for US baskets)
    const prefix = basketCountry === 'US' ? 'usa_' : '';
    let universeKey;
    if (sector !== 'all') {
      universeKey = prefix + sector;
    } else if (marketCap !== 'all') {
      universeKey = prefix + marketCap;
    } else {
      universeKey = prefix + 'largeCap';
    }

    // Build universe, optionally filtered by market cap
    let universeDefs = (STOCK_UNIVERSE[universeKey] || STOCK_UNIVERSE.largeCap).slice();
    if (sector !== 'all' && marketCap !== 'all') {
      // Filter sector universe by market cap threshold
      const filtered = universeDefs.filter(def => {
        const mc = (require('../services/rebalanceService').STATIC_FALLBACK[def.ticker] || {}).marketCapCr || 0;
        if (marketCap === 'largeCap') return mc >= MARKET_CAP_THRESHOLDS.largeCap;
        if (marketCap === 'midCap')   return mc >= MARKET_CAP_THRESHOLDS.midCap && mc < MARKET_CAP_THRESHOLDS.largeCap;
        if (marketCap === 'smallCap') return mc < MARKET_CAP_THRESHOLDS.midCap;
        return true;
      });
      if (filtered.length >= 10) universeDefs = filtered;
    }

    // Generate name if not provided
    const sectorLabel = SECTOR_LABELS[sector] || 'Mixed';
    const capLabel    = SECTOR_LABELS[marketCap] || 'All Cap';
    const baseName = name || (
      sector !== 'all' && marketCap !== 'all' ? `${sectorLabel} ${capLabel} Basket`
      : sector !== 'all' ? `${sectorLabel} Growth Basket`
      : `${capLabel} Picks Basket`
    );
    // Append timestamp to avoid name collision
    const uniqueName = `${baseName} (${Date.now()})`;
    const themeLabel = sector !== 'all' ? sectorLabel : capLabel;

    const basket = new Basket({
      name:            uniqueName,
      description:     `Custom basket: ${sectorLabel} sector, ${capLabel}`,
      category:        'Custom',
      categoryKey:     universeKey,
      theme:           themeLabel,
      country:         basketCountry,
      isUserCreated:   true,
      createdBy:       req.user.email,
      stocks:          [],
      subscribers:     [],
      nextRebalanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await basket.save();

    // Rebalance to populate stocks
    await rebalanceBasket(basket._id.toString(), false);
    const populated = await Basket.findById(basket._id);
    res.status(201).json(populated);
  } catch (error) {
    console.error('[create-custom]', error);
    res.status(500).json({ message: error.message });
  }
});

// ─── Delete basket (authenticated, user-created only) ──────────────────────────
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const basket = await Basket.findById(req.params.id);
    if (!basket) return res.status(404).json({ message: 'Basket not found' });
    if (!basket.isUserCreated)
      return res.status(403).json({ message: 'System baskets cannot be deleted' });
    if (basket.createdBy !== req.user.email)
      return res.status(403).json({ message: 'Not authorized to delete this basket' });
    await Basket.findByIdAndDelete(req.params.id);
    res.json({ message: 'Basket deleted successfully' });
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
    const isUS = basket.country === 'US';
    const benchmarks = isUS ? [
      { ticker: '^GSPC',  name: 'S&P 500' },
      { ticker: '^IXIC',  name: 'NASDAQ Composite' },
      { ticker: '^DJI',   name: 'Dow Jones' },
      { ticker: '^RUT',   name: 'Russell 2000' },
      { ticker: '^NDX',   name: 'NASDAQ 100' },
    ] : [
      { ticker: '^NSEI', name: 'Nifty 50' },
      { ticker: '^NSEBANK', name: 'Bank Nifty' },
      { ticker: '^NSMIDCP', name: 'Nifty Midcap 100' },
      { ticker: '^CNXSMALLCAP', name: 'Nifty Smallcap 100' },
      { ticker: '^CNXIT', name: 'Nifty IT' },
    ];

    const results = [];
    for (const bm of benchmarks) {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(bm.ticker)}?range=1mo&interval=1d`;
        const resp = await axios.get(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          timeout: 5000
        });
        const result = resp.data?.chart?.result?.[0];
        const meta = result?.meta || {};
        const timestamps = result?.timestamp || [];
        const closes = result?.indicators?.quote?.[0]?.close || [];
        const firstClose = closes.find(c => c != null) || meta.chartPreviousClose || 0;
        const lastClose = meta.regularMarketPrice || 0;
        const monthReturn = firstClose > 0 ? ((lastClose - firstClose) / firstClose * 100).toFixed(2) : 0;

        // Build normalized time series (Day 0 = 100)
        const series = timestamps.map((ts, i) => {
          const c = closes[i];
          if (c == null || firstClose <= 0) return null;
          return {
            date: new Date(ts * 1000).toISOString().split('T')[0],
            value: Number(((c / firstClose) * 100).toFixed(2)),
          };
        }).filter(Boolean);

        results.push({
          name: bm.name,
          ticker: bm.ticker,
          currentValue: lastClose,
          monthReturn: Number(monthReturn),
          series,
        });
      } catch (err) {
        results.push({ name: bm.name, ticker: bm.ticker, currentValue: 0, monthReturn: 0, series: [] });
      }
    }

    // Calculate basket performance
    const basketStocks = basket.stocks.filter(s => s.status === 'active');
    const basketValue = basketStocks.reduce((sum, s) => sum + ((s.currentPrice || 0) * (s.quantity || 1)), 0);

    // Build basket normalized series by fetching each stock's 1-month chart
    let basketSeries = [];
    let basketMonthReturn = 0;
    try {
      const axios = require('axios');
      const stockCharts = [];
      for (const s of basketStocks.slice(0, 15)) {
        try {
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(s.ticker)}?range=1mo&interval=1d`;
          const resp = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 5000 });
          const result = resp.data?.chart?.result?.[0];
          const timestamps = result?.timestamp || [];
          const closes = result?.indicators?.quote?.[0]?.close || [];
          stockCharts.push({ ticker: s.ticker, weight: s.weight || (100 / basketStocks.length), timestamps, closes });
        } catch (_) {}
      }

      if (stockCharts.length > 0) {
        // Get all unique dates
        const allDates = new Map();
        stockCharts.forEach(sc => {
          sc.timestamps.forEach((ts, i) => {
            const dateStr = new Date(ts * 1000).toISOString().split('T')[0];
            if (!allDates.has(dateStr)) allDates.set(dateStr, []);
          });
        });
        const sortedDates = [...allDates.keys()].sort();

        // For each stock, compute normalized return at each date
        const totalWeight = stockCharts.reduce((s, sc) => s + sc.weight, 0);
        const dailyReturns = sortedDates.map(date => {
          let weightedReturn = 0;
          let usedWeight = 0;
          stockCharts.forEach(sc => {
            const firstClose = sc.closes.find(c => c != null);
            if (!firstClose) return;
            // Find the close for this date
            const idx = sc.timestamps.findIndex(ts => new Date(ts * 1000).toISOString().split('T')[0] === date);
            if (idx === -1 || sc.closes[idx] == null) return;
            const normWeight = sc.weight / totalWeight;
            weightedReturn += normWeight * ((sc.closes[idx] / firstClose) * 100);
            usedWeight += normWeight;
          });
          if (usedWeight > 0) weightedReturn = weightedReturn / usedWeight;
          return { date, value: Number(weightedReturn.toFixed(2)) };
        }).filter(d => d.value > 0);

        basketSeries = dailyReturns;
        if (dailyReturns.length >= 2) {
          basketMonthReturn = Number((dailyReturns[dailyReturns.length - 1].value - 100).toFixed(2));
        }
      }
    } catch (_) {}

    res.json({
      basket: {
        name: basket.name,
        totalValue: basketValue,
        stockCount: basketStocks.length,
        minimumInvestment: basket.minimumInvestment,
        monthReturn: basketMonthReturn,
        series: basketSeries,
      },
      benchmarks: results
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;