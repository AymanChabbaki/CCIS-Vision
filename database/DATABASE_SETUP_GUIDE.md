# Database Setup Guide - CCIS-Vision

## Prerequisites

### 1. Install PostgreSQL 14+
```bash
# Windows (using Chocolatey)
choco install postgresql14

# Or download from: https://www.postgresql.org/download/windows/

# Verify installation
psql --version
```

### 2. Install Required Extensions
```sql
-- Connect to postgres
psql -U postgres

-- Create database
CREATE DATABASE ccis_vision;

-- Connect to new database
\c ccis_vision

-- Install extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";    -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm";      -- Fuzzy text search
CREATE EXTENSION IF NOT EXISTS "pgcrypto";     -- Password hashing
CREATE EXTENSION IF NOT EXISTS "pg_cron";      -- Scheduled jobs (optional)
```

## Setup Steps

### Step 1: Create the Database Schema

```bash
# Run the main schema file
psql -U postgres -d ccis_vision -f database_design.sql
```

This will create:
- 27+ tables
- 3 materialized views
- 10+ custom functions
- Triggers for automatic updates
- Initial data in lookup tables

### Step 2: Load Data Cleaning Functions

```bash
# Load cleaning and validation functions
psql -U postgres -d ccis_vision -f data_cleaning_queries.sql
```

### Step 3: Create Initial Admin User

```sql
-- Create first admin user
INSERT INTO users (username, email, password_hash, role_id, full_name, is_active)
VALUES (
    'admin',
    'admin@ccis.ma',
    crypt('ChangeMe123!', gen_salt('bf')),  -- Change this password!
    1,  -- Admin role
    'Administrator',
    TRUE
);
```

### Step 4: Verify Installation

```sql
-- Check tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Should return 27+ tables

-- Check functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_type = 'FUNCTION' 
  AND routine_schema = 'public'
ORDER BY routine_name;

-- Check views
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public';
```

### Step 5: Test Basic Functionality

```sql
-- Test company creation
INSERT INTO companies (name, ice, email, phone, city)
VALUES (
    'TEST COMPANY SARL',
    '001234567890123',
    'test@company.ma',
    '+212612345678',
    'Rabat'
);

-- Test quality score calculation
SELECT 
    id, 
    name, 
    calculate_company_quality_score(id) as quality_score 
FROM companies;

-- Test data cleaning functions
SELECT normalize_company_name('  s.a.r.l   test   company  ');
SELECT clean_ice_number('001.234.567.890.123');
SELECT clean_phone_number('06 12 34 56 78');
```

## Excel Import Workflow

### 1. Upload Excel File

```python
# Python example using pandas
import pandas as pd
import psycopg2
import json
from uuid import uuid4

# Read Excel file
df = pd.read_excel('entreprises_2024.xlsx')

# Connect to database
conn = psycopg2.connect(
    dbname='ccis_vision',
    user='postgres',
    password='your_password',
    host='localhost'
)

# Create import log
import_id = str(uuid4())
cursor = conn.cursor()
cursor.execute("""
    INSERT INTO import_logs (id, filename, data_type, total_rows, uploaded_by)
    VALUES (%s, %s, %s, %s, %s)
""", (import_id, 'entreprises_2024.xlsx', 'companies', len(df), 'user-uuid'))

# Insert raw data
for idx, row in df.iterrows():
    raw_data = json.dumps(row.to_dict(), default=str)
    cursor.execute("""
        INSERT INTO raw_excel_data (import_log_id, row_number, raw_data)
        VALUES (%s, %s, %s)
    """, (import_id, idx + 1, raw_data))

conn.commit()
```

### 2. Process Import

```sql
-- Run the import function
SELECT * FROM import_companies_from_raw('import-uuid');

-- Check results
SELECT * FROM v_import_quality_report WHERE import_id = 'import-uuid';
```

### 3. Review Issues

```sql
-- Check data quality issues
SELECT * FROM v_companies_incomplete;

-- Find duplicates
SELECT * FROM v_duplicate_companies_by_ice;

-- Get companies needing review
SELECT * FROM v_companies_need_review;
```

### 4. Clean and Validate

```sql
-- Run validation on all companies
SELECT validate_all_companies();

-- Review quality overview
SELECT * FROM v_company_quality_overview;
```

## Common Excel Data Scenarios

### Scenario 1: Importing Companies

**Excel Structure:**
```
| Nom Entreprise | ICE | Email | Téléphone | Ville |
|----------------|-----|-------|-----------|-------|
| SARL ABC       | ... | ...   | ...       | ...   |
```

**Import Steps:**
1. Upload to `raw_excel_data` with column mapping
2. Run `import_companies_from_raw()`
3. Review `data_quality_issues`
4. Fix issues manually or with update scripts

### Scenario 2: Importing Activities/Formations

**Excel Structure:**
```
| Titre Formation | Date Début | Date Fin | Lieu | Budget |
|----------------|-----------|----------|------|--------|
| Formation Excel | 15/03/2024 | 17/03/2024 | Rabat | 15000 |
```

**Import Logic:**
```sql
-- Similar pattern to companies
INSERT INTO activities (title, start_date, end_date, budget_allocated, activity_type_id)
SELECT 
    raw_data->>'Titre Formation',
    parse_excel_date(raw_data->>'Date Début'),
    parse_excel_date(raw_data->>'Date Fin'),
    (raw_data->>'Budget')::NUMERIC,
    1  -- Formation type
FROM raw_excel_data
WHERE import_log_id = 'your-import-id'
  AND status = 'pending';
```

### Scenario 3: Importing Participants

**Excel Structure:**
```
| Nom | Prénom | Email | Entreprise | Formation |
|-----|--------|-------|------------|-----------|
| ... | ...    | ...   | ...        | ...       |
```

