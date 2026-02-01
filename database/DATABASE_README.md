# Database Design Documentation - CCIS-Vision

## Overview
This PostgreSQL database is designed to handle the migration from decentralized Excel files to a centralized system for the Chambre de Commerce, d'Industrie et de Services (CCIS) of Rabat-Salé-Kénitra.

## Key Design Decisions for Messy Excel Data

### 1. **Flexible Data Import Structure**
- **import_logs** table tracks every Excel file imported with detailed metrics
- **raw_excel_data** table stores original Excel rows as JSONB before processing
- Allows reprocessing if validation rules change

### 2. **Data Quality Tracking**
```sql
companies.data_quality_score      -- 0-100 score based on completeness
companies.needs_verification      -- Flag for manual review
companies.duplicate_of            -- Link to potential duplicate
data_quality_issues               -- Centralized issue tracking
```

### 3. **Handling Inconsistent Data Types**

#### Phone Numbers
- Stored as VARCHAR(50) to handle various formats: 
  - `0612345678`, `+212 612 34 56 78`, `06-12-34-56-78`

#### Dates
- Use PostgreSQL DATE type, but validation handles:
  - European format: `31/12/2024`
  - ISO format: `2024-12-31`
  - Text: `Décembre 2024`

#### Company Names
- `name` (500 chars) - handles long/messy names
- `legal_name` - official registered name
- Enables searching both versions

### 4. **Duplicate Detection Strategy**

#### Level 1: ICE (Unique Business ID)
```sql
SELECT * FROM companies WHERE ice = '000123456789012';
```

#### Level 2: Fuzzy Name Matching
```sql
SELECT * FROM find_duplicate_companies('SOCIÉTÉ ABC', NULL);
-- Returns similarity scores
```

#### Level 3: Multiple Fields
- Name + City + Phone combination
- Stored in `duplicate_of` field for manual resolution

### 5. **Historization (Version Control)**
```sql
activities.version                 -- Version number
activities.previous_version_id     -- Link to previous version
audit_log                          -- Full change history (JSONB)
```

## Database Structure

### Core Modules

#### 1. Authentication & Users (Tables 1-2)
- `roles` - Admin, Service User, Viewer
- `users` - User accounts with department assignment

#### 2. Organizational Structure (Tables 3-4)
- `locations` - Siege + Annexes (Kénitra, Khémisset)
- `departments` - 7 main departments with hierarchy support

#### 3. Companies/Members (Tables 5-6)
- `company_sectors` - Industry classification
- `companies` - **CENTRAL TABLE** with quality tracking

#### 4. Activities (Tables 7-10)
- `activity_types` - Formation, Event, Project, Service
- `activities` - Main activity tracking
- `formations` - Extended training details
- `participants` - Beneficiary tracking

#### 5. Partnerships (Tables 11-12)
- `partner_types` - Classification
- `partners` - Partner organizations
- `activity_partners` - Many-to-many relationship

#### 6. Services (Tables 13-14)
- `service_types` - Predefined service catalog
- `services_provided` - Service requests/delivery

#### 7. Financial (Tables 15-17)
- `budget_categories` - Budget classification
- `budgets` - Annual budgets by department
- `expenses` - Expense tracking linked to activities

#### 8. Data Import & Quality (Tables 18-22)
- `import_logs` - Excel import tracking
- `raw_excel_data` - Raw data storage
- `data_quality_rules` - Validation rules
- `data_quality_issues` - Detected issues

#### 9. Audit & History (Table 23)
- `audit_log` - Complete change history

#### 10. Alerts (Tables 24-26)
- `alert_types` - Alert definitions
- `alerts` - Active alerts
- `alert_recipients` - Notification routing

#### 11. KPIs & Dashboard (Tables 27-28)
- `kpi_definitions` - Metric definitions
- `dashboard_stats` - Materialized view for performance

## Excel Data Migration Strategy

### Phase 1: Import Raw Data
```sql
-- 1. Upload Excel file → create import_log entry
INSERT INTO import_logs (filename, data_type, uploaded_by) 
VALUES ('entreprises_2024.xlsx', 'companies', user_uuid);

-- 2. Read Excel rows → store in raw_excel_data
INSERT INTO raw_excel_data (import_log_id, row_number, raw_data)
VALUES (import_uuid, 5, '{"Nom": "SARL ABC", "ICE": "001234567", ...}');
```

