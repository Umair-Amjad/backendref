const Investment = require('../models/Investment');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Updates investment statuses daily
 * - Marks completed investments that have reached their duration
 * - Credits profits to user accounts
 */
const updateInvestmentStatuses = async () => {
  try {
    console.log('Starting daily investment status update...');
    
    // Find active investments that have completed their duration
    const currentDate = new Date();
    const completedInvestments = await Investment.find({
      status: 'active',
      endDate: { $lte: currentDate }
    });
    
    console.log(`Found ${completedInvestments.length} investments ready for completion`);
    
    // Process each completed investment
    for (const investment of completedInvestments) {
      const session = await mongoose.startSession();
      session.startTransaction();
      
      try {
        // Calculate profit
        const profitAmount = parseFloat(investment.profit);
        
        // Update investment status
        investment.status = 'completed';
        investment.completedAt = currentDate;
        await investment.save({ session });
        
        // Update user balance
        const user = await User.findById(investment.user);
        if (!user) {
          throw new Error(`User not found for investment: ${investment._id}`);
        }
        
        user.balance += profitAmount + parseFloat(investment.amount);
        await user.save({ session });
        
        // Commit transaction
        await session.commitTransaction();
        console.log(`Successfully completed investment ${investment._id} for user ${user.email}`);
      } catch (error) {
        // Abort transaction on error
        await session.abortTransaction();
        console.error(`Error processing investment ${investment._id}:`, error);
      } finally {
        session.endSession();
      }
    }
    
    console.log('Investment status update completed successfully');
    return { success: true, processed: completedInvestments.length };
  } catch (error) {
    console.error('Error updating investment statuses:', error);
    return { success: false, error: error.message };
  }
};

module.exports = updateInvestmentStatuses; 