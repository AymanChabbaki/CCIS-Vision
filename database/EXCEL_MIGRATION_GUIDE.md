# Excel Data Migration - Quick Reference Guide

## Common Messy Data Problems & Solutions

### 🔴 PROBLEM 1: Inconsistent Company Names

#### What you'll see in Excel:
```
Row 1: "SARL SOCIÉTÉ ABC"
Row 2: "Société ABC"
Row 3: "S.A.R.L ABC"
Row 4: "  société   abc  "
Row 5: "SARL  SOCIETE  ABC"  (extra spaces)
```

#### Solution:
```sql
-- Use the normalize_company_name function
SELECT normalize_company_name('  s.a.r.l   société   abc  ');
-- Result: 'SARL SOCIÉTÉ ABC'

-- Before inserting, always normalize:
INSERT INTO companies (name)
VALUES (normalize_company_name(raw_name));
```

#### Fuzzy Matching for Duplicates:
```sql
-- Find similar names (requires pg_trgm extension)
SELECT name, SIMILARITY(name, 'SOCIÉTÉ ABC') as score
FROM companies
WHERE SIMILARITY(name, 'SOCIÉTÉ ABC') > 0.7
ORDER BY score DESC;
```

---

### 🔴 PROBLEM 2: Invalid or Missing ICE Numbers

#### What you'll see in Excel:
```
Row 1: "001234567890123"     ✓ Valid (15 digits)
Row 2: "1234567890123"       ✗ Too short (13 digits)
Row 3: "001.234.567.890.123" ✗ Has dots
Row 4: ""                     ✗ Missing
Row 5: "N/A"                  ✗ Text value
Row 6: "ICE001234567890123"  ✗ Has prefix
```

#### Solution:
```sql
-- Use clean_ice_number function
SELECT clean_ice_number('001.234.567.890.123');
-- Result: '001234567890123'

SELECT clean_ice_number('1234567890123');
-- Result: '001234567890123' (pads with zeros)

SELECT clean_ice_number('N/A');
-- Result: NULL

-- Validate during import:
UPDATE companies 
SET needs_verification = TRUE
WHERE ice IS NULL OR ice !~ '^[0-9]{15}$';

-- Check for invalid ICE numbers:
SELECT id, name, ice 
FROM companies 
WHERE ice IS NOT NULL 
  AND ice !~ '^[0-9]{15}$';
```

---

### 🔴 PROBLEM 3: Multiple Date Formats

#### What you'll see in Excel:
```
Row 1: "31/12/2024"        (DD/MM/YYYY)
Row 2: "2024-12-31"        (ISO format)
Row 3: "31-Dec-2024"       (Text with month name)
Row 4: "31 Décembre 2024"  (French text)
Row 5: "12/31/2024"        (MM/DD/YYYY - American)
Row 6: 44926               (Excel date serial number)
```

#### Solution:
```sql
-- Use parse_excel_date function
SELECT parse_excel_date('31/12/2024');
-- Result: 2024-12-31

SELECT parse_excel_date('2024-12-31');
-- Result: 2024-12-31

SELECT parse_excel_date('invalid date');
-- Result: NULL

-- Import pattern:
INSERT INTO activities (start_date)
SELECT parse_excel_date(raw_data->>'Date Début')
FROM raw_excel_data;

-- Find unparseable dates:
SELECT id, raw_data->>'Date Début' as raw_date
FROM raw_excel_data
WHERE parse_excel_date(raw_data->>'Date Début') IS NULL
  AND raw_data->>'Date Début' IS NOT NULL;
```

---

### 🔴 PROBLEM 4: Phone Number Chaos

#### What you'll see in Excel:
```
Row 1: "0612345678"
Row 2: "+212 612 34 56 78"
Row 3: "06-12-34-56-78"
Row 4: "212612345678"
Row 5: "00212612345678"
Row 6: "06 12 34 56 78"
Row 7: "(0612) 345-678"  (weird formatting)
```

#### Solution:
```sql
-- Use clean_phone_number function
SELECT clean_phone_number('06 12 34 56 78');
-- Result: '+212612345678'

SELECT clean_phone_number('212612345678');
-- Result: '+212612345678'

-- Without international prefix:
SELECT clean_phone_number('0612345678', FALSE);
-- Result: '0612345678'

-- Batch clean existing data:
UPDATE companies 
SET phone = clean_phone_number(phone)
WHERE phone IS NOT NULL;
```

