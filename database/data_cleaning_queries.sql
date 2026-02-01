-- =====================================================
-- Excel Data Cleaning & Import Queries
-- Common patterns for handling messy Excel data
-- =====================================================

-- =====================================================
-- 1. COMPANY NAME NORMALIZATION
-- =====================================================

-- Remove extra spaces, standardize case
CREATE OR REPLACE FUNCTION normalize_company_name(raw_name TEXT)
RETURNS TEXT AS $$
BEGIN
    IF raw_name IS NULL OR TRIM(raw_name) = '' THEN
        RETURN NULL;
    END IF;
    
    -- Remove extra spaces, convert to uppercase
    raw_name := UPPER(TRIM(REGEXP_REPLACE(raw_name, '\s+', ' ', 'g')));
    
    -- Standardize legal forms
    raw_name := REGEXP_REPLACE(raw_name, '^S\.?A\.?R\.?L\.?\s+', 'SARL ', 'i');
    raw_name := REGEXP_REPLACE(raw_name, '^S\.?A\.?\s+', 'SA ', 'i');
    raw_name := REGEXP_REPLACE(raw_name, '^S\.?N\.?C\.?\s+', 'SNC ', 'i');
    
    RETURN raw_name;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Example usage:
-- SELECT normalize_company_name('  s.a.r.l   société   abc  ');
-- Result: 'SARL SOCIÉTÉ ABC'

-- =====================================================
-- 2. ICE NUMBER VALIDATION & CLEANING
-- =====================================================

CREATE OR REPLACE FUNCTION clean_ice_number(raw_ice TEXT)
RETURNS TEXT AS $$
BEGIN
    IF raw_ice IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Remove all non-digits
    raw_ice := REGEXP_REPLACE(raw_ice, '[^0-9]', '', 'g');
    
    -- Check if exactly 15 digits
    IF LENGTH(raw_ice) = 15 THEN
        RETURN raw_ice;
    END IF;
    
    -- Pad with leading zeros if 14 or fewer digits
    IF LENGTH(raw_ice) BETWEEN 1 AND 14 THEN
        RETURN LPAD(raw_ice, 15, '0');
    END IF;
    
    -- Invalid ICE
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Example usage:
-- SELECT clean_ice_number('001.234.567.890.123');
-- Result: '001234567890123'

-- =====================================================
-- 3. EMAIL VALIDATION
-- =====================================================

CREATE OR REPLACE FUNCTION is_valid_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF email IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Basic email regex pattern
    RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION clean_email(raw_email TEXT)
RETURNS TEXT AS $$
BEGIN
    IF raw_email IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Trim and lowercase
    raw_email := LOWER(TRIM(raw_email));
    
    -- Remove common typos
    raw_email := REPLACE(raw_email, ' ', '');
    raw_email := REPLACE(raw_email, ',', '.');
    
    -- Return only if valid
    IF is_valid_email(raw_email) THEN
        RETURN raw_email;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 4. PHONE NUMBER STANDARDIZATION (Morocco)
-- =====================================================

CREATE OR REPLACE FUNCTION clean_phone_number(raw_phone TEXT, add_prefix BOOLEAN DEFAULT TRUE)
RETURNS TEXT AS $$
DECLARE
    cleaned TEXT;
BEGIN
    IF raw_phone IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Remove all non-digits
    cleaned := REGEXP_REPLACE(raw_phone, '[^0-9]', '', 'g');
    
    -- Handle international prefix
    IF cleaned LIKE '212%' THEN
        cleaned := SUBSTRING(cleaned FROM 4);
    ELSIF cleaned LIKE '00212%' THEN
        cleaned := SUBSTRING(cleaned FROM 6);
    END IF;
    
    -- Should be 9 or 10 digits
    IF LENGTH(cleaned) NOT BETWEEN 9 AND 10 THEN
        RETURN NULL;
    END IF;
    
    -- Add 0 if missing (mobile/landline)
    IF LENGTH(cleaned) = 9 AND cleaned ~ '^[5-7]' THEN
        cleaned := '0' || cleaned;
    END IF;
    
    -- Add international prefix if requested
    IF add_prefix AND LENGTH(cleaned) = 10 THEN
        RETURN '+212' || SUBSTRING(cleaned FROM 2);
    END IF;
    
    RETURN cleaned;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Example usage:
-- SELECT clean_phone_number('06 12 34 56 78');
-- Result: '+212612345678'

-- =====================================================
-- 5. DATE PARSING (Multiple Formats)
-- =====================================================

