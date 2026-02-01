# CCIS-Vision Database - Quick Start Checklist

## ✅ Setup Checklist (1-2 hours)

### Step 1: Install PostgreSQL
- [ ] Download PostgreSQL 14+ from https://www.postgresql.org/download/
- [ ] Install with default settings
- [ ] Note down the postgres password you set
- [ ] Verify installation: `psql --version`

### Step 2: Create Database
```bash
# Open command prompt and run:
psql -U postgres

# In psql console:
CREATE DATABASE ccis_vision;
\c ccis_vision

# Install extensions:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

# Exit psql:
\q
```

- [ ] Database created successfully
- [ ] Extensions installed

### Step 3: Load Schema
```bash
# Navigate to project folder:
cd "C:\Users\HP ZBOOK\Desktop\CCIS-Vision"

# Load main schema:
psql -U postgres -d ccis_vision -f database_design.sql

# Load cleaning functions:
psql -U postgres -d ccis_vision -f data_cleaning_queries.sql
```

- [ ] Schema loaded (27+ tables created)
- [ ] Functions loaded (10+ functions)

### Step 4: Create First User
```sql
psql -U postgres -d ccis_vision

-- Create admin user:
INSERT INTO users (username, email, password_hash, role_id, full_name, is_active)
VALUES (
    'admin',
    'admin@ccis.ma',
    crypt('AdminPass123!', gen_salt('bf')),
    1,
    'Administrator',
    TRUE
);

-- Verify:
SELECT username, email, full_name FROM users;
```

- [ ] Admin user created
- [ ] Can query users table

### Step 5: Verify Installation
```sql
-- Check tables:
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';
-- Should return 27+

-- Check functions:
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
-- Should show normalize_company_name, clean_ice_number, etc.

-- Test a function:
SELECT normalize_company_name('  s.a.r.l   test   ');
-- Should return: 'SARL TEST'
```

- [ ] 27+ tables created
- [ ] 10+ functions available
- [ ] Functions working correctly

---

## 📥 First Excel Import Checklist (30 minutes)

### Step 1: Prepare Your Excel File
- [ ] Open your Excel file
- [ ] Note the column names (e.g., "Nom Entreprise", "ICE", "Email")
- [ ] Check for obvious data issues
- [ ] Save as .xlsx format

### Step 2: Create Import Log
```sql
-- Generate a UUID for this import:
SELECT uuid_generate_v4();
-- Copy the result (e.g., '123e4567-e89b-12d3-a456-426614174000')

-- Create import log:
INSERT INTO import_logs (id, filename, data_type, total_rows, uploaded_by, status)
VALUES (
    '123e4567-e89b-12d3-a456-426614174000',  -- Use UUID from above
    'entreprises_2024.xlsx',
    'companies',
    0,  -- Will update later
    (SELECT id FROM users WHERE username = 'admin'),
    'pending'
);
```

- [ ] Import log created
- [ ] Import UUID noted

### Step 3: Load Excel Data

**Option A: Using Python (Recommended)**
```python
import pandas as pd
import psycopg2
import json

# Read Excel
df = pd.read_excel('entreprises_2024.xlsx')

# Connect to database
conn = psycopg2.connect(
    host='localhost',
    database='ccis_vision',
    user='postgres',
    password='your_postgres_password'
)
cur = conn.cursor()

# Import UUID from Step 2
import_id = '123e4567-e89b-12d3-a456-426614174000'

# Update total rows
cur.execute("""
    UPDATE import_logs SET total_rows = %s WHERE id = %s
""", (len(df), import_id))

# Insert raw data
for idx, row in df.iterrows():
    raw_json = json.dumps(row.to_dict(), default=str)
    cur.execute("""
        INSERT INTO raw_excel_data (import_log_id, row_number, raw_data, status)
        VALUES (%s, %s, %s::jsonb, 'pending')
    """, (import_id, idx + 1, raw_json))

conn.commit()
print(f"Imported {len(df)} rows successfully!")
```

**Option B: Manual (for small files)**
```sql
-- Insert one row at a time:
INSERT INTO raw_excel_data (import_log_id, row_number, raw_data, status)
VALUES (
    '123e4567-e89b-12d3-a456-426614174000',
    1,
    '{"name": "SARL ABC", "ice": "001234567890123", "email": "contact@abc.ma"}'::jsonb,
    'pending'
);
-- Repeat for each row...
```

- [ ] Excel data loaded into raw_excel_data table

### Step 4: Process the Import
```sql
-- Run the import function:
SELECT * FROM import_companies_from_raw('123e4567-e89b-12d3-a456-426614174000');

-- Results will show:
-- success_count | error_count | duplicate_count
--      45       |      2      |       3
```

- [ ] Import processed
- [ ] Results reviewed

