const mongoose = require('mongoose');

const basketSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['Bluechip Giants', 'Midcap Momentum', 'Smallcap Leaders', 'Tech Innovators', 'Finance Leaders', 'Renewable Energy', 'Healthcare Growth', 'Consumer Brands', 'Manufacturing Surge', 'Infrastructure Play']
  },
  description: String,
  category: {
    type: String,
    enum: ['Market Cap Based', 'Thematic'],
    default: 'Market Cap Based'
  },
  theme: String, // e.g., "Large Cap", "Tech", "Finance", etc.
  stocks: [{
    ticker: String,
    symbol: String,
    quantity: Number,
    buyPrice: Number,
    currentPrice: Number,
    weight: Number, // percentage
    reason: String, // Why this stock was picked
    addedDate: Date,
    removedDate: Date,
    status: {
      type: String,
      enum: ['active', 'removed', 'partial'],
      default: 'active'
    },
    partialQuantity: Number, // For partial sell
    high52Week: Number,
    low52Week: Number,
    marketCap: String,
    peRatio: Number,
    earningsGrowth: String,
    socialSentiment: String, // Based on social media monitoring
  }],
  createdDate: {
    type: Date,
    default: Date.now
  },
  lastRebalanceDate: Date,
  nextRebalanceDate: Date,
  totalValue: Number,
  benchmark: {
    name: String, // e.g., "Nifty 50"
    value: Number,
    performance: Number // %
  },
  minimumInvestment: Number, // To maintain equal weight
  subscribers: [String], // Email addresses of subscribers
  rebalanceHistory: [{
    date: Date,
    changes: String,
    reason: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Basket', basketSchema);
