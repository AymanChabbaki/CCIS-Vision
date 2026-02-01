const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

// Routes
router.use(authenticate);

router.get('/overview', authorize('admin', 'service_user', 'viewer'), dashboardController.getDashboardOverview);
router.get('/kpis', authorize('admin', 'service_user', 'viewer'), dashboardController.getKPIs);
router.get('/map', authorize('admin', 'service_user', 'viewer'), dashboardController.getCompaniesMap);
router.get('/data-quality', authorize('admin', 'service_user', 'viewer'), dashboardController.getDataQualityOverview);
router.get('/financial', authorize('admin', 'service_user'), dashboardController.getFinancialAnalytics);
router.get('/participants', authorize('admin', 'service_user', 'viewer'), dashboardController.getParticipantAnalytics);

module.exports = router;
