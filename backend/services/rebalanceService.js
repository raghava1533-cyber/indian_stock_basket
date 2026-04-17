const Basket = require('../models/Basket');
const StockData = require('../models/StockData');
const RebalanceHistory = require('../models/RebalanceHistory');
const { getStocksByCategory, calculateStockScore, getMultipleStocksData } = require('./stockDataService');
const emailService = require('./emailService');

// Quality filtering criteria (relaxed to handle missing data)
const isQualityStock = async (stockData) => {
  if (!stockData || !stockData.currentPrice) return false;

  // Apply marketCap filter only if data is available
  if (stockData.marketCap) {
    const marketCapInCr = stockData.marketCap / 10000000;
    if (marketCapInCr < 500) return false; // min 500 Cr
  }

  // Apply PE filter only if data is available — only reject extremely overvalued
  if (stockData.peRatio && stockData.peRatio > 0) {
    if (stockData.peRatio > 100) return false;
  }

  // Price above 52-week low (5% buffer) — only if 52w data is available
  if (stockData.high52Week && stockData.low52Week && stockData.low52Week > 0) {
    const priceAboveSupport = stockData.currentPrice > stockData.low52Week * 1.05;
    if (!priceAboveSupport) return false;
  }

  return true;
};

// Select top 10 stocks for a basket
const selectTopStocks = async (category, basketType) => {
  const tickers = getStocksByCategory(category);

  // Fetch data for all stocks
  const stocksData = await getMultipleStocksData(tickers);

  if (stocksData.length === 0) {
    console.warn(`No stock data fetched for category: ${category}`);
    return [];
  }

  // Filter quality stocks
  const qualityStocks = [];
  for (const stock of stocksData) {
    if (await isQualityStock(stock)) {
      stock.score = calculateStockScore(stock);
      qualityStocks.push(stock);
    }
  }

  // Fallback: if quality filter removes everything, use all fetched stocks
  let stocksToUse = qualityStocks;
  if (qualityStocks.length === 0) {
    console.warn(`No quality stocks found for ${category}, using top scored stocks as fallback`);
    stocksToUse = stocksData
      .filter(s => s && s.currentPrice)
      .map(s => ({ ...s, score: calculateStockScore(s) }));
  }

  // Sort by score and select top 10
  const topStocks = stocksToUse
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((stock, index) => ({
      ...stock,
      reason: `Ranked #${index + 1} in ${category} category. Strong fundamentals and growth potential.`,
      weight: 10,
    }));

  return topStocks;
};

// Rebalance a basket
const rebalanceBasket = async (basketId, manualTrigger = false) => {
  try {
    const basket = await Basket.findById(basketId);
    if (!basket) throw new Error('Basket not found');

    // Determine category based on basket name
    let category = 'largeCap';
    if (basket.name.includes('Midcap')) category = 'midCap';
    if (basket.name.includes('Smallcap')) category = 'smallCap';
    if (basket.name.includes('Tech')) category = 'tech';
    if (basket.name.includes('Finance')) category = 'finance';
    if (basket.name.includes('Healthcare')) category = 'healthcare';

    // Get new top stocks
    const newStocks = await selectTopStocks(category, basket.category);

    // Compare and identify changes
    const changes = {
      added: [],
      removed: [],
      partialRemoved: [],
      updated: [],
    };

    // Find removed stocks
    for (const oldStock of basket.stocks) {
      const newStockExists = newStocks.find(s => s.ticker === oldStock.ticker);
      if (!newStockExists) {
        changes.removed.push({
          ticker: oldStock.ticker,
          symbol: oldStock.symbol,
          quantity: oldStock.quantity,
          salePrice: oldStock.currentPrice,
          reason: 'No longer meets quality criteria',
        });
      }
    }

    // Find added stocks
    for (const newStock of newStocks) {
      const oldStockExists = basket.stocks.find(s => s.ticker === newStock.ticker);
      if (!oldStockExists) {
        changes.added.push({
          ticker: newStock.ticker,
          symbol: newStock.symbol,
          quantity: Math.round((100 / newStock.weight) / newStock.currentPrice),
          reason: newStock.reason,
          marketCapRank: newStocks.findIndex(s => s.ticker === newStock.ticker) + 1,
        });
      }
    }

    // Update basket stocks
    basket.stocks = newStocks.map(stock => ({
      ...stock,
      status: 'active',
      addedDate: basket.stocks.find(s => s.ticker === stock.ticker)?.addedDate || new Date(),
    }));

    basket.lastRebalanceDate = new Date();
    basket.nextRebalanceDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const historyEntry = new RebalanceHistory({
      basketId,
      changes,
      reason: manualTrigger ? 'Manual rebalance by user' : 'Automatic rebalance (30-day cycle)',
      manualTrigger,
      subscribers: basket.subscribers,
    });

    await basket.save();
    await historyEntry.save();

    if (basket.subscribers && basket.subscribers.length > 0) {
      for (const email of basket.subscribers) {
        await emailService.sendRebalanceNotification(email, basket, changes);
      }
    }

    return {
      success: true,
      basket,
      changes,
      emailsSent: basket.subscribers.length,
    };
  } catch (error) {
    console.error('Error rebalancing basket:', error);
    throw error;
  }
};

// Get rebalance summary
const getRebalanceSummary = async (basketId) => {
  try {
    const basket = await Basket.findById(basketId);
    const history = await RebalanceHistory.find({ basketId }).sort({ rebalanceDate: -1 }).limit(5);

    return {
      basket: {
        name: basket.name,
        lastRebalanceDate: basket.lastRebalanceDate,
        nextRebalanceDate: basket.nextRebalanceDate,
        totalValue: basket.totalValue,
        minimumInvestment: basket.minimumInvestment,
      },
      recentChanges: history,
    };
  } catch (error) {
    console.error('Error getting rebalance summary:', error);
    throw error;
  }
};

module.exports = {
  rebalanceBasket,
  selectTopStocks,
  getRebalanceSummary,
  isQualityStock,
};
