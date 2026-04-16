const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },
  subscribedBaskets: [{
    basketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Basket'
    },
    subscribedDate: {
      type: Date,
      default: Date.now
    },
    notificationEmail: {
      type: Boolean,
      default: true
    }
  }],
  portfolio: {
    brokerName: String, // e.g., "Zerodha", "5paisa", "Angel", etc.
    brokerUsername: String,
    brokerAPIKey: String, // Encrypted
    brokerAPISecret: String, // Encrypted
    connected: Boolean
  },
  investmentAmount: {
    type: Number,
    default: 0
  },
  allocatedPerBasket: {
    type: Number,
    default: 0
  },
  holdings: [{
    basketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Basket'
    },
    stocks: [{
      ticker: String,
      quantity: Number,
      buyPrice: Number,
      currentValue: Number
    }]
  }],
  preferredRebalanceTime: {
    type: String,
    default: '09:30' // 9:30 AM
  },
  createdDate: {
    type: Date,
    default: Date.now
  },
  updatedDate: Date
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.matchPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