### Phase 2: Validate & Clean
```sql
-- 3. Run validation rules
SELECT * FROM data_quality_rules WHERE entity_type = 'company';

-- 4. Detect duplicates
SELECT * FROM find_duplicate_companies('SARL ABC', '001234567890123');

-- 5. Calculate quality score
SELECT calculate_company_quality_score(company_uuid);
```

### Phase 3: Create Clean Records
```sql
-- 6. Insert validated companies
INSERT INTO companies (name, ice, email, ...)
SELECT cleaned_name, cleaned_ice, ... FROM raw_excel_data
WHERE status = 'validated';

-- 7. Link raw data to created entities
UPDATE raw_excel_data 
SET mapped_entity_id = new_company_uuid,
    status = 'processed';
```

### Phase 4: Handle Issues
```sql
-- 8. Log quality issues
INSERT INTO data_quality_issues (entity_type, entity_id, issue_description)
SELECT 'company', id, 'Email format invalid' 
FROM companies WHERE email NOT LIKE '%@%.%';

-- 9. Flag for manual review
UPDATE companies 
SET needs_verification = TRUE
WHERE data_quality_score < 50;
```

## Common Excel Data Problems & Solutions

### Problem 1: Inconsistent Company Names
**Excel:**
```
Row 1: "SARL SOCIÉTÉ ABC"
Row 2: "Société ABC"
Row 3: "S.A.R.L ABC"
```

**Solution:**
```sql
-- Normalize during import
UPDATE companies 
SET name = UPPER(TRIM(REGEXP_REPLACE(name, '\s+', ' ', 'g')))
WHERE needs_verification = TRUE;

-- Use fuzzy matching
SELECT * FROM companies 
WHERE SIMILARITY(name, 'SOCIÉTÉ ABC') > 0.8;
-- Requires: CREATE EXTENSION pg_trgm;
```

### Problem 2: Multiple Date Formats
**Excel:**
```
"31/12/2024"
"2024-12-31"
"31-Dec-2024"
"31 Décembre 2024"
```

**Solution:**
- Import as TEXT first in raw_excel_data
- Use application logic to try multiple parsers
- Store in DATE column only after successful parsing
- Log unparseable dates in data_quality_issues

### Problem 3: Missing/Invalid ICE Numbers
**Excel:**
```
Row 1: "001234567890123" ✓ (15 digits)
Row 2: "123456789"        ✗ (too short)
Row 3: ""                  ✗ (missing)
Row 4: "N/A"               ✗ (text)
```

**Solution:**
```sql
-- Validation rule
INSERT INTO data_quality_rules (entity_type, field_name, rule_type, validation_pattern)
VALUES ('company', 'ice', 'format', '^[0-9]{15}$');

-- Flag invalid ICE
UPDATE companies 
SET needs_verification = TRUE
WHERE ice IS NULL OR ice !~ '^[0-9]{15}$';
```

### Problem 4: Duplicate Entries
**Excel:**
```
File1.xlsx, Row 10: "ABC Company", ICE: 001234567890123
File2.xlsx, Row 25: "ABC COMPANY", ICE: 001234567890123
File3.xlsx, Row 8:  "Société ABC", ICE: null
```

**Solution:**
```sql
-- Detect exact ICE duplicates
SELECT ice, COUNT(*) 
FROM raw_excel_data 
WHERE raw_data->>'ICE' IS NOT NULL
GROUP BY ice HAVING COUNT(*) > 1;

-- Mark as duplicate
UPDATE companies c1
SET duplicate_of = c2.id
FROM companies c2
WHERE c1.ice = c2.ice 
  AND c1.id != c2.id 
  AND c1.created_at > c2.created_at;
```

### Problem 5: Address Geocoding
**Excel:**
```
"123 Avenue Hassan II, Rabat"
"Rue principale, Kénitra"  (vague)
""  (missing)
```

**Solution:**
- Store original address as TEXT
- Use geocoding API (Google Maps, MapBox) to get lat/lng
- Store in separate latitude/longitude columns
- Flag addresses that couldn't be geocoded

## Key Views for Excel Migration

