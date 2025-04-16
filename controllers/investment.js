const Investment = require('../models/Investment');
const User = require('../models/User');
const Referral = require('../models/Referral');
const Plan = require('../models/Plan');
const { investmentPlans, getPlanByAmount } = require('../config/investmentPlans');
const crypto = require('crypto');
const mongoose = require('mongoose');

// Mock crypto payment service integration
// In a real application, you would integrate with Coinbase Commerce or another provider
const initiateCryptoPayment = async (amount) => {
  // This would be replaced with actual API calls to a crypto payment provider
  return {
    id: crypto.randomBytes(10).toString('hex'),
    status: 'pending',
    paymentUrl: `https://payment-gateway.example.com/pay/${crypto.randomBytes(10).toString('hex')}`,
    amount
  };
};

// @desc    Create a new investment
// @route   POST /api/investment
// @access  Private
exports.createInvestment = async (req, res) => {
  try {
    const { amount, paymentMethod = 'Bitcoin' } = req.body;
    let transactionScreenshot = null;
    
    // Validate amount
    if (!amount || amount < 3) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid investment amount (minimum $3)'
      });
    }
    
    // Get plan based on amount
    const plan = getPlanByAmount(amount);
    
    if (!plan) {
      return res.status(400).json({
        success: false,
        message: 'Invalid investment amount'
      });
    }
    
    // Validate transaction screenshot for Easypaisa or JazzCash
    if (paymentMethod === 'Easypaisa' || paymentMethod === 'JazzCash') {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: `Please upload your ${paymentMethod} transaction screenshot`
        });
      }
      // Store the relative path to the file, making sure it starts with 'uploads/'
      transactionScreenshot = req.file.path.replace(/\\/g, '/');
      // Make sure path starts with 'uploads/' for correct URL resolution
      if (!transactionScreenshot.startsWith('uploads/')) {
        transactionScreenshot = transactionScreenshot.substring(transactionScreenshot.indexOf('uploads/'));
      }
    }
    
    // Find or create a Plan document
    const planData = await Plan.findOneAndUpdate(
      { name: plan.name },
      { 
        name: plan.name,
        returns: plan.roi,
        minimumAmount: plan.minAmount,
        maximumAmount: plan.maxAmount,
        duration: plan.duration,
        description: `${plan.name} investment plan with ${plan.roi}% returns over ${plan.duration} days`
      },
      { upsert: true, new: true }
    );
    
    // Calculate expected return
    const expectedReturn = amount + (amount * plan.roi / 100);
    
    // Handle different payment methods
    let paymentData = {};
    
    if (paymentMethod === 'Easypaisa' || paymentMethod === 'JazzCash') {
      // Local payment methods just store the screenshot
      paymentData = {
        id: crypto.randomBytes(10).toString('hex'),
        status: 'pending',
        transactionScreenshot
      };
    } else {
      // For crypto payments, initiate crypto payment
      paymentData = await initiateCryptoPayment(amount);
    }
    
    // Create investment
    const investment = await Investment.create({
      user: req.user._id,
      plan: planData._id,
      amount,
      returns: plan.roi,
      duration: plan.duration,
      expectedReturn,
      paymentMethod,
      transactionHash: paymentData.id,
      transactionScreenshot: paymentData.transactionScreenshot || null,
      paymentStatus: 'pending',
      paymentRecipient: paymentMethod === 'JazzCash' || paymentMethod === 'Easypaisa' 
        ? { phoneNumber: '0312094180', accountName: 'Umair Amjad' }
        : null
    });
    
    res.status(201).json({
      success: true,
      data: {
        investment,
        payment: {
          id: paymentData.id,
          paymentUrl: paymentData.paymentUrl || null
        }
      }
    });
  } catch (error) {
    console.error('Investment creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get investment by ID
// @route   GET /api/investment/:id
// @access  Private
exports.getInvestmentById = async (req, res) => {
  try {
    const investment = await Investment.findById(req.params.id);
    
    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found'
      });
    }
    
    // Check if user is authorized
    if (investment.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to view this investment'
      });
    }
    
    res.status(200).json({
      success: true,
      data: investment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all user investments
// @route   GET /api/investment/user
// @access  Private
exports.getUserInvestments = async (req, res) => {
  try {
    const investments = await Investment.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: investments.length,
      data: investments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get investment plans
// @route   GET /api/investment/plans
// @access  Public
exports.getInvestmentPlans = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: investmentPlans
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Verify payment and update investment status
// @route   POST /api/investment/verify-payment
// @access  Public (webhook from payment provider)
exports.verifyPayment = async (req, res) => {
  try {
    // In a real implementation, this would verify a webhook payload
    // from Coinbase Commerce or another provider
    const { paymentId, status } = req.body;
    
    if (!paymentId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide paymentId and status'
      });
    }
    
    // Find investment by transactionHash (which contains the payment ID)
    const investment = await Investment.findOne({ transactionHash: paymentId });
    
    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found'
      });
    }
    
    // Update payment status
    investment.paymentStatus = status;
    
    // If payment is confirmed, update investment status
    if (status === 'confirmed') {
      investment.status = 'active';
      
      // Update user's total invested amount
      const user = await User.findById(investment.user);
      user.totalInvested += investment.amount;
      await user.save();
      
      // Check if user was referred and create referral earning
      if (user.referredBy) {
        const referrer = await User.findById(user.referredBy);
        
        if (referrer) {
          // Calculate referral commission (5% of investment amount or from env)
          const referralPercentage = parseInt(process.env.REFERRAL_BONUS_PERCENTAGE) || 5;
          const referralAmount = investment.amount * referralPercentage / 100;
          
          // Create referral record
          await Referral.create({
            referrer: referrer._id,
            referee: user._id,
            investment: investment._id,
            amount: referralAmount,
            percentageEarned: referralPercentage,
            status: 'paid'
          });
          
          // Update referrer's balances - Add directly to withdrawable balance
          referrer.referralEarnings += referralAmount;
          referrer.referralBalance += referralAmount;
          referrer.withdrawableBalance += referralAmount;
          referrer.totalEarned += referralAmount;
          
          await referrer.save();
          
          // Create earning history record
          const EarningHistory = require('../models/EarningHistory');
          await EarningHistory.create({
            user: referrer._id,
            amount: referralAmount,
            type: 'referral',
            source: `Referral commission from ${user.name || user.email}`,
            status: 'completed',
            referral: user._id
          });
        }
      }
      
      await investment.save();
    }
    
    res.status(200).json({
      success: true,
      data: investment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}; 