---

### 🔴 PROBLEM 5: Email Address Issues

#### What you'll see in Excel:
```
Row 1: "contact@company.ma"      ✓ Valid
Row 2: "CONTACT@COMPANY.MA"      ✗ Uppercase
Row 3: "contact @company.ma"     ✗ Has space
Row 4: "contact,company.ma"      ✗ Comma instead of @
Row 5: "contact@company"         ✗ Missing TLD
Row 6: ""                         ✗ Empty
```

#### Solution:
```sql
-- Use clean_email function
SELECT clean_email('CONTACT @COMPANY.MA');
-- Result: 'contact@company.ma'

SELECT clean_email('contact,company.ma');
-- Result: 'contact.company.ma' (if valid after fix)

-- Validate all emails:
SELECT id, name, email
FROM companies
WHERE email IS NOT NULL 
  AND NOT is_valid_email(email);

-- Clean batch:
UPDATE companies 
SET email = clean_email(email)
WHERE email IS NOT NULL;
```

---

### 🔴 PROBLEM 6: Duplicate Entries Across Files

#### Scenario:
```
File: entreprises_2023.xlsx
Row 5: "ABC Company", ICE: 001234567890123, Email: contact@abc.ma

File: entreprises_2024.xlsx
Row 12: "ABC COMPANY", ICE: 001234567890123, Email: CONTACT@abc.ma

File: formation_participants.xlsx
Row 8: "Société ABC", ICE: (empty), Email: info@abc.ma
```

#### Solution Strategy:

**1. Detect Exact Duplicates (Same ICE):**
```sql
SELECT * FROM v_duplicate_companies_by_ice;
-- Shows all ICE numbers with multiple companies
```

**2. Find Fuzzy Duplicates (Similar Names):**
```sql
SELECT * FROM find_name_duplicates(0.85);
-- Returns pairs with 85%+ name similarity
```

**3. Comprehensive Duplicate Check:**
```sql
-- Check a specific company
SELECT * FROM find_potential_duplicates('company-uuid-here');
-- Returns: matching companies with confidence scores
```

**4. Merge Duplicates:**
```sql
-- Keep the oldest/best record, merge others
SELECT merge_companies(
    'keep-this-uuid',      -- Company to keep
    'merge-this-uuid',     -- Duplicate to merge
    'admin-user-uuid'      -- Who performed the merge
);

-- This will:
-- - Update all participant references
-- - Update all service references
-- - Mark merged company as duplicate
-- - Log in audit trail
```

---

### 🔴 PROBLEM 7: Missing or Inconsistent City Names

#### What you'll see in Excel:
```
Row 1: "Rabat"
Row 2: "RABAT"
Row 3: "rabat"
Row 4: "Rabat-Salé"
Row 5: "Salé"
Row 6: "Sale" (without accent)
Row 7: "" (empty)
```

#### Solution:
```sql
-- Standardize city names
UPDATE companies
SET city = CASE
    WHEN UPPER(city) IN ('RABAT', 'RABAT-SALE', 'RABAT SALE') THEN 'Rabat'
    WHEN UPPER(city) IN ('SALE', 'SALÉ') THEN 'Salé'
    WHEN UPPER(city) IN ('KENITRA', 'KÉNITRA') THEN 'Kénitra'
    WHEN UPPER(city) IN ('KHEMISSET', 'KHÉMISSET') THEN 'Khémisset'
    ELSE INITCAP(TRIM(city))
END
WHERE city IS NOT NULL;

-- Find companies with missing city:
SELECT id, name, address
FROM companies
WHERE city IS NULL OR TRIM(city) = '';
```

---

### 🔴 PROBLEM 8: Incomplete Address Data

#### What you'll see in Excel:
```
Row 1: "123 Avenue Hassan II, Rabat"  ✓ Complete
Row 2: "Rue principale"                ✗ Too vague
Row 3: "Hay Riad"                      ✗ Only neighborhood
Row 4: ""                               ✗ Empty
Row 5: "N/A"                           ✗ Placeholder
```

#### Solution:
```sql
-- Flag incomplete addresses
UPDATE companies
SET needs_verification = TRUE
WHERE address IS NULL 
   OR LENGTH(TRIM(address)) < 10
   OR address ILIKE '%n/a%'
   OR address ILIKE '%inconnu%';

-- Find companies needing address review:
SELECT id, name, address, city
FROM companies
WHERE needs_verification = TRUE
  AND (address IS NULL OR LENGTH(TRIM(address)) < 10);
```

