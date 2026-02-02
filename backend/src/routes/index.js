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
const kpiRoutes = require('./kpiRoutes');

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
