const axios = require('axios');
const { getFinnhubTargets } = require('./finnhubService');

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
};

// ── Sentiment word lists for news headline analysis ───────────────────────────
const POSITIVE_WORDS = new Set([
  'surge', 'surges', 'surging', 'rally', 'rallies', 'soar', 'soars', 'jump', 'jumps',
  'gain', 'gains', 'rise', 'rises', 'rising', 'up', 'high', 'higher', 'profit',
  'growth', 'grow', 'grows', 'upgrade', 'upgraded', 'outperform', 'buy', 'bullish',
  'record', 'beat', 'beats', 'strong', 'positive', 'boost', 'boosts', 'recover',
  'recovery', 'breakout', 'momentum', 'optimistic', 'robust', 'expand', 'expansion',
  'dividend', 'bonus', 'acquisition', 'deal', 'approval', 'innovation', 'launch',
]);
const NEGATIVE_WORDS = new Set([
  'fall', 'falls', 'falling', 'drop', 'drops', 'decline', 'declines', 'crash',
  'plunge', 'plunges', 'slip', 'slips', 'low', 'lower', 'loss', 'losses',
  'downgrade', 'downgraded', 'underperform', 'sell', 'bearish', 'weak', 'negative',
  'miss', 'misses', 'debt', 'default', 'fraud', 'scam', 'penalty', 'fine',
  'concern', 'risk', 'warning', 'slowdown', 'recession', 'layoff', 'layoffs',
  'cut', 'cuts', 'probe', 'investigation', 'ban', 'restriction',
]);

/**
 * Analyze sentiment of news headlines. Returns score 0-10.
 * @param {string[]} headlines
 * @returns {number} sentiment score 0-10
 */
const analyzeHeadlineSentiment = (headlines) => {
  if (!headlines || headlines.length === 0) return 5; // neutral default
  let posCount = 0, negCount = 0, total = 0;
  for (const headline of headlines) {
    const words = headline.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
    for (const w of words) {
      if (POSITIVE_WORDS.has(w)) posCount++;
      if (NEGATIVE_WORDS.has(w)) negCount++;
    }
    total++;
  }
  const netScore = posCount - negCount;
  // Map to 0-10: strongly negative = 0, strongly positive = 10
  const normalized = Math.max(0, Math.min(10, 5 + (netScore / Math.max(total, 1)) * 2.5));
  return Number(normalized.toFixed(1));
};

/**
 * Fetch news headlines for a ticker from Yahoo Finance.
 * @param {string} ticker
 * @returns {string[]} array of headline strings
 */
const fetchNewsHeadlines = async (ticker) => {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=5d&interval=1d`;
    // Yahoo v8 doesn't return news; use search endpoint instead
    const searchUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${ticker.replace('.NS', '')}&newsCount=10&quotesCount=0`;
    const resp = await axios.get(searchUrl, { headers: YF_HEADERS, timeout: 8000 });
    const news = resp.data?.news || [];
    return news.map(n => n.title).filter(Boolean);
  } catch (_) {
    return [];
  }
};

/**
 * Compute RSI (Relative Strength Index) from an array of closing prices.
 * @param {number[]} closes - array of closing prices (oldest first)
 * @param {number} period - RSI period (default 14)
 * @returns {number|null} RSI value (0-100) or null if insufficient data
 */
