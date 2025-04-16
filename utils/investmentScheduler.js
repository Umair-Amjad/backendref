const mongoose = require('mongoose');
const Investment = mongoose.model('Investment');
const User = mongoose.model('User');

/**
 * Updates investment statuses based on their end dates
 * This function should be called by a scheduler/cron job
 */
const updateInvestmentStatuses = async () => {
  try {
    console.log('Running investment status update job...');
    
    // Find active investments that have reached their end date
    const investmentsToComplete = await Investment.find({
      status: 'active',
      endDate: { $lte: new Date() }
    });
    
    console.log(`Found ${investmentsToComplete.length} investments to complete`);
    
    // Process each completed investment
    for (const investment of investmentsToComplete) {
      try {
        // Update investment status
        investment.status = 'completed';
        investment.completedAt = new Date();
        
        // Calculate profit
        const profit = investment.expectedReturn - investment.amount;
        
        // Find the user
        const user = await User.findById(investment.user);
        
        if (user) {
          // Add profit to user's earnings
          user.totalEarned += profit;
          
          // Update user's balance with the total return
          user.balance += investment.expectedReturn;
          
          await user.save();
          console.log(`Updated user ${user._id} with profit ${profit} and return ${investment.expectedReturn}`);
        } else {
          console.error(`User not found for investment ${investment._id}`);
        }
        
        await investment.save();
        console.log(`Completed investment ${investment._id}`);
      } catch (err) {
        console.error(`Error updating investment ${investment._id}:`, err);
      }
    }
    
    console.log('Investment status update job completed');
    return { completed: investmentsToComplete.length };
  } catch (error) {
    console.error('Error in updateInvestmentStatuses:', error);
    throw error;
  }
};

module.exports = {
  updateInvestmentStatuses
}; 