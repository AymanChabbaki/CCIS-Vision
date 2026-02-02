const KpiPeriodModel = require('../models/kpiPeriodModel');
const KpiAuditControlModel = require('../models/kpiAuditControlModel');
const KpiModel = require('../models/kpiModel');

class KpiController {
  // ============================================================================
  // PERIODS
  // ============================================================================

  // Get all periods
  static async getPeriods(req, res) {
    try {
      const { type, is_active } = req.query;
      const filters = {};
      
      if (type) filters.type = type;
      if (is_active !== undefined) filters.is_active = is_active === 'true';

      const periods = await KpiPeriodModel.findAll(filters);
      
      res.json({
        status: 'success',
        data: periods
      });
    } catch (error) {
      console.error('Error fetching periods:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la récupération des périodes'
      });
    }
  }

  // Get active period
  static async getActivePeriod(req, res) {
    try {
      const { type = 'quarterly' } = req.query;
      const period = await KpiPeriodModel.getActivePeriod(type);
      
      if (!period) {
        return res.status(404).json({
          status: 'error',
          message: 'Aucune période active trouvée'
        });
      }

      res.json({
        status: 'success',
        data: period
      });
    } catch (error) {
      console.error('Error fetching active period:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la récupération de la période active'
      });
    }
  }

  // Create period
  static async createPeriod(req, res) {
    try {
      const period = await KpiPeriodModel.create(req.body);
      
      res.status(201).json({
        status: 'success',
        data: period
      });
    } catch (error) {
      console.error('Error creating period:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la création de la période'
      });
    }
  }

  // Update period
  static async updatePeriod(req, res) {
    try {
      const { id } = req.params;
      const period = await KpiPeriodModel.update(id, req.body);
      
      if (!period) {
        return res.status(404).json({
          status: 'error',
          message: 'Période non trouvée'
        });
      }

      res.json({
        status: 'success',
        data: period
      });
    } catch (error) {
      console.error('Error updating period:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la mise à jour de la période'
      });
    }
  }

  // Delete period
  static async deletePeriod(req, res) {
    try {
      const { id } = req.params;
      await KpiPeriodModel.delete(id);
      
      res.json({
        status: 'success',
        message: 'Période supprimée avec succès'
      });
    } catch (error) {
      console.error('Error deleting period:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la suppression de la période'
      });
    }
  }

  // ============================================================================
  // AUDIT CONTROL
  // ============================================================================

  static async getAuditControl(req, res) {
    try {
      const { periodId } = req.params;
      const kpi = await KpiAuditControlModel.findByPeriod(periodId);
      
      res.json({
        status: 'success',
        data: kpi || {}
      });
    } catch (error) {
      console.error('Error fetching audit control KPIs:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la récupération des KPIs'
      });
    }
  }

  static async upsertAuditControl(req, res) {
    try {
      const userId = req.user.id;
      const kpi = await KpiAuditControlModel.upsert(req.body, userId);
      
      res.json({
        status: 'success',
        data: kpi
      });
    } catch (error) {
      console.error('Error upserting audit control KPIs:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la sauvegarde des KPIs'
      });
    }
  }

  // ============================================================================
  // RELATIONS INSTITUTIONNELLES
  // ============================================================================

  static async getRelationsInstitutionnelles(req, res) {
    try {
      const { periodId } = req.params;
      const kpi = await KpiModel.getRelationsInstitutionnelles(periodId);
      
      res.json({
        status: 'success',
        data: kpi || {}
      });
    } catch (error) {
      console.error('Error fetching relations institutionnelles KPIs:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la récupération des KPIs'
      });
    }
  }

  static async upsertRelationsInstitutionnelles(req, res) {
    try {
      const userId = req.user.id;
      const kpi = await KpiModel.upsertRelationsInstitutionnelles(req.body, userId);
      
      res.json({
        status: 'success',
        data: kpi
      });
    } catch (error) {
      console.error('Error upserting relations institutionnelles KPIs:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la sauvegarde des KPIs'
      });
    }
  }

  // ============================================================================
  // SYNTHESE DEPARTEMENTS
  // ============================================================================

  static async getSyntheseDepartements(req, res) {
    try {
      const { periodId } = req.params;
      const kpi = await KpiModel.getSyntheseDepartements(periodId);
      
      res.json({
        status: 'success',
        data: kpi || {}
      });
    } catch (error) {
      console.error('Error fetching synthese KPIs:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la récupération des KPIs'
      });
    }
  }

  static async upsertSyntheseDepartements(req, res) {
    try {
      const userId = req.user.id;
      const kpi = await KpiModel.upsertSyntheseDepartements(req.body, userId);
      
      res.json({
        status: 'success',
        data: kpi
      });
    } catch (error) {
      console.error('Error upserting synthese KPIs:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la sauvegarde des KPIs'
      });
    }
  }

  // ============================================================================
  // ADMIN FINANCIER
  // ============================================================================

  static async getAdminFinancier(req, res) {
    try {
      const { periodId } = req.params;
      const kpi = await KpiModel.getAdminFinancier(periodId);
      
      res.json({
        status: 'success',
        data: kpi || {}
      });
    } catch (error) {
      console.error('Error fetching admin financier KPIs:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la récupération des KPIs'
      });
    }
  }

  static async upsertAdminFinancier(req, res) {
    try {
      const userId = req.user.id;
      const kpi = await KpiModel.upsertAdminFinancier(req.body, userId);
      
      res.json({
        status: 'success',
        data: kpi
      });
    } catch (error) {
      console.error('Error upserting admin financier KPIs:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la sauvegarde des KPIs'
      });
    }
  }

  // ============================================================================
  // APPUI PROMOTION
  // ============================================================================

  static async getAppuiPromotion(req, res) {
    try {
      const { periodId } = req.params;
      const kpi = await KpiModel.getAppuiPromotion(periodId);
      
      res.json({
        status: 'success',
        data: kpi || {}
      });
    } catch (error) {
      console.error('Error fetching appui promotion KPIs:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la récupération des KPIs'
      });
    }
  }

  static async upsertAppuiPromotion(req, res) {
    try {
      const userId = req.user.id;
      const kpi = await KpiModel.upsertAppuiPromotion(req.body, userId);
      
      res.json({
        status: 'success',
        data: kpi
      });
    } catch (error) {
      console.error('Error upserting appui promotion KPIs:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la sauvegarde des KPIs'
      });
    }
  }

  // ============================================================================
  // SERVICES RESSORTISSANTS
  // ============================================================================

  static async getServicesRessortissants(req, res) {
    try {
      const { periodId } = req.params;
      const kpi = await KpiModel.getServicesRessortissants(periodId);
      
      res.json({
        status: 'success',
        data: kpi || {}
      });
    } catch (error) {
      console.error('Error fetching services ressortissants KPIs:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la récupération des KPIs'
      });
    }
  }

  static async upsertServicesRessortissants(req, res) {
    try {
      const userId = req.user.id;
      const kpi = await KpiModel.upsertServicesRessortissants(req.body, userId);
      
      res.json({
        status: 'success',
        data: kpi
      });
    } catch (error) {
      console.error('Error upserting services ressortissants KPIs:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la sauvegarde des KPIs'
      });
    }
  }

  // ============================================================================
  // STRATEGIE PARTENARIAT
  // ============================================================================

  static async getStrategiePartenariat(req, res) {
    try {
      const { periodId } = req.params;
      const kpi = await KpiModel.getStrategiePartenariat(periodId);
      
      res.json({
        status: 'success',
        data: kpi || {}
      });
    } catch (error) {
      console.error('Error fetching strategie partenariat KPIs:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la récupération des KPIs'
      });
    }
  }

  static async upsertStrategiePartenariat(req, res) {
    try {
      const userId = req.user.id;
      const kpi = await KpiModel.upsertStrategiePartenariat(req.body, userId);
      
      res.json({
        status: 'success',
        data: kpi
      });
    } catch (error) {
      console.error('Error upserting strategie partenariat KPIs:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la sauvegarde des KPIs'
      });
    }
  }

  // ============================================================================
  // ALL KPIs FOR PERIOD
  // ============================================================================

  static async getAllKpisByPeriod(req, res) {
    try {
      const { periodId } = req.params;
      const kpis = await KpiModel.getAllByPeriod(periodId);
      
      res.json({
        status: 'success',
        data: kpis
      });
    } catch (error) {
      console.error('Error fetching all KPIs:', error);
      res.status(500).json({
        status: 'error',
        message: 'Erreur lors de la récupération des KPIs'
      });
    }
  }
}

module.exports = KpiController;
