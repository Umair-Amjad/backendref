const Withdrawal = require('../models/Withdrawal');
const User = require('../models/User');
const validateWithdrawalInput = require('../validation/withdrawal');

// @route   POST api/withdrawals
// @desc    Request a withdrawal
// @access  Private
exports.requestWithdrawal = async (req, res) => {
  try {
    // Validate input
    const { errors, isValid } = validateWithdrawalInput(req.body);
    
    if (!isValid) {
      return res.status(400).json(errors);
    }

    const { amount, method, paymentDetails, withdrawalType = 'main' } = req.body;
    
    // Check minimum withdrawal amount based on method
    const minimumAmount = getMinimumWithdrawalAmount(method);
    if (amount < minimumAmount) {
      return res.status(400).json({ 
        amount: `Minimum withdrawal for ${method} is $${minimumAmount}` 
      });
    }

    // Check if user has enough balance
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check available balance based on withdrawal type
    let availableBalance = 0;
    if (withdrawalType === 'main') {
      availableBalance = user.withdrawableBalance;
    } else if (withdrawalType === 'referral') {
      availableBalance = user.referralBalance || 0;
    } else if (withdrawalType === 'combined') {
      availableBalance = user.withdrawableBalance + (user.referralBalance || 0);
    }

    if (availableBalance < amount) {
      return res.status(400).json({ 
        amount: `Insufficient withdrawable balance. Available: $${availableBalance.toFixed(2)}` 
      });
    }

    // Create withdrawal request
    const newWithdrawal = new Withdrawal({
      user: req.user.id,
      amount,
      method,
      paymentDetails,
      withdrawalType
    });

    // Deduct the amount from appropriate balance(s)
    if (withdrawalType === 'main' || withdrawalType === 'combined') {
      // If withdrawal is from main or combined, deduct from withdrawable balance first
      const mainDeduction = Math.min(user.withdrawableBalance, amount);
      user.withdrawableBalance -= mainDeduction;
      
      // If combined and withdrawable balance wasn't enough, deduct remainder from referral
      if (withdrawalType === 'combined' && mainDeduction < amount) {
        user.referralBalance -= (amount - mainDeduction);
      }
    } else if (withdrawalType === 'referral') {
      // If withdrawal is only from referral balance
      user.referralBalance -= amount;
    }
    
    await user.save();
    await newWithdrawal.save();
    
    res.json(newWithdrawal);
  } catch (err) {
    console.error('Error in requestWithdrawal:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// @route   GET api/withdrawals
// @desc    Get all withdrawals for a user
// @access  Private
exports.getUserWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    
    res.json(withdrawals);
  } catch (err) {
    console.error('Error in getUserWithdrawals:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// @route   GET api/withdrawals/:id
// @desc    Get withdrawal by ID
// @access  Private
exports.getWithdrawalById = async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    
    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }
    
    // Check if the withdrawal belongs to the user
    if (withdrawal.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ error: 'Not authorized' });
    }
    
    res.json(withdrawal);
  } catch (err) {
    console.error('Error in getWithdrawalById:', err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }
    
    res.status(500).json({ error: 'Server error' });
  }
};

// @route   GET api/withdrawals/balance
// @desc    Get withdrawable balance for a user
// @access  Private
exports.getWithdrawableBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get pending daily earnings
    const DailyEarning = require('../models/DailyEarning');
    const pendingEarnings = await DailyEarning.aggregate([
      { $match: { user: user._id, status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const pendingAmount = pendingEarnings.length > 0 ? pendingEarnings[0].total : 0;
    
    // Return all balance types
    res.json({ 
      withdrawableBalance: user.withdrawableBalance || 0,
      referralBalance: user.referralBalance || 0,
      pendingBalance: user.pendingBalance || 0,
      totalPendingRoi: pendingAmount,
      totalWithdrawable: (user.withdrawableBalance || 0) + (user.referralBalance || 0)
    });
  } catch (err) {
    console.error('Error in getWithdrawableBalance:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Helper function to get minimum withdrawal amount based on payment method
function getMinimumWithdrawalAmount(method) {
  switch (method) {
    case 'USDT':
    case 'crypto':
      return 20; // $20 minimum for crypto
    case 'BankTransfer':
    case 'bank':
      return 50; // $50 minimum for bank transfers
    case 'JazzCash':
    case 'jazzcash':
    case 'EasyPaisa':
    case 'easypaisa':
      return 10; // $10 minimum for mobile wallets
    case 'paypal':
      return 15; // $15 minimum for PayPal
    default:
      return 10; // Default minimum
  }
}