const { query } = require('../config/database');
const AppError = require('../utils/AppError');
const { validatePagination } = require('../utils/validators');

/**
 * Get all activities
 */
const getActivities = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, activity_type_id, status, year } = req.query;
    const { offset, limit: validLimit } = validatePagination(page, limit);

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (search && search.trim() !== '') {
      conditions.push(`(
        a.title ILIKE $${paramCount} OR
        a.description ILIKE $${paramCount} OR
        a.venue_name ILIKE $${paramCount}
      )`);
      params.push(`%${search}%`);
      paramCount++;
    }

    if (activity_type_id && activity_type_id.trim() !== '') {
      conditions.push(`a.activity_type_id = $${paramCount}`);
      params.push(parseInt(activity_type_id));
      paramCount++;
    }

    if (status && status.trim() !== '') {
      conditions.push(`a.status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    if (year) {
      conditions.push(`EXTRACT(YEAR FROM a.start_date) = $${paramCount}`);
      params.push(year);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM activities a ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(validLimit, offset);
    const result = await query(
      `SELECT 
        a.*,
        at.name as activity_type_name,
        l.latitude,
        l.longitude,
        l.city as location_city,
        COUNT(DISTINCT p.id) as participants_count
       FROM activities a
       LEFT JOIN activity_types at ON a.activity_type_id = at.id
       LEFT JOIN locations l ON a.location_id = l.id
       LEFT JOIN participants p ON a.id = p.activity_id
       ${whereClause}
       GROUP BY a.id, at.name, l.latitude, l.longitude, l.city
       ORDER BY a.start_date DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      params
    );

    res.status(200).json({
      status: 'success',
      data: {
        activities: result.rows,
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
 * Get activity by ID
 */
const getActivityById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        a.*,
        at.name as activity_type_name,
        l.name as location_name,
        COUNT(DISTINCT p.id) as participants_count,
        SUM(e.amount) as total_expenses
       FROM activities a
       LEFT JOIN activity_types at ON a.activity_type_id = at.id
       LEFT JOIN locations l ON a.location_id = l.id
       LEFT JOIN participants p ON a.id = p.activity_id
       LEFT JOIN expenses e ON a.id = e.activity_id
       WHERE a.id = $1
       GROUP BY a.id, at.name, l.name`,
      [id]
    );

    if (result.rows.length === 0) {
      return next(new AppError('Activity not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        activity: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create activity
 */
const createActivity = async (req, res, next) => {
  try {
    const {
      activity_type_id, title, description,
      start_date, end_date, registration_deadline,
      location_id, venue_name, venue_address, is_online,
      max_participants, budget_allocated, is_free, participation_fee,
      status, department_id
    } = req.body;

    const result = await query(
      `INSERT INTO activities (
        activity_type_id, title, description,
        start_date, end_date, registration_deadline,
        location_id, venue_name, venue_address, is_online,
        max_participants, budget_allocated, is_free, participation_fee,
        status, department_id, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        activity_type_id, title, description,
        start_date, end_date, registration_deadline,
        location_id, venue_name, venue_address, is_online,
        max_participants, budget_allocated, is_free, participation_fee,
        status, department_id, req.user.id
      ]
    );

    res.status(201).json({
      status: 'success',
      data: {
        activity: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update activity
 */
const updateActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const fields = Object.keys(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const values = fields.map(field => updates[field]);
    values.push(id);

    const result = await query(
      `UPDATE activities 
       SET ${setClause}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${values.length}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return next(new AppError('Activity not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        activity: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete activity
 */
const deleteActivity = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM activities WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return next(new AppError('Activity not found', 404));
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
 * Get activity statistics
 */
const getActivityStats = async (req, res, next) => {
  try {
    const { year } = req.query;

    const yearCondition = year ? `WHERE EXTRACT(YEAR FROM start_date) = ${year}` : '';

    const result = await query(`
      SELECT 
        COUNT(DISTINCT a.id) as total_activities,
        COUNT(DISTINCT a.id) FILTER (WHERE a.activity_type_id = 1) as formations,
        COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed') as completed,
        COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'ongoing') as in_progress,
        COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'planned') as planned,
        COUNT(DISTINCT p.company_id) as unique_companies
      FROM activities a
      LEFT JOIN participants p ON a.id = p.activity_id
      ${yearCondition}
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
 * Export activities to Excel
 */
const exportActivities = async (req, res, next) => {
  try {
    const { search, activity_type_id, status, year } = req.query;

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (search && search.trim() !== '') {
      conditions.push(`(
        a.title ILIKE $${paramCount} OR
        a.description ILIKE $${paramCount} OR
        a.venue_name ILIKE $${paramCount}
      )`);
      params.push(`%${search}%`);
      paramCount++;
    }

    if (activity_type_id && activity_type_id.trim() !== '') {
      conditions.push(`a.activity_type_id = $${paramCount}`);
      params.push(parseInt(activity_type_id));
      paramCount++;
    }

    if (status && status.trim() !== '') {
      conditions.push(`a.status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    if (year) {
      conditions.push(`EXTRACT(YEAR FROM a.start_date) = $${paramCount}`);
      params.push(year);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT 
        a.*,
        at.name as activity_type_name,
        l.city as location_city,
        l.address as location_address
       FROM activities a
       LEFT JOIN activity_types at ON a.activity_type_id = at.id
       LEFT JOIN locations l ON a.location_id = l.id
       ${whereClause}
       ORDER BY a.start_date DESC`,
      params
    );

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Activités');

    worksheet.columns = [
      { header: 'Titre', key: 'title', width: 40 },
      { header: 'Type', key: 'activity_type_name', width: 25 },
      { header: 'Statut', key: 'status', width: 15 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Date début', key: 'start_date', width: 15 },
      { header: 'Date fin', key: 'end_date', width: 15 },
      { header: 'Lieu', key: 'venue_name', width: 30 },
      { header: 'Adresse', key: 'venue_address', width: 40 },
      { header: 'Ville', key: 'location_city', width: 20 },
      { header: 'En ligne', key: 'is_online', width: 12 },
      { header: 'Max participants', key: 'max_participants', width: 18 },
      { header: 'Gratuit', key: 'is_free', width: 12 },
      { header: 'Frais participation', key: 'participation_fee', width: 20 },
      { header: 'Budget alloué', key: 'budget_allocated', width: 18 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF16A34A' }
    };

    const statusLabels = {
      planned: 'Planifiée',
      ongoing: 'En cours',
      completed: 'Terminée',
      cancelled: 'Annulée'
    };

    result.rows.forEach(activity => {
      worksheet.addRow({
        title: activity.title,
        activity_type_name: activity.activity_type_name,
        status: statusLabels[activity.status] || activity.status,
        description: activity.description,
        start_date: activity.start_date ? new Date(activity.start_date).toLocaleDateString('fr-FR') : '',
        end_date: activity.end_date ? new Date(activity.end_date).toLocaleDateString('fr-FR') : '',
        venue_name: activity.venue_name,
        venue_address: activity.venue_address,
        location_city: activity.location_city,
        is_online: activity.is_online ? 'Oui' : 'Non',
        max_participants: activity.max_participants,
        is_free: activity.is_free ? 'Oui' : 'Non',
        participation_fee: activity.participation_fee ? `${activity.participation_fee} MAD` : '',
        budget_allocated: activity.budget_allocated ? `${activity.budget_allocated} MAD` : '',
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=activites_${new Date().toISOString().split('T')[0]}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActivities,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
  getActivityStats,
  exportActivities,
};