CREATE OR REPLACE FUNCTION parse_excel_date(raw_date TEXT)
RETURNS DATE AS $$
DECLARE
    result DATE;
BEGIN
    IF raw_date IS NULL OR TRIM(raw_date) = '' THEN
        RETURN NULL;
    END IF;
    
    -- Try ISO format (2024-12-31)
    BEGIN
        result := raw_date::DATE;
        RETURN result;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- Try DD/MM/YYYY
    BEGIN
        result := TO_DATE(raw_date, 'DD/MM/YYYY');
        RETURN result;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- Try DD-MM-YYYY
    BEGIN
        result := TO_DATE(raw_date, 'DD-MM-YYYY');
        RETURN result;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- Try MM/DD/YYYY (American format)
    BEGIN
        result := TO_DATE(raw_date, 'MM/DD/YYYY');
        IF EXTRACT(YEAR FROM result) > 2000 AND EXTRACT(YEAR FROM result) < 2050 THEN
            RETURN result;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- Could not parse
    RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 6. DUPLICATE DETECTION QUERIES
-- =====================================================

-- Find exact ICE duplicates
CREATE OR REPLACE VIEW v_duplicate_companies_by_ice AS
SELECT 
    ice,
    COUNT(*) as duplicate_count,
    STRING_AGG(id::TEXT, ', ') as company_ids,
    STRING_AGG(name, ' | ') as company_names
FROM companies
WHERE ice IS NOT NULL
GROUP BY ice
HAVING COUNT(*) > 1;