**Import with Company Lookup:**
```sql
INSERT INTO participants (first_name, last_name, email, company_id, activity_id)
SELECT 
    raw_data->>'Prénom',
    raw_data->>'Nom',
    clean_email(raw_data->>'Email'),
    (SELECT id FROM companies WHERE name = raw_data->>'Entreprise' LIMIT 1),
    (SELECT id FROM activities WHERE title = raw_data->>'Formation' LIMIT 1)
FROM raw_excel_data
WHERE import_log_id = 'your-import-id';
```

## Performance Optimization

### 1. Regular Maintenance

```sql
-- Vacuum and analyze tables (run weekly)
VACUUM ANALYZE companies;
VACUUM ANALYZE activities;
VACUUM ANALYZE participants;

-- Refresh materialized views (run daily)
REFRESH MATERIALIZED VIEW dashboard_stats;

-- Clean old raw data (after 90 days)
DELETE FROM raw_excel_data 
WHERE created_at < NOW() - INTERVAL '90 days'
  AND status = 'processed';
```

### 2. Index Monitoring

```sql
-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- Find missing indexes
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    seq_tup_read / seq_scan as avg_tuples_per_scan
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC;
```

### 3. Query Optimization

```sql
-- Enable query timing
\timing on

-- Analyze slow queries
EXPLAIN ANALYZE
SELECT * FROM v_companies_with_quality
WHERE city = 'Rabat' AND data_quality_score > 80;

-- Use indexes for common searches
CREATE INDEX CONCURRENTLY idx_companies_city_quality 
ON companies(city, data_quality_score);
```

## Backup Strategy

### 1. Daily Backup

```bash
# Full backup
pg_dump -U postgres ccis_vision > backup_$(date +%Y%m%d).sql

# Compressed backup
pg_dump -U postgres -Fc ccis_vision > backup_$(date +%Y%m%d).dump
```

### 2. Backup Script (Windows PowerShell)

```powershell
# backup_database.ps1
$date = Get-Date -Format "yyyyMMdd_HHmmss"
$backupPath = "C:\Backups\CCIS"
$filename = "$backupPath\ccis_vision_$date.dump"

# Create backup directory if it doesn't exist
if (!(Test-Path $backupPath)) {
    New-Item -ItemType Directory -Path $backupPath
}

# Run pg_dump
& "C:\Program Files\PostgreSQL\14\bin\pg_dump.exe" `
    -U postgres `
    -Fc `
    ccis_vision `
    -f $filename

# Keep only last 7 days
Get-ChildItem $backupPath -Filter "*.dump" | 
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | 
    Remove-Item
```

### 3. Restore from Backup

```bash
# Restore from compressed backup
pg_restore -U postgres -d ccis_vision_restored backup_20240124.dump

# Restore from SQL file
psql -U postgres -d ccis_vision_restored < backup_20240124.sql
```

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong passwords (12+ characters, mixed case, numbers, symbols)
- [ ] Enable SSL connections in production
- [ ] Configure `pg_hba.conf` to restrict access
- [ ] Create separate database users for application and admin
- [ ] Enable row-level security on sensitive tables
- [ ] Set up regular backups
- [ ] Monitor failed login attempts
- [ ] Keep PostgreSQL updated

## Connection Configuration

### application.properties (Java/Spring Boot)
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/ccis_vision
spring.datasource.username=ccis_app_user
spring.datasource.password=your_secure_password
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
```

### .env (Node.js)
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ccis_vision
DB_USER=ccis_app_user
DB_PASSWORD=your_secure_password
DB_SSL=false
```

### Python Connection
```python
import psycopg2
from psycopg2.extras import RealDictCursor

conn = psycopg2.connect(
    host="localhost",
    port=5432,
    database="ccis_vision",
    user="ccis_app_user",
    password="your_secure_password",
    cursor_factory=RealDictCursor
)
```

## Monitoring Queries

### Database Size
```sql
SELECT 
    pg_size_pretty(pg_database_size('ccis_vision')) as database_size;
```

### Table Sizes
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Active Connections
```sql
SELECT 
    datname,
    count(*) as connections
FROM pg_stat_activity
GROUP BY datname;
```

### Recent Import Activity
```sql
SELECT 
    filename,
    upload_date,
    status,
    total_rows,
    rows_imported,
    rows_with_errors
FROM import_logs
ORDER BY upload_date DESC
LIMIT 10;
```

## Troubleshooting

### Issue: Import fails with date parsing errors
**Solution:** Check date format in Excel, update `parse_excel_date()` function

### Issue: Duplicate companies being created
**Solution:** 
1. Run duplicate detection: `SELECT * FROM v_duplicate_companies_by_ice`
2. Merge duplicates: `SELECT merge_companies('keep-id', 'merge-id', 'user-id')`

### Issue: Slow queries on large tables
**Solution:**
1. Check missing indexes: See "Performance Optimization" section
2. Update statistics: `ANALYZE companies;`
3. Consider partitioning for `audit_log` table

### Issue: Connection limit reached
**Solution:**
```sql
-- Check max connections
SHOW max_connections;

-- Increase limit in postgresql.conf
max_connections = 200

-- Then restart PostgreSQL
```

## Next Steps

1. ✅ Database schema created
2. ⏳ Build API backend (Node.js/Python/Java)
3. ⏳ Create Excel import service
4. ⏳ Build frontend dashboard
5. ⏳ Implement authentication
6. ⏳ Deploy to production server

## Support & Resources

- PostgreSQL Documentation: https://www.postgresql.org/docs/
- pgAdmin (GUI tool): https://www.pgadmin.org/
- DBeaver (Alternative GUI): https://dbeaver.io/
