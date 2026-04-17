const mongoose = require('mongoose');

const basketSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: [
      'Bluechip Giants',
      'Midcap Momentum',
      'Smallcap Leaders',
      'Tech Innovators',
      'Finance Leaders',
      'Healthcare Growth',
      'Renewable Energy',
      'Consumer Brands',
      'Infrastructure Surge'
    ]
  },
  description: String,
  category: {
    type: String,
    enum: ['Market Cap Based', 'Thematic'],
    default: 'Market Cap Based'
  },
  theme: String,
  stocks: [{
    ticker: String,
    symbol: String,
    companyName: String,
    quantity: Number,
    buyPrice: Number,
    currentPrice: Number,
    weight: Number,
    reason: String,
    addedDate: Date,
    removedDate: Date,
    status: {
      type: String,
      enum: ['active', 'removed', 'partial'],
      default: 'active'
    },
    partialQuantity: Number,
    high52Week: Number,
    low52Week: Number,
    marketCap: String,
    peRatio: Number,
    earningsGrowth: Number,
    socialSentiment: Number,
    score: Number,
    qualityScores: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  }],
  createdDate: {
    type: Date,
    default: Date.now
  },
  lastRebalanceDate: Date,
  nextRebalanceDate: Date,
  totalValue: Number,
  benchmark: {
    name: String,
    value: Number,
    performance: Number
  },
  minimumInvestment: Number,
  subscribers: [String],
  rebalanceHistory: [{
    date: Date,
    changes: String,
    reason: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Basket', basketSchema);