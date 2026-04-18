const mongoose = require('mongoose');

const rebalanceHistorySchema = new mongoose.Schema({
  basketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Basket',
    required: true
  },
  rebalanceDate: {
    type: Date,
    default: Date.now
  },
  reason: String,
  manualTrigger: Boolean,
  changes: {
    added: [{
      ticker: String,
      symbol: String,
      companyName: String,
      quantity: Number,
      buyPrice: Number,
      addedDate: Date,
      reason: String,
      marketCapRank: Number
    }],
    removed: [{
      ticker: String,
      symbol: String,
      companyName: String,
      quantity: Number,
      buyPrice: Number,
      salePrice: Number,
      addedDate: Date,
      reason: String
    }],
    partialRemoved: [{
      ticker: String,
      symbol: String,
      companyName: String,
      quantityRemoved: Number,
      quantityKept: Number,
      buyPrice: Number,
      salePrice: Number,
      addedDate: Date,
      reason: String
    }],
    updated: [{
      ticker: String,
      symbol: String,
      oldQuantity: Number,
      newQuantity: Number,
      reason: String
    }]
  },
  performanceMetrics: {
    basketPerformance: Number, // %
    benchmarkPerformance: Number, // %
    outperformance: Number // %
  },
  subscribers: [String], // Email addresses notified
  emailsSent: {
    type: Number,
    default: 0
  },
  createdDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RebalanceHistory', rebalanceHistorySchema);