const computeRSI = (closes, period = 14) => {
  if (!closes || closes.length < period + 1) return null;
  const validCloses = closes.filter(c => c != null);
  if (validCloses.length < period + 1) return null;

  let avgGain = 0, avgLoss = 0;
  // Initial average over first `period` changes
  for (let i = 1; i <= period; i++) {
    const change = validCloses[i] - validCloses[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;

  // Smooth over remaining data
  for (let i = period + 1; i < validCloses.length; i++) {
    const change = validCloses[i] - validCloses[i - 1];
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Number((100 - (100 / (1 + rs))).toFixed(1));
};

/**
 * Compute Simple Moving Averages (SMA) from closing prices.
 * @param {number[]} closes
 * @returns {{ sma20: number|null, sma50: number|null, sma200: number|null }}
 */
const computeSMAs = (closes) => {
  const validCloses = (closes || []).filter(c => c != null);
  const sma = (arr, n) => arr.length >= n ? arr.slice(-n).reduce((s, v) => s + v, 0) / n : null;
  return {
    sma20: sma(validCloses, 20) ? Number(sma(validCloses, 20).toFixed(2)) : null,
    sma50: sma(validCloses, 50) ? Number(sma(validCloses, 50).toFixed(2)) : null,
    sma200: sma(validCloses, 200) ? Number(sma(validCloses, 200).toFixed(2)) : null,
  };
};

/**
 * Fetch the latest close price from Stooq (independent secondary source).
 * Works for NSE (.NS), BSE (.BO), and US tickers (appends .us suffix).
 * Used as tertiary fallback when both Yahoo Finance v10 and v8 fail.
 *
 * @param {string} ticker - Yahoo Finance ticker e.g. 'RELIANCE.NS' or 'AAPL'
 * @returns {number|null} latest close price or null if not found
 */
const getStooqPrice = async (ticker) => {
  try {
    // Convert Yahoo ticker format to Stooq format:
    //   RELIANCE.NS → reliance.ns  (NSE — same suffix)
    //   RELIANCE.BO → reliance.bo  (BSE — same suffix)
    //   AAPL        → aapl.us      (US bare tickers get .us)
    const stooqTicker = ticker.includes('.')
      ? ticker.toLowerCase()
      : `${ticker.toLowerCase()}.us`;
    const url = `https://stooq.com/q/l/?s=${encodeURIComponent(stooqTicker)}&f=sd2t2ohlcv&h&e=csv`;
    const resp = await axios.get(url, { headers: YF_HEADERS, timeout: 8000, responseType: 'text' });
    const lines = (resp.data || '').trim().split('\n');
    if (lines.length < 2) return null;
    // CSV columns: Symbol,Date,Time,Open,High,Low,Close,Volume
    const cols = lines[1].split(',');
    if (cols.length < 7 || cols[6] === 'N/D' || cols[6] === '') return null;
    const close = parseFloat(cols[6]);
    return isNaN(close) ? null : close;
  } catch (_) {
    return null;
  }
};

/**
 * Fetch enriched stock data from Yahoo Finance.
 * Primary: v10 quoteSummary (price, financialData, defaultKeyStatistics)
 * Fallback: v8 chart (basic price + 52W range)
 * Tertiary: Stooq (independent source — verifies Yahoo, handles edge cases)
 *
 * @param {string} ticker - e.g. 'RELIANCE.NS'
 * @returns {object|null} enriched stock data or null on complete failure
 */
const getEnrichedStockData = async (ticker) => {
  // ── Primary: v10 quoteSummary ──────────────────────────────────────────────
  let finnhubTargets = null;
  let triedFinnhub = false;
  try {
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${ticker}`;
    const resp = await axios.get(url, {
      params: { modules: 'price,financialData,defaultKeyStatistics,recommendationTrend' },
      headers: YF_HEADERS,
      timeout: 12000,
    });

    const result = resp.data?.quoteSummary?.result?.[0];
    if (!result) throw new Error('Empty v10 result');

    const price    = result.price            || {};
    const finData  = result.financialData    || {};
    const keyStats = result.defaultKeyStatistics || {};
    const recTrend = result.recommendationTrend?.trend?.[0] || {};

    const currentPrice = price.regularMarketPrice?.raw ?? 0;
    const high52Week   = price.fiftyTwoWeekHigh?.raw   ?? currentPrice;
    const low52Week    = price.fiftyTwoWeekLow?.raw    ?? currentPrice;
    const marketCap    = price.marketCap?.raw          ?? 0;
    const marketCapCr  = Math.round(marketCap / 1e7);

    // PE: prefer trailingPE from keyStats, then forwardPE
    const trailingPE = keyStats.trailingPE?.raw ?? null;
    const forwardPE  = keyStats.forwardPE?.raw  ?? null;
    const peRatio    = trailingPE ?? forwardPE;

    const earningsGrowth = finData.earningsGrowth?.raw != null
      ? finData.earningsGrowth.raw * 100
      : null;
    const revenueGrowth  = finData.revenueGrowth?.raw != null
      ? finData.revenueGrowth.raw * 100
      : null;

    // ── Analyst data ──
    const targetMeanPrice = finData.targetMeanPrice?.raw ?? null;
    const targetHighPrice = finData.targetHighPrice?.raw ?? null;
    const targetLowPrice  = finData.targetLowPrice?.raw  ?? null;
    const recommendationKey = finData.recommendationKey ?? null; // 'buy', 'hold', 'sell', etc.
    const numberOfAnalysts  = finData.numberOfAnalystOpinions?.raw ?? null;

    // Analyst consensus counts from recommendationTrend
    const analystBuy    = (recTrend.strongBuy || 0) + (recTrend.buy || 0);
    const analystHold   = recTrend.hold || 0;
    const analystSell   = (recTrend.sell || 0) + (recTrend.strongSell || 0);

    // futureGrowth from analyst target upside (0-10 scale)
    const futureGrowth = (targetMeanPrice && currentPrice > 0)
      ? Math.max(0, Math.min(10, ((targetMeanPrice - currentPrice) / currentPrice) * 10))
      : null;

    // 52W momentum proxy → base socialSentiment score 0-10
    const range52 = high52Week - low52Week;
    const momentumSentiment = range52 > 0
      ? Math.max(0, Math.min(10, ((currentPrice - low52Week) / range52) * 10))
      : 5;

    // Fetch news headlines and compute NLP sentiment
    let newsSentiment = 5;
    let newsHeadlines = [];
    try {
      newsHeadlines = await fetchNewsHeadlines(ticker);
      if (newsHeadlines.length > 0) {
        newsSentiment = analyzeHeadlineSentiment(newsHeadlines);
      }
    } catch (_) {}

    // Blend: 40% news sentiment + 60% momentum
    const socialSentiment = Number(((newsSentiment * 0.4) + (momentumSentiment * 0.6)).toFixed(1));

    // Fetch chart data for RSI/SMA (1y)
    let rsi = null, sma20 = null, sma50 = null, sma200 = null;
    let v8Price = null;
    try {
      const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`;
      const chartResp = await axios.get(chartUrl, {
        params: { interval: '1d', range: '1y' },
        headers: YF_HEADERS,
        timeout: 8000,
      });
      const chartResult = chartResp.data?.chart?.result?.[0];
      const closes = chartResult?.indicators?.quote?.[0]?.close || [];
      rsi = computeRSI(closes);
      const smas = computeSMAs(closes);
      sma20 = smas.sma20;
      sma50 = smas.sma50;
      sma200 = smas.sma200;
      v8Price = chartResult?.meta?.regularMarketPrice ?? null;
    } catch (_) {}

    // Separate 5d fetch for accurate previous close (range=1y chartPreviousClose is
    // adjusted for corporate actions and will show wrong day change on ex-dates)
    let v8PrevClose = null;
    try {
      const resp5d = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`, {
        params: { interval: '1d', range: '5d' },
        headers: YF_HEADERS,
        timeout: 8000,
      });
      const meta5d = resp5d.data?.chart?.result?.[0]?.meta || {};
      v8PrevClose = meta5d.chartPreviousClose ?? null;
      if (!v8Price) v8Price = meta5d.regularMarketPrice ?? null;
    } catch (_) {}

    // Use v10's reported dayChange directly (already adjusted for corporate actions)
    // Only fall back to v8-derived if v10 didn't provide one
    const finalPrice = v8Price || currentPrice;
    const v10Change    = price.regularMarketChange?.raw ?? null;
    const v10ChangePct = (() => {
      const chg = price.regularMarketChange?.raw ?? null;
      const cur = price.regularMarketPrice?.raw  ?? null;
      if (chg != null && cur != null && (cur - chg) > 0)
        return (chg / (cur - chg)) * 100;
      return price.regularMarketChangePercent?.raw != null
        ? price.regularMarketChangePercent.raw * 100
        : null;
    })();

    // v8-derived change as fallback only (may be stale on corporate action days)
    const v8Change    = (v8Price != null && v8PrevClose != null && v8PrevClose > 0) ? v8Price - v8PrevClose : null;
    const v8ChangePct = (v8Change != null && v8PrevClose > 0) ? (v8Change / v8PrevClose) * 100 : null;

    // Prefer v10 change (authoritative); use v8 only if v10 is null
    const finalDayChange    = v10Change    ?? v8Change;
    const finalDayChangePct = v10ChangePct ?? v8ChangePct;

    // If Yahoo has no analyst targets, try Finnhub
    if (targetMeanPrice == null && !triedFinnhub) {
      finnhubTargets = await getFinnhubTargets(ticker);
      triedFinnhub = true;
    }
    return {
      ticker,
      companyName:     price.longName || price.shortName || ticker,
      currentPrice: finalPrice,
      high52Week,
      low52Week,
      marketCap,
      marketCapCr,
      peRatio,
      earningsGrowth,
      revenueGrowth,
      futureGrowth,
      socialSentiment,
      newsSentiment,
      momentumSentiment,
      // Analyst fields
      targetMeanPrice: targetMeanPrice ?? finnhubTargets?.targetMean ?? null,
      targetHighPrice: targetHighPrice ?? finnhubTargets?.targetHigh ?? null,
      targetLowPrice:  targetLowPrice  ?? finnhubTargets?.targetLow  ?? null,
      recommendationKey,
      numberOfAnalysts,
      analystBuy,
      analystHold,
      analystSell,
      // Technical (from chart data)
      rsi,
      sma20,
      sma50,
      sma200,
      dayChange: finalDayChange,
      dayChangePercent: finalDayChangePct,
      lastUpdated: new Date(),
      _analystSource: targetMeanPrice != null ? 'Yahoo' : (finnhubTargets?.targetMean ? 'Finnhub' : null),
    };
  } catch (v10Err) {
    console.warn(`[stockDataService] v10 failed for ${ticker}: ${v10Err.message}`);
  }

  // ── Fallback: v8 chart (also used to compute RSI + SMA) ─────────────────────
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`;
    const resp = await axios.get(url, {
      params: { interval: '1d', range: '1y' },
      headers: YF_HEADERS,
      timeout: 12000,
    });

    const meta    = resp.data?.chart?.result?.[0]?.meta;
    const history = resp.data?.chart?.result?.[0]?.indicators?.quote?.[0];
    if (!meta) throw new Error('Empty v8 result');

    const closes = history?.close || [];
    const validCloses = closes.filter(c => c != null);
    // BSE (.BO) tickers sometimes return null regularMarketPrice but have close data
    const currentPrice = meta.regularMarketPrice ?? (validCloses.length ? validCloses[validCloses.length - 1] : 0);
    const highs = (history?.high  || []).filter(h => h != null);
    const lows  = (history?.low   || []).filter(l => l != null);
    const high52Week = highs.length ? Math.max(...highs) : currentPrice;
    const low52Week  = lows.length  ? Math.min(...lows)  : currentPrice;
    const marketCap  = meta.marketCap ?? 0;
    const marketCapCr = Math.round(marketCap / 1e7);

    const peRatio = (meta.epsTrailingTwelveMonths && currentPrice)
      ? currentPrice / meta.epsTrailingTwelveMonths
      : null;

    // Fetch 5d chart for accurate previous close (range=1y chartPreviousClose is
    // adjusted for corporate actions and will be wrong on ex-dates)
    let prevClose = null;
    try {
      const resp5d = await axios.get(url, {
        params: { interval: '1d', range: '5d' },
        headers: YF_HEADERS,
        timeout: 8000,
      });
      prevClose = resp5d.data?.chart?.result?.[0]?.meta?.chartPreviousClose ?? null;
    } catch (_) {
      // fallback: use 1y chartPreviousClose (may be wrong on ex-date days)
      prevClose = meta.chartPreviousClose ?? meta.previousClose ?? null;
    }
    const dayChange = prevClose ? currentPrice - prevClose : null;
    const dayChangePercent = prevClose && prevClose > 0 ? ((currentPrice - prevClose) / prevClose) * 100 : null;

    // Compute technical indicators from chart data
    const rsi = computeRSI(closes);
    const smas = computeSMAs(closes);

    const range52 = high52Week - low52Week;
    const socialSentiment = range52 > 0
      ? Math.max(0, Math.min(10, ((currentPrice - low52Week) / range52) * 10))
      : 5;

    return {
      ticker,
      companyName:     meta.longName || meta.shortName || ticker,
      currentPrice,
      high52Week,
      low52Week,
      marketCap,
      marketCapCr,
      peRatio,
      earningsGrowth:  null,
      revenueGrowth:   null,
      futureGrowth:    null,
      socialSentiment,
      newsSentiment:   null,
      momentumSentiment: socialSentiment,
      targetMeanPrice: null,
      targetHighPrice: null,
      targetLowPrice:  null,
      recommendationKey: null,
      numberOfAnalysts: null,
      analystBuy: null,
      analystHold: null,
      analystSell: null,
      rsi,
      sma20: smas.sma20,
      sma50: smas.sma50,
      sma200: smas.sma200,
      dayChange,
      dayChangePercent,
      lastUpdated: new Date(),
    };
  } catch (v8Err) {
    console.warn(`[stockDataService] v8 failed for ${ticker}: ${v8Err.message}`);
    // fall through to Stooq tertiary
  }

  // ── Tertiary: Stooq (independent source — cross-verifies Yahoo, free, no API key) ──
  try {
    const stooqPrice = await getStooqPrice(ticker);
    if (stooqPrice && stooqPrice > 0) {
      console.warn(`[stockDataService] Both Yahoo sources failed for ${ticker}; using Stooq price: ${stooqPrice}`);
      return {
        ticker,
        companyName:       ticker,
        currentPrice:      stooqPrice,
        high52Week:        stooqPrice,
        low52Week:         stooqPrice,
        marketCap:         0,
        marketCapCr:       0,
        peRatio:           null,
        earningsGrowth:    null,
        revenueGrowth:     null,
        futureGrowth:      null,
        socialSentiment:   5,
        newsSentiment:     null,
        momentumSentiment: 5,
        targetMeanPrice:   null,
        targetHighPrice:   null,
        targetLowPrice:    null,
        recommendationKey: null,
        numberOfAnalysts:  null,
        analystBuy:        null,
        analystHold:       null,
        analystSell:       null,
        rsi:               null,
        sma20:             null,
        sma50:             null,
        sma200:            null,
        dayChange:         null,
        dayChangePercent:  null,
        _isStooqFallback:  true,
        lastUpdated:       new Date(),
      };
    }
  } catch (_) {}

  console.error(`[stockDataService] All sources (Yahoo v10/v8 + Stooq) failed for ${ticker}`);
  return null;
};

/**
 * Fetch enriched data for a list of tickers with batched concurrency and
 * a small inter-batch delay to avoid rate limiting.
 *
 * @param {string[]} tickers
 * @param {number}   concurrency - parallel requests per batch (default 5)
 * @returns {Array<object|null>} same order as input tickers
 */
const getEnrichedUniverseData = async (tickers, concurrency = 3) => {
  const results = [];
  for (let i = 0; i < tickers.length; i += concurrency) {
    const batch = tickers.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(t => getEnrichedStockData(t)));
    results.push(...batchResults);
    if (i + concurrency < tickers.length) {
      await new Promise(resolve => setTimeout(resolve, 400));
    }
  }
  return results;
};

// ── Backward-compatible aliases ────────────────────────────────────────────────
const getStockData = getEnrichedStockData;

const getMultipleStocksData = async (tickers) => {
  const all = await getEnrichedUniverseData(tickers);
  return all.filter(Boolean);
};

const getStocksByCategory = () => [];
const calculateStockScore = () => 0;

/**
 * Batch-fetch accurate price + 1-day change for many tickers.
 * Primary: Yahoo Finance v7/quote batch endpoint (1 request for all tickers).
 * Fallback: per-ticker v8 chart for any that the batch misses.
 * Returns map of { ticker: { pct, price } }
 */
const getBatchDayChanges = async (tickers) => {
  if (!tickers || tickers.length === 0) return {};
  const map = {};

  // ── Primary: v7/finance/quote batch (single request) ────────────────────────
  const CHUNK = 25;
  for (let i = 0; i < tickers.length; i += CHUNK) {
    const chunk = tickers.slice(i, i + CHUNK);
    try {
      const resp = await axios.get('https://query2.finance.yahoo.com/v7/finance/quote', {
        params: { symbols: chunk.join(','), fields: 'regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketPreviousClose' },
        headers: YF_HEADERS,
        timeout: 15000,
      });
      const quotes = resp.data?.quoteResponse?.result || [];
      for (const q of quotes) {
        const price = q.regularMarketPrice ?? null;
        const prev  = q.regularMarketPreviousClose ?? null;
        const change = q.regularMarketChange ?? null;
        if (price == null) continue;
        if (prev != null && prev > 0) {
          map[q.symbol] = { pct: ((price - prev) / prev) * 100, price };
        } else if (change != null) {
          const prevCalc = price - change;
          if (prevCalc > 0) map[q.symbol] = { pct: (change / prevCalc) * 100, price };
        }
      }
    } catch (_) {}
    if (i + CHUNK < tickers.length) await new Promise(r => setTimeout(r, 300));
  }

  // ── Fallback: per-ticker v8 chart for any that batch missed ─────────────────
  const failed = tickers.filter(t => !map[t]);
  if (failed.length > 0) {
    await new Promise(r => setTimeout(r, 400));
    for (let i = 0; i < failed.length; i += 4) {
      const batch = failed.slice(i, i + 4);
      await Promise.all(batch.map(async (ticker) => {
        try {
          const resp = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`, {
            params: { interval: '1d', range: '5d' },
            headers: YF_HEADERS,
            timeout: 12000,
          });
          const chartResult = resp.data?.chart?.result?.[0];
          const meta   = chartResult?.meta || {};
          const closes = (chartResult?.indicators?.quote?.[0]?.close || []).filter(c => c != null);
          const price  = meta.regularMarketPrice ?? null;
          // chartPreviousClose is most accurate; fall back to last close in history
          const prev   = meta.chartPreviousClose ?? meta.previousClose ??
                         (closes.length >= 2 ? closes[closes.length - 1] : null);
          if (price != null && prev && prev > 0) {
            map[ticker] = { pct: ((price - prev) / prev) * 100, price };
          }
        } catch (_) {}
      }));
      if (i + 4 < failed.length) await new Promise(r => setTimeout(r, 300));
    }
  }

  return map;
};

module.exports = {
  getEnrichedStockData,
  getEnrichedUniverseData,
  getStockData,
  getMultipleStocksData,
  getStocksByCategory,
  calculateStockScore,
  getBatchDayChanges,
  getStooqPrice,
  computeRSI,
  computeSMAs,
  analyzeHeadlineSentiment,
  fetchNewsHeadlines,
};
