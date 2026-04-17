const axios = require('axios');

// Indian stock tickers - NSE format
const INDIAN_STOCKS = {
  largeCap: [
    'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HINDUNILVR.NS', 'ICICIBANK.NS',
    'WIPRO.NS', 'ITC.NS', 'MARUTI.NS', 'SBIN.NS', 'HDFCBANK.NS',
    'BAJAJFINSV.NS', 'TITAN.NS', 'ASIANPAINT.NS', 'NESTLEIND.NS', 'SUNPHARMA.NS'
  ],
  midCap: [
    'APOLLOHOSP.NS', 'POWERGRID.NS', 'GAIL.NS', 'LT.NS', 'SAIL.NS',
    'JSWSTEEL.NS', 'HINDALCO.NS', 'INDIGO.NS', 'ADANIPORTS.NS',
    'AXISBANK.NS', 'KOTAKBANK.NS', 'LTTS.NS', 'ZEEL.NS', 'MUTHOOTFIN.NS', 'CHOLAFIN.NS'
  ],
  smallCap: [
    'JUSTDIAL.NS', 'PIDILITIND.NS', 'PAGEIND.NS', 'BHARTIARTL.NS', 'AUBANK.NS',
    'RADICO.NS', 'DIVISLAB.NS', 'EDELWEISS.NS', 'IDFCFIRSTB.NS', 'NATCOPHARM.NS'
  ],
  tech: [
    'TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS', 'LTTS.NS',
    'TECHM.NS', 'PERSISTENT.NS', 'MPHASIS.NS', 'COFORGE.NS', 'KPITTECH.NS'
  ],
  finance: [
    'ICICIBANK.NS', 'HDFCBANK.NS', 'SBIN.NS', 'AXISBANK.NS', 'KOTAKBANK.NS',
    'BAJAJFINSV.NS', 'IRFC.NS', 'PFC.NS', 'RECLTD.NS', 'M&MFIN.NS'
  ],
  healthcare: [
    'SUNPHARMA.NS', 'APOLLOHOSP.NS', 'DIVISLAB.NS', 'CIPLA.NS', 'DRREDDY.NS',
    'BIOCON.NS', 'ALKEM.NS', 'LUPIN.NS', 'TORNTPHARM.NS', 'AUROPHARMA.NS'
  ]
};

// Fetch live stock data from Yahoo Finance
const getStockData = async (ticker) => {
  try {
    const response = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`,
      {
        params: { interval: '1d', range: '1y' },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
        timeout: 10000,
      }
    );

    const result = response.data?.chart?.result?.[0];
    if (!result) return null;

    const quote = result.meta;
    const history = result.indicators?.quote?.[0];

    if (!quote || !history) return null;

    const highs = (history.high || []).filter(h => h !== null && !isNaN(h));
    const lows = (history.low || []).filter(l => l !== null && !isNaN(l));

    const eps = quote.epsTrailingTwelveMonths;
    const currentPrice = quote.regularMarketPrice;

    return {
      ticker,
      currentPrice,
      high52Week: highs.length > 0 ? Math.max(...highs) : currentPrice,
      low52Week: lows.length > 0 ? Math.min(...lows) : currentPrice * 0.8,
      marketCap: quote.marketCap || null,
      peRatio: (eps && eps !== 0 && currentPrice) ? currentPrice / eps : null,
      currency: quote.currency,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error(`Error fetching data for ${ticker}:`, error.message);
    return null;
  }
};

// Get multiple stocks data
const getMultipleStocksData = async (tickers) => {
  const stocksData = [];
  for (const ticker of tickers) {
    const data = await getStockData(ticker);
    if (data) {
      stocksData.push(data);
    }
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  return stocksData;
};

// Get stocks by category
const getStocksByCategory = (category) => {
  return INDIAN_STOCKS[category] || [];
};

// Calculate stock score based on multiple factors
const calculateStockScore = (stockData) => {
  let score = 0;

  // 40% - Price position in 52-week range (0-40)
  const priceRange = stockData.high52Week - stockData.low52Week;
  if (priceRange > 0) {
    const pricePosition = (stockData.currentPrice - stockData.low52Week) / priceRange;
    score += Math.min(pricePosition * 40, 40);
  }

  // 30% - PE Ratio (lower is better, only if available)
  if (stockData.peRatio && stockData.peRatio > 0) {
    score += Math.max(30 - stockData.peRatio / 2, 0);
  } else {
    score += 15; // neutral score if PE not available
  }

  // 30% - Market Cap (higher = more stable)
  if (stockData.marketCap) {
    score += Math.min((stockData.marketCap / 1000000000000) * 30, 30);
  } else {
    score += 10; // neutral score if marketCap not available
  }

  return Math.round(score * 100) / 100;
};

module.exports = {
  getStockData,
  getMultipleStocksData,
  getStocksByCategory,
  calculateStockScore,
  INDIAN_STOCKS,
};
