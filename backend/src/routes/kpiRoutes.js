const express = require('express');
const router = express.Router();
const KpiController = require('../controllers/kpiController');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/rbac');

// ============================================================================
// PERIODS ROUTES
// ============================================================================

// Get all periods
router.get('/periods', authenticateToken, KpiController.getPeriods);

// Get active period
router.get('/periods/active', authenticateToken, KpiController.getActivePeriod);

// Create period (Admin only)
router.post('/periods', authenticateToken, checkRole(['Admin']), KpiController.createPeriod);

// Update period (Admin only)
router.put('/periods/:id', authenticateToken, checkRole(['Admin']), KpiController.updatePeriod);

// Delete period (Admin only)
router.delete('/periods/:id', authenticateToken, checkRole(['Admin']), KpiController.deletePeriod);

// ============================================================================
// AUDIT CONTROL ROUTES
// ============================================================================

router.get('/audit-control/:periodId', authenticateToken, KpiController.getAuditControl);
router.post('/audit-control', authenticateToken, checkRole(['Admin', 'Gestionnaire']), KpiController.upsertAuditControl);

// ============================================================================
// RELATIONS INSTITUTIONNELLES ROUTES
// ============================================================================

router.get('/relations-institutionnelles/:periodId', authenticateToken, KpiController.getRelationsInstitutionnelles);
router.post('/relations-institutionnelles', authenticateToken, checkRole(['Admin', 'Gestionnaire']), KpiController.upsertRelationsInstitutionnelles);

// ============================================================================
// SYNTHESE DEPARTEMENTS ROUTES
// ============================================================================

router.get('/synthese-departements/:periodId', authenticateToken, KpiController.getSyntheseDepartements);
router.post('/synthese-departements', authenticateToken, checkRole(['Admin', 'Gestionnaire']), KpiController.upsertSyntheseDepartements);

// ============================================================================
// ADMIN FINANCIER ROUTES
// ============================================================================

router.get('/admin-financier/:periodId', authenticateToken, KpiController.getAdminFinancier);
router.post('/admin-financier', authenticateToken, checkRole(['Admin', 'Gestionnaire']), KpiController.upsertAdminFinancier);

// ============================================================================
// APPUI PROMOTION ROUTES
// ============================================================================

router.get('/appui-promotion/:periodId', authenticateToken, KpiController.getAppuiPromotion);
router.post('/appui-promotion', authenticateToken, checkRole(['Admin', 'Gestionnaire']), KpiController.upsertAppuiPromotion);

// ============================================================================
// SERVICES RESSORTISSANTS ROUTES
// ============================================================================

router.get('/services-ressortissants/:periodId', authenticateToken, KpiController.getServicesRessortissants);
router.post('/services-ressortissants', authenticateToken, checkRole(['Admin', 'Gestionnaire']), KpiController.upsertServicesRessortissants);

// ============================================================================
// STRATEGIE PARTENARIAT ROUTES
// ============================================================================

router.get('/strategie-partenariat/:periodId', authenticateToken, KpiController.getStrategiePartenariat);
router.post('/strategie-partenariat', authenticateToken, checkRole(['Admin', 'Gestionnaire']), KpiController.upsertStrategiePartenariat);

// ============================================================================
// GET ALL KPIs FOR A PERIOD
// ============================================================================

router.get('/all/:periodId', authenticateToken, KpiController.getAllKpisByPeriod);

module.exports = router;
