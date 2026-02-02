const express = require('express');
const router = express.Router();
const KpiController = require('../controllers/kpiController');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/authorize');

// Detailed diagnostic logging
console.log('=== KPI Routes Loading ===');
console.log('KpiController type:', typeof KpiController);
console.log('KpiController is null?', KpiController === null);
console.log('KpiController is undefined?', KpiController === undefined);
console.log('KpiController.constructor.name:', KpiController?.constructor?.name);
console.log('KpiController.getPeriods type:', typeof KpiController?.getPeriods);
console.log('KpiController methods:', KpiController ? Object.getOwnPropertyNames(KpiController).filter(m => typeof KpiController[m] === 'function') : 'N/A');
console.log('authenticate type:', typeof authenticate);
console.log('isAdmin type:', typeof isAdmin);

// Verify controller loaded correctly
if (!KpiController || !KpiController.getPeriods) {
  console.error('❌ CRITICAL ERROR: KpiController not loaded properly!');
  console.error('KpiController:', KpiController);
  throw new Error('KpiController.getPeriods is undefined - cannot create routes');
}

// ============================================================================
// PERIODS ROUTES
// ============================================================================

// Get all periods
router.get('/periods', authenticate, KpiController.getPeriods);

// Get active period
router.get('/periods/active', authenticate, KpiController.getActivePeriod);

// Create period (Admin only)
router.post('/periods', authenticate, isAdmin, KpiController.createPeriod);

// Update period (Admin only)
router.put('/periods/:id', authenticate, isAdmin, KpiController.updatePeriod);

// Delete period (Admin only)
router.delete('/periods/:id', authenticate, isAdmin, KpiController.deletePeriod);

// ============================================================================
// AUDIT CONTROL ROUTES
// ============================================================================

router.get('/audit-control/:periodId', authenticate, KpiController.getAuditControl);
router.post('/audit-control', authenticate, KpiController.upsertAuditControl);

// ============================================================================
// RELATIONS INSTITUTIONNELLES ROUTES
// ============================================================================

router.get('/relations-institutionnelles/:periodId', authenticate, KpiController.getRelationsInstitutionnelles);
router.post('/relations-institutionnelles', authenticate,  KpiController.upsertRelationsInstitutionnelles);

// ============================================================================
// SYNTHESE DEPARTEMENTS ROUTES
// ============================================================================

router.get('/synthese-departements/:periodId', authenticate, KpiController.getSyntheseDepartements);
router.post('/synthese-departements', authenticate,  KpiController.upsertSyntheseDepartements);

// ============================================================================
// ADMIN FINANCIER ROUTES
// ============================================================================

router.get('/admin-financier/:periodId', authenticate, KpiController.getAdminFinancier);
router.post('/admin-financier', authenticate,  KpiController.upsertAdminFinancier);

// ============================================================================
// APPUI PROMOTION ROUTES
// ============================================================================

router.get('/appui-promotion/:periodId', authenticate, KpiController.getAppuiPromotion);
router.post('/appui-promotion', authenticate,  KpiController.upsertAppuiPromotion);

// ============================================================================
// SERVICES RESSORTISSANTS ROUTES
// ============================================================================

router.get('/services-ressortissants/:periodId', authenticate, KpiController.getServicesRessortissants);
router.post('/services-ressortissants', authenticate, KpiController.upsertServicesRessortissants);

// ============================================================================
// STRATEGIE PARTENARIAT ROUTES
// ============================================================================

router.get('/strategie-partenariat/:periodId', authenticate, KpiController.getStrategiePartenariat);
router.post('/strategie-partenariat', authenticate, KpiController.upsertStrategiePartenariat);

// ============================================================================
// GET ALL KPIs FOR A PERIOD
// ============================================================================

router.get('/all/:periodId', authenticate, KpiController.getAllKpisByPeriod);

// Health check for KPI routes
router.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'KPI routes are working',
    note: 'Run database/kpis_schema.sql on Neon to activate KPI features'
  });
});

module.exports = router;
