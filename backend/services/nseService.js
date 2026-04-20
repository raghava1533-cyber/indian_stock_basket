/**
 * NSE India live price service.
 * Uses NSE's public API (same as nseindia.com website) for accurate prices
 * and day change for Indian stocks. NSE symbols are the base ticker without
 * any exchange suffix (e.g. RELIANCE, MAHINDCIE, DEEPAKNITRITE).
 *
 * Session cookies are refreshed automatically every 5 minutes.
 */

const axios = require('axios');

// ── Session management ────────────────────────────────────────────────────────
let _cookies = '';
let _cookieTime = 0;
const COOKIE_TTL = 5 * 60 * 1000; // 5 minutes

const NSE_BASE = 'https://www.nseindia.com';

const NSE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  Referer: 'https://www.nseindia.com/',
  'sec-fetch-site': 'same-origin',
  'sec-fetch-mode': 'cors',
  'sec-fetch-dest': 'empty',
  Connection: 'keep-alive',
};

const refreshSession = async () => {
  try {
    const resp = await axios.get(NSE_BASE, {
      headers: {
        'User-Agent': NSE_HEADERS['User-Agent'],
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        Connection: 'keep-alive',
      },
      timeout: 12000,
    });
    const raw = resp.headers['set-cookie'];
    if (raw && raw.length > 0) {
      _cookies = raw.map((c) => c.split(';')[0]).join('; ');
      _cookieTime = Date.now();
    }
  } catch (e) {
    console.warn('[NSE] Session refresh failed:', e.message);
  }
};

const getSession = async () => {
  if (!_cookies || Date.now() - _cookieTime > COOKIE_TTL) {
    await refreshSession();
  }
  return _cookies;
};

// ── Single stock quote ────────────────────────────────────────────────────────
/**
 * Fetch live quote for one NSE symbol.
 * Returns { price, change, changePct, prevClose, high52Week, low52Week } or null.
 */
const getNSEQuote = async (symbol, cookies) => {
  try {
    const resp = await axios.get(
      `${NSE_BASE}/api/quote-equity?symbol=${encodeURIComponent(symbol)}`,
      {
        headers: { ...NSE_HEADERS, Cookie: cookies || '' },
        timeout: 10000,
      },
    );
    const pi = resp.data?.priceInfo;
    if (!pi) return null;
    return {
      price: pi.lastPrice ?? null,
      change: pi.change ?? null,
      changePct: pi.pChange ?? null,
      prevClose: pi.previousClose ?? null,
      high52Week: pi.weekHighLow?.max ?? null,
      low52Week: pi.weekHighLow?.min ?? null,
    };
  } catch {
    return null;
  }
};

// ── Batch quotes ──────────────────────────────────────────────────────────────
/**
 * Fetch live quotes for multiple NSE symbols.
 * Returns a map: { SYMBOL: { price, change, changePct, prevClose, high52Week, low52Week } }
 *
 * Runs up to `concurrency` requests in parallel per batch with inter-batch delays.
 */
const getBatchNSEQuotes = async (symbols) => {
  if (!symbols || symbols.length === 0) return {};

  const cookies = await getSession();
  const map = {};
  const CONCURRENCY = 4;
  const DELAY = 250; // ms between batches

  for (let i = 0; i < symbols.length; i += CONCURRENCY) {
    const batch = symbols.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (sym) => {
        const q = await getNSEQuote(sym, cookies);
        if (q && q.price != null) map[sym] = q;
      }),
    );
    if (i + CONCURRENCY < symbols.length) {
      await new Promise((r) => setTimeout(r, DELAY));
    }
  }

  // Retry missing symbols once (session may have expired mid-batch)
  const failed = symbols.filter((s) => !map[s]);
  if (failed.length > 0) {
    // Force session refresh for retry
    await refreshSession();
    const freshCookies = _cookies;
    await new Promise((r) => setTimeout(r, 500));
    await Promise.all(
      failed.map(async (sym) => {
        const q = await getNSEQuote(sym, freshCookies);
        if (q && q.price != null) map[sym] = q;
      }),
    );
  }

  return map;
};

module.exports = { getBatchNSEQuotes, getNSEQuote, refreshSession };

// ── Index quote helper (NIFTY, BANKNIFTY) ──────────────────────────────────
/**
 * Fetch index value from NSE option-chain API (underlyingValue).
 * indexSymbol: 'NIFTY' or 'BANKNIFTY'
 */
async function getNSEIndexQuote(indexSymbol) {
  try {
    await getSession();
    const url = `${NSE_BASE}/api/option-chain-indices?symbol=${encodeURIComponent(indexSymbol)}`;
    const resp = await axios.get(url, {
      headers: { ...NSE_HEADERS, Cookie: _cookies || '' },
      timeout: 10000,
    });
    const rec = resp.data?.records || {};
    const price = rec.underlyingValue ?? null;
    const timestamp = rec.timestamp ?? null;
    return { price, timestamp, raw: resp.data };
  } catch (err) {
    console.warn(`[NSE] getNSEIndexQuote ${indexSymbol} failed: ${err.message}`);
    return null;
  }
}

module.exports = { getBatchNSEQuotes, getNSEQuote, refreshSession, getNSEIndexQuote };