---

### 🔴 PROBLEM 9: Mixed Data Types in Numeric Columns

#### What you'll see in Excel:
```
Budget Column:
Row 1: 15000
Row 2: "15 000"      (with space separator)
Row 3: "15,000"      (with comma)
Row 4: "15000 DH"    (with currency)
Row 5: "~15000"      (with approximation symbol)
Row 6: "N/A"         (text)
```

#### Solution:
```sql
-- Clean numeric values
CREATE OR REPLACE FUNCTION clean_numeric(raw_value TEXT)
RETURNS NUMERIC AS $$
BEGIN
    IF raw_value IS NULL OR TRIM(raw_value) = '' THEN
        RETURN NULL;
    END IF;
    
    -- Remove all non-numeric except dot and minus
    raw_value := REGEXP_REPLACE(raw_value, '[^0-9.-]', '', 'g');
    
    -- Try to convert
    BEGIN
        RETURN raw_value::NUMERIC;
    EXCEPTION WHEN OTHERS THEN
        RETURN NULL;
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Usage:
SELECT clean_numeric('15 000 DH');
-- Result: 15000

UPDATE activities
SET budget_allocated = clean_numeric(raw_data->>'Budget')
FROM raw_excel_data
WHERE activities.id = raw_excel_data.mapped_entity_id;
```

---

## 📊 Complete Import Workflow Example

### Step 1: Upload and Store Raw Data

```python
import pandas as pd
import psycopg2
import json
from uuid import uuid4

# Read Excel
df = pd.read_excel('entreprises_2024.xlsx')

# Connect to DB
conn = psycopg2.connect("postgresql://user:pass@localhost/ccis_vision")
cur = conn.cursor()

# Create import log
import_id = str(uuid4())
cur.execute("""
    INSERT INTO import_logs (id, filename, data_type, total_rows, uploaded_by)
    VALUES (%s, %s, %s, %s, %s)
""", (import_id, 'entreprises_2024.xlsx', 'companies', len(df), 'user-uuid'))

# Store raw data
for idx, row in df.iterrows():
    raw_json = json.dumps(row.to_dict(), default=str)
    cur.execute("""
        INSERT INTO raw_excel_data (import_log_id, row_number, raw_data, status)
        VALUES (%s, %s, %s::jsonb, 'pending')
    """, (import_id, idx + 1, raw_json))

conn.commit()
```

### Step 2: Process and Clean

```sql
-- Run the import function
SELECT * FROM import_companies_from_raw('your-import-uuid');

-- Results:
-- success_count | error_count | duplicate_count
--      245      |      5      |       12
```

### Step 3: Review Issues

```sql
-- Check import results
SELECT * FROM v_import_quality_report 
WHERE import_id = 'your-import-uuid';

-- Find errors
SELECT row_number, raw_data, error_message
FROM raw_excel_data
WHERE import_log_id = 'your-import-uuid'
  AND status = 'error';

-- Find duplicates
SELECT row_number, raw_data, mapped_entity_id
FROM raw_excel_data
WHERE import_log_id = 'your-import-uuid'
  AND status = 'duplicate';
```

### Step 4: Validate Quality

```sql
-- Run full validation
SELECT validate_all_companies();

-- Check quality overview
SELECT * FROM v_company_quality_overview;

-- Find companies needing review
SELECT * FROM v_companies_need_review
ORDER BY data_quality_score ASC;
```

### Step 5: Fix Issues

```sql
-- Update specific issues
UPDATE companies
SET ice = clean_ice_number(ice),
    email = clean_email(email),
    phone = clean_phone_number(phone)
WHERE needs_verification = TRUE;

-- Recalculate quality scores
UPDATE companies
SET data_quality_score = calculate_company_quality_score(id);

-- Mark as reviewed
UPDATE companies
SET needs_verification = FALSE
WHERE data_quality_score >= 70;
```

---

## 🎯 Data Quality Scoring

### Quality Score Calculation (0-100)

| Field | Points | Notes |
|-------|--------|-------|
| Name (not empty) | 10 | Required field |
| ICE Number | 15 | Unique identifier |
| Email | 10 | Contact information |
| Phone | 10 | Contact information |
| Address | 10 | Location data |
| City | 10 | Location data |
| Sector | 10 | Classification |
| Employee Count | 5 | Business info |
| Latitude/Longitude | 10 | Map feature |
| Representative | 10 | Contact person |
| **TOTAL** | **100** | |

