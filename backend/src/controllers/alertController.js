const { query } = require('../config/database');
const AppError = require('../utils/AppError');
const { validatePagination } = require('../utils/validators');
const { runAllAlertChecks } = require('../services/alertService');

/**
 * Get all alerts
 */
const getAlerts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, is_active, severity, alert_type_id, is_read } = req.query;
    const { offset, limit: validLimit } = validatePagination(page, limit);

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (is_active !== undefined) {
      conditions.push(`is_active = $${paramCount}`);
      params.push(is_active === 'true');
      paramCount++;
    }

    if (severity) {
      conditions.push(`severity = $${paramCount}`);
      params.push(severity);
      paramCount++;
    }

    if (alert_type_id) {
      conditions.push(`alert_type_id = $${paramCount}`);
      params.push(alert_type_id);
      paramCount++;
    }

    if (is_read !== undefined && is_read !== '' && is_read !== null) {
      conditions.push(`is_read = $${paramCount}`);
      params.push(is_read === 'true' || is_read === true);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM alerts ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(validLimit, offset);
    const result = await query(
      `SELECT 
        a.*,
        at.name as alert_type_name,
        u.username as read_by_username
       FROM alerts a
       LEFT JOIN alert_types at ON a.alert_type_id = at.id
       LEFT JOIN users u ON a.read_by = u.id
       ${whereClause}
       ORDER BY 
         CASE WHEN a.is_active = true THEN 0 ELSE 1 END,
         a.severity DESC,
         a.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      params
    );

    res.status(200).json({
      status: 'success',
      data: {
        alerts: result.rows,
        pagination: {
          page: parseInt(page),
          limit: validLimit,
          total,
          totalPages: Math.ceil(total / validLimit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create alert
 */
const createAlert = async (req, res, next) => {
  try {
    const { alert_type_id, severity, title, message, entity_type, entity_id, threshold_value, current_value } = req.body;

    const result = await query(
      `INSERT INTO alerts (
        alert_type_id, severity, title, message,
        entity_type, entity_id, threshold_value, current_value
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [alert_type_id, severity, title, message, entity_type, entity_id, threshold_value, current_value]
    );

    res.status(201).json({
      status: 'success',
      data: {
        alert: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update alert status
 */
const updateAlertStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_read } = req.body;

    const result = await query(
      `UPDATE alerts 
       SET is_read = $1,
           read_at = CASE WHEN $1 = true THEN CURRENT_TIMESTAMP ELSE NULL END,
           read_by = CASE WHEN $1 = true THEN $2::uuid ELSE NULL END
       WHERE id = $3
       RETURNING *`,
      [is_read, req.user.id, id]
    );

    if (result.rows.length === 0) {
      return next(new AppError('Alert not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        alert: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete alert
 */
const deleteAlert = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM alerts WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return next(new AppError('Alert not found', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get alert statistics
 */
const getAlertStats = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = true) as active,
        COUNT(*) FILTER (WHERE is_read = true) as read,
        COUNT(*) FILTER (WHERE severity = 'critical') as critical,
        COUNT(*) FILTER (WHERE severity = 'warning') as warning,
        COUNT(*) FILTER (WHERE severity = 'info') as info
      FROM alerts
    `);

    res.status(200).json({
      status: 'success',
      data: {
        stats: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manually trigger automated alert checks
 */
const triggerAlertChecks = async (req, res, next) => {
  try {
    const summary = await runAllAlertChecks();

    res.status(200).json({
      status: 'success',
      message: 'Alert checks completed',
      data: {
        summary,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAlerts,
  createAlert,
  updateAlertStatus,
  deleteAlert,
  getAlertStats,
  triggerAlertChecks,
};
