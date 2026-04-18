const express = require('express');
const jwt = require('jsonwebtoken');
const Basket = require('../models/Basket');
const { rebalanceBasket, getRebalanceSummary, STATIC_FALLBACK, buildReason, STOCK_UNIVERSE } = require('../services/rebalanceService');
const { getMultipleStocksData, getBatchDayChanges } = require('../services/stockDataService');
const { getBatchNSEQuotes } = require('../services/nseService');
const emailService = require('../services/emailService');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme_secret';

// ─── In-memory cache for /live-summary (60 s TTL) ────────────────────────────
// Prevents hammering Yahoo Finance on every dashboard page load/navigation.
let _liveSummaryCache = { data: null, updatedAt: 0 };
const LIVE_SUMMARY_TTL = 60 * 1000; // 60 seconds

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
  // Look up fallback using both the stored ticker and the .NS variant
  const fb = STATIC_FALLBACK[stock.ticker] || STATIC_FALLBACK[stock.ticker + '.NS'] || {};
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
    // Return cached result if it is still fresh
    if (_liveSummaryCache.data && (Date.now() - _liveSummaryCache.updatedAt) < LIVE_SUMMARY_TTL) {
      return res.json(_liveSummaryCache.data);
    }

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
    // Store in cache
    _liveSummaryCache = { data: summary, updatedAt: Date.now() };
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

    const isIndian = basket.country !== 'US';
    const INVEST_BASE = basket.country === 'US' ? 1000 : 100000;

    // NSE symbols = base ticker without any suffix (e.g. MAHINDCIE, DEEPAKNITRITE)
    // Yahoo Finance Indian symbols = NSE symbol + .NS
    const toNSESymbol = (t) => t.replace(/\.(NS|BO)$/i, '');
    const toYFTicker  = (t) => isIndian ? (t.includes('.') ? t : t + '.NS') : t;

    // Yahoo ticker mapping: where Yahoo Finance uses a different symbol or exchange than NSE
    // Values that already include a suffix (.BO/.NS) are used as-is; otherwise .NS is appended
    const YAHOO_TICKER_MAP = {
      'DEEPAKNITRITE': 'DEEPAKNTR',  // Yahoo uses DEEPAKNTR.NS
      'MAHINDCIE': '532756.BO',       // Not on NSE Yahoo Finance; use BSE code
      'KALPATPOWR': 'KPIL',           // Renamed to Kalpataru Projects International
    };

    const nseSymbols   = basket.stocks.map(s => toNSESymbol(s.ticker));
    const yfTickers    = basket.stocks.map(s => {
      const nse = toNSESymbol(s.ticker);
      const mapped = isIndian ? (YAHOO_TICKER_MAP[nse] || null) : null;
      if (mapped) return mapped.includes('.') ? mapped : mapped + '.NS';
      return isIndian ? nse + '.NS' : s.ticker;
    });

    // For Indian baskets: NSE is primary (price + dayChange), YF is for enriched data
    // For US baskets: Yahoo Finance only
    let nseQuotes = {};
    if (isIndian) {
      nseQuotes = await getBatchNSEQuotes(nseSymbols);
    }

    // Fetch enriched data (PE, 52W, analyst targets, RSI etc.) from Yahoo Finance
    const liveData = await getMultipleStocksData(yfTickers);

    // For US baskets, also fetch day changes from Yahoo
    let yfDayChanges = {};
    if (!isIndian) {
      yfDayChanges = await getBatchDayChanges(yfTickers);
    }

    const enrichedStocks = basket.stocks.map((stock, idx) => {
      const s = stock.toObject ? stock.toObject() : { ...stock };
      const nseSym   = nseSymbols[idx];
      const yfTicker = yfTickers[idx];
      const nseQ     = nseQuotes[nseSym];       // NSE live quote (Indian only)
      const liveInfo = liveData.find(d => d.ticker === yfTicker);
      const yfDc     = yfDayChanges[yfTicker];  // Yahoo day change (US only)

      // Price: NSE (most real-time) > Yahoo Finance > stored
      const price = nseQ?.price ?? liveInfo?.currentPrice ?? s.currentPrice ?? 0;

      // Day change: Yahoo Finance FIRST (handles corporate actions correctly),
      // then NSE fallback (for stocks where Yahoo has no data like MAHINDCIE, CENTURYTEX)
      // then Yahoo batch (US only), then stored
      const dcAbs = liveInfo?.dayChange ?? nseQ?.change ??
        (yfDc != null ? price - price / (1 + yfDc.pct / 100) : null);
      const dcPct = liveInfo?.dayChangePercent ?? nseQ?.changePct ?? yfDc?.pct ?? null;

      // 52W range: NSE > Yahoo Finance > stored
      const high52 = nseQ?.high52Week ?? liveInfo?.high52Week ?? s.high52Week;
      const low52  = nseQ?.low52Week  ?? liveInfo?.low52Week  ?? s.low52Week;

      // Quantity from weight
      const weight = s.weight || 10;
      const qty = Math.max(1, Math.floor((weight / 100 * INVEST_BASE) / price));

      return supplementStock({
        ...s,
        ticker: isIndian ? nseSym + '.NS' : s.ticker,
        currentPrice: price,
        quantity: qty,
        high52Week: high52,
        low52Week: low52,
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
        lastUpdated: new Date(),
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

// Get benchmark comparison for basket with timeframe support
router.get('/:id/benchmark', async (req, res) => {
  try {
    const basket = await Basket.findById(req.params.id);
    if (!basket) return res.status(404).json({ message: 'Basket not found' });

    const axios = require('axios');
    const isUS = basket.country === 'US';
    const tf = req.query.tf || 'max'; // 1m,3m,6m,1y,2y,3y,5y,ytd,max

    const launchDate = new Date(basket.createdDate || basket.createdAt || Date.now());
    const now = new Date();

    // Compute period1 based on timeframe
    let startDate;
    switch (tf) {
      case '1m':  startDate = new Date(now); startDate.setMonth(startDate.getMonth() - 1); break;
      case '3m':  startDate = new Date(now); startDate.setMonth(startDate.getMonth() - 3); break;
      case '6m':  startDate = new Date(now); startDate.setMonth(startDate.getMonth() - 6); break;
      case '1y':  startDate = new Date(now); startDate.setFullYear(startDate.getFullYear() - 1); break;
      case '2y':  startDate = new Date(now); startDate.setFullYear(startDate.getFullYear() - 2); break;
      case '3y':  startDate = new Date(now); startDate.setFullYear(startDate.getFullYear() - 3); break;
      case '5y':  startDate = new Date(now); startDate.setFullYear(startDate.getFullYear() - 5); break;
      case 'ytd': startDate = new Date(now.getFullYear(), 0, 1); break;
      case 'max':
      default:    startDate = launchDate; break;
    }
    // Don't go before launch date
    if (startDate < launchDate) startDate = launchDate;

    const daysSinceStart = Math.max(1, Math.ceil((now - startDate) / (1000 * 60 * 60 * 24)));
    const daysSinceLaunch = Math.max(1, Math.ceil((now - launchDate) / (1000 * 60 * 60 * 24)));
    const interval = daysSinceStart <= 90 ? '1d' : daysSinceStart <= 365 ? '1d' : daysSinceStart <= 1095 ? '1wk' : '1mo';
    const period1 = Math.floor(startDate.getTime() / 1000);
    const period2 = Math.floor(now.getTime() / 1000);

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
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(bm.ticker)}?period1=${period1}&period2=${period2}&interval=${interval}`;
        const resp = await axios.get(url, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          timeout: 8000
        });
        const result = resp.data?.chart?.result?.[0];
        const meta = result?.meta || {};
        const timestamps = result?.timestamp || [];
        const closes = result?.indicators?.quote?.[0]?.close || [];
        const firstClose = closes.find(c => c != null) || meta.chartPreviousClose || 0;
        const lastClose = meta.regularMarketPrice || 0;
        const returnPct = firstClose > 0 ? ((lastClose - firstClose) / firstClose * 100).toFixed(2) : 0;

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
          returnPct: Number(returnPct),
          series,
        });
      } catch (err) {
        results.push({ name: bm.name, ticker: bm.ticker, currentValue: 0, returnPct: 0, series: [] });
      }
    }

    // Calculate basket performance — include ALL stocks (active + removed/sold)
    const activeStocks = basket.stocks.filter(s => s.status === 'active');
    const allStocks = basket.stocks; // includes removed stocks too
    const basketValue = activeStocks.reduce((sum, s) => sum + ((s.currentPrice || 0) * (s.quantity || 1)), 0);

    // Realized P&L from sold/removed stocks
    const removedStocks = basket.stocks.filter(s => s.status === 'removed');
    const realizedPnL = removedStocks.reduce((sum, s) => {
      const sellPrice = s.currentPrice || 0; // price at time of removal
      const buyP = s.buyPrice || sellPrice;
      return sum + ((sellPrice - buyP) * (s.quantity || 1));
    }, 0);

    // Also gather realized P&L from rebalance history
    let historyRealizedPnL = 0;
    try {
      const RebalanceHistory = require('../models/RebalanceHistory');
      const histories = await RebalanceHistory.find({ basketId: basket._id }).lean();
      for (const h of histories) {
        if (h.changes?.removed) {
          for (const r of h.changes.removed) {
            const saleP = r.salePrice || 0;
            const buyP = r.buyPrice || saleP;
            historyRealizedPnL += (saleP - buyP) * (r.quantity || 1);
          }
        }
      }
    } catch (_) {}

    // Total P&L = unrealized (active) + realized (sold)
    const investedActive = activeStocks.reduce((sum, s) => sum + ((s.buyPrice || s.currentPrice || 0) * (s.quantity || 1)), 0);
    const unrealizedPnL = basketValue - investedActive;
    const totalPnL = unrealizedPnL + realizedPnL + historyRealizedPnL;
    const totalInvested = investedActive + removedStocks.reduce((sum, s) => sum + ((s.buyPrice || s.currentPrice || 0) * (s.quantity || 1)), 0);
    const overallReturn = totalInvested > 0 ? Number(((totalPnL / totalInvested) * 100).toFixed(2)) : 0;

    // Build basket normalized series by fetching each active stock's chart
    // For Indian stocks: use .NS suffix for Yahoo Finance charts
    const toYFChart = (ticker, isUS) => {
      if (isUS) return ticker;
      // Strip existing suffix then re-add appropriate suffix
      const base = ticker.replace(/\.(NS|BO)$/i, '');
      // Apply known Yahoo ticker remaps (values with . suffix are used as-is)
      const YAHOO_CHART_MAP = { 'DEEPAKNITRITE': 'DEEPAKNTR', 'MAHINDCIE': '532756.BO', 'KALPATPOWR': 'KPIL' };
      const mapped = YAHOO_CHART_MAP[base];
      if (mapped) return mapped.includes('.') ? mapped : mapped + '.NS';
      return base + '.NS';
    };

    let basketSeries = [];
    let basketReturnPct = 0;
    try {
      const stockCharts = [];
      for (const s of activeStocks.slice(0, 15)) {
        try {
          const yfTicker = toYFChart(s.ticker, isUS);
          const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yfTicker)}?period1=${period1}&period2=${period2}&interval=${interval}`;
          const resp = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 });
          const result = resp.data?.chart?.result?.[0];
          const timestamps = result?.timestamp || [];
          const closes = result?.indicators?.quote?.[0]?.close || [];
          stockCharts.push({ ticker: yfTicker, weight: s.weight || (100 / activeStocks.length), timestamps, closes });
        } catch (_) {}
      }

      if (stockCharts.length > 0) {
        const allDates = new Map();
        stockCharts.forEach(sc => {
          sc.timestamps.forEach((ts) => {
            const dateStr = new Date(ts * 1000).toISOString().split('T')[0];
            if (!allDates.has(dateStr)) allDates.set(dateStr, []);
          });
        });
        const sortedDates = [...allDates.keys()].sort();

        const totalWeight = stockCharts.reduce((s, sc) => s + sc.weight, 0);
        const dailyReturns = sortedDates.map(date => {
          let weightedReturn = 0;
          let usedWeight = 0;
          stockCharts.forEach(sc => {
            const firstClose = sc.closes.find(c => c != null);
            if (!firstClose) return;
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
          basketReturnPct = Number((dailyReturns[dailyReturns.length - 1].value - 100).toFixed(2));
        }
      }
    } catch (_) {}

    // Fallback for new baskets (< 2 chart candles): compute return from live prices vs stored buy prices
    if (basketReturnPct === 0 && activeStocks.length > 0) {
      try {
        const tickersForLive = activeStocks.map(s => s.ticker);
        const liveQuotes = await getBatchDayChanges(tickersForLive);
        let totalBought = 0, totalNow = 0;
        for (const s of activeStocks) {
          const livePrice = liveQuotes[s.ticker]?.price || s.currentPrice;
          const buyP = s.buyPrice || s.currentPrice;
          totalBought += buyP * (s.quantity || 1);
          totalNow   += livePrice * (s.quantity || 1);
        }
        if (totalBought > 0) {
          basketReturnPct = Number(((totalNow - totalBought) / totalBought * 100).toFixed(2));
        }
      } catch (_) {}
    }

    res.json({
      basket: {
        name: basket.name,
        totalValue: basketValue,
        investedValue: investedActive,
        stockCount: activeStocks.length,
        minimumInvestment: basket.minimumInvestment,
        returnPct: basketReturnPct,
        overallReturn,
        realizedPnL: realizedPnL + historyRealizedPnL,
        unrealizedPnL,
        totalPnL,
        series: basketSeries,
        launchDate: launchDate.toISOString(),
      },
      benchmarks: results,
      daysSinceLaunch,
      daysSinceStart,
      timeframe: tf,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── ONE-TIME ADMIN: clear rebalance history & reset basket launch dates ─────
const RebalanceHistory = require('../models/RebalanceHistory');
router.post('/admin/reset-history', async (req, res) => {
  const secret = req.headers['x-admin-secret'];
  if (secret !== (process.env.ADMIN_SECRET || 'smartbasket-reset-2026')) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const today = new Date();
    const nextReb = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const histResult = await RebalanceHistory.deleteMany({});

    const basketResult = await Basket.updateMany({}, {
      $set: {
        lastRebalanceDate: today,
        nextRebalanceDate: nextReb,
      }
    });

    res.json({
      message: 'Reset complete',
      rebalanceHistoryDeleted: histResult.deletedCount,
      basketsUpdated: basketResult.modifiedCount,
      newLaunchDate: today.toISOString().slice(0, 10),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;