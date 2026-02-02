const pool = require('../config/database');

class KpiModel {
  // Relations Institutionnelles
  static async getRelationsInstitutionnelles(periodId) {
    const result = await pool.query(
      'SELECT * FROM kpi_relations_institutionnelles WHERE period_id = $1',
      [periodId]
    );
    return result.rows[0];
  }

  static async upsertRelationsInstitutionnelles(data, userId) {
    const {
      period_id, nombre_reunions_ag_bureau_commissions, nombre_conventions_partenariats,
      nombre_pv_rapports, nombre_relations_administrations, taux_realisation_plan_action, notes
    } = data;

    const result = await pool.query(`
      INSERT INTO kpi_relations_institutionnelles (
        period_id, nombre_reunions_ag_bureau_commissions, nombre_conventions_partenariats,
        nombre_pv_rapports, nombre_relations_administrations, taux_realisation_plan_action,
        notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (period_id) 
      DO UPDATE SET
        nombre_reunions_ag_bureau_commissions = EXCLUDED.nombre_reunions_ag_bureau_commissions,
        nombre_conventions_partenariats = EXCLUDED.nombre_conventions_partenariats,
        nombre_pv_rapports = EXCLUDED.nombre_pv_rapports,
        nombre_relations_administrations = EXCLUDED.nombre_relations_administrations,
        taux_realisation_plan_action = EXCLUDED.taux_realisation_plan_action,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [period_id, nombre_reunions_ag_bureau_commissions || 0, nombre_conventions_partenariats || 0,
        nombre_pv_rapports || 0, nombre_relations_administrations || 0, 
        taux_realisation_plan_action || 0, notes, userId]);

    return result.rows[0];
  }

  // Synthèse Départements
  static async getSyntheseDepartements(periodId) {
    const result = await pool.query(
      'SELECT * FROM kpi_synthese_departements WHERE period_id = $1',
      [periodId]
    );
    return result.rows[0];
  }

  static async upsertSyntheseDepartements(data, userId) {
    const {
      period_id, opportunites_internationales, demandes_traitees,
      entreprises_accompagnees, prestations_realisees, notes
    } = data;

    const result = await pool.query(`
      INSERT INTO kpi_synthese_departements (
        period_id, opportunites_internationales, demandes_traitees,
        entreprises_accompagnees, prestations_realisees, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (period_id) 
      DO UPDATE SET
        opportunites_internationales = EXCLUDED.opportunites_internationales,
        demandes_traitees = EXCLUDED.demandes_traitees,
        entreprises_accompagnees = EXCLUDED.entreprises_accompagnees,
        prestations_realisees = EXCLUDED.prestations_realisees,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [period_id, opportunites_internationales || 0, demandes_traitees || 0,
        entreprises_accompagnees || 0, prestations_realisees || 0, notes, userId]);

    return result.rows[0];
  }

  // Admin Financier
  static async getAdminFinancier(periodId) {
    const result = await pool.query(
      'SELECT * FROM kpi_admin_financier WHERE period_id = $1',
      [periodId]
    );
    return result.rows[0];
  }

  static async upsertAdminFinancier(data, userId) {
    const {
      period_id, assemblees_generales_organisees, prestations_logistiques,
      services_restauration, salles_mises_disposition, attestations_delivrees,
      locations_salles, services_agenda_organises, notes
    } = data;

    const result = await pool.query(`
      INSERT INTO kpi_admin_financier (
        period_id, assemblees_generales_organisees, prestations_logistiques,
        services_restauration, salles_mises_disposition, attestations_delivrees,
        locations_salles, services_agenda_organises, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (period_id) 
      DO UPDATE SET
        assemblees_generales_organisees = EXCLUDED.assemblees_generales_organisees,
        prestations_logistiques = EXCLUDED.prestations_logistiques,
        services_restauration = EXCLUDED.services_restauration,
        salles_mises_disposition = EXCLUDED.salles_mises_disposition,
        attestations_delivrees = EXCLUDED.attestations_delivrees,
        locations_salles = EXCLUDED.locations_salles,
        services_agenda_organises = EXCLUDED.services_agenda_organises,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [period_id, assemblees_generales_organisees || 0, prestations_logistiques || 0,
        services_restauration || 0, salles_mises_disposition || 0, attestations_delivrees || 0,
        locations_salles || 0, services_agenda_organises || 0, notes, userId]);

    return result.rows[0];
  }

  // Appui Promotion
  static async getAppuiPromotion(periodId) {
    const result = await pool.query(
      'SELECT * FROM kpi_appui_promotion WHERE period_id = $1',
      [periodId]
    );
    return result.rows[0];
  }

  static async upsertAppuiPromotion(data, userId) {
    const {
      period_id, porteurs_projets_accompagnes, createurs_entreprise_accompagnes,
      entreprises_guichets_proximite, demandes_administratives_traitees,
      porteurs_projets_satisfaits, entrepreneurs_satisfaits, taux_satisfaction,
      entrepreneurs_financement, formations_employes, entreprises_radiees,
      entreprises_beneficiaires_services, notes
    } = data;

    const result = await pool.query(`
      INSERT INTO kpi_appui_promotion (
        period_id, porteurs_projets_accompagnes, createurs_entreprise_accompagnes,
        entreprises_guichets_proximite, demandes_administratives_traitees,
        porteurs_projets_satisfaits, entrepreneurs_satisfaits, taux_satisfaction,
        entrepreneurs_financement, formations_employes, entreprises_radiees,
        entreprises_beneficiaires_services, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (period_id) 
      DO UPDATE SET
        porteurs_projets_accompagnes = EXCLUDED.porteurs_projets_accompagnes,
        createurs_entreprise_accompagnes = EXCLUDED.createurs_entreprise_accompagnes,
        entreprises_guichets_proximite = EXCLUDED.entreprises_guichets_proximite,
        demandes_administratives_traitees = EXCLUDED.demandes_administratives_traitees,
        porteurs_projets_satisfaits = EXCLUDED.porteurs_projets_satisfaits,
        entrepreneurs_satisfaits = EXCLUDED.entrepreneurs_satisfaits,
        taux_satisfaction = EXCLUDED.taux_satisfaction,
        entrepreneurs_financement = EXCLUDED.entrepreneurs_financement,
        formations_employes = EXCLUDED.formations_employes,
        entreprises_radiees = EXCLUDED.entreprises_radiees,
        entreprises_beneficiaires_services = EXCLUDED.entreprises_beneficiaires_services,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [period_id, porteurs_projets_accompagnes || 0, createurs_entreprise_accompagnes || 0,
        entreprises_guichets_proximite || 0, demandes_administratives_traitees || 0,
        porteurs_projets_satisfaits || 0, entrepreneurs_satisfaits || 0, taux_satisfaction || 0,
        entrepreneurs_financement || 0, formations_employes || 0, entreprises_radiees || 0,
        entreprises_beneficiaires_services || 0, notes, userId]);

    return result.rows[0];
  }

  // Services Ressortissants
  static async getServicesRessortissants(periodId) {
    const result = await pool.query(
      'SELECT * FROM kpi_services_ressortissants WHERE period_id = $1',
      [periodId]
    );
    return result.rows[0];
  }

  static async upsertServicesRessortissants(data, userId) {
    const {
      period_id, newsletters_editees, demandes_ressortissants,
      indicateurs_economiques_suivis, notes
    } = data;

    const result = await pool.query(`
      INSERT INTO kpi_services_ressortissants (
        period_id, newsletters_editees, demandes_ressortissants,
        indicateurs_economiques_suivis, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (period_id) 
      DO UPDATE SET
        newsletters_editees = EXCLUDED.newsletters_editees,
        demandes_ressortissants = EXCLUDED.demandes_ressortissants,
        indicateurs_economiques_suivis = EXCLUDED.indicateurs_economiques_suivis,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [period_id, newsletters_editees || 0, demandes_ressortissants || 0,
        indicateurs_economiques_suivis || 0, notes, userId]);

    return result.rows[0];
  }

  // Stratégie Partenariat
  static async getStrategiePartenariat(periodId) {
    const result = await pool.query(
      'SELECT * FROM kpi_strategie_partenariat WHERE period_id = $1',
      [periodId]
    );
    return result.rows[0];
  }

  static async upsertStrategiePartenariat(data, userId) {
    const {
      period_id, actions_realisees, ressortissants_satisfaits_evenements,
      entreprises_potentiel_export, entreprises_accompagnees, delegations,
      opportunites_affaires_internationales, notes
    } = data;

    const result = await pool.query(`
      INSERT INTO kpi_strategie_partenariat (
        period_id, actions_realisees, ressortissants_satisfaits_evenements,
        entreprises_potentiel_export, entreprises_accompagnees, delegations,
        opportunites_affaires_internationales, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (period_id) 
      DO UPDATE SET
        actions_realisees = EXCLUDED.actions_realisees,
        ressortissants_satisfaits_evenements = EXCLUDED.ressortissants_satisfaits_evenements,
        entreprises_potentiel_export = EXCLUDED.entreprises_potentiel_export,
        entreprises_accompagnees = EXCLUDED.entreprises_accompagnees,
        delegations = EXCLUDED.delegations,
        opportunites_affaires_internationales = EXCLUDED.opportunites_affaires_internationales,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [period_id, actions_realisees || 0, ressortissants_satisfaits_evenements || 0,
        entreprises_potentiel_export || 0, entreprises_accompagnees || 0, delegations || 0,
        opportunites_affaires_internationales || 0, notes, userId]);

    return result.rows[0];
  }

  // Get all KPIs for a period
  static async getAllByPeriod(periodId) {
    const [audit, relations, synthese, admin, appui, services, strategie] = await Promise.all([
      this.getAuditControl(periodId),
      this.getRelationsInstitutionnelles(periodId),
      this.getSyntheseDepartements(periodId),
      this.getAdminFinancier(periodId),
      this.getAppuiPromotion(periodId),
      this.getServicesRessortissants(periodId),
      this.getStrategiePartenariat(periodId)
    ]);

    return {
      audit_control: audit || {},
      relations_institutionnelles: relations || {},
      synthese_departements: synthese || {},
      admin_financier: admin || {},
      appui_promotion: appui || {},
      services_ressortissants: services || {},
      strategie_partenariat: strategie || {}
    };
  }

  // Audit Control (reuse from KpiAuditControlModel)
  static async getAuditControl(periodId) {
    const result = await pool.query(
      'SELECT * FROM kpi_audit_control WHERE period_id = $1',
      [periodId]
    );
    return result.rows[0];
  }
}

module.exports = KpiModel;
