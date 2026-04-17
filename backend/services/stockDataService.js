const axios = require('axios');

// Indian stock tickers - NSE format
const INDIAN_STOCKS = {
  largeCap: [
    'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HINDUNILVR.NS', 'ICICIBANK.NS',
    'HDFC.NS', 'WIPRO.NS', 'ITC.NS', 'MARUTI.NS', 'SBIN.NS',
    'BAJAJFINSV.NS', 'TITAN.NS', 'ASIANPAINT.NS', 'NESTLEIND.NS', 'SUNPHARMA.NS'
  ],
  midCap: [
    'APOLLOHOSP.NS', 'POWERGRID.NS', 'GAIL.NS', 'LT.NS', 'SAIL.NS',
    'JSWSTEEL.NS', 'HINDALCO.NS', 'BAJAJELECTR.NS', 'INDIGO.NS', 'ADANIPORTS.NS',
    'HDFCBANK.NS', 'AXISBANK.NS', 'KOTAKBANK.NS', 'LTTS.NS', 'ZEEL.NS'
  ],
  smallCap: [
    'JUSTDIAL.NS', 'PIDILITIND.NS', 'PAGEIND.NS', 'BHARTIARTL.NS', 'AUBANK.NS',
    'RADICO.NS', 'SUVINSURG.NS', 'DIVISLAB.NS', 'CGCONSTRUCT.NS', 'EDELWEISS.NS'
  ],
  tech: [
    'TCS.NS', 'INFY.NS', 'WIPRO.NS', 'HCLTECH.NS', 'LTTS.NS',
    'TECHM.NS', 'PERSISTENT.NS', 'MINDTREE.NS', 'MPHASIS.NS', 'COFORGE.NS'
  ],
  finance: [
    'ICICIBANK.NS', 'HDFC.NS', 'SBIN.NS', 'AXISBANK.NS', 'KOTAKBANK.NS',
    'BAJAJFINSV.NS', 'HDFCBANK.NS', 'BOMDYEING.NS', 'IRFC.NS', 'PFC.NS'
  ],
  healthcare: [
    'SUNPHARMA.NS', 'APOLLOHOSP.NS', 'DIVISLAB.NS', 'CIPLA.NS', 'DRREDDY.NS',
    'BIOCON.NS', 'PHARMEASY.NS', 'STRIDES.NS', 'ALKEM.NS', 'LUPIN.NS'
  ]
};

// Fetch live stock data using yfinance
const getStockData = async (ticker) => {
  try {
    const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`, {
      params: {
        interval: '1d',
        range: '1y'
      }
    });

    const quote = response.data.chart.result[0].meta;
    const history = response.data.chart.result[0].indicators.quote[0];

    return {
      ticker: ticker,
      currentPrice: quote.regularMarketPrice,
      high52Week: Math.max(...history.high.filter(h => h !== null)),
      low52Week: Math.min(...history.low.filter(h => h !== null)),
      marketCap: quote.marketCap,
      peRatio: (quote.epsTrailingTwelveMonths && quote.epsTrailingTwelveMonths !== 0)
        ? quote.regularMarketPrice / quote.epsTrailingTwelveMonths
        : null,
      currency: quote.currency,
      lastUpdated: new Date()
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
  }
  return stocksData;
};

// Get stocks by category
const getStocksByCategory = (category) => {
  return INDIAN_STOCKS[category] || [];
};

// Calculate stock score based on multiple factors
const calculateStockScore = (stockData) => {
  // Score based on: Price vs 52-week low, PE ratio, market cap
  let score = 0;

  // 40% - Price position in 52-week range (0-40)
  const priceRange = stockData.high52Week - stockData.low52Week;
  const pricePosition = (stockData.currentPrice - stockData.low52Week) / priceRange;
  score += Math.min(pricePosition * 40, 40);

  // 30% - PE Ratio (lower is better)
  if (stockData.peRatio && stockData.peRatio > 0) {
    score += Math.max(30 - (stockData.peRatio / 2), 0);
  }

  // 30% - Market Cap (higher cap = more stable = more points)
  if (stockData.marketCap) {
    score += Math.min((stockData.marketCap / 1000000000000) * 30, 30);
  }

  return Math.round(score * 100) / 100;
};

module.exports = {
  getStockData,
  getMultipleStocksData,
  getStocksByCategory,
  calculateStockScore,
  INDIAN_STOCKS
};
