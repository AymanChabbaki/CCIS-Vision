const express = require('express');
const router = express.Router();
const KpiController = require('../controllers/kpiController');
const { authenticateToken } = require('../middleware/auth');
const { isAdmin} = require('../middleware/authorize');

// ============================================================================
// PERIODS ROUTES
// ============================================================================

// Get all periods
router.get('/periods', authenticateToken, KpiController.getPeriods);

// Get active period
router.get('/periods/active', authenticateToken, KpiController.getActivePeriod);

// Create period (Admin only)
router.post('/periods', authenticateToken, isAdmin, KpiController.createPeriod);

// Update period (Admin only)
router.put('/periods/:id', authenticateToken, isAdmin, KpiController.updatePeriod);

// Delete period (Admin only)
router.delete('/periods/:id', authenticateToken, isAdmin, KpiController.deletePeriod);

// ============================================================================
// AUDIT CONTROL ROUTES
// ============================================================================

router.get('/audit-control/:periodId', authenticateToken, KpiController.getAuditControl);
router.post('/audit-control', authenticateToken, KpiController.upsertAuditControl);

// ============================================================================
// RELATIONS INSTITUTIONNELLES ROUTES
// ============================================================================

router.get('/relations-institutionnelles/:periodId', authenticateToken, KpiController.getRelationsInstitutionnelles);
router.post('/relations-institutionnelles', authenticateToken,  KpiController.upsertRelationsInstitutionnelles);

// ============================================================================
// SYNTHESE DEPARTEMENTS ROUTES
// ============================================================================

router.get('/synthese-departements/:periodId', authenticateToken, KpiController.getSyntheseDepartements);
router.post('/synthese-departements', authenticateToken,  KpiController.upsertSyntheseDepartements);

// ============================================================================
// ADMIN FINANCIER ROUTES
// ============================================================================

router.get('/admin-financier/:periodId', authenticateToken, KpiController.getAdminFinancier);
router.post('/admin-financier', authenticateToken,  KpiController.upsertAdminFinancier);

// ============================================================================
// APPUI PROMOTION ROUTES
// ============================================================================

router.get('/appui-promotion/:periodId', authenticateToken, KpiController.getAppuiPromotion);
router.post('/appui-promotion', authenticateToken,  KpiController.upsertAppuiPromotion);

// ============================================================================
// SERVICES RESSORTISSANTS ROUTES
// ============================================================================

router.get('/services-ressortissants/:periodId', authenticateToken, KpiController.getServicesRessortissants);
router.post('/services-ressortissants', authenticateToken, KpiController.upsertServicesRessortissants);

// ============================================================================
// STRATEGIE PARTENARIAT ROUTES
// ============================================================================

router.get('/strategie-partenariat/:periodId', authenticateToken, KpiController.getStrategiePartenariat);
router.post('/strategie-partenariat', authenticateToken, KpiController.upsertStrategiePartenariat);

// ============================================================================
// GET ALL KPIs FOR A PERIOD
// ============================================================================

router.get('/all/:periodId', authenticateToken, KpiController.getAllKpisByPeriod);

module.exports = router;
