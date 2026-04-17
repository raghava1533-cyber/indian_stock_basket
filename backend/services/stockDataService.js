const axios = require('axios');

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
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
 * Fetch enriched stock data from Yahoo Finance.
 * Primary: v10 quoteSummary (price, financialData, defaultKeyStatistics)
 * Fallback: v8 chart (basic price + 52W range)
 *
 * @param {string} ticker - e.g. 'RELIANCE.NS'
 * @returns {object|null} enriched stock data or null on complete failure
 */
const getEnrichedStockData = async (ticker) => {
  // ── Primary: v10 quoteSummary ──────────────────────────────────────────────
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

    // Fetch chart data for RSI/SMA computation + accurate price/dayChange from v8
    let rsi = null, sma20 = null, sma50 = null, sma200 = null;
    let v8Price = null, v8PrevClose = null;
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
      // Extract v8 price and previousClose for accurate dayChange
      const chartMeta = chartResult?.meta || {};
      v8Price = chartMeta.regularMarketPrice ?? null;
      v8PrevClose = chartMeta.chartPreviousClose ?? chartMeta.previousClose ?? null;
    } catch (_) {}

    // Prefer v8 price (more accurate/real-time) over v10 when available
    const finalPrice = v8Price || currentPrice;

    // Compute dayChange: prefer v8-derived (chartPreviousClose is accurate)
    let finalDayChange = price.regularMarketChange?.raw ?? null;
    let finalDayChangePct = (() => {
      const chg = price.regularMarketChange?.raw ?? null;
      const cur = price.regularMarketPrice?.raw  ?? null;
      if (chg != null && cur != null && (cur - chg) > 0)
        return (chg / (cur - chg)) * 100;
      return price.regularMarketChangePercent?.raw != null
        ? price.regularMarketChangePercent.raw * 100
        : null;
    })();

    // Override with v8-based dayChange if v10 didn't provide it or v8 price is fresher
    if (v8Price != null && v8PrevClose != null && v8PrevClose > 0) {
      const v8DayChange = v8Price - v8PrevClose;
      const v8DayChangePct = (v8DayChange / v8PrevClose) * 100;
      if (finalDayChange == null || v8Price !== currentPrice) {
        finalDayChange = v8DayChange;
        finalDayChangePct = v8DayChangePct;
      }
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
      targetMeanPrice,
      targetHighPrice,
      targetLowPrice,
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
    const currentPrice = meta.regularMarketPrice ?? 0;
    const highs = (history?.high  || []).filter(h => h != null);
    const lows  = (history?.low   || []).filter(l => l != null);
    const high52Week = highs.length ? Math.max(...highs) : currentPrice;
    const low52Week  = lows.length  ? Math.min(...lows)  : currentPrice;
    const marketCap  = meta.marketCap ?? 0;
    const marketCapCr = Math.round(marketCap / 1e7);

    const peRatio = (meta.epsTrailingTwelveMonths && currentPrice)
      ? currentPrice / meta.epsTrailingTwelveMonths
      : null;

    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? null;
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
    console.error(`[stockDataService] v8 failed for ${ticker}: ${v8Err.message}`);
    return null;
  }
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
 * Batch-fetch accurate 1-day change % for many tickers using Yahoo v8 chart.
 * v8 meta.chartPreviousClose is the unadjusted previous session close that
 * matches what Google Finance / NSE website shows.
 * Runs 8 tickers in parallel per batch.
 * Returns a map of { ticker: dayChangePercent (%) } — null means unavailable.
 */
const getBatchDayChanges = async (tickers) => {
  if (!tickers || tickers.length === 0) return {};
  const map = {};
  const concurrency = 6;

  const fetchOne = async (ticker) => {
    try {
      const resp = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`, {
        params: { interval: '1d', range: '5d' },
        headers: YF_HEADERS,
        timeout: 10000,
      });
      const meta  = resp.data?.chart?.result?.[0]?.meta || {};
      const price = meta.regularMarketPrice ?? null;
      const prev  = meta.chartPreviousClose ?? meta.previousClose ?? null;
      if (price != null && prev && prev > 0) {
        map[ticker] = { pct: ((price - prev) / prev) * 100, price };
      }
    } catch (_) { /* skip */ }
  };

  for (let i = 0; i < tickers.length; i += concurrency) {
    const batch = tickers.slice(i, i + concurrency);
    await Promise.all(batch.map(fetchOne));
    if (i + concurrency < tickers.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  // Retry failed tickers once with longer timeout
  const failed = tickers.filter(t => !map[t]);
  if (failed.length > 0) {
    await new Promise(r => setTimeout(r, 500));
    for (let i = 0; i < failed.length; i += 4) {
      const batch = failed.slice(i, i + 4);
      await Promise.all(batch.map(async (ticker) => {
        try {
          const resp = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`, {
            params: { interval: '1d', range: '5d' },
            headers: { ...YF_HEADERS, 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
            timeout: 15000,
          });
          const meta  = resp.data?.chart?.result?.[0]?.meta || {};
          const price = meta.regularMarketPrice ?? null;
          const prev  = meta.chartPreviousClose ?? meta.previousClose ?? null;
          if (price != null && prev && prev > 0) {
            map[ticker] = { pct: ((price - prev) / prev) * 100, price };
          }
        } catch (_) { /* skip */ }
      }));
      if (i + 4 < failed.length) {
        await new Promise(r => setTimeout(r, 300));
      }
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
  computeRSI,
  computeSMAs,
  analyzeHeadlineSentiment,
  fetchNewsHeadlines,
};
