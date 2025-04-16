const asyncHandler = require('express-async-handler');
const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Get withdrawal statistics for current user
// @route   GET /api/withdrawals/stats
// @access  Private
const getWithdrawalStats = asyncHandler(async (req, res) => {
  const stats = await Withdrawal.aggregate([
    { $match: { user: mongoose.Types.ObjectId(req.user._id) } },
    { $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  // Transform to more usable format
  const statsObj = stats.reduce((acc, stat) => {
    acc[stat._id] = {
      count: stat.count,
      totalAmount: stat.totalAmount
    };
    return acc;
  }, {
    pending: { count: 0, totalAmount: 0 },
    completed: { count: 0, totalAmount: 0 },
    cancelled: { count: 0, totalAmount: 0 },
    rejected: { count: 0, totalAmount: 0 }
  });

  res.status(200).json(statsObj);
});

// @desc    Get all withdrawals for current user
// @route   GET /api/withdrawals
// @access  Private
const getWithdrawals = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const status = req.query.status || null;

  // Build query
  const query = { user: req.user._id };
  if (status) {
    query.status = status;
  }

  const withdrawals = await Withdrawal.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Withdrawal.countDocuments(query);

  res.status(200).json({
    withdrawals,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get a single withdrawal
// @route   GET /api/withdrawals/:id
// @access  Private
const getWithdrawal = asyncHandler(async (req, res) => {
  const withdrawal = await Withdrawal.findById(req.params.id);

  if (!withdrawal) {
    res.status(404);
    throw new Error('Withdrawal not found');
  }

  // Verify the withdrawal belongs to the user
  if (withdrawal.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You are not authorized to view this withdrawal');
  }

  res.status(200).json(withdrawal);
});

// @desc    Create a new withdrawal request
// @route   POST /api/withdrawals
// @access  Private
const createWithdrawal = asyncHandler(async (req, res) => {
  const { amount, paymentMethod, paymentDetails } = req.body;

  if (!amount || !paymentMethod || !paymentDetails) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // Check if amount is numeric and greater than minimum
  if (isNaN(amount) || amount < 10) {
    res.status(400);
    throw new Error('Withdrawal amount must be at least $10');
  }

  // Verify user has sufficient balance
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.balance < amount) {
    res.status(400);
    throw new Error('Insufficient balance for withdrawal');
  }

  // Create withdrawal request
  const withdrawal = await Withdrawal.create({
    user: req.user._id,
    amount,
    paymentMethod,
    paymentDetails,
    status: 'pending'
  });

  // Update user's balance
  user.balance -= amount;
  await user.save();

  res.status(201).json(withdrawal);
});

// @desc    Cancel a withdrawal request
// @route   PUT /api/withdrawals/:id/cancel
// @access  Private
const cancelWithdrawal = asyncHandler(async (req, res) => {
  const withdrawal = await Withdrawal.findById(req.params.id);

  if (!withdrawal) {
    res.status(404);
    throw new Error('Withdrawal not found');
  }

  // Verify the withdrawal belongs to the user
  if (withdrawal.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You are not authorized to cancel this withdrawal');
  }

  // Can only cancel pending withdrawals
  if (withdrawal.status !== 'pending') {
    res.status(400);
    throw new Error(`Cannot cancel a withdrawal with status: ${withdrawal.status}`);
  }

  // Update withdrawal status
  withdrawal.status = 'cancelled';
  await withdrawal.save();

  // Refund the amount to user's balance
  const user = await User.findById(req.user._id);
  user.balance += withdrawal.amount;
  await user.save();

  res.status(200).json(withdrawal);
});

module.exports = {
  getWithdrawalStats,
  getWithdrawals,
  getWithdrawal,
  createWithdrawal,
  cancelWithdrawal
}; 