### Step 5: Review Results
```sql
-- Check import summary:
SELECT * FROM v_import_quality_report 
WHERE import_id = '123e4567-e89b-12d3-a456-426614174000';

-- Check for errors:
SELECT row_number, raw_data, error_message
FROM raw_excel_data
WHERE import_log_id = '123e4567-e89b-12d3-a456-426614174000'
  AND status = 'error';

-- Check for duplicates:
SELECT row_number, raw_data->>'name' as company_name
FROM raw_excel_data
WHERE import_log_id = '123e4567-e89b-12d3-a456-426614174000'
  AND status = 'duplicate';

-- View imported companies:
SELECT id, name, ice, email, data_quality_score
FROM companies
ORDER BY created_at DESC
LIMIT 10;
```

- [ ] No critical errors
- [ ] Duplicates identified and handled
- [ ] Companies visible in database

### Step 6: Quality Check
```sql
-- Run validation:
SELECT validate_all_companies();

-- Check quality overview:
SELECT * FROM v_company_quality_overview;

-- Find companies needing review:
SELECT id, name, data_quality_score, needs_verification
FROM companies
WHERE needs_verification = TRUE OR data_quality_score < 70;
```

- [ ] Validation complete
- [ ] Quality scores calculated
- [ ] Issues documented

### Step 7: Fix Issues (if any)
```sql
-- Clean data:
UPDATE companies
SET ice = clean_ice_number(ice),
    email = clean_email(email),
    phone = clean_phone_number(phone)
WHERE needs_verification = TRUE;

-- Recalculate scores:
UPDATE companies
SET data_quality_score = calculate_company_quality_score(id)
WHERE needs_verification = TRUE;

-- Mark as reviewed:
UPDATE companies
SET needs_verification = FALSE
WHERE data_quality_score >= 70;
```

- [ ] Data cleaned
- [ ] Quality scores updated
- [ ] Ready for use

---

## 🔍 Testing Checklist

### Basic CRUD Operations

**Create:**
```sql
INSERT INTO companies (name, ice, email, phone, city, sector_id)
VALUES (
    'TEST COMPANY SARL',
    '001234567890123',
    'test@company.ma',
    '+212612345678',
    'Rabat',
    1
);
```
- [ ] Can insert new company

**Read:**
```sql
SELECT * FROM companies WHERE name LIKE '%TEST%';
```
- [ ] Can query companies

**Update:**
```sql
UPDATE companies 
SET email = 'newemail@company.ma' 
WHERE name = 'TEST COMPANY SARL';
```
- [ ] Can update company
- [ ] Audit log created (check audit_log table)

**Delete:**
```sql
DELETE FROM companies WHERE name = 'TEST COMPANY SARL';
```
- [ ] Can delete company

### Data Cleaning Functions

```sql
-- Test normalize_company_name:
SELECT normalize_company_name('  s.a.r.l   test   company  ');
-- Expected: 'SARL TEST COMPANY'

-- Test clean_ice_number:
SELECT clean_ice_number('001.234.567.890.123');
-- Expected: '001234567890123'

-- Test clean_email:
SELECT clean_email('CONTACT @COMPANY.MA');
-- Expected: 'contact@company.ma'

-- Test clean_phone_number:
SELECT clean_phone_number('06 12 34 56 78');
-- Expected: '+212612345678'

-- Test parse_excel_date:
SELECT parse_excel_date('31/12/2024');
-- Expected: 2024-12-31
```

- [ ] All cleaning functions working
- [ ] Results as expected

### Duplicate Detection

```sql
-- Insert duplicate:
INSERT INTO companies (name, ice) VALUES ('COMPANY ABC', '001111111111111');
INSERT INTO companies (name, ice) VALUES ('Company ABC', '001111111111111');

-- Find duplicates:
SELECT * FROM v_duplicate_companies_by_ice;

-- Clean up:
DELETE FROM companies WHERE ice = '001111111111111';
```

- [ ] Duplicate detection working
- [ ] Can find by ICE
- [ ] Can find by name similarity

### Quality Scoring

```sql
-- Create company with minimal data:
INSERT INTO companies (name) VALUES ('MINIMAL COMPANY');

-- Check score:
SELECT calculate_company_quality_score(id)
FROM companies WHERE name = 'MINIMAL COMPANY';
-- Expected: Low score (10-20)

-- Add more data:
UPDATE companies 
SET ice = '002222222222222',
    email = 'contact@minimal.ma',
    phone = '+212611111111',
    city = 'Rabat'
WHERE name = 'MINIMAL COMPANY';

-- Check score again:
SELECT calculate_company_quality_score(id)
FROM companies WHERE name = 'MINIMAL COMPANY';
-- Expected: Higher score (50-60)

-- Clean up:
DELETE FROM companies WHERE name = 'MINIMAL COMPANY';
```

- [ ] Quality scoring working
- [ ] Score increases with more data

---

