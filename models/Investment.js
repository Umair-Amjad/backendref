const mongoose = require('mongoose');

const InvestmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: true
    },
    amount: {
      type: Number,
      required: [true, 'Please provide an investment amount'],
      min: [3, 'Minimum investment amount is $3']
    },
    returns: {
      type: Number,
      required: true
    },
    profit: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed', 'cancelled'],
      default: 'pending'
    },
    duration: {
      type: Number,
      required: true // Duration in days
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    paymentMethod: {
      type: String,
      required: [true, 'Please provide a payment method'],
      enum: ['Bitcoin', 'Ethereum', 'Litecoin', 'USDT', 'Easypaisa', 'JazzCash']
    },
    transactionHash: {
      type: String
    },
    transactionScreenshot: {
      type: String
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'failed', 'rejected'],
      default: 'pending'
    },
    expectedReturn: {
      type: Number,
      required: true
    },
    paymentRecipient: {
      type: Object,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Middleware to set start/end dates when investment becomes active
InvestmentSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'active' && !this.startDate) {
    this.startDate = new Date();
    this.endDate = new Date();
    this.endDate.setDate(this.endDate.getDate() + this.duration);
  }
  next();
});

// Calculate expected return (principal + profit)
InvestmentSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('returns')) {
    this.expectedReturn = this.amount + (this.amount * this.returns / 100);
  }
  next();
});

// Static method to determine the plan based on amount
InvestmentSchema.statics.getPlanByAmount = function(amount) {
  if (amount >= 3 && amount <= 10) {
    return {
      name: 'Bronze',
      roi: 5 // 5% ROI for Bronze plan
    };
  } else if (amount >= 11 && amount <= 50) {
    return {
      name: 'Silver',
      roi: 7 // 7% ROI for Silver plan
    };
  } else if (amount >= 51 && amount <= 200) {
    return {
      name: 'Gold',
      roi: 10 // 10% ROI for Gold plan
    };
  } else if (amount >= 201 && amount <= 500) {
    return {
      name: 'Platinum',
      roi: 15 // 15% ROI for Platinum plan
    };
  } else if (amount >= 501 && amount <= 1000) {
    return {
      name: 'Diamond',
      roi: 20 // 20% ROI for Diamond plan
    };
  } else if (amount >= 1001 && amount <= 50000) {
    return {
      name: 'Elite',
      roi: 25 // 25% ROI for Elite plan
    };
  } else {
    return null; // Invalid amount
  }
};

module.exports = mongoose.model('Investment', InvestmentSchema); 