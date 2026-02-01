const XLSX = require('xlsx');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const { query, transaction } = require('../config/database');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const {
  normalizeCompanyName,
  cleanICENumber,
  cleanEmail,
  cleanPhoneNumber,
  parseExcelDate,
  cleanNumeric,
} = require('../utils/validators');

/**
 * Download file from URL to buffer (for Cloudinary)
 */
const downloadFileToBuffer = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
};

/**
 * Upload and parse Excel file
 */
const uploadExcelFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please upload an Excel file', 400));
    }

    const { entity_type } = req.body;
    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const fileSize = req.file.size;
    const isCloudinary = filePath.startsWith('http');

    // Read Excel file - handle both local and Cloudinary
    let workbook;
    if (isCloudinary) {
      // Download from Cloudinary and read from buffer
      const buffer = await downloadFileToBuffer(filePath);
      workbook = XLSX.read(buffer, { type: 'buffer' });
    } else {
      // Read local file
      workbook = XLSX.readFile(filePath);
    }
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: null });

    if (rawData.length === 0) {
      // Delete file (Cloudinary or local)
      if (!isCloudinary) {
        await fs.unlink(filePath);
      }
      return next(new AppError('Excel file is empty', 400));
    }

    // Create import log
    const importResult = await query(
      `INSERT INTO import_logs (
        filename, data_type, total_rows, uploaded_by, status, file_size, sheet_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`,
      [fileName, entity_type, rawData.length, req.user.id, 'pending', fileSize, sheetName]
    );

    const importId = importResult.rows[0].id;

    // Store raw data
    await transaction(async (client) => {
      for (let i = 0; i < rawData.length; i++) {
        await client.query(
          `INSERT INTO raw_excel_data (import_log_id, row_number, raw_data)
           VALUES ($1, $2, $3)`,
          [importId, i + 1, rawData[i]]
        );
      }
    });

    logger.info(`Excel file uploaded: ${fileName} (${rawData.length} rows) by user ${req.user.id}`);

    res.status(200).json({
      status: 'success',
      data: {
        importId,
        fileName,
        totalRows: rawData.length,
        dataType: entity_type,
        preview: rawData.slice(0, 5), // First 5 rows for preview
      },
    });
  } catch (error) {
    // Clean up file on error (only for local files, Cloudinary files persist)
    if (req.file && req.file.path && !req.file.path.startsWith('http')) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        logger.error('Failed to delete file:', unlinkError);
      }
    }
    next(error);
  }
};

/**
 * Process imported data based on type
 */
