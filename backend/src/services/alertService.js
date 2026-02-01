const { query } = require('../config/database');
const logger = require('../utils/logger');
const { sendAlertEmail } = require('./emailService');

/**
 * Check budget utilization and create alerts
 */
const checkBudgetAlerts = async () => {
  try {
    const currentYear = new Date().getFullYear();
    
    // Check budgets approaching or exceeding limits
    const result = await query(`
      SELECT 
        b.id,
        b.allocated_amount,
        bc.name as category_name,
        COALESCE(SUM(e.amount), 0) as spent,
        ROUND((COALESCE(SUM(e.amount), 0) / NULLIF(b.allocated_amount, 0) * 100)::numeric, 2) as utilization_rate
      FROM budgets b
      LEFT JOIN budget_categories bc ON b.category_id = bc.id
      LEFT JOIN expenses e ON b.id = e.budget_id
      WHERE b.fiscal_year = $1 AND b.allocated_amount > 0
      GROUP BY b.id, b.allocated_amount, bc.name
      HAVING (COALESCE(SUM(e.amount), 0) / NULLIF(b.allocated_amount, 0) * 100) >= 90
    `, [currentYear]);

    const alerts = [];
    
    for (const budget of result.rows) {
      const utilization = parseFloat(budget.utilization_rate);
      const alertTypeId = utilization >= 100 ? 1 : 2; // 1=dépassé, 2=proche limite
      const severity = utilization >= 100 ? 'critical' : 'warning';
      
      // Check if alert already exists for this budget
      const existing = await query(
        `SELECT id FROM alerts 
         WHERE alert_type_id = $1 
         AND entity_type = 'budget' 
         AND entity_id = $2 
         AND created_at > CURRENT_DATE - INTERVAL '7 days'`,
        [alertTypeId, budget.id]
      );

      if (existing.rows.length === 0) {
        const title = utilization >= 100 
          ? `Budget ${budget.category_name} dépassé`
          : `Budget ${budget.category_name} proche de la limite`;
          
        const message = utilization >= 100
          ? `Le budget ${budget.category_name} a dépassé la limite. Utilisation: ${utilization}% (${budget.spent} MAD / ${budget.allocated_amount} MAD)`
          : `Le budget ${budget.category_name} approche de la limite (${utilization}%). Montant dépensé: ${budget.spent} MAD sur ${budget.allocated_amount} MAD alloués.`;

        const alertResult = await query(
          `INSERT INTO alerts (
            alert_type_id, severity, title, message,
            entity_type, entity_id, threshold_value, current_value
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *`,
          [alertTypeId, severity, title, message, 'budget', budget.id, utilization >= 100 ? 100 : 90, utilization]
        );

        alerts.push(alertResult.rows[0]);
        
        // Send email to admin users
        const admins = await query(
          `SELECT email FROM users WHERE role_id = 1 AND email IS NOT NULL AND is_active = true`
        );
        
        if (admins.rows.length > 0) {
          await sendAlertEmail(
            { ...alertResult.rows[0], category_name: budget.category_name },
            admins.rows.map(u => u.email)
          );
        }
      }
    }

    logger.info(`Budget alerts check completed: ${alerts.length} new alerts created`);
    return alerts;
  } catch (error) {
    logger.error('Error checking budget alerts:', error);
    throw error;
  }
};

/**
 * Check activity deadlines and create alerts
 */
const checkActivityDeadlines = async () => {
  try {
    // Check activities with registration deadlines in the next 7 days
    const result = await query(`
      SELECT 
        a.id,
        a.title,
        a.registration_deadline,
        a.start_date,
        EXTRACT(DAY FROM (a.registration_deadline - CURRENT_DATE)) as days_remaining
      FROM activities a
      WHERE a.registration_deadline IS NOT NULL
      AND a.registration_deadline > CURRENT_DATE
      AND a.registration_deadline <= CURRENT_DATE + INTERVAL '7 days'
      AND a.status IN ('planned', 'ongoing')
    `);

    const alerts = [];
    
    for (const activity of result.rows) {
      // Check if alert already exists
      const existing = await query(
        `SELECT id FROM alerts 
         WHERE alert_type_id = 4 
         AND entity_type = 'activity' 
         AND entity_id = $1 
         AND created_at > CURRENT_DATE - INTERVAL '3 days'`,
        [activity.id]
      );

      if (existing.rows.length === 0) {
        const daysRemaining = Math.floor(activity.days_remaining);
        const title = `Date limite inscription approche - ${activity.title}`;
        const message = `La date limite d'inscription pour "${activity.title}" est dans ${daysRemaining} jour(s). Date limite: ${new Date(activity.registration_deadline).toLocaleDateString('fr-FR')}`;

        const alertResult = await query(
          `INSERT INTO alerts (
            alert_type_id, severity, title, message,
            entity_type, entity_id
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *`,
          [4, 'info', title, message, 'activity', activity.id]
        );

        alerts.push(alertResult.rows[0]);
        
        // Send email
        const users = await query(
          `SELECT email FROM users WHERE role_id IN (1, 2) AND email IS NOT NULL AND is_active = true`
        );
        
        if (users.rows.length > 0) {
          await sendAlertEmail(
            { ...alertResult.rows[0], days_remaining: daysRemaining },
            users.rows.map(u => u.email)
          );
        }
      }
    }

    logger.info(`Activity deadline alerts check completed: ${alerts.length} new alerts created`);
    return alerts;
  } catch (error) {
    logger.error('Error checking activity deadlines:', error);
    throw error;
  }
};

/**
 * Check data quality and create alerts
 */
