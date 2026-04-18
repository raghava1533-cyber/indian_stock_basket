const axios = require('axios');

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'YOUR_API_KEY_HERE';

/**
 * Fetch analyst price targets from Finnhub for a given ticker.
 * @param {string} ticker - e.g. 'RELIANCE.NS' or 'AAPL'
 * @returns {Promise<{targetHigh: number|null, targetLow: number|null, targetMean: number|null, targetMedian: number|null, lastUpdated: string|null}>}
 */
async function getFinnhubTargets(ticker) {
  try {
    // Finnhub uses NSE:RELIANCE for Indian stocks, not RELIANCE.NS
    let symbol = ticker.replace('.NS', '');
    if (/^[A-Z]+\.NS$/.test(ticker)) symbol = `NSE:${symbol}`;
    const url = `https://finnhub.io/api/v1/stock/price-target?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
    const resp = await axios.get(url, { timeout: 8000 });
    const d = resp.data || {};
    return {
      targetHigh: d.targetHigh ?? null,
      targetLow: d.targetLow ?? null,
      targetMean: d.targetMean ?? null,
      targetMedian: d.targetMedian ?? null,
      lastUpdated: d.lastUpdated ?? null,
    };
  } catch (err) {
    console.warn(`[finnhubService] Finnhub failed for ${ticker}: ${err.message}`);
    return {
      targetHigh: null, targetLow: null, targetMean: null, targetMedian: null, lastUpdated: null
    };
  }
}

module.exports = { getFinnhubTargets };