const processImport = async (req, res, next) => {
  try {
    const { importId } = req.params;

    // Get import info to determine type
    const importCheck = await query(
      'SELECT id, data_type, status FROM import_logs WHERE id = $1',
      [importId]
    );

    if (importCheck.rows.length === 0) {
      return next(new AppError('Import not found', 404));
    }

    const { data_type, status } = importCheck.rows[0];

    if (status === 'completed') {
      return next(new AppError('Import already processed', 400));
    }

    // Route to appropriate processor based on data type
    req.params.importId = importId;
    req.dataType = data_type;

    switch (data_type) {
      case 'company':
        return await processCompaniesImport(req, res, next);
      case 'activity':
        return await processActivitiesImport(req, res, next);
      case 'participant':
        return await processParticipantsImport(req, res, next);
      case 'budget':
        return await processBudgetsImport(req, res, next);
      default:
        return next(new AppError(`Unsupported data type: ${data_type}`, 400));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Process imported companies from raw data
 */
const processCompaniesImport = async (req, res, next) => {
  try {
    const { importId } = req.params;

    // Check if import exists
    const importCheck = await query(
      'SELECT id, status FROM import_logs WHERE id = $1',
      [importId]
    );

    if (importCheck.rows.length === 0) {
      return next(new AppError('Import not found', 404));
    }

    if (importCheck.rows[0].status === 'completed') {
      return next(new AppError('Import already processed', 400));
    }

    // Get raw data
    const rawDataResult = await query(
      `SELECT id, row_number, raw_data 
       FROM raw_excel_data 
       WHERE import_log_id = $1 
       ORDER BY row_number`,
      [importId]
    );

    let processed = 0;
    let failed = 0;
    const errors = [];

    // Process each row
    await transaction(async (client) => {
      for (const row of rawDataResult.rows) {
        try {
          const data = row.raw_data;

          // Clean and validate data
          const companyData = {
            name: normalizeCompanyName(data['Raison sociale *'] || data.nom || data.name || data['Raison sociale']),
            legal_name: data['Raison sociale légale'] || data.legal_name,
            ice: cleanICENumber(data['ICE *'] || data.ice || data.ICE || data['Numéro ICE']),
            rc: data.RC || data.rc || data['Registre Commerce'],
            patent_number: data['Numéro de brevet'] || data.patent,
            tax_id: data['Identifiant Fiscal'] || data.tax_id,
            phone: cleanPhoneNumber(data['Téléphone'] || data.telephone || data.phone || data.tel),
            mobile: cleanPhoneNumber(data.Mobile || data.mobile || data.gsm),
            email: cleanEmail(data['E-mail'] || data.email),
            website: data['Site web'] || data.website,
            address: data.Adresse || data.address || data.adresse,
            city: data.Ville || data.city || data.ville,
            province: data.Province || data.province,
            postal_code: data['Code postal'] || data.postal_code,
            company_type: data['Forme juridique'] || data.company_type || data.legal_form,
            sector_id: data.sector_id || null,
            representative_name: data['Nom du représentant'] || data.representative_name,
            is_member: data.is_member || false,
            membership_status: data.membership_status || 'pending',
            created_by: req.user.id,
          };

          // Skip if no name or ICE
          if (!companyData.name && !companyData.ice) {
            failed++;
            errors.push({
              row: row.row_number,
              error: 'Missing required fields (name or ICE)',
            });
            continue;
          }

          // Check for existing company by ICE
          let existingCompany = null;
          if (companyData.ice) {
            const checkResult = await client.query(
              'SELECT id FROM companies WHERE ice = $1',
              [companyData.ice]
            );
            existingCompany = checkResult.rows[0];
          }

          if (existingCompany) {
            // Update existing company
            await client.query(
              `UPDATE companies 
               SET name = COALESCE($1, name),
                   phone = COALESCE($2, phone),
                   email = COALESCE($3, email),
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = $4`,
              [companyData.name, companyData.phone, companyData.email, existingCompany.id]
            );
          } else {
            // Insert new company
            await client.query(
              `INSERT INTO companies (
                name, legal_name, ice, rc, patent_number, tax_id,
                phone, mobile, email, website,
                address, city, province, postal_code,
                company_type, sector_id, representative_name,
                is_member, membership_status, created_by
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
              [
                companyData.name, companyData.legal_name, companyData.ice, companyData.rc,
                companyData.patent_number, companyData.tax_id, companyData.phone, companyData.mobile,
                companyData.email, companyData.website, companyData.address, companyData.city,
                companyData.province, companyData.postal_code, companyData.company_type,
                companyData.sector_id, companyData.representative_name, companyData.is_member,
                companyData.membership_status, companyData.created_by
              ]
            );
          }

          processed++;
        } catch (rowError) {
          failed++;
          errors.push({
            row: row.row_number,
            error: rowError.message,
          });
          logger.error(`Error processing row ${row.row_number}:`, rowError);
        }
      }

      // Update import log
      await client.query(
        `UPDATE import_logs 
         SET status = 'completed', 
             rows_imported = $1, 
             rows_with_errors = $2,
             error_log = $3,
             processing_completed_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [processed, failed, JSON.stringify(errors), importId]
      );
    });

    logger.info(`Import processed: ${importId} - ${processed} success, ${failed} failed`);

    res.status(200).json({
      status: 'success',
      data: {
        importId,
        processed,
        failed,
        errors: errors.slice(0, 20), // Return first 20 errors
      },
    });
  } catch (error) {
    // Update import log on failure
    await query(
      `UPDATE import_logs 
       SET status = 'failed', 
           error_log = $1
       WHERE id = $2`,
      [JSON.stringify([{ error: error.message }]), req.params.importId]
    );
    next(error);
  }
};

/**
 * Get import history
 */
const getImportHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT 
        il.id, il.filename, il.data_type, il.total_rows,
        il.rows_imported, il.rows_skipped, il.status,
        il.upload_date,
        u.username as uploaded_by_username
       FROM import_logs il
       LEFT JOIN users u ON il.uploaded_by = u.id
       ORDER BY il.upload_date DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await query('SELECT COUNT(*) FROM import_logs');
    const total = parseInt(countResult.rows[0].count);

    res.status(200).json({
      status: 'success',
      data: {
        imports: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get import details
 */
const getImportDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        il.*,
        u.username as uploaded_by_username,
        COUNT(red.id) as raw_data_count
       FROM import_logs il
       LEFT JOIN users u ON il.uploaded_by = u.id
       LEFT JOIN raw_excel_data red ON il.id = red.import_log_id
       WHERE il.id = $1
       GROUP BY il.id, u.username`,
      [id]
    );

    if (result.rows.length === 0) {
      return next(new AppError('Import not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        import: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validate data before processing
 */
const validateImport = async (req, res, next) => {
  try {
    const { importId } = req.params;

    // Get import type
    const importInfo = await query(
      'SELECT data_type FROM import_logs WHERE id = $1',
      [importId]
    );

    if (importInfo.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Import not found' });
    }

    const dataType = importInfo.rows[0].data_type;

    const rawDataResult = await query(
      `SELECT id, row_number, raw_data 
       FROM raw_excel_data 
       WHERE import_log_id = $1 
       ORDER BY row_number`,
      [importId]
    );

    const validationResults = [];

    for (const row of rawDataResult.rows) {
      const data = row.raw_data;
      const issues = [];

      // Validate based on data type
      if (dataType === 'company') {
        // Validate company data
        const companyName = data['Raison sociale *'] || data['Raison sociale'] || data.nom || data.name;
        if (!companyName) {
          issues.push('Missing company name');
        }

        const iceRaw = data['ICE *'] || data.ICE || data.ice || data['Numéro ICE'];
        const ice = cleanICENumber(iceRaw);
        if (!ice) {
          issues.push('Invalid or missing ICE number');
        }

        const email = data['E-mail'] || data.email;
        if (email && !cleanEmail(email)) {
          issues.push('Invalid email format');
        }

        const phone = data['Téléphone'] || data.telephone || data.phone || data.tel;
        if (phone && !cleanPhoneNumber(phone)) {
          issues.push('Invalid phone format');
        }

        validationResults.push({
          row: row.row_number,
          valid: issues.length === 0,
          issues,
          data: { name: companyName, ice: iceRaw },
        });

      } else if (dataType === 'activity') {
        // Validate activity data
        const title = data['Titre *'] || data.title;
        if (!title) {
          issues.push('Missing activity title');
        }

        const startDate = data['Date début *'] || data.start_date;
        if (!startDate) {
          issues.push('Missing start date');
        }

        validationResults.push({
          row: row.row_number,
          valid: issues.length === 0,
          issues,
          data: { title, start_date: startDate },
        });

      } else if (dataType === 'participant') {
        // Validate participant data
        const firstName = data['Prénom *'] || data.first_name;
        const lastName = data['Nom *'] || data.last_name;
        const email = data['E-mail *'] || data.email;

        if (!firstName) issues.push('Missing first name');
        if (!lastName) issues.push('Missing last name');
        if (!email) issues.push('Missing email');

        validationResults.push({
          row: row.row_number,
          valid: issues.length === 0,
          issues,
          data: { first_name: firstName, last_name: lastName, email },
        });

      } else if (dataType === 'budget') {
        // Validate budget data
        const fiscalYear = data['Année fiscale *'] || data.fiscal_year;
        const amount = data['Montant alloué *'] || data['Montant *'] || data.amount;

        if (!fiscalYear) issues.push('Missing fiscal year');
        if (!amount) issues.push('Missing amount');

        validationResults.push({
          row: row.row_number,
          valid: issues.length === 0,
          issues,
          data: { fiscal_year: fiscalYear, amount },
        });

      } else {
        validationResults.push({
          row: row.row_number,
          valid: false,
          issues: ['Unknown data type'],
          data: {},
        });
      }
    }

    const validCount = validationResults.filter(r => r.valid).length;
    const invalidCount = validationResults.length - validCount;

    res.status(200).json({
      status: 'success',
      data: {
        total: validationResults.length,
        valid: validCount,
        invalid: invalidCount,
        results: validationResults.slice(0, 50), // First 50 rows
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Process imported activities from raw data
 */
const processActivitiesImport = async (req, res, next) => {
  try {
    const { importId } = req.params;

    // Get raw data
    const rawDataResult = await query(
      `SELECT id, row_number, raw_data 
       FROM raw_excel_data 
       WHERE import_log_id = $1 
       ORDER BY row_number`,
      [importId]
    );

    let processed = 0;
    let failed = 0;
    const errors = [];

    // Process each row
    await transaction(async (client) => {
      for (const row of rawDataResult.rows) {
        try {
          const data = row.raw_data;

          // Map Excel columns to database fields
          const title = data['Titre *'] || data.title || data.Titre;
          const description = data.Description || data.description;
          const start_date = data['Date début *'] || data.start_date;
          const end_date = data['Date fin *'] || data.end_date;
          const venue_name = data.Lieu || data.location || data.lieu;
          const max_participants = data['Capacité max'] || data.capacity || data.max_capacity;
          const registration_deadline = data['Date limite inscription'] || data.registration_deadline;
          const is_free = (data['Gratuit (Oui/Non)'] || '').toLowerCase() === 'oui' || data.is_free === true;
          const participation_fee = data['Frais participation'] || data.participation_fee || 0;
          const budget_allocated = data['Budget alloué'] || data.budget || 0;
          const status = data.Statut || data.status || 'planned';

          // Skip if no title
          if (!title) {
            failed++;
            errors.push({
              row: row.row_number,
              error: 'Missing required field: title',
            });
            continue;
          }

          // Insert activity with correct column names
          await client.query(
            `INSERT INTO activities (
              title, description, start_date, end_date,
              venue_name, max_participants, registration_deadline,
              is_free, participation_fee, budget_allocated, status, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              title, description, start_date, end_date,
              venue_name, max_participants, registration_deadline,
              is_free, participation_fee, budget_allocated,
              status, req.user.id
            ]
          );

          processed++;
        } catch (rowError) {
          failed++;
          errors.push({
            row: row.row_number,
            error: rowError.message,
          });
          logger.error(`Error processing row ${row.row_number}:`, rowError.message);
        }
      }

      // Update import log
      await client.query(
        `UPDATE import_logs 
         SET status = 'completed', 
             rows_imported = $1, 
             rows_with_errors = $2,
             error_log = $3,
             processing_completed_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [processed, failed, JSON.stringify(errors), importId]
      );
    });

    logger.info(`Import processed: ${importId} - ${processed} success, ${failed} failed`);

    res.status(200).json({
      status: 'success',
      data: {
        importId,
        processed,
        failed,
        errors: errors.slice(0, 20),
      },
    });
  } catch (error) {
    await query(
      `UPDATE import_logs 
       SET status = 'failed', 
           error_log = $1
       WHERE id = $2`,
      [JSON.stringify([{ error: error.message }]), req.params.importId]
    );
    next(error);
  }
};

/**
 * Process imported participants from raw data
 */
const processParticipantsImport = async (req, res, next) => {
  try {
    const { importId } = req.params;

    const rawDataResult = await query(
      `SELECT id, row_number, raw_data 
       FROM raw_excel_data 
       WHERE import_log_id = $1 
       ORDER BY row_number`,
      [importId]
    );

    let processed = 0;
    let failed = 0;
    const errors = [];

    await transaction(async (client) => {
      for (const row of rawDataResult.rows) {
        try {
          const data = row.raw_data;

          const participantData = {
            first_name: data['Prénom *'] || data.first_name || data.prenom,
            last_name: data['Nom *'] || data.last_name || data.nom,
            email: data['E-mail *'] || data.email,
            phone: data['Téléphone'] || data.phone || data.telephone,
            registration_date: data['Date inscription'] || data.registration_date || new Date(),
            registration_status: data['Statut'] || data.status || 'registered',
            attendance_confirmed: (data['Présence'] || '').toLowerCase() === 'oui' || false,
            feedback_comments: data['Notes'] || data.notes,
            job_title: data['Poste'] || data.job_title,
            department: data['Département'] || data.department,
            source_file: `Excel Import`,
            source_row: row.row_number,
          };

          if (!participantData.first_name || !participantData.last_name || !participantData.email) {
            failed++;
            errors.push({
              row: row.row_number,
              error: 'Missing required fields (first_name, last_name, or email)',
            });
            continue;
          }

          await client.query(
            `INSERT INTO participants (
              first_name, last_name, email, phone,
              registration_date, registration_status, attendance_confirmed,
              feedback_comments, job_title, department, source_file, source_row
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              participantData.first_name, participantData.last_name, participantData.email,
              participantData.phone, participantData.registration_date, participantData.registration_status,
              participantData.attendance_confirmed, participantData.feedback_comments,
              participantData.job_title, participantData.department, participantData.source_file,
              participantData.source_row
            ]
          );

          processed++;
        } catch (rowError) {
          failed++;
          errors.push({
            row: row.row_number,
            error: rowError.message,
          });
          logger.error(`Error processing row ${row.row_number}:`, rowError.message);
        }
      }

      await client.query(
        `UPDATE import_logs 
         SET status = 'completed', 
             rows_imported = $1, 
             rows_with_errors = $2,
             error_log = $3,
             processing_completed_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [processed, failed, JSON.stringify(errors), importId]
      );
    });

    logger.info(`Import processed: ${importId} - ${processed} success, ${failed} failed`);

    res.status(200).json({
      status: 'success',
      data: {
        importId,
        processed,
        failed,
        errors: errors.slice(0, 20),
      },
    });
  } catch (error) {
    await query(
      `UPDATE import_logs 
       SET status = 'failed', 
           error_log = $1
       WHERE id = $2`,
      [JSON.stringify([{ error: error.message }]), req.params.importId]
    );
    next(error);
  }
};

/**
 * Process imported budgets from raw data
 */
const processBudgetsImport = async (req, res, next) => {
  try {
    const { importId } = req.params;

    const rawDataResult = await query(
      `SELECT id, row_number, raw_data 
       FROM raw_excel_data 
       WHERE import_log_id = $1 
       ORDER BY row_number`,
      [importId]
    );

    let processed = 0;
    let failed = 0;
    const errors = [];

    await transaction(async (client) => {
      for (const row of rawDataResult.rows) {
        try {
          const data = row.raw_data;

          const budgetData = {
            fiscal_year: parseInt(data['Année fiscale *'] || data.fiscal_year || data.year || new Date().getFullYear()),
            allocated_amount: parseFloat(data['Montant alloué *'] || data['Montant *'] || data.amount || data.montant || 0),
            notes: data['Description'] || data.description,
          };

          if (!budgetData.fiscal_year || !budgetData.allocated_amount) {
            failed++;
            errors.push({
              row: row.row_number,
              error: 'Missing required fields (fiscal_year or allocated_amount)',
            });
            continue;
          }

          await client.query(
            `INSERT INTO budgets (
              fiscal_year, allocated_amount, notes
            ) VALUES ($1, $2, $3)`,
            [
              budgetData.fiscal_year, budgetData.allocated_amount, budgetData.notes
            ]
          );

          processed++;
        } catch (rowError) {
          failed++;
          errors.push({
            row: row.row_number,
            error: rowError.message,
          });
          logger.error(`Error processing row ${row.row_number}:`, rowError.message);
        }
      }

      await client.query(
        `UPDATE import_logs 
         SET status = 'completed', 
             rows_imported = $1, 
             rows_with_errors = $2,
             error_log = $3,
             processing_completed_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [processed, failed, JSON.stringify(errors), importId]
      );
    });

    logger.info(`Import processed: ${importId} - ${processed} success, ${failed} failed`);

    res.status(200).json({
      status: 'success',
      data: {
        importId,
        processed,
        failed,
        errors: errors.slice(0, 20),
      },
    });
  } catch (error) {
    await query(
      `UPDATE import_logs 
       SET status = 'failed', 
           error_log = $1
       WHERE id = $2`,
      [JSON.stringify([{ error: error.message }]), req.params.importId]
    );
    next(error);
  }
};

module.exports = {
  uploadExcelFile,
  processImport,
  processCompaniesImport,
  processActivitiesImport,
  processParticipantsImport,
  processBudgetsImport,
  getImportHistory,
  getImportDetails,
  validateImport,
};
