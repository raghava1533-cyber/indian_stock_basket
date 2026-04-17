const axios = require('axios');

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
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
      params: { modules: 'price,financialData,defaultKeyStatistics' },
      headers: YF_HEADERS,
      timeout: 12000,
    });

    const result = resp.data?.quoteSummary?.result?.[0];
    if (!result) throw new Error('Empty v10 result');

    const price    = result.price            || {};
    const finData  = result.financialData    || {};
    const keyStats = result.defaultKeyStatistics || {};

    const currentPrice = price.regularMarketPrice?.raw ?? 0;
    const high52Week   = price.fiftyTwoWeekHigh?.raw   ?? currentPrice;
    const low52Week    = price.fiftyTwoWeekLow?.raw    ?? currentPrice;
    const marketCap    = price.marketCap?.raw          ?? 0;
    const marketCapCr  = Math.round(marketCap / 1e7);   // 1 Crore = 10^7 INR

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

    // Analyst target upside → futureGrowth score 0-10
    const targetMeanPrice = finData.targetMeanPrice?.raw ?? null;
    let futureGrowth = 5;
    if (targetMeanPrice && currentPrice > 0) {
      const upside = ((targetMeanPrice - currentPrice) / currentPrice) * 10;
      futureGrowth = Math.max(0, Math.min(10, upside));
    }

    // 52W momentum proxy → socialSentiment score 0-10
    const range52 = high52Week - low52Week;
    const socialSentiment = range52 > 0
      ? Math.max(0, Math.min(10, ((currentPrice - low52Week) / range52) * 10))
      : 5;

    return {
      ticker,
      companyName:     price.longName || price.shortName || ticker,
      currentPrice,
      high52Week,
      low52Week,
      marketCap,
      marketCapCr,
      peRatio,
      earningsGrowth,
      revenueGrowth,
      futureGrowth,
      socialSentiment,
      lastUpdated: new Date(),
    };
  } catch (v10Err) {
    console.warn(`[stockDataService] v10 failed for ${ticker}: ${v10Err.message}`);
  }

  // ── Fallback: v8 chart ─────────────────────────────────────────────────────
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
      futureGrowth:    5,
      socialSentiment,
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
const getEnrichedUniverseData = async (tickers, concurrency = 5) => {
  const results = [];
  for (let i = 0; i < tickers.length; i += concurrency) {
    const batch = tickers.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(t => getEnrichedStockData(t)));
    results.push(...batchResults);
    if (i + concurrency < tickers.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
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

module.exports = {
  getEnrichedStockData,
  getEnrichedUniverseData,
  getStockData,
  getMultipleStocksData,
  getStocksByCategory,
  calculateStockScore,
};