-- Find potential name duplicates (fuzzy)
CREATE OR REPLACE FUNCTION find_name_duplicates(similarity_threshold FLOAT DEFAULT 0.8)
RETURNS TABLE(
    company1_id UUID,
    company1_name VARCHAR,
    company2_id UUID,
    company2_name VARCHAR,
    similarity_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c1.id,
        c1.name,
        c2.id,
        c2.name,
        SIMILARITY(c1.name, c2.name) as sim_score
    FROM companies c1
    CROSS JOIN companies c2
    WHERE c1.id < c2.id  -- Avoid comparing same company and duplicates (A,B) and (B,A)
        AND SIMILARITY(c1.name, c2.name) >= similarity_threshold
    ORDER BY sim_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Find duplicates by multiple criteria
CREATE OR REPLACE FUNCTION find_potential_duplicates(
    check_company_id UUID
)
RETURNS TABLE(
    id UUID,
    name VARCHAR,
    match_reason TEXT,
    confidence INTEGER
) AS $$
DECLARE
    comp_record companies%ROWTYPE;
BEGIN
    SELECT * INTO comp_record FROM companies WHERE companies.id = check_company_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        CASE
            WHEN c.ice = comp_record.ice THEN 'Same ICE'
            WHEN SIMILARITY(c.name, comp_record.name) > 0.9 THEN 'Very similar name'
            WHEN c.email = comp_record.email THEN 'Same email'
            WHEN c.phone = comp_record.phone THEN 'Same phone'
            ELSE 'Similar name + address'
        END as match_reason,
        CASE
            WHEN c.ice = comp_record.ice THEN 100
            WHEN SIMILARITY(c.name, comp_record.name) > 0.9 THEN 90
            WHEN c.email = comp_record.email THEN 85
            WHEN c.phone = comp_record.phone THEN 80
            ELSE 60
        END as confidence
    FROM companies c
    WHERE c.id != check_company_id
        AND (
            c.ice = comp_record.ice
            OR SIMILARITY(c.name, comp_record.name) > 0.7
            OR c.email = comp_record.email
            OR c.phone = comp_record.phone
            OR (c.city = comp_record.city AND SIMILARITY(c.address, comp_record.address) > 0.8)
        )
    ORDER BY confidence DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. BATCH IMPORT FROM RAW DATA
-- =====================================================

-- Import companies from raw_excel_data
CREATE OR REPLACE FUNCTION import_companies_from_raw(
    import_log_uuid UUID
)
RETURNS TABLE(
    success_count INTEGER,
    error_count INTEGER,
    duplicate_count INTEGER
) AS $$
DECLARE
    total_success INTEGER := 0;
    total_errors INTEGER := 0;
    total_duplicates INTEGER := 0;
    raw_row RECORD;
    new_company_id UUID;
    cleaned_ice TEXT;
    existing_company UUID;
BEGIN
    FOR raw_row IN 
        SELECT * FROM raw_excel_data 
        WHERE import_log_id = import_log_uuid 
            AND status = 'pending'
    LOOP
        BEGIN
            -- Clean ICE number
            cleaned_ice := clean_ice_number(raw_row.raw_data->>'ice');
            
            -- Check for existing company by ICE
            IF cleaned_ice IS NOT NULL THEN
                SELECT id INTO existing_company 
                FROM companies 
                WHERE ice = cleaned_ice 
                LIMIT 1;
                
                IF existing_company IS NOT NULL THEN
                    -- Mark as duplicate
                    UPDATE raw_excel_data 
                    SET status = 'duplicate',
                        mapped_entity_id = existing_company,
                        error_message = 'Company with same ICE already exists'
                    WHERE id = raw_row.id;
                    
                    total_duplicates := total_duplicates + 1;
                    CONTINUE;
                END IF;
            END IF;
            
            -- Insert new company
            INSERT INTO companies (
                name,
                ice,
                email,
                phone,
                address,
                city,
                representative_name
            ) VALUES (
                normalize_company_name(raw_row.raw_data->>'name'),
                cleaned_ice,
                clean_email(raw_row.raw_data->>'email'),
                clean_phone_number(raw_row.raw_data->>'phone'),
                TRIM(raw_row.raw_data->>'address'),
                TRIM(raw_row.raw_data->>'city'),
                TRIM(raw_row.raw_data->>'representative')
            )
            RETURNING id INTO new_company_id;
            
            -- Update raw data record
            UPDATE raw_excel_data
            SET status = 'processed',
                mapped_entity_id = new_company_id
            WHERE id = raw_row.id;
            
            total_success := total_success + 1;
            
        EXCEPTION WHEN OTHERS THEN
            -- Log error
            UPDATE raw_excel_data
            SET status = 'error',
                error_message = SQLERRM
            WHERE id = raw_row.id;
            
            total_errors := total_errors + 1;
        END;
    END LOOP;
    
    -- Update import log
    UPDATE import_logs
    SET status = 'completed',
        rows_imported = total_success,
        rows_skipped = total_duplicates,
        rows_with_errors = total_errors,
        processing_completed_at = CURRENT_TIMESTAMP
    WHERE id = import_log_uuid;
    
    RETURN QUERY SELECT total_success, total_errors, total_duplicates;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. DATA QUALITY VALIDATION QUERIES
-- =====================================================

-- Find companies with missing critical information
CREATE OR REPLACE VIEW v_companies_incomplete AS
SELECT 
    id,
    name,
    CASE WHEN ice IS NULL THEN 'Missing ICE' END as ice_issue,
    CASE WHEN email IS NULL OR NOT is_valid_email(email) THEN 'Invalid Email' END as email_issue,
    CASE WHEN phone IS NULL THEN 'Missing Phone' END as phone_issue,
    CASE WHEN city IS NULL THEN 'Missing City' END as city_issue,
    CASE WHEN sector_id IS NULL THEN 'Missing Sector' END as sector_issue,
    calculate_company_quality_score(id) as quality_score
FROM companies
WHERE 
    ice IS NULL 
    OR email IS NULL 
    OR NOT is_valid_email(email)
    OR phone IS NULL
    OR city IS NULL
    OR sector_id IS NULL;

-- Batch validate all companies and create quality issues
CREATE OR REPLACE FUNCTION validate_all_companies()
RETURNS INTEGER AS $$
DECLARE
    issue_count INTEGER := 0;
    comp RECORD;
BEGIN
    FOR comp IN SELECT * FROM companies LOOP
        -- Check ICE format
        IF comp.ice IS NOT NULL AND comp.ice !~ '^[0-9]{15}$' THEN
            INSERT INTO data_quality_issues (entity_type, entity_id, field_name, issue_description, severity)
            VALUES ('company', comp.id, 'ice', 'ICE number format invalid (should be 15 digits)', 'warning')
            ON CONFLICT DO NOTHING;
            issue_count := issue_count + 1;
        END IF;
        
        -- Check email format
        IF comp.email IS NOT NULL AND NOT is_valid_email(comp.email) THEN
            INSERT INTO data_quality_issues (entity_type, entity_id, field_name, issue_description, severity)
            VALUES ('company', comp.id, 'email', 'Email format invalid', 'warning')
            ON CONFLICT DO NOTHING;
            issue_count := issue_count + 1;
        END IF;
        
        -- Check required fields
        IF comp.name IS NULL OR LENGTH(TRIM(comp.name)) = 0 THEN
            INSERT INTO data_quality_issues (entity_type, entity_id, field_name, issue_description, severity)
            VALUES ('company', comp.id, 'name', 'Company name is required', 'error')
            ON CONFLICT DO NOTHING;
            issue_count := issue_count + 1;
        END IF;
        
        -- Update quality score
        UPDATE companies 
        SET data_quality_score = calculate_company_quality_score(comp.id)
        WHERE id = comp.id;
    END LOOP;
    
    RETURN issue_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. MERGE DUPLICATE COMPANIES
-- =====================================================

CREATE OR REPLACE FUNCTION merge_companies(
    keep_company_id UUID,
    merge_company_id UUID,
    merged_by_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update all references to point to the kept company
    
    -- Update participants
    UPDATE participants 
    SET company_id = keep_company_id 
    WHERE company_id = merge_company_id;
    
    -- Update services_provided
    UPDATE services_provided 
    SET company_id = keep_company_id 
    WHERE company_id = merge_company_id;
    
    -- Update raw_excel_data mappings
    UPDATE raw_excel_data 
    SET mapped_entity_id = keep_company_id 
    WHERE mapped_entity_id = merge_company_id;
    
    -- Mark the merged company as duplicate
    UPDATE companies 
    SET duplicate_of = keep_company_id,
        updated_by = merged_by_user_id,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = merge_company_id;
    
    -- Log the merge in audit trail
    INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, changed_by)
    VALUES (
        'companies',
        merge_company_id,
        'MERGE',
        jsonb_build_object('merged_into', keep_company_id),
        jsonb_build_object('status', 'merged'),
        merged_by_user_id
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. SUMMARY REPORTS
-- =====================================================

-- Import summary report
CREATE OR REPLACE VIEW v_import_quality_report AS
SELECT 
    il.id as import_id,
    il.filename,
    il.upload_date,
    il.data_type,
    il.status,
    il.total_rows,
    il.rows_imported,
    il.rows_skipped,
    il.rows_with_errors,
    ROUND((il.rows_imported::NUMERIC / NULLIF(il.total_rows, 0) * 100), 2) as success_rate,
    u.username as uploaded_by
FROM import_logs il
LEFT JOIN users u ON il.uploaded_by = u.id
ORDER BY il.upload_date DESC;

-- Company quality overview
CREATE OR REPLACE VIEW v_company_quality_overview AS
SELECT 
    COUNT(*) as total_companies,
    COUNT(CASE WHEN data_quality_score >= 90 THEN 1 END) as excellent_quality,
    COUNT(CASE WHEN data_quality_score BETWEEN 70 AND 89 THEN 1 END) as good_quality,
    COUNT(CASE WHEN data_quality_score BETWEEN 50 AND 69 THEN 1 END) as fair_quality,
    COUNT(CASE WHEN data_quality_score < 50 THEN 1 END) as poor_quality,
    COUNT(CASE WHEN needs_verification THEN 1 END) as needs_verification,
    COUNT(CASE WHEN duplicate_of IS NOT NULL THEN 1 END) as duplicates,
    ROUND(AVG(data_quality_score), 2) as avg_quality_score
FROM companies;

-- =====================================================
-- 11. EXAMPLE USAGE
-- =====================================================

/*
-- Step 1: Create import log
INSERT INTO import_logs (filename, data_type, uploaded_by)
VALUES ('entreprises_2024.xlsx', 'companies', 'user-uuid')
RETURNING id;

-- Step 2: Insert raw data (from application)
INSERT INTO raw_excel_data (import_log_id, row_number, raw_data)
VALUES 
    ('import-uuid', 1, '{"name": "SARL ABC", "ice": "001234567890123", "email": "contact@abc.ma"}'),
    ('import-uuid', 2, '{"name": "Société XYZ", "ice": "009876543210987", "email": "info@xyz.com"}');

-- Step 3: Process the import
SELECT * FROM import_companies_from_raw('import-uuid');

-- Step 4: Review results
SELECT * FROM v_import_quality_report WHERE import_id = 'import-uuid';

-- Step 5: Check for issues
SELECT * FROM v_companies_incomplete;

-- Step 6: Validate data quality
SELECT validate_all_companies();

-- Step 7: Find duplicates
SELECT * FROM v_duplicate_companies_by_ice;
SELECT * FROM find_name_duplicates(0.85);

-- Step 8: Merge duplicates if needed
SELECT merge_companies('keep-uuid', 'merge-uuid', 'user-uuid');
*/
