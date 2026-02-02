const pool = require('../config/database');

class KpiPeriodModel {
  // Get all periods
  static async findAll(filters = {}) {
    try {
      let query = 'SELECT * FROM kpi_periods WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (filters.type) {
        query += ` AND type = $${paramIndex}`;
        params.push(filters.type);
        paramIndex++;
      }

      if (filters.is_active !== undefined) {
        query += ` AND is_active = $${paramIndex}`;
        params.push(filters.is_active);
        paramIndex++;
      }

      query += ' ORDER BY start_date DESC';

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get period by ID
  static async findById(id) {
    try {
      const result = await pool.query(
        'SELECT * FROM kpi_periods WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get active period
  static async getActivePeriod(type = 'quarterly') {
    try {
      const result = await pool.query(
        'SELECT * FROM kpi_periods WHERE is_active = TRUE AND type = $1 ORDER BY start_date DESC LIMIT 1',
        [type]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Create period
  static async create(periodData) {
    try {
      const { name, type, start_date, end_date, is_active } = periodData;
      
      const result = await pool.query(
        `INSERT INTO kpi_periods (name, type, start_date, end_date, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [name, type, start_date, end_date, is_active ?? true]
      );
      
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Update period
  static async update(id, periodData) {
    try {
      const { name, type, start_date, end_date, is_active } = periodData;
      
      const result = await pool.query(
        `UPDATE kpi_periods 
         SET name = COALESCE($1, name),
             type = COALESCE($2, type),
             start_date = COALESCE($3, start_date),
             end_date = COALESCE($4, end_date),
             is_active = COALESCE($5, is_active)
         WHERE id = $6
         RETURNING *`,
        [name, type, start_date, end_date, is_active, id]
      );
      
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Delete period
  static async delete(id) {
    try {
      await pool.query('DELETE FROM kpi_periods WHERE id = $1', [id]);
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = KpiPeriodModel;
