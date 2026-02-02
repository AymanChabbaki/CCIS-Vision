const pool = require('../config/database');

class KpiAuditControlModel {
  // Get all KPIs
  static async findAll() {
    try {
      const result = await pool.query(`
        SELECT kac.*, kp.name as period_name, kp.start_date, kp.end_date
        FROM kpi_audit_control kac
        JOIN kpi_periods kp ON kac.period_id = kp.id
        ORDER BY kp.start_date DESC
      `);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get KPI by period
  static async findByPeriod(periodId) {
    try {
      const result = await pool.query(
        'SELECT * FROM kpi_audit_control WHERE period_id = $1',
        [periodId]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Create or update KPI
  static async upsert(kpiData, userId) {
    try {
      const {
        period_id,
        nombre_rapports_gestion,
        nombre_tableaux_bord,
        nombre_missions_audit,
        taux_mise_en_oeuvre_recommandations,
        nombre_procedures_ameliorees,
        notes
      } = kpiData;

      const result = await pool.query(`
        INSERT INTO kpi_audit_control (
          period_id, nombre_rapports_gestion, nombre_tableaux_bord,
          nombre_missions_audit, taux_mise_en_oeuvre_recommandations,
          nombre_procedures_ameliorees, notes, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (period_id) 
        DO UPDATE SET
          nombre_rapports_gestion = EXCLUDED.nombre_rapports_gestion,
          nombre_tableaux_bord = EXCLUDED.nombre_tableaux_bord,
          nombre_missions_audit = EXCLUDED.nombre_missions_audit,
          taux_mise_en_oeuvre_recommandations = EXCLUDED.taux_mise_en_oeuvre_recommandations,
          nombre_procedures_ameliorees = EXCLUDED.nombre_procedures_ameliorees,
          notes = EXCLUDED.notes,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [
        period_id, 
        nombre_rapports_gestion || 0,
        nombre_tableaux_bord || 0,
        nombre_missions_audit || 0,
        taux_mise_en_oeuvre_recommandations || 0,
        nombre_procedures_ameliorees || 0,
        notes,
        userId
      ]);

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Delete KPI
  static async delete(periodId) {
    try {
      await pool.query('DELETE FROM kpi_audit_control WHERE period_id = $1', [periodId]);
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = KpiAuditControlModel;
