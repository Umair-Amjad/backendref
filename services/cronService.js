const cron = require('node-cron');
const updateInvestmentStatuses = require('../utils/updateInvestmentStatuses');
const { generateDailyROI, releaseReadyEarnings } = require('../utils/dailyRoiGenerator');

/**
 * Initializes and schedules all cron jobs for the application
 */
const initCronJobs = () => {
  // Schedule investment status updates to run daily at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('Running scheduled task: Update Investment Statuses');
    try {
      const result = await updateInvestmentStatuses();
      console.log('Scheduled task completed with result:', result);
    } catch (error) {
      console.error('Error in scheduled investment update task:', error);
    }
  });
  
  // Schedule daily ROI generation to run every day at 00:15
  cron.schedule('15 0 * * *', async () => {
    console.log('Running scheduled task: Generate Daily ROI');
    try {
      const result = await generateDailyROI();
      console.log('Daily ROI generation task completed with result:', result);
    } catch (error) {
      console.error('Error in daily ROI generation task:', error);
    }
  });
  
  // Schedule release of ready earnings to run every day at 00:30
  cron.schedule('30 0 * * *', async () => {
    console.log('Running scheduled task: Release Ready Earnings');
    try {
      const result = await releaseReadyEarnings();
      console.log('Release earnings task completed with result:', result);
    } catch (error) {
      console.error('Error in release earnings task:', error);
    }
  });
  
  console.log('All cron jobs initialized successfully');
};

module.exports = { initCronJobs }; 