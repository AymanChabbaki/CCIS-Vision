const { query } = require('../config/database');
const AppError = require('../utils/AppError');

/**
 * Get dashboard overview statistics
 */
const getDashboardOverview = async (req, res, next) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    // Get key metrics
    const metrics = await query(`
      SELECT
        (SELECT COUNT(*) FROM companies WHERE is_member = true) as total_companies,
        (SELECT COUNT(*) FROM activities WHERE EXTRACT(YEAR FROM start_date) = $1) as total_activities,
        (SELECT COUNT(DISTINCT p.id) 
         FROM participants p 
         JOIN activities a ON p.activity_id = a.id 
         WHERE EXTRACT(YEAR FROM a.start_date) = $1) as total_participants,
        (SELECT COALESCE(SUM(allocated_amount), 0) FROM budgets WHERE fiscal_year = $1) as total_budget,
        (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE EXTRACT(YEAR FROM expense_date) = $1) as total_expenses,
        (SELECT AVG(data_quality_score) FROM companies) as avg_quality_score,
        (SELECT COUNT(*) FROM data_quality_issues WHERE status = 'open') as open_quality_issues
    `, [year]);

    // Get monthly activity trend
    const activityTrend = await query(`
      SELECT 
        DATE_TRUNC('month', start_date) as month,
        COUNT(*) as count
      FROM activities a
      WHERE EXTRACT(YEAR FROM a.start_date) = $1
      GROUP BY DATE_TRUNC('month', start_date)
      ORDER BY month
    `, [year]);

    // Get companies by region
    const companiesByRegion = await query(`
      SELECT province, COUNT(*) as count
      FROM companies
      WHERE province IS NOT NULL AND is_member = true
      GROUP BY province
      ORDER BY count DESC
      LIMIT 10
    `);

    // Get top activities by participants
    const topActivities = await query(`
      SELECT 
        a.id, a.title,
        at.name as activity_type,
        COUNT(p.id) as participants_count,
        a.start_date
      FROM activities a
      LEFT JOIN activity_types at ON a.activity_type_id = at.id
      LEFT JOIN participants p ON a.id = p.activity_id
      WHERE EXTRACT(YEAR FROM a.start_date) = $1
      GROUP BY a.id, a.title, at.name, a.start_date
      ORDER BY participants_count DESC
      LIMIT 10
    `, [year]);

    // Get budget utilization
    const budgetUtilization = await query(`
      SELECT 
        bc.name as category,
        SUM(b.allocated_amount) as allocated,
        COALESCE(SUM(e.amount), 0) as spent,
        ROUND((COALESCE(SUM(e.amount), 0) / NULLIF(SUM(b.allocated_amount), 0) * 100)::numeric, 2) as utilization_rate
      FROM budgets b
      LEFT JOIN budget_categories bc ON b.category_id = bc.id
      LEFT JOIN expenses e ON b.id = e.budget_id
      WHERE b.fiscal_year = $1
      GROUP BY bc.name
    `, [year]);

    res.status(200).json({
      status: 'success',
      data: {
        year: parseInt(year),
        metrics: metrics.rows[0],
        activityTrend: activityTrend.rows,
        companiesByRegion: companiesByRegion.rows,
        topActivities: topActivities.rows,
        budgetUtilization: budgetUtilization.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get KPIs for current year
 */
const getKPIs = async (req, res, next) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    
    const result = await query(`
      SELECT
        (SELECT COUNT(*) FROM companies WHERE is_member = true) as total_companies,
        (SELECT COUNT(*) FROM activities WHERE EXTRACT(YEAR FROM start_date) = $1) as total_activities,
        (SELECT COUNT(*) FROM participants WHERE EXTRACT(YEAR FROM registration_date) = $1) as total_participants,
        (SELECT COUNT(*) FROM activities WHERE status = 'completed' AND EXTRACT(YEAR FROM start_date) = $1) as completed_activities,
        (SELECT COALESCE(AVG(satisfaction_rating), 0) FROM participants WHERE EXTRACT(YEAR FROM registration_date) = $1) as avg_satisfaction,
        (SELECT COALESCE(SUM(allocated_amount), 0) FROM budgets WHERE fiscal_year = $1) as total_budget,
        (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE EXTRACT(YEAR FROM expense_date) = $1) as total_expenses
    `, [year]);

    res.status(200).json({
      status: 'success',
      data: {
        kpis: result.rows[0] || {},
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get companies map data
 */
const getCompaniesMap = async (req, res, next) => {
  try {
    const { province, city } = req.query;

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (province) {
      conditions.push(`province = $${paramCount}`);
      params.push(province);
      paramCount++;
    }

    if (city) {
      conditions.push(`city = $${paramCount}`);
      params.push(city);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')} AND is_member = true` : 'WHERE is_member = true';

    const result = await query(
      `SELECT 
        id, name, ice, city, province,
        address, sector_id,
        latitude, longitude
       FROM companies
       ${whereClause}
       ORDER BY name
       LIMIT 500`,
      params
    );

    res.status(200).json({
      status: 'success',
      data: {
        companies: result.rows,
        total: result.rows.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get data quality overview
 */
const getDataQualityOverview = async (req, res, next) => {
  try {
    // Quality score distribution
    const qualityDistribution = await query(`
      SELECT 
        CASE 
          WHEN data_quality_score >= 80 THEN 'High (80-100)'
          WHEN data_quality_score >= 50 THEN 'Medium (50-79)'
          ELSE 'Low (0-49)'
        END as quality_level,
        COUNT(*) as count,
        ROUND(AVG(data_quality_score), 2) as avg_score
      FROM companies
      GROUP BY quality_level
      ORDER BY quality_level DESC
    `);

    // Issues by type
    const issuesByType = await query(`
      SELECT 
        field_name,
        severity,
        COUNT(*) as count
      FROM data_quality_issues
      WHERE status = 'open'
      GROUP BY field_name, severity
      ORDER BY count DESC
    `);

    // Issues by entity
    const issuesByEntity = await query(`
      SELECT 
        entity_type,
        COUNT(*) as count
      FROM data_quality_issues
      WHERE status = 'open'
      GROUP BY entity_type
    `);

    res.status(200).json({
      status: 'success',
      data: {
        qualityDistribution: qualityDistribution.rows,
        issuesByType: issuesByType.rows,
        issuesByEntity: issuesByEntity.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get financial analytics
 */
const getFinancialAnalytics = async (req, res, next) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    // Budget vs Expenses
    const budgetVsExpenses = await query(`
      SELECT 
        TO_CHAR(month, 'YYYY-MM') as month,
        COALESCE(SUM(budget_amount), 0) as budget,
        COALESCE(SUM(expense_amount), 0) as expenses
      FROM monthly_budget_summary
      WHERE EXTRACT(YEAR FROM month) = $1
      GROUP BY month
      ORDER BY month
    `, [year]);

    // Expenses by category
    const expensesByCategory = await query(`
      SELECT 
        e.category,
        SUM(e.amount) as total,
        COUNT(*) as count
      FROM expenses e
      WHERE EXTRACT(YEAR FROM e.expense_date) = $1
      GROUP BY e.category
      ORDER BY total DESC
    `, [year]);

    // Budget allocation by department
    const budgetByDepartment = await query(`
      SELECT 
        d.name as department,
        SUM(b.amount) as allocated
      FROM budgets b
      JOIN departments d ON b.department_id = d.id
      WHERE EXTRACT(YEAR FROM b.fiscal_year) = $1
      GROUP BY d.name
      ORDER BY allocated DESC
    `, [year]);

    res.status(200).json({
      status: 'success',
      data: {
        year: parseInt(year),
        budgetVsExpenses: budgetVsExpenses.rows,
        expensesByCategory: expensesByCategory.rows,
        budgetByDepartment: budgetByDepartment.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get participant analytics
 */
const getParticipantAnalytics = async (req, res, next) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    // Participants by activity type
    const participantsByType = await query(`
      SELECT 
        at.name as type_name,
        COUNT(DISTINCT p.id) as participant_count,
        COUNT(DISTINCT a.id) as activity_count
      FROM activities a
      LEFT JOIN activity_types at ON a.activity_type_id = at.id
      LEFT JOIN participants p ON a.id = p.activity_id
      WHERE EXTRACT(YEAR FROM a.start_date) = $1
      GROUP BY at.name
    `, [year]);

    // Top companies by participation
    const topCompanies = await query(`
      SELECT 
        c.name,
        c.ice,
        COUNT(DISTINCT p.id) as participant_count,
        COUNT(DISTINCT a.id) as activity_count
      FROM companies c
      LEFT JOIN participants p ON c.id = p.company_id
      LEFT JOIN activities a ON p.activity_id = a.id
      WHERE EXTRACT(YEAR FROM p.registration_date) = $1
      GROUP BY c.id, c.name, c.ice
      ORDER BY participant_count DESC
      LIMIT 10
    `, [year]);

    // Monthly participant trend
    const monthlyTrend = await query(`
      SELECT 
        DATE_TRUNC('month', registration_date) as month,
        COUNT(*) as count
      FROM participants
      WHERE EXTRACT(YEAR FROM registration_date) = $1
      GROUP BY month
      ORDER BY month
    `, [year]);

    res.status(200).json({
      status: 'success',
      data: {
        year: parseInt(year),
        participantsByType: participantsByType.rows,
        topCompanies: topCompanies.rows,
        monthlyTrend: monthlyTrend.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardOverview,
  getKPIs,
  getCompaniesMap,
  getDataQualityOverview,
  getFinancialAnalytics,
  getParticipantAnalytics,
};
