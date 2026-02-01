/**
 * Data validation and cleaning utilities
 * Based on database cleaning functions
 */

/**
 * Normalize company name (SARL ABC, S.A.R.L abc → SARL ABC)
 */
const normalizeCompanyName = (rawName) => {
  if (!rawName || typeof rawName !== 'string') return null;
  
  // Remove extra spaces and convert to uppercase
  let normalized = rawName.trim().replace(/\s+/g, ' ').toUpperCase();
  
  // Standardize legal forms
  normalized = normalized.replace(/^S\.?A\.?R\.?L\.?\s+/i, 'SARL ');
  normalized = normalized.replace(/^S\.?A\.?\s+/i, 'SA ');
  normalized = normalized.replace(/^S\.?N\.?C\.?\s+/i, 'SNC ');
  
  return normalized;
};

/**
 * Clean and validate ICE number (Morocco's 15-digit business identifier)
 */
const cleanICENumber = (rawICE) => {
  if (!rawICE) return null;
  
  // Remove all non-digits
  const cleaned = rawICE.toString().replace(/\D/g, '');
  
  // Check if exactly 15 digits
  if (cleaned.length === 15) {
    return cleaned;
  }
  
  // Pad with leading zeros if between 1 and 14 digits
  if (cleaned.length > 0 && cleaned.length < 15) {
    return cleaned.padStart(15, '0');
  }
  
  return null;
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Clean email address
 */
const cleanEmail = (rawEmail) => {
  if (!rawEmail) return null;
  
  // Trim and lowercase
  let cleaned = rawEmail.trim().toLowerCase();
  
  // Remove spaces and replace commas with dots
  cleaned = cleaned.replace(/\s/g, '').replace(/,/g, '.');
  
  // Return only if valid
  return isValidEmail(cleaned) ? cleaned : null;
};

/**
 * Clean phone number (Morocco format)
 */
const cleanPhoneNumber = (rawPhone, addPrefix = true) => {
  if (!rawPhone) return null;
  
  // Remove all non-digits
  let cleaned = rawPhone.toString().replace(/\D/g, '');
  
  // Handle international prefix
  if (cleaned.startsWith('212')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('00212')) {
    cleaned = cleaned.substring(5);
  }
  
  // Should be 9 or 10 digits
  if (cleaned.length < 9 || cleaned.length > 10) {
    return null;
  }
  
  // Add 0 if missing (mobile/landline)
  if (cleaned.length === 9 && /^[5-7]/.test(cleaned)) {
    cleaned = '0' + cleaned;
  }
  
  // Add international prefix if requested
  if (addPrefix && cleaned.length === 10) {
    return '+212' + cleaned.substring(1);
  }
  
  return cleaned;
};

/**
 * Parse date from various formats
 */
const parseExcelDate = (rawDate) => {
  if (!rawDate) return null;
  
  const dateStr = rawDate.toString().trim();
  
  // Try ISO format (2024-12-31)
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(year, month - 1, day);
  }
  
  // Try DD/MM/YYYY
  const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    return new Date(year, month - 1, day);
  }
  
  // Try DD-MM-YYYY
  const ddmmyyyyDashMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (ddmmyyyyDashMatch) {
    const [, day, month, year] = ddmmyyyyDashMatch;
    return new Date(year, month - 1, day);
  }
  
  // Try MM/DD/YYYY (American format)
  const mmddyyyyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mmddyyyyMatch) {
    const [, month, day, year] = mmddyyyyMatch;
    const date = new Date(year, month - 1, day);
    // Only accept if year is reasonable
    if (date.getFullYear() >= 2000 && date.getFullYear() <= 2050) {
      return date;
    }
  }
  
  // Try Excel serial number
  if (!isNaN(rawDate) && rawDate > 25569) {
    // Excel epoch starts at 1900-01-01
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + rawDate * 86400000);
  }
  
  return null;
};

/**
 * Clean numeric value (remove spaces, commas, currency symbols)
 */
const cleanNumeric = (rawValue) => {
  if (!rawValue) return null;
  
  const cleaned = rawValue.toString().replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  
  return isNaN(num) ? null : num;
};

/**
 * Calculate data quality score (0-100) based on field completeness
 */
const calculateQualityScore = (data, fields) => {
  let score = 0;
  const weights = fields;
  
  for (const [field, weight] of Object.entries(weights)) {
    if (data[field] !== null && data[field] !== undefined && data[field] !== '') {
      score += weight;
    }
  }
  
  return Math.min(100, Math.round(score));
};

/**
 * Validate pagination parameters
 */
const validatePagination = (page, limit, maxLimit = 100) => {
  const validPage = Math.max(1, parseInt(page) || 1);
  const validLimit = Math.min(maxLimit, Math.max(1, parseInt(limit) || 20));
  const offset = (validPage - 1) * validLimit;
  
  return { page: validPage, limit: validLimit, offset };
};

module.exports = {
  normalizeCompanyName,
  cleanICENumber,
  isValidEmail,
  cleanEmail,
  cleanPhoneNumber,
  parseExcelDate,
  cleanNumeric,
  calculateQualityScore,
  validatePagination,
};
