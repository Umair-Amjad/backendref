const mongoose = require('mongoose');

const DailyEarningSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  investment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investment',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'released', 'withdrawn'],
    default: 'pending'
  },
  releaseDate: {
    type: Date,
    required: true
  },
  releasedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
DailyEarningSchema.index({ user: 1, status: 1, releaseDate: 1 });
DailyEarningSchema.index({ investment: 1 });

const DailyEarning = mongoose.model('DailyEarning', DailyEarningSchema);

module.exports = DailyEarning; 