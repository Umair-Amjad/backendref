const User = require('../models/User');
const Investment = require('../models/Investment');
const Referral = require('../models/Referral');

// @desc    Get user profile
// @route   GET /api/user/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        referralCode: user.referralCode,
        totalInvested: user.totalInvested,
        totalEarned: user.totalEarned,
        totalReferralEarned: user.totalReferralEarned,
        isVerified: user.isVerified,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt
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

// @desc    Update user profile
// @route   PUT /api/user/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone },
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        referralCode: updatedUser.referralCode,
        createdAt: updatedUser.createdAt
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user referral info
// @route   GET /api/user/referral
// @access  Private
exports.getReferralInfo = async (req, res) => {
  try {
    const referrals = await User.find({ referredBy: req.user._id });
    
    // Get referral earnings
    const referralEarnings = await Referral.find({ referrer: req.user._id });
    
    // Get count of successful investments from referred users
    const referralInvestmentsCount = await Investment.countDocuments({
      user: { $in: referrals.map(r => r._id) },
      status: 'active'
    });
    
    res.status(200).json({
      success: true,
      data: {
        referralCode: req.user.referralCode,
        referralLink: `${req.protocol}://${req.get('host')}/register?ref=${req.user.referralCode}`,
        referralsCount: referrals.length,
        referralInvestmentsCount,
        totalReferralEarned: req.user.totalReferralEarned,
        referralEarnings: referralEarnings.map(earning => ({
          _id: earning._id,
          amount: earning.amount,
          status: earning.status,
          date: earning.createdAt
        }))
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

// @desc    Get user dashboard stats
// @route   GET /api/user/dashboard
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    // Get all active investments
    const activeInvestments = await Investment.find({
      user: req.user._id,
      status: 'active'
    });
    
    // Calculate total active investment amount
    const totalActiveInvestment = activeInvestments.reduce(
      (total, inv) => total + inv.amount,
      0
    );
    
    // Calculate total expected return from active investments
    const totalExpectedReturn = activeInvestments.reduce(
      (total, inv) => total + inv.expectedReturn,
      0
    );
    
    // Get recent investments
    const recentInvestments = await Investment.find({
      user: req.user._id
    })
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get referral count
    const referralsCount = await User.countDocuments({
      referredBy: req.user._id
    });
    
    // Get pending daily earnings
    const DailyEarning = require('../models/DailyEarning');
    const pendingEarnings = await DailyEarning.find({
      user: req.user._id,
      status: 'pending'
    }).sort({ releaseDate: 1 });
    
    // Calculate total pending earnings
    const totalPendingAmount = pendingEarnings.reduce(
      (total, earning) => total + earning.amount,
      0
    );
    
    // Get the user
    const user = await User.findById(req.user._id);
    
    res.status(200).json({
      success: true,
      data: {
        totalInvested: req.user.totalInvested,
        totalEarned: req.user.totalEarned,
        totalRoiEarned: user.totalRoiEarned || 0,
        totalReferralEarned: req.user.totalReferralEarned || user.referralEarnings || 0,
        withdrawableBalance: user.withdrawableBalance || 0,
        pendingBalance: user.pendingBalance || 0,
        referralBalance: user.referralBalance || 0,
        totalWithdrawable: (user.withdrawableBalance || 0) + (user.referralBalance || 0),
        totalPendingEarnings: totalPendingAmount,
        totalActiveInvestment,
        totalExpectedReturn,
        activeInvestmentsCount: activeInvestments.length,
        referralsCount,
        recentInvestments: recentInvestments.map(inv => ({
          _id: inv._id,
          amount: inv.amount,
          plan: inv.plan,
          roi: inv.roi,
          expectedReturn: inv.expectedReturn,
          status: inv.status,
          createdAt: inv.createdAt
        }))
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

// @desc    Get user's referrals
// @route   GET /api/user/referrals
// @access  Private
exports.getReferrals = async (req, res) => {
  try {
    const referrals = await User.find({ referredBy: req.user._id })
      .select('name email isVerified referralCode createdAt')
      .sort({ createdAt: -1 });
    
    const referralData = await Promise.all(
      referrals.map(async (referral) => {
        // Get investment data for each referral
        const investments = await Investment.find({ user: referral._id });
        const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
        
        // Get referral earnings from this user
        const earnings = await Referral.find({ 
          referrer: req.user._id,
          referee: referral._id
        });
        const totalEarned = earnings.reduce((sum, earning) => sum + earning.amount, 0);
        
        return {
          _id: referral._id,
          name: referral.name,
          email: referral.email,
          isVerified: referral.isVerified,
          joinedDate: referral.createdAt,
          totalInvested,
          totalEarned
        };
      })
    );
    
    res.status(200).json({
      success: true,
      count: referrals.length,
      data: referralData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user's referral tree
// @route   GET /api/user/referral-tree
// @access  Private
exports.getReferralTree = async (req, res) => {
  try {
    // Function to recursively build referral tree
    const buildReferralTree = async (userId, level = 0) => {
      const user = await User.findById(userId).select('name referralCode');
      
      if (!user) {
        return null;
      }
      
      const directReferrals = await User.find({ referredBy: userId })
        .select('name referralCode')
        .sort({ createdAt: -1 });
      
      const children = await Promise.all(
        directReferrals.map(async (referral) => {
          // Only go to next level if we're not too deep (to prevent infinite recursion)
          if (level < 2) {
            return await buildReferralTree(referral._id, level + 1);
          } else {
            // At level 2, just return user info without their children
            return {
              _id: referral._id,
              name: referral.name,
              referralCode: referral.referralCode,
              children: []
            };
          }
        })
      );
      
      return {
        _id: user._id,
        name: user.name,
        referralCode: user.referralCode,
        children
      };
    };
    
    const referralTree = await buildReferralTree(req.user._id);
    
    res.status(200).json({
      success: true,
      data: referralTree
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
// @route   GET /api/user/referral-earnings
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
    
    // Calculate available earnings (what can be withdrawn)
    const availableEarnings = req.user.referralBalance || req.user.totalReferralEarned;
    
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
        totalEarnings: req.user.totalReferralEarned,
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

// @desc    Get user's earning history
// @route   GET /api/user/earning-history
// @access  Private
exports.getEarningHistory = async (req, res) => {
  try {
    // First check if we have data in the EarningHistory model
    const EarningHistory = require('../models/EarningHistory');
    const earningHistoryExists = await EarningHistory.exists({ user: req.user._id });
    
    // If we have data in the new model, use it
    if (earningHistoryExists) {
      const earningHistory = await EarningHistory.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .populate({
          path: 'referral',
          populate: {
            path: 'referee',
            select: 'name email'
          }
        })
        .populate('investment');
      
      return res.status(200).json({
        success: true,
        data: earningHistory,
        stats: {
          totalEarned: req.user.totalEarned,
          totalReferralEarned: req.user.totalReferralEarned,
          totalInvestmentEarned: req.user.totalEarned - req.user.totalReferralEarned
        }
      });
    }
    
    // Fallback to legacy approach if no records in new model
    // Get investment earnings
    const investments = await Investment.find({
      user: req.user._id,
      status: { $in: ['completed', 'active'] }
    }).sort({ createdAt: -1 });
    
    const investmentEarnings = investments.map(investment => ({
      _id: investment._id,
      type: 'investment',
      amount: investment.profit || (investment.amount * (investment.roi / 100)),
      source: investment.plan,
      status: investment.status,
      createdAt: investment.createdAt
    }));
    
    // Get referral earnings
    const referralEarnings = await Referral.find({
      referrer: req.user._id
    })
    .populate({
      path: 'referee',
      select: 'name email'
    })
    .sort({ createdAt: -1 });
    
    const formattedReferralEarnings = referralEarnings.map(earning => ({
      _id: earning._id,
      type: 'referral',
      amount: earning.amount,
      source: earning.referee ? `Referral: ${earning.referee.name || earning.referee.email}` : 'Referral bonus',
      status: earning.status,
      createdAt: earning.createdAt
    }));
    
    // Combine and sort by date
    const allEarnings = [...investmentEarnings, ...formattedReferralEarnings]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Migrate data to the new model (in background)
    try {
      const earningRecords = [];
      
      // Create investment earning records
      for (const investment of investments) {
        // Fix the calculation to avoid NaN
        let amount = 0;
        if (investment.profit && !isNaN(investment.profit)) {
          amount = investment.profit;
        } else if (investment.amount && investment.roi && !isNaN(investment.amount) && !isNaN(investment.roi)) {
          amount = investment.amount * (investment.roi / 100);
        }
        
        // Only add to records if amount is a valid number
        if (!isNaN(amount) && amount > 0) {
          earningRecords.push({
            user: req.user._id,
            amount, // Now we're sure this is a valid number
            type: 'investment',
            source: investment.plan,
            status: investment.status === 'active' ? 'pending' : 'completed',
            investment: investment._id,
            description: `Investment earnings from ${investment.plan} plan`,
            createdAt: investment.createdAt
          });
        }
      }
      
      // Create referral earning records
      for (const earning of referralEarnings) {
        // Make sure amount is a valid number
        if (earning.amount && !isNaN(earning.amount)) {
          earningRecords.push({
            user: req.user._id,
            amount: earning.amount,
            type: 'referral',
            source: earning.referee ? `Referral: ${earning.referee.name || earning.referee.email}` : 'Referral bonus',
            status: earning.status === 'paid' ? 'completed' : 'pending',
            referral: earning._id,
            description: 'Earnings from referral commission',
            createdAt: earning.createdAt
          });
        }
      }
      
      // Bulk insert all earning records
      if (earningRecords.length > 0) {
        await EarningHistory.insertMany(earningRecords);
      }
    } catch (migrationError) {
      console.error('Error migrating to EarningHistory model:', migrationError);
      // Don't let migration error affect response
    }
    
    res.status(200).json({
      success: true,
      data: allEarnings,
      stats: {
        totalEarned: req.user.totalEarned,
        totalReferralEarned: req.user.totalReferralEarned,
        totalInvestmentEarned: req.user.totalEarned - req.user.totalReferralEarned
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

// Helper function to record an earning in the history
exports.recordEarning = async (user, amount, type, source, status = 'completed', relatedDoc = null, description = '') => {
  try {
    const EarningHistory = require('../models/EarningHistory');
    
    // Validate amount to prevent NaN
    if (amount === undefined || amount === null || isNaN(amount)) {
      console.warn(`Invalid amount value: ${amount} for user ${user._id}`);
      return false;
    }
    
    const earningRecord = {
      user: user._id,
      amount: Number(amount), // Ensure it's a number
      type,
      source,
      status,
      description
    };
    
    // Add reference to related document if provided
    if (relatedDoc) {
      if (type === 'referral') {
        earningRecord.referral = relatedDoc._id;
      } else if (type === 'investment') {
        earningRecord.investment = relatedDoc._id;
      }
    }
    
    await EarningHistory.create(earningRecord);
    
    return true;
  } catch (error) {
    console.error('Error recording earning:', error);
    return false;
  }
}; 