const checkDataQualityAlerts = async () => {
  try {
    // Check companies with low data quality scores
    const result = await query(`
      SELECT 
        id,
        name,
        data_quality_score
      FROM companies
      WHERE data_quality_score < 50
      AND is_member = true
    `);

    const alerts = [];
    
    for (const company of result.rows) {
      // Check if alert already exists
      const existing = await query(
        `SELECT id FROM alerts 
         WHERE alert_type_id = 5 
         AND entity_type = 'company' 
         AND entity_id = $1 
         AND created_at > CURRENT_DATE - INTERVAL '14 days'`,
        [company.id]
      );

      if (existing.rows.length === 0) {
        const title = `Données entreprise incomplètes - ${company.name}`;
        const message = `Les données de l'entreprise "${company.name}" sont incomplètes. Score de qualité: ${company.data_quality_score}%. Veuillez compléter les informations manquantes.`;

        const alertResult = await query(
          `INSERT INTO alerts (
            alert_type_id, severity, title, message,
            entity_type, entity_id, threshold_value, current_value
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *`,
          [5, 'info', title, message, 'company', company.id, 50, company.data_quality_score]
        );

        alerts.push(alertResult.rows[0]);
        
        // Send email
        const admins = await query(
          `SELECT email FROM users WHERE role_id IN (1, 2) AND email IS NOT NULL AND is_active = true`
        );
        
        if (admins.rows.length > 0) {
          await sendAlertEmail(
            { ...alertResult.rows[0], company_name: company.name },
            admins.rows.map(u => u.email)
          );
        }
      }
    }

    logger.info(`Data quality alerts check completed: ${alerts.length} new alerts created`);
    return alerts;
  } catch (error) {
    logger.error('Error checking data quality alerts:', error);
    throw error;
  }
};

/**
 * Check activity capacity and create alerts
 */
const checkActivityCapacityAlerts = async () => {
  try {
    // Check activities approaching or at capacity
    const result = await query(`
      SELECT 
        a.id,
        a.title,
        a.max_participants,
        COUNT(p.id) as current_participants,
        ROUND((COUNT(p.id)::numeric / NULLIF(a.max_participants, 0) * 100), 2) as fill_rate
      FROM activities a
      LEFT JOIN participants p ON a.id = p.activity_id
      WHERE a.max_participants > 0
      AND a.status IN ('planned', 'ongoing')
      GROUP BY a.id, a.title, a.max_participants
      HAVING (COUNT(p.id)::numeric / NULLIF(a.max_participants, 0) * 100) >= 90
    `);

    const alerts = [];
    
    for (const activity of result.rows) {
      const fillRate = parseFloat(activity.fill_rate);
      
      // Check if alert already exists
      const existing = await query(
        `SELECT id FROM alerts 
         WHERE alert_type_id = 3 
         AND entity_type = 'activity' 
         AND entity_id = $1 
         AND created_at > CURRENT_DATE - INTERVAL '7 days'`,
        [activity.id]
      );

      if (existing.rows.length === 0) {
        const title = fillRate >= 100 
          ? `Capacité atteinte - ${activity.title}`
          : `Capacité proche - ${activity.title}`;
          
        const message = fillRate >= 100
          ? `L'activité "${activity.title}" a atteint sa capacité maximale (${activity.current_participants}/${activity.max_participants} participants).`
          : `L'activité "${activity.title}" approche de sa capacité maximale. ${activity.current_participants} participants sur ${activity.max_participants} places disponibles (${fillRate}%).`;

        const alertResult = await query(
          `INSERT INTO alerts (
            alert_type_id, severity, title, message,
            entity_type, entity_id, threshold_value, current_value
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *`,
          [3, fillRate >= 100 ? 'warning' : 'info', title, message, 'activity', activity.id, 100, fillRate]
        );

        alerts.push(alertResult.rows[0]);
        
        // Send email
        const users = await query(
          `SELECT email FROM users WHERE role_id IN (1, 2) AND email IS NOT NULL AND is_active = true`
        );
        
        if (users.rows.length > 0) {
          await sendAlertEmail(
            { ...alertResult.rows[0], activity_title: activity.title },
            users.rows.map(u => u.email)
          );
        }
      }
    }

    logger.info(`Activity capacity alerts check completed: ${alerts.length} new alerts created`);
    return alerts;
  } catch (error) {
    logger.error('Error checking activity capacity alerts:', error);
    throw error;
  }
};

/**
 * Run all alert checks
 */
const runAllAlertChecks = async () => {
  try {
    logger.info('Starting automated alert checks...');
    
    const results = await Promise.allSettled([
      checkBudgetAlerts(),
      checkActivityDeadlines(),
      checkDataQualityAlerts(),
      checkActivityCapacityAlerts(),
    ]);

    const summary = {
      budget: results[0].status === 'fulfilled' ? results[0].value.length : 0,
      deadlines: results[1].status === 'fulfilled' ? results[1].value.length : 0,
      dataQuality: results[2].status === 'fulfilled' ? results[2].value.length : 0,
      capacity: results[3].status === 'fulfilled' ? results[3].value.length : 0,
      total: 0,
    };

    summary.total = summary.budget + summary.deadlines + summary.dataQuality + summary.capacity;

    logger.info(`Alert checks completed. Summary:`, summary);
    
    return summary;
  } catch (error) {
    logger.error('Error running alert checks:', error);
    throw error;
  }
};

module.exports = {
  checkBudgetAlerts,
  checkActivityDeadlines,
  checkDataQualityAlerts,
  checkActivityCapacityAlerts,
  runAllAlertChecks,
};
