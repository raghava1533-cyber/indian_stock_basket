const mongoose = require('mongoose');

const stockDataSchema = new mongoose.Schema({
  ticker: String,
  symbol: String,
  name: String,
  sector: String,
  marketCap: String,
  peRatio: Number,
  pbRatio: Number,
  dividendYield: Number,
  roe: Number,
  debtToEquity: Number,
  currentPrice: Number,
  high52Week: Number,
  low52Week: Number,
  quarterlyEarnings: String,
  futureGrowth: String,
  socialSentiment: {
    positive: Number,
    negative: Number,
    neutral: Number,
    lastUpdated: Date
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StockData', stockDataSchema);