### Quality Levels

- **90-100**: ✅ Excellent - Complete data
- **70-89**: ⚠️ Good - Minor fields missing
- **50-69**: ⚠️ Fair - Important fields missing
- **0-49**: ❌ Poor - Critical data missing

```sql
-- Companies by quality level
SELECT 
    CASE 
        WHEN data_quality_score >= 90 THEN '✅ Excellent (90-100)'
        WHEN data_quality_score >= 70 THEN '⚠️ Good (70-89)'
        WHEN data_quality_score >= 50 THEN '⚠️ Fair (50-69)'
        ELSE '❌ Poor (0-49)'
    END as quality_level,
    COUNT(*) as company_count
FROM companies
GROUP BY quality_level
ORDER BY MIN(data_quality_score) DESC;
```

---

## 🚀 Quick Commands Cheat Sheet

### Find Duplicates
```sql
-- By ICE
SELECT * FROM v_duplicate_companies_by_ice;

-- By Name Similarity
SELECT * FROM find_name_duplicates(0.80);

-- Check specific company
SELECT * FROM find_potential_duplicates('company-uuid');
```

### Data Cleaning
```sql
-- Normalize all company names
UPDATE companies SET name = normalize_company_name(name);

-- Clean all ICE numbers
UPDATE companies SET ice = clean_ice_number(ice) WHERE ice IS NOT NULL;

-- Clean all emails
UPDATE companies SET email = clean_email(email) WHERE email IS NOT NULL;

-- Clean all phones
UPDATE companies SET phone = clean_phone_number(phone) WHERE phone IS NOT NULL;
```

### Quality Checks
```sql
-- Run validation
SELECT validate_all_companies();

-- Update all quality scores
UPDATE companies SET data_quality_score = calculate_company_quality_score(id);

-- Find incomplete companies
SELECT * FROM v_companies_incomplete;

-- Get quality overview
SELECT * FROM v_company_quality_overview;
```

### Import Management
```sql
-- View recent imports
SELECT * FROM v_import_quality_report LIMIT 10;

-- Check specific import
SELECT * FROM import_logs WHERE id = 'import-uuid';

-- Review raw data errors
SELECT * FROM raw_excel_data WHERE status = 'error';
```

---

## 📞 Support Queries

### Most Common Issues After Import

```sql
-- 1. Companies without ICE (15%)
SELECT COUNT(*), ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM companies), 1) as percentage
FROM companies WHERE ice IS NULL;

-- 2. Invalid email formats (8%)
SELECT COUNT(*) FROM companies 
WHERE email IS NOT NULL AND NOT is_valid_email(email);

-- 3. Missing contact info (12%)
SELECT COUNT(*) FROM companies 
WHERE phone IS NULL AND email IS NULL;

-- 4. Potential duplicates (5%)
SELECT COUNT(DISTINCT ice) as unique_ice, COUNT(*) as total
FROM companies WHERE ice IS NOT NULL;

-- 5. Missing location (20%)
SELECT COUNT(*) FROM companies 
WHERE latitude IS NULL OR longitude IS NULL;
```

---

## ✅ Validation Checklist

After each Excel import, run this checklist:

- [ ] Import completed without errors
- [ ] Duplicate detection performed
- [ ] Quality scores calculated
- [ ] Critical fields validated (name, ICE, email)
- [ ] Missing data flagged for review
- [ ] Suspicious duplicates investigated
- [ ] Data quality issues logged
- [ ] Import log updated with final statistics

```sql
-- Run all checks at once
SELECT 
    (SELECT COUNT(*) FROM import_logs WHERE status = 'completed') as completed_imports,
    (SELECT COUNT(*) FROM companies) as total_companies,
    (SELECT COUNT(*) FROM companies WHERE needs_verification) as need_review,
    (SELECT COUNT(*) FROM data_quality_issues WHERE status = 'open') as open_issues,
    (SELECT AVG(data_quality_score) FROM companies) as avg_quality_score;
```

---

## 📚 Additional Resources

- Full Database Schema: `database_design.sql`
- Cleaning Functions: `data_cleaning_queries.sql`
- Setup Instructions: `DATABASE_SETUP_GUIDE.md`
- ER Diagram: `ER_DIAGRAM.md`
- Documentation: `DATABASE_README.md`
