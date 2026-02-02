const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const companyRoutes = require('./company.routes');
const activityRoutes = require('./activity.routes');
const excelRoutes = require('./excel.routes');
const dashboardRoutes = require('./dashboard.routes');
const alertRoutes = require('./alert.routes');
const userRoutes = require('./user.routes');
const chatbotRoutes = require('./chatbot.routes');

// Try to import KPI routes with error handling
let kpiRoutes;
try {
  kpiRoutes = require('./kpiRoutes');
} catch (error) {
  console.error('ERROR: Failed to load KPI routes:', error.message);
  console.error('Stack:', error.stack);
  // Create a dummy router that returns an error message
  const express = require('express');
  kpiRoutes = express.Router();
  kpiRoutes.all('*', (req, res) => {
    res.status(503).json({
      status: 'error',
      message: 'KPI routes failed to load',
      error: error.message
    });
  });
}

// Mount routes
router.use('/auth', authRoutes);
router.use('/companies', companyRoutes);
router.use('/activities', activityRoutes);
router.use('/excel', excelRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/alerts', alertRoutes);
router.use('/users', userRoutes);
router.use('/chatbot', chatbotRoutes);
router.use('/kpis', kpiRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'CCIS-Vision API is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
