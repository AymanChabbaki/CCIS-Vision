const cron = require('node-cron');
const { runAllAlertChecks } = require('../services/alertService');
const logger = require('../utils/logger');

/**
 * Initialize scheduled jobs
 */
const initializeScheduledJobs = () => {
  // Run alert checks every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    logger.info('Running scheduled alert checks (daily 9:00 AM)...');
    try {
      await runAllAlertChecks();
    } catch (error) {
      logger.error('Error in scheduled alert checks:', error);
    }
  });

  // Run alert checks every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    logger.info('Running scheduled alert checks (every 6 hours)...');
    try {
      await runAllAlertChecks();
    } catch (error) {
      logger.error('Error in scheduled alert checks:', error);
    }
  });

  logger.info('Scheduled jobs initialized:');
  logger.info('- Daily alert checks at 9:00 AM');
  logger.info('- Alert checks every 6 hours');
};

module.exports = {
  initializeScheduledJobs,
};