## 📊 Dashboard Data Check

### Verify Dashboard Stats
```sql
-- Refresh materialized view:
REFRESH MATERIALIZED VIEW dashboard_stats;

-- Check stats:
SELECT * FROM dashboard_stats;
```

- [ ] Dashboard stats view working
- [ ] All metrics calculated

### Test Common Queries
```sql
-- Companies by city:
SELECT city, COUNT(*) as count
FROM companies
WHERE city IS NOT NULL
GROUP BY city
ORDER BY count DESC;

-- Activities by type:
SELECT at.name, COUNT(*) as count
FROM activities a
JOIN activity_types at ON a.activity_type_id = at.id
GROUP BY at.name;

-- Monthly statistics:
SELECT * FROM v_monthly_statistics
LIMIT 12;
```

- [ ] All queries run without errors
- [ ] Results make sense

---

## 🔐 Security Check

### Password Hashing
```sql
-- Verify password is hashed:
SELECT password_hash FROM users WHERE username = 'admin';
-- Should NOT show plain text password
```

- [ ] Passwords are hashed

### Role-Based Access
```sql
-- Check roles:
SELECT * FROM roles;

-- Check user roles:
SELECT u.username, r.name as role
FROM users u
JOIN roles r ON u.role_id = r.id;
```

- [ ] All roles exist
- [ ] Users assigned to roles

---

## 📈 Performance Check

### Check Indexes
```sql
-- List indexes:
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

- [ ] Indexes created on key columns

### Query Performance
```sql
-- Enable timing:
\timing on

-- Test search query:
SELECT * FROM companies WHERE city = 'Rabat';

-- Test join query:
SELECT a.title, d.name, COUNT(p.id) as participants
FROM activities a
JOIN departments d ON a.department_id = d.id
LEFT JOIN participants p ON p.activity_id = a.id
GROUP BY a.title, d.name;
```

- [ ] Queries execute in < 100ms for small data
- [ ] No obvious performance issues

---

## 🎯 Final Validation

### Data Integrity
```sql
-- Check for orphaned records:
SELECT COUNT(*) FROM companies WHERE sector_id NOT IN (SELECT id FROM company_sectors);
SELECT COUNT(*) FROM activities WHERE department_id NOT IN (SELECT id FROM departments);
SELECT COUNT(*) FROM participants WHERE company_id NOT IN (SELECT id FROM companies);
-- All should return 0

-- Check foreign keys:
SELECT tc.table_name, tc.constraint_name, tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```

- [ ] No orphaned records
- [ ] All foreign keys in place

### Backup Test
```bash
# Create backup:
pg_dump -U postgres ccis_vision > test_backup.sql

# Verify backup file exists and has content:
dir test_backup.sql
# Should show file with size > 0
```

- [ ] Backup created successfully
- [ ] Backup file has content

---

## ✅ Success Criteria

You're ready to go live when:

- [x] PostgreSQL installed and running
- [x] Database created with all tables
- [x] Extensions installed (uuid-ossp, pg_trgm, pgcrypto)
- [x] Admin user created
- [x] Can import Excel data successfully
- [x] Data cleaning functions working
- [x] Quality scoring operational
- [x] Duplicate detection functional
- [x] Dashboard queries running
- [x] Backups configured
- [x] Security measures in place

---

## 📚 Reference

| What | Where to Look |
|------|---------------|
| Full schema | `database_design.sql` |
| Cleaning functions | `data_cleaning_queries.sql` |
| Installation guide | `DATABASE_SETUP_GUIDE.md` |
| Excel migration help | `EXCEL_MIGRATION_GUIDE.md` |
| Database structure | `ER_DIAGRAM.md` |
| Complete docs | `DATABASE_README.md` |
| Project overview | `PROJECT_SUMMARY.md` |

---

## 🆘 Troubleshooting

**Issue**: Can't connect to PostgreSQL
- Solution: Check if PostgreSQL service is running, verify password

**Issue**: Extension not found
- Solution: Install PostgreSQL with contrib modules, or run `CREATE EXTENSION` with superuser

**Issue**: Import function fails
- Solution: Check error message in `import_logs.error_log` column

**Issue**: Duplicates not detected
- Solution: Make sure pg_trgm extension is installed, check SIMILARITY threshold

**Issue**: Slow queries
- Solution: Run `VACUUM ANALYZE`, check if indexes exist

---

## 🎉 You're All Set!

Once all checklists are complete, you have a fully functional database ready to:
- Import messy Excel data
- Clean and validate automatically
- Detect and merge duplicates
- Track activities and participants
- Manage budgets and expenses
- Generate analytics and dashboards

**Time to build the application layer! 🚀**

---

**Quick Start Time**: 1-2 hours  
**First Import Time**: 30 minutes  
**Total Setup Time**: 2-3 hours  

**Questions?** Refer to the documentation files listed above.
