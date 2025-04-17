const Investment = require('../models/Investment');
const User = require('../models/User');
const DailyEarning = require('../models/DailyEarning');
const mongoose = require('mongoose');

/**
 * Generates daily ROI earnings for all active investments
 * Earnings are immediately available for withdrawal
 */
const generateDailyROI = async () => {
  try {
    console.log('Starting daily ROI generation...');
    
    // Find all active investments
    const activeInvestments = await Investment.find({
      status: 'active',
      startDate: { $lte: new Date() },
      endDate: { $gt: new Date() }
    }).populate('user', '_id email');
    
    console.log(`Found ${activeInvestments.length} active investments for ROI generation`);
    
    let totalEarningsGenerated = 0;
    
    // Process each active investment
    for (const investment of activeInvestments) {
      const session = await mongoose.startSession();
      session.startTransaction();
      
      try {
        // Calculate daily ROI
        // ROI = investment amount * (ROI percentage / 100) / duration
        const dailyRoi = parseFloat(
          (investment.amount * (investment.returns / 100) / investment.duration).toFixed(6)
        );
        
        // Set release date to current date (immediate availability)
        const releaseDate = new Date();
        
        // Create daily earning record
        const dailyEarning = new DailyEarning({
          user: investment.user._id,
          investment: investment._id,
          amount: dailyRoi,
          releaseDate: releaseDate,
          status: 'released' // Set as already released
        });
        
        await dailyEarning.save({ session });
        
        // Update user's withdrawable balance directly
        const user = await User.findById(investment.user._id);
        user.withdrawableBalance += dailyRoi; // Add directly to withdrawable balance
        user.totalEarned += dailyRoi;
        user.totalRoiEarned += dailyRoi;
        await user.save({ session });
        
        totalEarningsGenerated += dailyRoi;
        
        // Commit transaction
        await session.commitTransaction();
        console.log(`Generated ROI of ${dailyRoi} for investment ${investment._id} (user: ${user.email})`);
      } catch (error) {
        // Abort transaction on error
        await session.abortTransaction();
        console.error(`Error generating ROI for investment ${investment._id}:`, error);
      } finally {
        session.endSession();
      }
    }
    
    console.log(`Daily ROI generation completed. Total ROI generated: $${totalEarningsGenerated.toFixed(2)}`);
    return { success: true, totalGenerated: totalEarningsGenerated, count: activeInvestments.length };
  } catch (error) {
    console.error('Error generating daily ROI:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Releases any pending earnings that might exist in the system
 * Note: This function is kept for backward compatibility, but
 * new earnings are now immediately added to withdrawable balance
 */
const releaseReadyEarnings = async () => {
  try {
    console.log('Starting release of ready earnings...');
    
    // Find all pending earnings
    const readyEarnings = await DailyEarning.find({
      status: 'pending'
    }).populate('user', '_id email');
    
    console.log(`Found ${readyEarnings.length} earnings ready to be released`);
    
    let totalReleased = 0;
    
    // Process each ready earning
    for (const earning of readyEarnings) {
      const session = await mongoose.startSession();
      session.startTransaction();
      
      try {
        // Update earning status
        earning.status = 'released';
        earning.releasedAt = new Date();
        await earning.save({ session });
        
        // Update user balances
        const user = await User.findById(earning.user._id);
        user.pendingBalance -= earning.amount;
        user.withdrawableBalance += earning.amount;
        await user.save({ session });
        
        totalReleased += earning.amount;
        
        // Commit transaction
        await session.commitTransaction();
        console.log(`Released earning of ${earning.amount} for user ${user.email}`);
      } catch (error) {
        // Abort transaction on error
        await session.abortTransaction();
        console.error(`Error releasing earning ${earning._id}:`, error);
      } finally {
        session.endSession();
      }
    }
    
    console.log(`Release process completed. Total released: $${totalReleased.toFixed(2)}`);
    return { success: true, totalReleased, count: readyEarnings.length };
  } catch (error) {
    console.error('Error releasing ready earnings:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateDailyROI,
  releaseReadyEarnings
}; 