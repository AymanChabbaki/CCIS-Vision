const { query, transaction } = require('../config/database');
const AppError = require('../utils/AppError');
const { validatePagination } = require('../utils/validators');
const logger = require('../utils/logger');

/**
 * Get all companies with filters and pagination
 */
const getCompanies = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, province, sector, size, is_member, quality_min, quality_max, sort = 'created_at', order = 'DESC' } = req.query;
    const { offset, limit: validLimit } = validatePagination(page, limit);

    // Build WHERE clause
    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (search && search.trim() !== '') {
      conditions.push(`(
        c.name ILIKE $${paramCount} OR
        c.legal_name ILIKE $${paramCount} OR 
        c.ice ILIKE $${paramCount} OR 
        c.email ILIKE $${paramCount}
      )`);
      params.push(`%${search}%`);
      paramCount++;
    }

    if (province && province.trim() !== '') {
      conditions.push(`c.province = $${paramCount}`);
      params.push(province);
      paramCount++;
    }

    if (sector && sector.trim() !== '') {
      conditions.push(`c.sector_id = $${paramCount}`);
      params.push(parseInt(sector));
      paramCount++;
    }

    if (size && size.trim() !== '') {
      conditions.push(`c.size_category = $${paramCount}`);
      params.push(size);
      paramCount++;
    }

    if (is_member !== undefined && is_member !== '' && is_member !== null) {
      const isMemberBool = is_member === 'true' || is_member === true;
      conditions.push(`c.is_member = $${paramCount}`);
      params.push(isMemberBool);
      paramCount++;
    }

    if (quality_min) {
      conditions.push(`c.data_quality_score >= $${paramCount}`);
      params.push(quality_min);
      paramCount++;
    }

    if (quality_max) {
      conditions.push(`c.data_quality_score <= $${paramCount}`);
      params.push(quality_max);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM companies c ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get companies
    const allowedSortFields = ['name', 'created_at', 'data_quality_score', 'ice'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    params.push(validLimit, offset);
    const result = await query(
      `SELECT 
        c.id, c.name, c.legal_name, c.ice, c.rc, c.patent_number, c.tax_id,
        c.phone, c.mobile, c.email, c.website,
        c.address, c.city, c.province, c.postal_code,
        c.latitude, c.longitude,
        c.company_type, c.sector_id, cs.name as sector_name,
        c.size_category, c.employee_count, c.annual_revenue,
        c.representative_name, c.representative_title,
        c.is_member, c.membership_status, c.membership_date,
        c.data_quality_score, c.needs_verification,
        c.created_at, c.updated_at,
        COUNT(DISTINCT p.id) as activities_count,
        COUNT(DISTINCT pt.id) as participants_count
       FROM companies c
       LEFT JOIN company_sectors cs ON c.sector_id = cs.id
       LEFT JOIN participants p ON c.id = p.company_id AND p.activity_id IS NOT NULL
       LEFT JOIN participants pt ON c.id = pt.company_id
       ${whereClause}
       GROUP BY c.id, cs.name
       ORDER BY c.${sortField} ${sortOrder}
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      params
    );

    res.status(200).json({
      status: 'success',
      data: {
        companies: result.rows,
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
 * Get company by ID
 */
const getCompanyById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        c.*,
        cs.name as sector_name,
        json_agg(DISTINCT jsonb_build_object(
          'id', dqi.id,
          'field_name', dqi.field_name,
          'issue_description', dqi.issue_description,
          'severity', dqi.severity
        )) FILTER (WHERE dqi.id IS NOT NULL) as quality_issues
       FROM companies c
       LEFT JOIN company_sectors cs ON c.sector_id = cs.id
       LEFT JOIN data_quality_issues dqi ON c.id = dqi.entity_id AND dqi.entity_type = 'company' AND dqi.status = 'open'
       WHERE c.id = $1
       GROUP BY c.id, cs.name`,
      [id]
    );

    if (result.rows.length === 0) {
      return next(new AppError('Company not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        company: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new company
 */
const createCompany = async (req, res, next) => {
  try {
    const {
      name, legal_name, ice, rc, patent_number, tax_id,
      phone, mobile, email, website,
      address, city, province, postal_code,
      company_type, sector_id, size_category, employee_count, annual_revenue,
      representative_name, representative_title, representative_email, representative_phone,
      is_member, membership_date, membership_status,
      latitude, longitude
    } = req.body;

    const result = await query(
      `INSERT INTO companies (
        name, legal_name, ice, rc, patent_number, tax_id,
        phone, mobile, email, website,
        address, city, province, postal_code,
        company_type, sector_id, size_category, employee_count, annual_revenue,
        representative_name, representative_title, representative_email, representative_phone,
        is_member, membership_date, membership_status,
        latitude, longitude, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
      RETURNING *`,
      [
        name, legal_name, ice, rc, patent_number, tax_id,
        phone, mobile, email, website,
        address, city, province, postal_code,
        company_type, sector_id, size_category, employee_count, annual_revenue,
        representative_name, representative_title, representative_email, representative_phone,
        is_member, membership_date, membership_status,
        latitude, longitude, req.user.id
      ]
    );

    logger.info(`Company created: ${name} by user ${req.user.id}`);

    res.status(201).json({
      status: 'success',
      data: {
        company: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update company
 */
const updateCompany = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic UPDATE query
    const fields = Object.keys(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
    const values = fields.map(field => updates[field]);
    values.push(id);

    const result = await query(
      `UPDATE companies 
       SET ${setClause}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${values.length}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return next(new AppError('Company not found', 404));
    }

    logger.info(`Company updated: ${id} by user ${req.user.id}`);

    res.status(200).json({
      status: 'success',
      data: {
        company: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete company
 */
const deleteCompany = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM companies WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return next(new AppError('Company not found', 404));
    }

    logger.info(`Company deleted: ${id} by user ${req.user.id}`);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Find duplicate companies
 */
const findDuplicates = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT 
        c1.id,
        c1.name,
        c1.ice,
        c1.city,
        c2.id as duplicate_id,
        c2.name as duplicate_name,
        c2.ice as duplicate_ice,
        c2.city as duplicate_city,
        CASE 
          WHEN c1.ice IS NOT NULL AND c1.ice = c2.ice THEN 100
          WHEN LOWER(c1.name) = LOWER(c2.name) THEN 90
          WHEN LOWER(c1.name) LIKE '%' || LOWER(c2.name) || '%' OR LOWER(c2.name) LIKE '%' || LOWER(c1.name) || '%' THEN 70
          ELSE 50
        END as similarity_score
      FROM companies c1
      INNER JOIN companies c2 ON c1.id < c2.id
      WHERE 
        (c1.ice IS NOT NULL AND c1.ice = c2.ice)
        OR (LOWER(c1.name) = LOWER(c2.name))
        OR (LOWER(c1.name) LIKE '%' || LOWER(c2.name) || '%')
        OR (LOWER(c2.name) LIKE '%' || LOWER(c1.name) || '%')
      ORDER BY similarity_score DESC
      LIMIT 100
    `);

    res.status(200).json({
      status: 'success',
      data: {
        duplicates: result.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Merge companies
 */
const mergeCompanies = async (req, res, next) => {
  try {
    const { keepId, mergeIds } = req.body;

    await transaction(async (client) => {
      for (const mergeId of mergeIds) {
        await client.query('SELECT merge_companies($1, $2)', [keepId, mergeId]);
      }
    });

    logger.info(`Companies merged: kept ${keepId}, merged ${mergeIds.join(',')} by user ${req.user.id}`);

    res.status(200).json({
      status: 'success',
      message: 'Companies merged successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get company statistics
 */
const getCompanyStats = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total_companies,
        COUNT(*) FILTER (WHERE is_member = true) as member_companies,
        COUNT(*) FILTER (WHERE membership_status = 'active') as active_members,
        COUNT(*) FILTER (WHERE data_quality_score >= 80) as high_quality,
        COUNT(*) FILTER (WHERE data_quality_score < 80 AND data_quality_score >= 50) as medium_quality,
        COUNT(*) FILTER (WHERE data_quality_score < 50) as low_quality,
        AVG(data_quality_score) as avg_quality_score,
        COUNT(DISTINCT city) as total_cities,
        COUNT(DISTINCT province) as total_provinces
      FROM companies
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
 * Export companies to Excel
 */
const exportCompanies = async (req, res, next) => {
  try {
    const { search, province, sector, size, is_member } = req.query;

    // Build WHERE clause
    const conditions = [];
    const params = [];
    let paramCount = 1;

    // Only add conditions for non-empty values
    if (search && search.trim() !== '') {
      conditions.push(`(
        c.name ILIKE $${paramCount} OR
        c.legal_name ILIKE $${paramCount} OR 
        c.ice ILIKE $${paramCount} OR 
        c.rc ILIKE $${paramCount}
      )`);
      params.push(`%${search}%`);
      paramCount++;
    }

    if (province && province.trim() !== '') {
      conditions.push(`c.province = $${paramCount}`);
      params.push(province);
      paramCount++;
    }

    if (sector && sector.trim() !== '') {
      conditions.push(`c.sector_id = $${paramCount}`);
      params.push(parseInt(sector));
      paramCount++;
    }

    if (size && size.trim() !== '') {
      conditions.push(`c.size_category = $${paramCount}`);
      params.push(size);
      paramCount++;
    }

    if (is_member !== undefined && is_member !== '' && is_member !== null) {
      conditions.push(`c.is_member = $${paramCount}`);
      params.push(is_member === 'true');
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT 
        c.id,
        c.name,
        c.legal_name,
        c.ice,
        c.rc,
        c.patent_number,
        c.tax_id,
        c.phone,
        c.mobile,
        c.email,
        c.website,
        c.address,
        c.city,
        c.province,
        c.postal_code,
        c.size_category,
        c.is_member,
        c.membership_date,
        c.employee_count,
        s.name as sector_name,
        c.created_at
      FROM companies c
      LEFT JOIN company_sectors s ON c.sector_id = s.id
      ${whereClause}
      ORDER BY c.name ASC
    `;

    const result = await query(sql, params);

    logger.info(`Exporting ${result.rows.length} companies`);

    // Import ExcelJS
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Entreprises');

    // Define columns
    worksheet.columns = [
      { header: 'Nom', key: 'name', width: 30 },
      { header: 'Raison sociale', key: 'legal_name', width: 30 },
      { header: 'ICE', key: 'ice', width: 20 },
      { header: 'RC', key: 'rc', width: 20 },
      { header: 'Numéro de brevet', key: 'patent_number', width: 20 },
      { header: 'Identifiant fiscal', key: 'tax_id', width: 20 },
      { header: 'Téléphone', key: 'phone', width: 15 },
      { header: 'Mobile', key: 'mobile', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Site web', key: 'website', width: 30 },
      { header: 'Adresse', key: 'address', width: 40 },
      { header: 'Ville', key: 'city', width: 20 },
      { header: 'Province', key: 'province', width: 20 },
      { header: 'Code postal', key: 'postal_code', width: 15 },
      { header: 'Taille', key: 'size_category', width: 15 },
      { header: 'Adhérent', key: 'is_member', width: 12 },
      { header: 'Date adhésion', key: 'membership_date', width: 15 },
      { header: 'Effectif', key: 'employee_count', width: 12 },
      { header: 'Secteur', key: 'sector_name', width: 25 },
      { header: 'Date de création', key: 'created_at', width: 18 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add data
    result.rows.forEach(company => {
      worksheet.addRow({
        name: company.name,
        legal_name: company.legal_name,
        ice: company.ice,
        rc: company.rc,
        patent_number: company.patent_number,
        tax_id: company.tax_id,
        phone: company.phone,
        mobile: company.mobile,
        email: company.email,
        website: company.website,
        address: company.address,
        city: company.city,
        province: company.province,
        postal_code: company.postal_code,
        size_category: company.size_category,
        is_member: company.is_member ? 'Oui' : 'Non',
        membership_date: company.membership_date ? new Date(company.membership_date).toLocaleDateString('fr-FR') : '',
        employee_count: company.employee_count,
        sector_name: company.sector_name,
        created_at: new Date(company.created_at).toLocaleDateString('fr-FR'),
      });
    });

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=entreprises_${new Date().toISOString().split('T')[0]}.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    logger.error('Error exporting companies:', error);
    next(new AppError('Erreur lors de l\'export des entreprises', 500));
  }
};

module.exports = {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  findDuplicates,
  mergeCompanies,
  getCompanyStats,
  exportCompanies,
};