### View: Companies Needing Review
```sql
CREATE VIEW v_companies_need_review AS
SELECT 
    c.id,
    c.name,
    c.data_quality_score,
    c.needs_verification,
    COUNT(dqi.id) as issue_count,
    STRING_AGG(dqi.issue_description, '; ') as issues
FROM companies c
LEFT JOIN data_quality_issues dqi ON dqi.entity_id = c.id AND dqi.status = 'open'
WHERE c.needs_verification = TRUE OR c.data_quality_score < 70
GROUP BY c.id, c.name, c.data_quality_score, c.needs_verification;
```

### View: Import Summary
```sql
CREATE VIEW v_import_summary AS
SELECT 
    il.filename,
    il.upload_date,
    il.status,
    il.total_rows,
    il.rows_imported,
    il.rows_with_errors,
    ROUND((il.rows_imported::NUMERIC / il.total_rows * 100), 2) as success_rate,
    u.username as uploaded_by_user
FROM import_logs il
JOIN users u ON il.uploaded_by = u.id
ORDER BY il.upload_date DESC;
```

## Performance Considerations

### 1. Indexes for Search
```sql
-- Full-text search (requires pg_trgm extension)
CREATE INDEX idx_companies_name_trgm ON companies USING gin(name gin_trgm_ops);

-- Regular indexes
CREATE INDEX idx_companies_ice ON companies(ice);
CREATE INDEX idx_companies_city ON companies(city);
```

### 2. Materialized Views for Dashboards
```sql
-- Refresh periodically (e.g., every hour)
REFRESH MATERIALIZED VIEW dashboard_stats;

-- Or create refresh job
SELECT cron.schedule('refresh-stats', '0 * * * *', 
    'REFRESH MATERIALIZED VIEW dashboard_stats');
-- Requires: CREATE EXTENSION pg_cron;
```

### 3. Partitioning for Large Tables
```sql
-- If audit_log grows very large, partition by date
CREATE TABLE audit_log_2024 PARTITION OF audit_log
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

## Security Considerations

### 1. Row-Level Security
```sql
-- Enable RLS on sensitive tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see companies in their department
CREATE POLICY company_department_policy ON companies
    FOR SELECT
    USING (
        department_id IN (
            SELECT department_id FROM users WHERE id = current_user_id()
        )
        OR 
        EXISTS (
            SELECT 1 FROM users WHERE id = current_user_id() AND role_id = 1 -- Admin
        )
    );
```

### 2. Sensitive Data
```sql
-- Encrypt sensitive fields at application level
-- Store hash of password, not plaintext
UPDATE users SET password_hash = crypt('password', gen_salt('bf'));
```

## Backup & Recovery Strategy

### 1. Regular Backups
```bash
# Daily full backup
pg_dump -U postgres ccis_vision > backup_$(date +%Y%m%d).sql

# Continuous archiving (WAL)
archive_mode = on
archive_command = 'cp %p /backup/archive/%f'
```

### 2. Point-in-Time Recovery
- Keep raw_excel_data for at least 90 days
- Audit log enables reconstruction of any state

## Next Steps for Implementation

1. **Create Database**
   ```bash
   createdb ccis_vision
   psql ccis_vision < database_design.sql
   ```

2. **Install Extensions**
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pg_trgm";
   CREATE EXTENSION IF NOT EXISTS "pg_cron";
   ```

3. **Create Initial Users**
   ```sql
   INSERT INTO users (username, email, password_hash, role_id)
   VALUES ('admin', 'admin@ccis.ma', crypt('temp123', gen_salt('bf')), 1);
   ```

4. **Test Import Pipeline**
   - Upload sample Excel file
   - Validate data quality rules
   - Review detected issues
   - Refine cleaning scripts

5. **Build Application Layer**
   - Backend API (Node.js/Python)
   - Excel import processor
   - Data cleaning scripts
   - Frontend dashboard (React/Vue)

## Estimated Storage Requirements

| Table | Initial Rows | Growth Rate | Storage (est.) |
|-------|-------------|-------------|----------------|
| companies | 5,000 | 500/year | 50 MB |
| activities | 1,000 | 200/year | 20 MB |
| participants | 10,000 | 2,000/year | 100 MB |
| raw_excel_data | 20,000 | 5,000/year | 200 MB |
| audit_log | 50,000 | 10,000/month | 500 MB/year |

**Total estimated: ~1 GB first year, growing ~500 MB/year**

## Contact & Support

For questions about this database design:
- Review the inline comments in `database_design.sql`
- Check the views and functions for implementation examples
- Test with sample data before production migration
