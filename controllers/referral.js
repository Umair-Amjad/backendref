const User = require('../models/User');
const Referral = require('../models/Referral');

// @desc    Get user's referrals
// @route   GET /api/referral
// @access  Private
exports.getUserReferrals = async (req, res) => {
  try {
    // Find all users who were referred by current user
    const referredUsers = await User.find({ referredBy: req.user._id })
      .select('name email totalInvested createdAt');
    
    if (!referredUsers) {
      return res.status(404).json({
        success: false,
        message: 'No referrals found'
      });
    }
    
    res.status(200).json({
      success: true,
      count: referredUsers.length,
      data: referredUsers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user's referral earnings
// @route   GET /api/referral/earnings
// @access  Private
exports.getReferralEarnings = async (req, res) => {
  try {
    // Find all referral records for the current user
    const referrals = await Referral.find({ referrer: req.user._id })
      .populate({
        path: 'referee',
        select: 'name email'
      })
      .populate({
        path: 'investment',
        select: 'amount plan'
      })
      .sort({ createdAt: -1 });
    
    // Calculate total pending and paid earnings
    const pendingEarnings = referrals
      .filter(ref => ref.status === 'pending')
      .reduce((total, ref) => total + ref.amount, 0);
    
    const paidEarnings = referrals
      .filter(ref => ref.status === 'paid')
      .reduce((total, ref) => total + ref.amount, 0);
    
    // Get the available balance for withdrawal
    const availableEarnings = req.user.referralBalance || 0;
    
    res.status(200).json({
      success: true,
      data: {
        referrals: referrals.map(ref => ({
          _id: ref._id,
          referee: ref.referee,
          investment: ref.investment,
          amount: ref.amount,
          percentageEarned: ref.percentageEarned,
          status: ref.status,
          createdAt: ref.createdAt
        })),
        totalEarnings: req.user.totalReferralEarned || req.user.referralEarnings || 0,
        pendingEarnings,
        paidEarnings,
        availableEarnings,
        minimumWithdrawalAmount: process.env.MINIMUM_WITHDRAWAL || 50
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}; 