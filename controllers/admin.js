const User = require('../models/User');
const Investment = require('../models/Investment');
const Withdrawal = require('../models/Withdrawal');
const Referral = require('../models/Referral');
const { investmentPlans } = require('../config/investmentPlans');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all investments
// @route   GET /api/admin/investments
// @access  Private/Admin
exports.getAllInvestments = async (req, res) => {
  try {
    const investments = await Investment.find()
      .populate({
        path: 'user',
        select: 'name email referralCode'
      })
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

// @desc    Get all withdrawals
// @route   GET /api/admin/withdrawals
// @access  Private/Admin
exports.getAllWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find()
      .populate({
        path: 'user',
        select: 'name email'
      })
      .sort({ requestedAt: -1 });
    
    res.status(200).json({
      success: true,
      count: withdrawals.length,
      data: withdrawals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Process withdrawal request
// @route   PUT /api/admin/withdrawal/:id
// @access  Private/Admin
exports.processWithdrawal = async (req, res) => {
  try {
    const { status, notes, transactionId } = req.body;
    
    if (!status || !['approved', 'rejected', 'completed', 'paid'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid status (approved, rejected, completed, or paid)'
      });
    }
    
    const withdrawal = await Withdrawal.findById(req.params.id);
    
    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found'
      });
    }
    
    // If withdrawal is already processed
    if (withdrawal.status !== 'pending' && withdrawal.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: `Withdrawal is already ${withdrawal.status}`
      });
    }
    
    // Update withdrawal
    withdrawal.status = status;
    withdrawal.notes = notes || withdrawal.notes;
    withdrawal.processedBy = req.user._id;
    withdrawal.processedAt = Date.now();
    
    if ((status === 'completed' || status === 'paid') && transactionId) {
      withdrawal.transactionId = transactionId;
    }
    
    // If status is paid, set the completedAt date
    if (status === 'paid') {
      withdrawal.completedAt = Date.now();
    }
    
    // If approved, completed or paid, update user's earnings
    if ((status === 'approved' || status === 'completed' || status === 'paid') && withdrawal.status === 'pending') {
      const user = await User.findById(withdrawal.user);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      if (withdrawal.type === 'investment') {
        user.totalEarned -= withdrawal.amount;
      } else if (withdrawal.type === 'referral') {
        user.totalReferralEarned -= withdrawal.amount;
      }
      
      await user.save();
    }
    
    // If rejected and was previously approved, refund the user
    if (status === 'rejected' && withdrawal.status === 'approved') {
      const user = await User.findById(withdrawal.user);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      if (withdrawal.type === 'investment') {
        user.totalEarned += withdrawal.amount;
      } else if (withdrawal.type === 'referral') {
        user.totalReferralEarned += withdrawal.amount;
      }
      
      await user.save();
    }
    
    await withdrawal.save();
    
    res.status(200).json({
      success: true,
      data: withdrawal,
      message: `Withdrawal ${status} successfully`
    });
  } catch (error) {
    console.error('Process withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update investment status
// @route   PUT /api/admin/investment/:id
// @access  Private/Admin
exports.updateInvestmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['active', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid status (active, completed, or cancelled)'
      });
    }
    
    const investment = await Investment.findById(req.params.id);
    
    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found'
      });
    }
    
    // Update investment
    investment.status = status;
    
    // If completing an investment, update user's earnings
    if (status === 'completed' && investment.status !== 'completed') {
      const user = await User.findById(investment.user);
      
      // Calculate profit
      const profit = investment.expectedReturn - investment.amount;
      
      // Add profit to user's earnings
      user.totalEarned += profit;
      
      // Set completion date
      investment.completedAt = Date.now();
      
      await user.save();
    }
    
    await investment.save();
    
    res.status(200).json({
      success: true,
      data: investment,
      message: `Investment status updated to ${status} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getAdminDashboard = async (req, res) => {
  try {
    // Total users
    const totalUsers = await User.countDocuments();
    
    // Total investments
    const totalInvestments = await Investment.countDocuments();
    
    // Active investments
    const activeInvestments = await Investment.countDocuments({ status: 'active' });
    
    // Total amount invested
    const investmentsData = await Investment.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);
    
    const totalAmountInvested = investmentsData.length > 0 ? investmentsData[0].totalAmount : 0;
    
    // Pending withdrawals
    const pendingWithdrawals = await Withdrawal.countDocuments({ status: 'pending' });
    
    // Recent users
    const recentUsers = await User.find()
      .select('name email referralCode createdAt')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Recent investments
    const recentInvestments = await Investment.find()
      .populate({
        path: 'user',
        select: 'name email'
      })
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Recent withdrawals
    const recentWithdrawals = await Withdrawal.find()
      .populate({
        path: 'user',
        select: 'name email'
      })
      .sort({ requestedAt: -1 })
      .limit(5);
    
    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalInvestments,
        activeInvestments,
        totalAmountInvested,
        pendingWithdrawals,
        recentUsers,
        recentInvestments,
        recentWithdrawals
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

// @desc    Update investment plan
// @route   PUT /api/admin/plans/:name
// @access  Private/Admin
exports.updateInvestmentPlan = async (req, res) => {
  try {
    const { roi, minAmount, maxAmount, duration } = req.body;
    const planName = req.params.name;
    
    // Find the plan
    const planIndex = investmentPlans.findIndex(p => p.name === planName);
    
    if (planIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Investment plan not found'
      });
    }
    
    // Update plan
    if (roi !== undefined) investmentPlans[planIndex].roi = roi;
    if (minAmount !== undefined) investmentPlans[planIndex].minAmount = minAmount;
    if (maxAmount !== undefined) investmentPlans[planIndex].maxAmount = maxAmount;
    if (duration !== undefined) investmentPlans[planIndex].duration = duration;
    
    res.status(200).json({
      success: true,
      data: investmentPlans[planIndex],
      message: 'Investment plan updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Verify investment payment
// @route   PUT /api/admin/investment/verify/:id
// @access  Private/Admin
exports.verifyInvestmentPayment = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    
    if (!status || !['confirmed', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid status (confirmed or rejected)'
      });
    }
    
    const investment = await Investment.findById(req.params.id);
    
    if (!investment) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found'
      });
    }
    
    // Ensure the investment is in pending state
    if (investment.paymentStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Investment payment is already ${investment.paymentStatus}`
      });
    }
    
    // Update payment status
    investment.paymentStatus = status;
    
    // If payment is rejected, add rejection reason
    if (status === 'rejected') {
      investment.rejectionReason = rejectionReason || 'Payment verification failed';
    }
    
    // If payment is confirmed, update investment status to active
    if (status === 'confirmed') {
      investment.status = 'active';
      
      // Set start and end dates
      investment.startDate = new Date();
      investment.endDate = new Date();
      investment.endDate.setDate(investment.endDate.getDate() + investment.duration);
      
      // Update user's total invested amount
      const user = await User.findById(investment.user);
      user.totalInvested += investment.amount;
      await user.save();
      
      // Check if user was referred and create referral earning
      if (user.referredBy) {
        const referrer = await User.findById(user.referredBy);
        
        if (referrer) {
          // Calculate referral bonus (default 5% or from env)
          const referralPercentage = parseInt(process.env.REFERRAL_BONUS_PERCENTAGE) || 5;
          const referralBonus = investment.amount * referralPercentage / 100;
          
          // Create referral record
          await Referral.create({
            referrer: referrer._id,
            referee: user._id,
            investment: investment._id,
            amount: referralBonus,
            percentageEarned: referralPercentage,
            status: 'paid'
          });
          
          // Update referrer's balances - Add directly to withdrawable balance
          referrer.referralEarnings += referralBonus;
          referrer.referralBalance += referralBonus;
          referrer.withdrawableBalance += referralBonus;
          referrer.totalEarned += referralBonus;
          
          await referrer.save();
          
          // Create an earning history record
          const EarningHistory = require('../models/EarningHistory');
          await EarningHistory.create({
            user: referrer._id,
            amount: referralBonus,
            type: 'referral',
            source: `Referral commission from ${user.name || user.email}`,
            status: 'completed',
            referral: user._id
          });
        }
      }
    }
    
    await investment.save();
    
    res.status(200).json({
      success: true,
      data: investment,
      message: `Investment payment ${status === 'confirmed' ? 'verified' : 'rejected'} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/user/toggle-active/:id
// @access  Private/Admin
exports.toggleUserActiveStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Don't allow deactivating admin accounts (optional security measure)
    if (user.isAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change active status of admin users'
      });
    }
    
    // Toggle the active status
    user.isActive = !user.isActive;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        userId: user._id,
        isActive: user.isActive
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

// @desc    Get system settings
// @route   GET /api/admin/settings
// @access  Private/Admin
exports.getSystemSettings = async (req, res) => {
  try {
    // Get the settings from the database
    // For now we'll return default settings
    res.status(200).json({
      success: true,
      data: {
        allowUserLogin: true,
        verifyTransactions: true,
        withdrawalsEnabled: true,
        registrationEnabled: true,
        minimumWithdrawal: 10,
        maintenanceMode: false,
        referralPercentage: 5
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

// @desc    Update system settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
exports.updateSystemSettings = async (req, res) => {
  try {
    // Update settings in the database
    // For now we'll just return the settings that were sent
    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: req.body
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}; 