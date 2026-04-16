const Basket = require('../models/Basket');
const StockData = require('../models/StockData');
const RebalanceHistory = require('../models/RebalanceHistory');
const { getStocksByCategory, calculateStockScore, getMultipleStocksData } = require('./stockDataService');
const emailService = require('./emailService');

// Quality filtering criteria
const isQualityStock = async (stockData) => {
  // Criteria:
  // 1. Market Cap > 10,000 Cr (for largecap)
  // 2. PE Ratio < 30 (reasonable valuation)
  // 3. Price > 52-week low (above support)
  // 4. Volume indicates good liquidity

  if (!stockData.marketCap || !stockData.peRatio) return false;

  const marketCapInCr = stockData.marketCap / 10000000;
  const priceAboveSupport = stockData.currentPrice > stockData.low52Week * 1.1;
  const reasonableValuation = stockData.peRatio < 40 && stockData.peRatio > 0;

  return marketCapInCr > 1000 && priceAboveSupport && reasonableValuation;
};

// Select top 10 stocks for a basket
const selectTopStocks = async (category, basketType) => {
  const tickers = getStocksByCategory(category);
  
  // Fetch data for all stocks
  const stocksData = await getMultipleStocksData(tickers);
  
  // Filter quality stocks
  const qualityStocks = [];
  for (const stock of stocksData) {
    if (await isQualityStock(stock)) {
      stock.score = calculateStockScore(stock);
      qualityStocks.push(stock);
    }
  }

  // Sort by score and select top 10
  const topStocks = qualityStocks
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((stock, index) => ({
      ...stock,
      reason: `Ranked #${index + 1} in ${category} category. Strong fundamentals and growth potential.`,
      weight: 10 // Equal weight - 10% each
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
      updated: []
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
          reason: 'No longer meets quality criteria'
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
          quantity: Math.round((100 / newStock.weight) / newStock.currentPrice), // Assuming 100 per stock
          reason: newStock.reason,
          marketCapRank: newStocks.findIndex(s => s.ticker === newStock.ticker) + 1
        });
      }
    }

    // Update basket stocks
    basket.stocks = newStocks.map(stock => ({
      ...stock,
      status: 'active',
      addedDate: basket.stocks.find(s => s.ticker === stock.ticker)?.addedDate || new Date()
    }));

    // Update rebalance dates
    basket.lastRebalanceDate = new Date();
    basket.nextRebalanceDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Save changes to history
    const historyEntry = new RebalanceHistory({
      basketId,
      changes,
      reason: manualTrigger ? 'Manual rebalance by user' : 'Automatic rebalance (30-day cycle)',
      manualTrigger,
      subscribers: basket.subscribers
    });

    await basket.save();
    await historyEntry.save();

    // Send email notifications to subscribers
    if (basket.subscribers && basket.subscribers.length > 0) {
      for (const email of basket.subscribers) {
        await emailService.sendRebalanceNotification(email, basket, changes);
      }
    }

    return {
      success: true,
      basket,
      changes,
      emailsSent: basket.subscribers.length
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
        minimumInvestment: basket.minimumInvestment
      },
      recentChanges: history
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
  isQualityStock
};
