const Basket = require('../models/Basket');
const RebalanceHistory = require('../models/RebalanceHistory');
const { getStocksByCategory, calculateStockScore, getMultipleStocksData } = require('./stockDataService');
const emailService = require('./emailService');

const isQualityStock = (stock) => {
  if (!stock || !stock.currentPrice) return false;
  if (stock.marketCap) {
    const marketCapInCr = stock.marketCap / 10000000;
    if (marketCapInCr < 200) return false;
  }
  if (stock.peRatio && stock.peRatio > 0 && stock.peRatio > 150) return false;
  if (stock.low52Week && stock.low52Week > 0) {
    if (stock.currentPrice < stock.low52Week * 1.02) return false;
  }
  return true;
};

const buildReason = (stock, rank, category) => {
  const pe = stock.peRatio ? `PE:${stock.peRatio.toFixed(1)}` : 'PE:N/A';
  const mcap = stock.marketCap ? `MCap:₹${(stock.marketCap / 1e9).toFixed(0)}B` : 'MCap:N/A';
  const range = stock.high52Week - stock.low52Week;
  const momentum = range > 0 ? `Momentum:${(((stock.currentPrice - stock.low52Week) / range) * 100).toFixed(0)}%` : '';
  return `Rank #${rank} in ${category} | ${pe} | ${mcap}${momentum ? ' | ' + momentum : ''} | Strong fundamentals`;
};

const getCategoryFromName = (name) => {
  if (name.includes('Midcap')) return 'midCap';
  if (name.includes('Smallcap')) return 'smallCap';
  if (name.includes('Tech')) return 'tech';
  if (name.includes('Finance')) return 'finance';
  if (name.includes('Healthcare')) return 'healthcare';
  if (name.includes('Renewable')) return 'renewable';
  if (name.includes('Consumer')) return 'consumer';
  if (name.includes('Infra') || name.includes('Infrastructure')) return 'infrastructure';
  return 'largeCap';
};

const selectTopStocks = async (category) => {
  const tickers = getStocksByCategory(category);
  if (tickers.length === 0) return [];

  const stocksData = await getMultipleStocksData(tickers);
  if (stocksData.length === 0) return [];

  let qualityStocks = stocksData.filter(s => isQualityStock(s));

  if (qualityStocks.length === 0) {
    console.warn(`No quality stocks found for ${category}, using fallback`);
    qualityStocks = stocksData.filter(s => s && s.currentPrice);
  }

  const scored = qualityStocks.map(s => ({ ...s, score: calculateStockScore(s) }));
  const top10 = scored.sort((a, b) => b.score - a.score).slice(0, 10);

  return top10.map((stock, idx) => ({
    ticker: stock.ticker,
    companyName: stock.companyName || stock.ticker,
    symbol: stock.ticker,
    currentPrice: stock.currentPrice,
    high52Week: stock.high52Week,
    low52Week: stock.low52Week,
    marketCap: stock.marketCap ? String(stock.marketCap) : null,
    peRatio: stock.peRatio,
    weight: 10,
    quantity: 1,
    reason: buildReason(stock, idx + 1, category),
    status: 'active',
    addedDate: new Date(),
    score: stock.score,
  }));
};

const rebalanceBasket = async (basketId, manualTrigger = false) => {
  try {
    const basket = await Basket.findById(basketId);
    if (!basket) throw new Error('Basket not found');

    const category = getCategoryFromName(basket.name);
    const newStocks = await selectTopStocks(category);

    const changes = { added: [], removed: [], partialRemoved: [] };

    for (const oldStock of basket.stocks) {
      if (!newStocks.find(s => s.ticker === oldStock.ticker)) {
        changes.removed.push({ ticker: oldStock.ticker, companyName: oldStock.companyName, quantity: oldStock.quantity });
      }
    }
    for (const newStock of newStocks) {
      if (!basket.stocks.find(s => s.ticker === newStock.ticker)) {
        changes.added.push({ ticker: newStock.ticker, companyName: newStock.companyName, quantity: newStock.quantity, reason: newStock.reason });
      }
    }

    basket.stocks = newStocks.map(stock => ({
      ...stock,
      addedDate: basket.stocks.find(s => s.ticker === stock.ticker)?.addedDate || new Date(),
    }));

    const totalPrice = newStocks.reduce((sum, s) => sum + (s.currentPrice || 0), 0);
    basket.minimumInvestment = Math.ceil(totalPrice);
    basket.lastRebalanceDate = new Date();
    basket.nextRebalanceDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await basket.save();

    try {
      const historyEntry = new RebalanceHistory({
        basketId,
        changes,
        reason: manualTrigger ? 'Manual rebalance by user' : 'Automatic rebalance (30-day cycle)',
        manualTrigger,
        emailsSent: 0,
      });
      await historyEntry.save();
    } catch (histErr) {
      console.warn('Could not save rebalance history:', histErr.message);
    }

    if (basket.subscribers && basket.subscribers.length > 0) {
      for (const email of basket.subscribers) {
        try {
          await emailService.sendRebalanceNotification(email, basket, changes);
        } catch (emailErr) {
          console.warn(`Email failed for ${email}:`, emailErr.message);
        }
      }
    }

    return { success: true, basket, changes, emailsSent: basket.subscribers.length };
  } catch (error) {
    console.error('Error rebalancing basket:', error);
    throw error;
  }
};

const getRebalanceSummary = async (basketId) => {
  try {
    const basket = await Basket.findById(basketId);
    let history = [];
    try {
      history = await RebalanceHistory.find({ basketId }).sort({ createdAt: -1 }).limit(10);
    } catch (e) {
      console.warn('Could not fetch rebalance history:', e.message);
    }
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

module.exports = { rebalanceBasket, selectTopStocks, getRebalanceSummary, isQualityStock };