const mongoose = require('mongoose');

const EarningHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    enum: ['referral', 'investment', 'bonus'],
    required: true
  },
  source: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  // Optional reference to related documents
  referral: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Referral'
  },
  investment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investment'
  },
  description: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries by user
EarningHistorySchema.index({ user: 1, createdAt: -1 });

const EarningHistory = mongoose.model('EarningHistory', EarningHistorySchema);

module.exports = EarningHistory; 