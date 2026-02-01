--
-- PostgreSQL database dump
--

\restrict y090Rnmp0uaFI4Fl0OBK0jsvBw8KCRtof5KAVnOjohvKCtL2AgQF6uWxaTIbSl9

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: calculate_company_quality_score(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calculate_company_quality_score(company_uuid uuid) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    quality_score INTEGER := 0;
    company_record companies%ROWTYPE;
BEGIN
    SELECT * INTO company_record FROM companies WHERE id = company_uuid;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Add points for each complete field
    IF company_record.name IS NOT NULL AND LENGTH(company_record.name) > 0 THEN quality_score := quality_score + 10; END IF;
    IF company_record.ice IS NOT NULL THEN quality_score := quality_score + 15; END IF;
    IF company_record.email IS NOT NULL THEN quality_score := quality_score + 10; END IF;
    IF company_record.phone IS NOT NULL THEN quality_score := quality_score + 10; END IF;
    IF company_record.address IS NOT NULL THEN quality_score := quality_score + 10; END IF;
    IF company_record.city IS NOT NULL THEN quality_score := quality_score + 10; END IF;
    IF company_record.sector_id IS NOT NULL THEN quality_score := quality_score + 10; END IF;
    IF company_record.employee_count IS NOT NULL THEN quality_score := quality_score + 5; END IF;
    IF company_record.latitude IS NOT NULL AND company_record.longitude IS NOT NULL THEN quality_score := quality_score + 10; END IF;
    IF company_record.representative_name IS NOT NULL THEN quality_score := quality_score + 10; END IF;
    
    RETURN quality_score;
END;
$$;


ALTER FUNCTION public.calculate_company_quality_score(company_uuid uuid) OWNER TO postgres;

--
-- Name: clean_email(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.clean_email(raw_email text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
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
$$;


ALTER FUNCTION public.clean_email(raw_email text) OWNER TO postgres;

--
-- Name: clean_ice_number(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.clean_ice_number(raw_ice text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
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
$$;


ALTER FUNCTION public.clean_ice_number(raw_ice text) OWNER TO postgres;

--
-- Name: clean_phone_number(text, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.clean_phone_number(raw_phone text, add_prefix boolean DEFAULT true) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
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
$$;


ALTER FUNCTION public.clean_phone_number(raw_phone text, add_prefix boolean) OWNER TO postgres;

--
-- Name: find_duplicate_companies(character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.find_duplicate_companies(company_name character varying, company_ice character varying DEFAULT NULL::character varying) RETURNS TABLE(id uuid, name character varying, ice character varying, similarity_score integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.ice,
        (
            CASE 
                WHEN c.ice IS NOT NULL AND c.ice = company_ice THEN 100
                WHEN LOWER(c.name) = LOWER(company_name) THEN 90
                WHEN LOWER(c.name) LIKE '%' || LOWER(company_name) || '%' THEN 70
                ELSE 50
            END
        ) as similarity_score
    FROM companies c
    WHERE 
        (company_ice IS NOT NULL AND c.ice = company_ice)
        OR LOWER(c.name) SIMILAR TO '%' || LOWER(company_name) || '%'
    ORDER BY similarity_score DESC
    LIMIT 10;
END;
$$;


ALTER FUNCTION public.find_duplicate_companies(company_name character varying, company_ice character varying) OWNER TO postgres;

--
-- Name: find_name_duplicates(double precision); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.find_name_duplicates(similarity_threshold double precision DEFAULT 0.8) RETURNS TABLE(company1_id uuid, company1_name character varying, company2_id uuid, company2_name character varying, similarity_score double precision)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.find_name_duplicates(similarity_threshold double precision) OWNER TO postgres;

--
-- Name: find_potential_duplicates(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.find_potential_duplicates(check_company_id uuid) RETURNS TABLE(id uuid, name character varying, match_reason text, confidence integer)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.find_potential_duplicates(check_company_id uuid) OWNER TO postgres;

--
-- Name: import_companies_from_raw(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.import_companies_from_raw(import_log_uuid uuid) RETURNS TABLE(success_count integer, error_count integer, duplicate_count integer)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.import_companies_from_raw(import_log_uuid uuid) OWNER TO postgres;

--
-- Name: is_valid_email(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_valid_email(email text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $_$
BEGIN
    IF email IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Basic email regex pattern
    RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$_$;


ALTER FUNCTION public.is_valid_email(email text) OWNER TO postgres;

--
-- Name: log_audit_trail(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.log_audit_trail() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, new_values)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, record_id, action, new_values)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW));
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION public.log_audit_trail() OWNER TO postgres;

--
-- Name: merge_companies(uuid, uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.merge_companies(keep_company_id uuid, merge_company_id uuid, merged_by_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.merge_companies(keep_company_id uuid, merge_company_id uuid, merged_by_user_id uuid) OWNER TO postgres;

--
-- Name: normalize_company_name(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.normalize_company_name(raw_name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
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
$$;


ALTER FUNCTION public.normalize_company_name(raw_name text) OWNER TO postgres;

--
-- Name: parse_excel_date(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.parse_excel_date(raw_date text) RETURNS date
    LANGUAGE plpgsql IMMUTABLE
    AS $$
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
$$;


ALTER FUNCTION public.parse_excel_date(raw_date text) OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

--
-- Name: validate_all_companies(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validate_all_companies() RETURNS integer
    LANGUAGE plpgsql
    AS $_$
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
$_$;


ALTER FUNCTION public.validate_all_companies() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activities (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(500) NOT NULL,
    description text,
    activity_type_id integer,
    department_id integer,
    start_date date,
    end_date date,
    registration_deadline date,
    location_id integer,
    venue_name character varying(255),
    venue_address text,
    is_online boolean DEFAULT false,
    max_participants integer,
    current_participants integer DEFAULT 0,
    waiting_list_count integer DEFAULT 0,
    budget_allocated numeric(15,2),
    budget_spent numeric(15,2),
    cost_per_participant numeric(10,2),
    is_free boolean DEFAULT false,
    participation_fee numeric(10,2),
    status character varying(50) NOT NULL,
    completion_percentage integer DEFAULT 0,
    actual_participants integer,
    satisfaction_score numeric(3,2),
    impact_notes text,
    partners jsonb,
    documents_path text,
    version integer DEFAULT 1,
    previous_version_id uuid,
    created_by uuid,
    updated_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.activities OWNER TO postgres;

--
-- Name: TABLE activities; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.activities IS 'Main table for all types of activities (formations, events, projects, services). Includes historization via version field.';


--
-- Name: activity_partners; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_partners (
    activity_id uuid NOT NULL,
    partner_id uuid NOT NULL,
    contribution_type character varying(255),
    contribution_amount numeric(15,2),
    notes text
);


ALTER TABLE public.activity_partners OWNER TO postgres;

--
-- Name: activity_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activity_types (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(50),
    description text,
    icon character varying(100)
);


ALTER TABLE public.activity_types OWNER TO postgres;

--
-- Name: activity_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.activity_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_types_id_seq OWNER TO postgres;

--
-- Name: activity_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.activity_types_id_seq OWNED BY public.activity_types.id;


--
-- Name: alert_recipients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alert_recipients (
    alert_id uuid NOT NULL,
    user_id uuid NOT NULL,
    notification_method character varying(50),
    notified_at timestamp without time zone
);


ALTER TABLE public.alert_recipients OWNER TO postgres;

--
-- Name: alert_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alert_types (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    default_threshold numeric(15,2),
    is_active boolean DEFAULT true
);


ALTER TABLE public.alert_types OWNER TO postgres;

--
-- Name: alert_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.alert_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alert_types_id_seq OWNER TO postgres;

--
-- Name: alert_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.alert_types_id_seq OWNED BY public.alert_types.id;


--
-- Name: alerts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alerts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    alert_type_id integer,
    entity_type character varying(100),
    entity_id uuid,
    title character varying(500) NOT NULL,
    message text,
    severity character varying(20),
    threshold_value numeric(15,2),
    current_value numeric(15,2),
    is_active boolean DEFAULT true,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    read_at timestamp without time zone,
    read_by uuid
);


ALTER TABLE public.alerts OWNER TO postgres;

--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_log (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    table_name character varying(100) NOT NULL,
    record_id uuid NOT NULL,
    action character varying(20) NOT NULL,
    old_values jsonb,
    new_values jsonb,
    changed_fields text[],
    changed_by uuid,
    changed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ip_address inet,
    user_agent text
);


ALTER TABLE public.audit_log OWNER TO postgres;

--
-- Name: TABLE audit_log; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.audit_log IS 'Complete audit trail of all changes to critical data.';


--
-- Name: budget_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.budget_categories (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(50),
    parent_category_id integer,
    description text
);


ALTER TABLE public.budget_categories OWNER TO postgres;

--
-- Name: budget_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.budget_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.budget_categories_id_seq OWNER TO postgres;

--
-- Name: budget_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.budget_categories_id_seq OWNED BY public.budget_categories.id;


--
-- Name: budgets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.budgets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    fiscal_year integer NOT NULL,
    department_id integer,
    category_id integer,
    allocated_amount numeric(15,2) NOT NULL,
    spent_amount numeric(15,2) DEFAULT 0,
    committed_amount numeric(15,2) DEFAULT 0,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.budgets OWNER TO postgres;

--
-- Name: companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.companies (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(500) NOT NULL,
    legal_name character varying(500),
    ice character varying(50),
    rc character varying(100),
    patent_number character varying(100),
    tax_id character varying(100),
    sector_id integer,
    company_type character varying(100),
    size_category character varying(50),
    employee_count integer,
    annual_revenue numeric(15,2),
    email character varying(255),
    phone character varying(50),
    mobile character varying(50),
    fax character varying(50),
    website character varying(255),
    address text,
    city character varying(100),
    province character varying(100),
    postal_code character varying(20),
    latitude numeric(10,8),
    longitude numeric(11,8),
    representative_name character varying(255),
    representative_title character varying(100),
    representative_email character varying(255),
    representative_phone character varying(50),
    is_member boolean DEFAULT false,
    membership_date date,
    membership_status character varying(50),
    data_quality_score integer,
    needs_verification boolean DEFAULT false,
    verification_notes text,
    duplicate_of uuid,
    created_by uuid,
    updated_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.companies OWNER TO postgres;

--
-- Name: TABLE companies; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.companies IS 'Central table for all companies/members. Handles messy Excel data with quality tracking.';


--
-- Name: company_sectors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_sectors (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(50),
    description text
);


ALTER TABLE public.company_sectors OWNER TO postgres;

--
-- Name: company_sectors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.company_sectors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.company_sectors_id_seq OWNER TO postgres;

--
-- Name: company_sectors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.company_sectors_id_seq OWNED BY public.company_sectors.id;


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expenses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    budget_id uuid,
    activity_id uuid,
    expense_date date NOT NULL,
    description character varying(500) NOT NULL,
    amount numeric(15,2) NOT NULL,
    supplier character varying(255),
    invoice_number character varying(100),
    payment_status character varying(50),
    payment_date date,
    approved_by uuid,
    approval_date date,
    created_by uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.expenses OWNER TO postgres;

--
-- Name: participants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.participants (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    first_name character varying(255),
    last_name character varying(255),
    email character varying(255),
    phone character varying(50),
    company_id uuid,
    job_title character varying(255),
    department character varying(255),
    activity_id uuid,
    registration_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    registration_status character varying(50),
    attendance_confirmed boolean DEFAULT false,
    attendance_date timestamp without time zone,
    certificate_issued boolean DEFAULT false,
    satisfaction_rating integer,
    feedback_comments text,
    feedback_date timestamp without time zone,
    source_file character varying(255),
    source_row integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.participants OWNER TO postgres;

--
-- Name: dashboard_stats; Type: MATERIALIZED VIEW; Schema: public; Owner: postgres
--

CREATE MATERIALIZED VIEW public.dashboard_stats AS
 SELECT count(DISTINCT c.id) AS total_companies,
    count(DISTINCT
        CASE
            WHEN c.is_member THEN c.id
            ELSE NULL::uuid
        END) AS member_companies,
    count(DISTINCT a.id) AS total_activities,
    count(DISTINCT
        CASE
            WHEN (a.activity_type_id = 1) THEN a.id
            ELSE NULL::uuid
        END) AS total_formations,
    count(DISTINCT
        CASE
            WHEN ((a.status)::text = 'completed'::text) THEN a.id
            ELSE NULL::uuid
        END) AS completed_activities,
    count(DISTINCT p.id) AS total_participants,
    COALESCE(avg(p.satisfaction_rating), (0)::numeric) AS avg_satisfaction,
    COALESCE(sum(b.allocated_amount), (0)::numeric) AS total_budget_allocated,
    COALESCE(sum(b.spent_amount), (0)::numeric) AS total_budget_spent,
    COALESCE(sum(e.amount), (0)::numeric) AS total_expenses,
    CURRENT_TIMESTAMP AS last_updated
   FROM ((((public.companies c
     FULL JOIN public.activities a ON (true))
     FULL JOIN public.participants p ON (true))
     FULL JOIN public.budgets b ON (true))
     FULL JOIN public.expenses e ON (true))
  WITH NO DATA;


ALTER MATERIALIZED VIEW public.dashboard_stats OWNER TO postgres;

--
-- Name: data_quality_issues; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.data_quality_issues (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    entity_type character varying(100) NOT NULL,
    entity_id uuid NOT NULL,
    field_name character varying(100),
    rule_id integer,
    issue_description text,
    severity character varying(20),
    status character varying(50) DEFAULT 'open'::character varying,
    detected_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    resolved_date timestamp without time zone,
    resolved_by uuid,
    resolution_notes text
);


ALTER TABLE public.data_quality_issues OWNER TO postgres;

--
-- Name: TABLE data_quality_issues; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.data_quality_issues IS 'Tracks data quality problems detected during import or validation.';


--
-- Name: data_quality_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.data_quality_rules (
    id integer NOT NULL,
    entity_type character varying(100) NOT NULL,
    field_name character varying(100) NOT NULL,
    rule_type character varying(50),
    validation_pattern text,
    error_message text,
    is_active boolean DEFAULT true,
    severity character varying(20),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.data_quality_rules OWNER TO postgres;

--
-- Name: data_quality_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.data_quality_rules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.data_quality_rules_id_seq OWNER TO postgres;

--
-- Name: data_quality_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.data_quality_rules_id_seq OWNED BY public.data_quality_rules.id;


--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(50),
    location_id integer,
    parent_department_id integer,
    description text,
    head_name character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_id_seq OWNER TO postgres;

--
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- Name: formations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.formations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    activity_id uuid,
    category_id integer,
    level character varying(50),
    duration_hours numeric(5,1),
    language character varying(50),
    trainer_name character varying(255),
    trainer_organization character varying(255),
    trainer_bio text,
    provides_certificate boolean DEFAULT false,
    certificate_type character varying(255),
    prerequisites text,
    target_audience text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.formations OWNER TO postgres;

--
-- Name: import_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.import_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    filename character varying(500) NOT NULL,
    file_hash character varying(64),
    file_size bigint,
    sheet_name character varying(255),
    data_type character varying(100),
    uploaded_by uuid,
    upload_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(50),
    total_rows integer,
    rows_imported integer,
    rows_skipped integer,
    rows_with_errors integer,
    error_log text,
    warnings_log text,
    processing_started_at timestamp without time zone,
    processing_completed_at timestamp without time zone,
    notes text
);


ALTER TABLE public.import_logs OWNER TO postgres;

--
-- Name: TABLE import_logs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.import_logs IS 'Tracks all Excel file imports with detailed error/warning logs for data quality monitoring.';


--
-- Name: kpi_definitions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kpi_definitions (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(50),
    description text,
    calculation_formula text,
    unit character varying(50),
    category character varying(100)
);


ALTER TABLE public.kpi_definitions OWNER TO postgres;

--
-- Name: kpi_definitions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.kpi_definitions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.kpi_definitions_id_seq OWNER TO postgres;

--
-- Name: kpi_definitions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.kpi_definitions_id_seq OWNED BY public.kpi_definitions.id;


--
-- Name: locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.locations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    type character varying(50) NOT NULL,
    address text,
    city character varying(100),
    postal_code character varying(20),
    latitude numeric(10,8),
    longitude numeric(11,8),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.locations OWNER TO postgres;

--
-- Name: locations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.locations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.locations_id_seq OWNER TO postgres;

--
-- Name: locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.locations_id_seq OWNED BY public.locations.id;


--
-- Name: partner_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.partner_types (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text
);


ALTER TABLE public.partner_types OWNER TO postgres;

--
-- Name: partner_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.partner_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.partner_types_id_seq OWNER TO postgres;

--
-- Name: partner_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.partner_types_id_seq OWNED BY public.partner_types.id;


--
-- Name: partners; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.partners (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(500) NOT NULL,
    partner_type_id integer,
    contact_person character varying(255),
    email character varying(255),
    phone character varying(50),
    address text,
    website character varying(255),
    partnership_start_date date,
    partnership_status character varying(50),
    description text,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.partners OWNER TO postgres;

--
-- Name: raw_excel_data; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.raw_excel_data (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    import_log_id uuid,
    row_number integer,
    raw_data jsonb,
    status character varying(50),
    error_message text,
    mapped_entity_type character varying(100),
    mapped_entity_id uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.raw_excel_data OWNER TO postgres;

--
-- Name: TABLE raw_excel_data; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.raw_excel_data IS 'Stores raw Excel data before processing - enables audit trail and reprocessing if needed.';


--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: service_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_types (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(50),
    category character varying(100),
    description text
);


ALTER TABLE public.service_types OWNER TO postgres;

--
-- Name: service_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.service_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.service_types_id_seq OWNER TO postgres;

--
-- Name: service_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.service_types_id_seq OWNED BY public.service_types.id;


--
-- Name: services_provided; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services_provided (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    service_type_id integer,
    company_id uuid,
    department_id integer,
    request_date date NOT NULL,
    request_description text,
    assigned_to uuid,
    status character varying(50),
    priority character varying(20),
    start_date date,
    completion_date date,
    cost numeric(10,2),
    paid boolean DEFAULT false,
    payment_date date,
    outcome text,
    satisfaction_rating integer,
    requires_followup boolean DEFAULT false,
    followup_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.services_provided OWNER TO postgres;

--
-- Name: training_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.training_categories (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text
);


ALTER TABLE public.training_categories OWNER TO postgres;

--
-- Name: training_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.training_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.training_categories_id_seq OWNER TO postgres;

--
-- Name: training_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.training_categories_id_seq OWNED BY public.training_categories.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role_id integer,
    full_name character varying(255),
    department_id integer,
    is_active boolean DEFAULT true,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: v_activities_summary; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_activities_summary AS
SELECT
    NULL::uuid AS id,
    NULL::character varying(500) AS title,
    NULL::text AS description,
    NULL::integer AS activity_type_id,
    NULL::integer AS department_id,
    NULL::date AS start_date,
    NULL::date AS end_date,
    NULL::date AS registration_deadline,
    NULL::integer AS location_id,
    NULL::character varying(255) AS venue_name,
    NULL::text AS venue_address,
    NULL::boolean AS is_online,
    NULL::integer AS max_participants,
    NULL::integer AS current_participants,
    NULL::integer AS waiting_list_count,
    NULL::numeric(15,2) AS budget_allocated,
    NULL::numeric(15,2) AS budget_spent,
    NULL::numeric(10,2) AS cost_per_participant,
    NULL::boolean AS is_free,
    NULL::numeric(10,2) AS participation_fee,
    NULL::character varying(50) AS status,
    NULL::integer AS completion_percentage,
    NULL::integer AS actual_participants,
    NULL::numeric(3,2) AS satisfaction_score,
    NULL::text AS impact_notes,
    NULL::jsonb AS partners,
    NULL::text AS documents_path,
    NULL::integer AS version,
    NULL::uuid AS previous_version_id,
    NULL::uuid AS created_by,
    NULL::uuid AS updated_by,
    NULL::timestamp without time zone AS created_at,
    NULL::timestamp without time zone AS updated_at,
    NULL::character varying(100) AS activity_type_name,
    NULL::character varying(255) AS department_name,
    NULL::character varying(100) AS location_name,
    NULL::bigint AS total_participants,
    NULL::bigint AS confirmed_participants,
    NULL::numeric AS avg_satisfaction,
    NULL::numeric AS budget_usage_percentage;


ALTER VIEW public.v_activities_summary OWNER TO postgres;

--
-- Name: v_companies_incomplete; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_companies_incomplete AS
 SELECT id,
    name,
        CASE
            WHEN (ice IS NULL) THEN 'Missing ICE'::text
            ELSE NULL::text
        END AS ice_issue,
        CASE
            WHEN ((email IS NULL) OR (NOT public.is_valid_email((email)::text))) THEN 'Invalid Email'::text
            ELSE NULL::text
        END AS email_issue,
        CASE
            WHEN (phone IS NULL) THEN 'Missing Phone'::text
            ELSE NULL::text
        END AS phone_issue,
        CASE
            WHEN (city IS NULL) THEN 'Missing City'::text
            ELSE NULL::text
        END AS city_issue,
        CASE
            WHEN (sector_id IS NULL) THEN 'Missing Sector'::text
            ELSE NULL::text
        END AS sector_issue,
    public.calculate_company_quality_score(id) AS quality_score
   FROM public.companies
  WHERE ((ice IS NULL) OR (email IS NULL) OR (NOT public.is_valid_email((email)::text)) OR (phone IS NULL) OR (city IS NULL) OR (sector_id IS NULL));


ALTER VIEW public.v_companies_incomplete OWNER TO postgres;

--
-- Name: v_companies_with_quality; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_companies_with_quality AS
SELECT
    NULL::uuid AS id,
    NULL::character varying(500) AS name,
    NULL::character varying(500) AS legal_name,
    NULL::character varying(50) AS ice,
    NULL::character varying(100) AS rc,
    NULL::character varying(100) AS patent_number,
    NULL::character varying(100) AS tax_id,
    NULL::integer AS sector_id,
    NULL::character varying(100) AS company_type,
    NULL::character varying(50) AS size_category,
    NULL::integer AS employee_count,
    NULL::numeric(15,2) AS annual_revenue,
    NULL::character varying(255) AS email,
    NULL::character varying(50) AS phone,
    NULL::character varying(50) AS mobile,
    NULL::character varying(50) AS fax,
    NULL::character varying(255) AS website,
    NULL::text AS address,
    NULL::character varying(100) AS city,
    NULL::character varying(100) AS province,
    NULL::character varying(20) AS postal_code,
    NULL::numeric(10,8) AS latitude,
    NULL::numeric(11,8) AS longitude,
    NULL::character varying(255) AS representative_name,
    NULL::character varying(100) AS representative_title,
    NULL::character varying(255) AS representative_email,
    NULL::character varying(50) AS representative_phone,
    NULL::boolean AS is_member,
    NULL::date AS membership_date,
    NULL::character varying(50) AS membership_status,
    NULL::integer AS data_quality_score,
    NULL::boolean AS needs_verification,
    NULL::text AS verification_notes,
    NULL::uuid AS duplicate_of,
    NULL::uuid AS created_by,
    NULL::uuid AS updated_by,
    NULL::timestamp without time zone AS created_at,
    NULL::timestamp without time zone AS updated_at,
    NULL::character varying(255) AS sector_name,
    NULL::integer AS calculated_quality_score,
    NULL::bigint AS open_quality_issues;


ALTER VIEW public.v_companies_with_quality OWNER TO postgres;

--
-- Name: v_company_quality_overview; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_company_quality_overview AS
 SELECT count(*) AS total_companies,
    count(
        CASE
            WHEN (data_quality_score >= 90) THEN 1
            ELSE NULL::integer
        END) AS excellent_quality,
    count(
        CASE
            WHEN ((data_quality_score >= 70) AND (data_quality_score <= 89)) THEN 1
            ELSE NULL::integer
        END) AS good_quality,
    count(
        CASE
            WHEN ((data_quality_score >= 50) AND (data_quality_score <= 69)) THEN 1
            ELSE NULL::integer
        END) AS fair_quality,
    count(
        CASE
            WHEN (data_quality_score < 50) THEN 1
            ELSE NULL::integer
        END) AS poor_quality,
    count(
        CASE
            WHEN needs_verification THEN 1
            ELSE NULL::integer
        END) AS needs_verification,
    count(
        CASE
            WHEN (duplicate_of IS NOT NULL) THEN 1
            ELSE NULL::integer
        END) AS duplicates,
    round(avg(data_quality_score), 2) AS avg_quality_score
   FROM public.companies;


ALTER VIEW public.v_company_quality_overview OWNER TO postgres;

--
-- Name: v_duplicate_companies_by_ice; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_duplicate_companies_by_ice AS
 SELECT ice,
    count(*) AS duplicate_count,
    string_agg((id)::text, ', '::text) AS company_ids,
    string_agg((name)::text, ' | '::text) AS company_names
   FROM public.companies
  WHERE (ice IS NOT NULL)
  GROUP BY ice
 HAVING (count(*) > 1);


ALTER VIEW public.v_duplicate_companies_by_ice OWNER TO postgres;

--
-- Name: v_import_quality_report; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_import_quality_report AS
 SELECT il.id AS import_id,
    il.filename,
    il.upload_date,
    il.data_type,
    il.status,
    il.total_rows,
    il.rows_imported,
    il.rows_skipped,
    il.rows_with_errors,
    round((((il.rows_imported)::numeric / (NULLIF(il.total_rows, 0))::numeric) * (100)::numeric), 2) AS success_rate,
    u.username AS uploaded_by
   FROM (public.import_logs il
     LEFT JOIN public.users u ON ((il.uploaded_by = u.id)))
  ORDER BY il.upload_date DESC;


ALTER VIEW public.v_import_quality_report OWNER TO postgres;

--
-- Name: v_monthly_statistics; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_monthly_statistics AS
 SELECT date_trunc('month'::text, (a.start_date)::timestamp with time zone) AS month,
    count(*) AS total_activities,
    count(DISTINCT
        CASE
            WHEN ((a.status)::text = 'completed'::text) THEN a.id
            ELSE NULL::uuid
        END) AS completed_activities,
    sum(a.budget_allocated) AS total_budget,
    sum(a.budget_spent) AS total_spent,
    count(DISTINCT p.id) AS total_participants
   FROM (public.activities a
     LEFT JOIN public.participants p ON ((p.activity_id = a.id)))
  WHERE (a.start_date IS NOT NULL)
  GROUP BY (date_trunc('month'::text, (a.start_date)::timestamp with time zone))
  ORDER BY (date_trunc('month'::text, (a.start_date)::timestamp with time zone)) DESC;


ALTER VIEW public.v_monthly_statistics OWNER TO postgres;

--
-- Name: activity_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_types ALTER COLUMN id SET DEFAULT nextval('public.activity_types_id_seq'::regclass);


--
-- Name: alert_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert_types ALTER COLUMN id SET DEFAULT nextval('public.alert_types_id_seq'::regclass);


--
-- Name: budget_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_categories ALTER COLUMN id SET DEFAULT nextval('public.budget_categories_id_seq'::regclass);


--
-- Name: company_sectors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_sectors ALTER COLUMN id SET DEFAULT nextval('public.company_sectors_id_seq'::regclass);


--
-- Name: data_quality_rules id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data_quality_rules ALTER COLUMN id SET DEFAULT nextval('public.data_quality_rules_id_seq'::regclass);


--
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- Name: kpi_definitions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kpi_definitions ALTER COLUMN id SET DEFAULT nextval('public.kpi_definitions_id_seq'::regclass);


--
-- Name: locations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations ALTER COLUMN id SET DEFAULT nextval('public.locations_id_seq'::regclass);


--
-- Name: partner_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partner_types ALTER COLUMN id SET DEFAULT nextval('public.partner_types_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: service_types id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_types ALTER COLUMN id SET DEFAULT nextval('public.service_types_id_seq'::regclass);


--
-- Name: training_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_categories ALTER COLUMN id SET DEFAULT nextval('public.training_categories_id_seq'::regclass);


--
-- Data for Name: activities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activities (id, title, description, activity_type_id, department_id, start_date, end_date, registration_deadline, location_id, venue_name, venue_address, is_online, max_participants, current_participants, waiting_list_count, budget_allocated, budget_spent, cost_per_participant, is_free, participation_fee, status, completion_percentage, actual_participants, satisfaction_score, impact_notes, partners, documents_path, version, previous_version_id, created_by, updated_by, created_at, updated_at) FROM stdin;
c2eeaac6-df6c-4b87-9ce7-3b22764b2ee5	Mission Prospection Europe	Mission de prospection commerciale en Europe (France, Espagne, Allemagne)	5	3	2026-07-15	2026-07-25	2026-07-01	1	Paris, Madrid, Berlin	\N	f	15	0	0	120000.00	0.00	\N	f	5000.00	planned	0	\N	\N	\N	\N	\N	1	\N	\N	\N	2026-01-27 16:35:00.707567	2026-01-29 17:30:13.538389
d7597bba-8e80-451c-8749-f3b5668ab6cf	Mission Prospection Afrique	Mission commerciale vers les pays d'Afrique de l'Ouest	5	3	2025-12-10	2025-12-20	2025-12-01	1	Dakar, Abidjan, Lagos	\N	f	12	10	0	100000.00	85000.00	\N	f	6000.00	completed	100	10	4.20	\N	\N	\N	1	\N	\N	\N	2026-01-27 16:35:00.707567	2026-01-29 17:30:13.538389
69b42d8b-8a9b-40f9-a6d5-2505bb5f46c3	Conference Innovation et Entrepreneuriat	Grande conference sur l'innovation et l'entrepreneuriat au Maroc	2	2	2026-05-20	2026-05-20	2026-05-15	1	ThAA¢tre Mohammed V	\N	f	300	0	0	80000.00	0.00	\N	t	0.00	planned	0	\N	\N	\N	\N	\N	1	\N	\N	\N	2026-01-27 16:35:00.707567	2026-01-29 23:03:25.952417
7423b7c4-b62b-437f-a79b-00870c5013b3	Salon B2B - Rabat-Sale-Kenitra 2026	Rencontres B2B pour favoriser les partenariats entre entreprises de la region	2	4	2026-04-15	2026-04-17	2026-04-10	1	Palais des Congres Rabat	\N	f	200	0	0	150000.00	0.00	\N	f	1000.00	planned	0	\N	\N	\N	\N	\N	1	\N	\N	\N	2026-01-27 16:35:00.707567	2026-01-29 23:06:18.839227
5119f56f-6761-4a3f-a53a-5beada684953	Management et Leadership	Developper ses compeences en management et leadership	1	4	2026-02-05	2026-02-07	2026-01-30	2	Annexe Kenitra	\N	f	20	18	0	20000.00	8000.00	\N	f	500.00	ongoing	40	\N	\N	\N	\N	\N	1	\N	\N	\N	2026-01-27 16:35:00.707567	2026-01-29 23:06:18.846311
427d0226-c41b-4fbf-88e7-7c0cf0ef3c18	Strategies de Developpement Commercial	Techniques avancees pour developper son activite commerciale	1	4	2026-03-10	2026-03-12	2026-03-05	1	Siege CCIS Rabat	\N	f	30	0	0	22000.00	0.00	\N	f	400.00	planned	0	\N	\N	\N	\N	\N	1	\N	\N	\N	2026-01-27 16:35:00.707567	2026-01-29 23:06:18.848625
0b98801f-371c-4234-90c7-0effc4e4d8a1	Fiscalite des Entreprises 2026	Mise A jour sur la fiscalite et les nouvelles reglementations	1	4	2026-03-20	2026-03-21	2026-03-15	1	Salle de conference	\N	f	40	0	0	15000.00	0.00	\N	t	0.00	planned	0	\N	\N	\N	\N	\N	1	\N	\N	\N	2026-01-27 16:35:00.707567	2026-01-29 23:06:18.850566
0ce2effd-d2ff-46aa-95a7-5b834a16e4e3	Forum Investissement RSK 2026	Forum regional pour attirer les investissements dans la region	2	3	2026-01-30	2026-06-11	2026-06-05	1	Hotel Hilton Rabat	Sidi Moumen, Walili 5 IMM 5 APP 13	f	150	0	0	200000.00	0.00	\N	f	2000.00	planned	0	\N	\N	\N	\N	\N	1	\N	\N	\N	2026-01-27 16:35:00.707567	2026-01-29 23:00:37.106726
718e03c7-09df-491d-9f2c-48fefe58bc66	Comptabilite et Gestion Financiere	Formation sur les bases de la comptabilite et la gestion financiere pour entrepreneurs	1	4	2025-02-09	2025-02-11	2025-02-04	1	Salle de formation - Siege CCIS	rabat	f	25	22	0	18000.00	17200.00	\N	f	400.00	completed	100	22	4.30	\N	\N	\N	1	\N	\N	\N	2026-01-27 16:35:00.707567	2026-01-29 23:00:37.10942
69a43bc7-892f-415b-94bc-a9062f75ccf7	Formation en Digital Marketing	Formation intensive sur les strategies de marketing digital pour les entreprises	\N	\N	2026-02-15	2026-02-17	2026-02-10	\N	Casablanca	\N	f	30	0	0	50000.00	\N	\N	f	2000.00	planned	0	\N	\N	\N	\N	\N	1	\N	dfcc5a88-6560-4a87-86d5-8c9f4cf48f7d	\N	2026-01-29 22:18:16.315041	2026-01-29 23:00:37.111989
95f42f77-ed59-486a-96ea-286e9ac49282	Conference Innovation 2026	Conference annuelle sur l'innovation et la transformation digitale	\N	\N	2026-03-20	2026-03-20	2026-03-15	\N	Rabat	\N	f	100	0	0	150000.00	\N	\N	t	0.00	planned	0	\N	\N	\N	\N	\N	1	\N	dfcc5a88-6560-4a87-86d5-8c9f4cf48f7d	\N	2026-01-29 22:18:16.315041	2026-01-29 23:00:37.114441
b7ec6950-4ac6-4599-b6ff-fc93e5a3fe5e	Export et Commerce International	Maeriser les techniques d'exportation et le commerce international	1	4	2024-11-20	2024-11-22	2024-11-15	1	Centre de formation CCIS	\N	f	20	18	0	22000.00	20800.00	\N	f	600.00	completed	100	18	4.70	\N	\N	\N	1	\N	\N	\N	2026-01-27 16:35:00.707567	2026-01-29 23:03:25.932556
dcf6a7c4-5c76-4179-bbc9-70a5f0aed8ab	Formation Marketing Digital 2025	Formation intensive sur les strategies de marketing digital pour les PME	1	4	2025-01-15	2025-01-17	2025-01-10	1	Salle de conference - Siege CCIS	\N	f	30	28	0	25000.00	23500.00	\N	f	500.00	completed	100	28	4.50	\N	\N	\N	1	\N	\N	\N	2026-01-27 16:35:00.707567	2026-01-29 23:03:25.939954
625ea33e-ecd8-488c-8a6d-efddd667511c	Transformation Digitale des Entreprises	Programme d'accompagnement pour la digitalisation des PME	1	4	2026-01-20	2026-01-24	2026-01-15	1	Salle multimedia - Siege CCIS	\N	t	35	32	0	30000.00	15000.00	\N	f	450.00	ongoing	60	\N	\N	\N	\N	\N	1	\N	\N	\N	2026-01-27 16:35:00.707567	2026-01-29 23:03:25.942219
\.


--
-- Data for Name: activity_partners; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity_partners (activity_id, partner_id, contribution_type, contribution_amount, notes) FROM stdin;
7423b7c4-b62b-437f-a79b-00870c5013b3	8df95f98-15a2-44bf-b9c1-0645e56fdb21	financial	27062.82	Partenariat eabli pour soutien de l'activitA
7423b7c4-b62b-437f-a79b-00870c5013b3	cf48729e-4c46-481e-9211-377463d85ebf	expertise	\N	Partenariat eabli pour soutien de l'activitA
69b42d8b-8a9b-40f9-a6d5-2505bb5f46c3	8df95f98-15a2-44bf-b9c1-0645e56fdb21	financial	22837.02	Partenariat eabli pour soutien de l'activitA
69b42d8b-8a9b-40f9-a6d5-2505bb5f46c3	fbd17c9f-2088-4daa-b119-2088f82db895	expertise	\N	Partenariat eabli pour soutien de l'activitA
dcf6a7c4-5c76-4179-bbc9-70a5f0aed8ab	b5981010-938b-4ee5-b4d0-f176c1331e6f	support	\N	Partenariat eabli pour soutien de l'activitA
625ea33e-ecd8-488c-8a6d-efddd667511c	b5981010-938b-4ee5-b4d0-f176c1331e6f	support	\N	Partenariat eabli pour soutien de l'activitA
718e03c7-09df-491d-9f2c-48fefe58bc66	0c4311c1-8880-4bf0-b1b5-aff92f7c0d00	support	\N	Partenariat eabli pour soutien de l'activitA
718e03c7-09df-491d-9f2c-48fefe58bc66	8df95f98-15a2-44bf-b9c1-0645e56fdb21	financial	22221.30	Partenariat eabli pour soutien de l'activitA
718e03c7-09df-491d-9f2c-48fefe58bc66	b5981010-938b-4ee5-b4d0-f176c1331e6f	support	\N	Partenariat eabli pour soutien de l'activitA
5119f56f-6761-4a3f-a53a-5beada684953	0c4311c1-8880-4bf0-b1b5-aff92f7c0d00	support	\N	Partenariat eabli pour soutien de l'activitA
5119f56f-6761-4a3f-a53a-5beada684953	8df95f98-15a2-44bf-b9c1-0645e56fdb21	financial	25135.27	Partenariat eabli pour soutien de l'activitA
427d0226-c41b-4fbf-88e7-7c0cf0ef3c18	0c4311c1-8880-4bf0-b1b5-aff92f7c0d00	support	\N	Partenariat eabli pour soutien de l'activitA
427d0226-c41b-4fbf-88e7-7c0cf0ef3c18	b5981010-938b-4ee5-b4d0-f176c1331e6f	support	\N	Partenariat eabli pour soutien de l'activitA
427d0226-c41b-4fbf-88e7-7c0cf0ef3c18	cf48729e-4c46-481e-9211-377463d85ebf	expertise	\N	Partenariat eabli pour soutien de l'activitA
b7ec6950-4ac6-4599-b6ff-fc93e5a3fe5e	fbd17c9f-2088-4daa-b119-2088f82db895	expertise	\N	Partenariat eabli pour soutien de l'activitA
\.


--
-- Data for Name: activity_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activity_types (id, name, code, description, icon) FROM stdin;
1	Formation	FORM	Training programs and workshops	\N
3	Projet	PROJ	Development projects and partnerships	\N
4	Service	SERV	Services provided to companies (assistance, mediation, etc.)	\N
5	Mission	MISS	International prospecting missions	\N
6	A‰tude	STUD	Market studies and research	\N
2	A‰venement	EVENT	Events, seminars, conferences, B2B meetings	\N
\.


--
-- Data for Name: alert_recipients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alert_recipients (alert_id, user_id, notification_method, notified_at) FROM stdin;
\.


--
-- Data for Name: alert_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alert_types (id, name, description, default_threshold, is_active) FROM stdin;
2	Budget proche limite	Alerte A 90% du budget	90.00	t
1	Budget depassA	Alerte quand le budget est depassA	100.00	t
4	Date limite proche	A‰cheance approche (7 jours)	\N	t
3	Capacite atteinte	Activite complete	100.00	t
5	Donnees incompletes	Score qualite < 50%	50.00	t
\.


--
-- Data for Name: alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alerts (id, alert_type_id, entity_type, entity_id, title, message, severity, threshold_value, current_value, is_active, is_read, created_at, read_at, read_by) FROM stdin;
f4f7e3e1-60c5-49fb-8dd3-7b9b53efcff5	2	budget	2c1e3fc2-ffaa-4ad1-8ab8-4482c66d0e1d	Budget Formation proche de la limite	Le budget formation a atteint 90% de consommation	warning	90.00	88.20	t	f	2026-01-27 16:35:01.421284	\N	\N
f8946dd0-20ab-4a86-9e39-9c80f8dee200	4	activity	427d0226-c41b-4fbf-88e7-7c0cf0ef3c18	Date limite inscription approche	La date limite d'inscription pour la formation approche dans 7 jours	info	\N	\N	t	f	2026-01-27 16:35:01.421284	\N	\N
59ac0162-c4c1-4574-9536-5293bbb04224	5	company	2cde67e4-2878-4c3f-bbff-bce974ddef48	Donnees entreprise incompletes	Le profil de l'entreprise Start-Up Tech a un score de qualite faible (65%)	info	70.00	65.00	t	t	2026-01-27 16:35:01.421284	2026-01-29 18:47:06.37407	dfcc5a88-6560-4a87-86d5-8c9f4cf48f7d
\.


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_log (id, table_name, record_id, action, old_values, new_values, changed_fields, changed_by, changed_at, ip_address, user_agent) FROM stdin;
\.


--
-- Data for Name: budget_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.budget_categories (id, name, code, parent_category_id, description) FROM stdin;
1	Formation	FORM	\N	\N
3	Communication	COMM	\N	\N
5	Personnel	PERS	\N	\N
6	Fonctionnement	FONC	\N	\N
7	Investissement	INV	\N	\N
4	A‰tudes	ETUDE	\N	\N
2	A‰venements	EVENT	\N	\N
\.


--
-- Data for Name: budgets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.budgets (id, fiscal_year, department_id, category_id, allocated_amount, spent_amount, committed_amount, notes, created_at, updated_at) FROM stdin;
2c1e3fc2-ffaa-4ad1-8ab8-4482c66d0e1d	2026	4	1	500000.00	88200.00	120000.00	\N	2026-01-27 16:35:01.257109	2026-01-27 16:35:01.257109
bff35407-e32d-494d-a6ae-d8c0cf8ed98c	2026	4	2	800000.00	0.00	430000.00	\N	2026-01-27 16:35:01.257109	2026-01-27 16:35:01.257109
d8215067-0149-4efa-8007-8247731a23b1	2026	3	4	200000.00	0.00	0.00	\N	2026-01-27 16:35:01.257109	2026-01-27 16:35:01.257109
b81b010b-b978-4338-90f5-acc924a4ce7a	2026	2	5	300000.00	0.00	0.00	\N	2026-01-27 16:35:01.257109	2026-01-27 16:35:01.257109
5c5780e3-9482-46aa-9efc-678cd1cd954f	2026	5	6	400000.00	0.00	0.00	\N	2026-01-27 16:35:01.257109	2026-01-27 16:35:01.257109
e28b9c76-cea9-4683-9106-3f94d36a1df5	2026	6	3	150000.00	0.00	0.00	\N	2026-01-27 16:35:01.257109	2026-01-27 16:35:01.257109
4ff6860a-6ec2-4fee-903a-2e787b992ac9	2025	4	1	450000.00	380000.00	0.00	\N	2026-01-27 16:35:01.257109	2026-01-27 16:35:01.257109
a6b40cd2-d1db-4608-a067-960469fa12ef	2025	4	2	750000.00	620000.00	0.00	\N	2026-01-27 16:35:01.257109	2026-01-27 16:35:01.257109
f29caeb3-8cc0-420e-8f11-34720b7c215b	2025	3	4	180000.00	150000.00	0.00	\N	2026-01-27 16:35:01.257109	2026-01-27 16:35:01.257109
9f5af043-4405-489c-b979-90c9109d186a	2025	2	5	280000.00	280000.00	0.00	\N	2026-01-27 16:35:01.257109	2026-01-27 16:35:01.257109
92c45597-3834-428e-9f14-b83470d00110	2025	5	6	380000.00	365000.00	0.00	\N	2026-01-27 16:35:01.257109	2026-01-27 16:35:01.257109
d06a46b1-1e6f-490e-96a5-702d8bfdb83b	2026	\N	\N	500000.00	0.00	0.00	Budget annuel pour les formations professionnelles	2026-01-29 22:25:32.614567	2026-01-29 22:25:32.614567
30cc2481-1ef5-4584-8e98-53bbaea6e6d7	2026	\N	\N	200000.00	0.00	0.00	Budget campagnes digitales et communication en ligne	2026-01-29 22:25:32.614567	2026-01-29 22:25:32.614567
2e00b81d-9741-44dd-a8a1-d3eecd1bb70a	2026	\N	\N	300000.00	0.00	0.00	Budget pour l'organisation de conferences et evenements	2026-01-29 22:25:32.614567	2026-01-29 22:25:32.614567
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.companies (id, name, legal_name, ice, rc, patent_number, tax_id, sector_id, company_type, size_category, employee_count, annual_revenue, email, phone, mobile, fax, website, address, city, province, postal_code, latitude, longitude, representative_name, representative_title, representative_email, representative_phone, is_member, membership_date, membership_status, data_quality_score, needs_verification, verification_notes, duplicate_of, created_by, updated_by, created_at, updated_at) FROM stdin;
585724e4-9017-4594-a17a-6b870d031981	Conseil & Strategie SARL	Conseil & Strategie Societe A Responsabilite Limitee	002345678901241	RC567897	\N	\N	4	SARL	TPE	18	3500000.00	contact@conseil-strategie.ma	0537901234	0664567890	\N	\N	33 Rue Oqba	Rabat	Rabat	10000	33.96960000	-6.83480000	Hicham Fassi	Gerant	h.fassi@conseil-strategie.ma	0664567890	t	2025-01-15	active	85	f	\N	\N	\N	\N	2026-01-27 16:35:00.590087	2026-01-29 23:06:18.918399
5847047c-29f1-47bb-afbd-bdac8c047f05	Artisanat Marocain SARL	Artisanat Marocain Societe A Responsabilite Limitee	002345678901247	RC567903	\N	\N	7	SARL	TPE	8	1500000.00	contact@artisanat-maroc.ma	0537234567	0667890123	\N	\N	5 Rue des Consuls	Rabat	Rabat	10000	33.99660000	-6.85980000	Mohammed Lamrani	Gerant	m.lamrani@artisanat-maroc.ma	0667890123	t	2024-09-05	active	78	f	\N	\N	\N	\N	2026-01-27 16:35:00.590087	2026-01-29 23:06:18.920232
c9d9d97e-6b57-4392-9855-c1345dc6f59a	Manufacture elas SARL	Manufacture elas Societe A Responsabilite Limitee	002345678901237	RC567893	\N	\N	2	SARL	PME	120	25000000.00	contact@atlas-manuf.ma	0537789012	0662345678	\N	\N	Zone Industrielle Technopolis	Sale	Sale	11000	34.05310000	-6.79490000	Rachid Tazi	Directeur General	r.tazi@atlas-manuf.ma	0662345678	t	2022-09-05	active	90	f	\N	\N	\N	\N	2026-01-27 16:35:00.590087	2026-01-29 23:06:18.925624
b5232a9b-5200-42ce-88ff-416466171104	Distribution Plus SARL	Distribution Plus Societe A Responsabilite Limitee	002345678901239	RC567895	\N	\N	3	SARL	PME	85	18000000.00	contact@distplus.ma	0537890123	0663456789	\N	\N	45 Avenue Allal Ben Abdellah	Rabat	Rabat	10000	33.98160000	-6.84480000	Omar Bennis	Directeur	o.bennis@distplus.ma	0663456789	t	2023-11-20	active	87	f	\N	\N	\N	\N	2026-01-27 16:35:00.590087	2026-01-29 23:06:18.927518
234d55dc-c410-4c48-8290-a4e492fc8458	Textile Moderne SA	Textile Moderne Societe Anonyme	002345678901238	RC567894	\N	\N	2	SA	GE	350	85000000.00	info@textile-moderne.ma	0537789013	0662345679	\N	\N	Rue de l'Industrie, Zone Industrielle	Kenitra	Kenitra	14000	34.26100000	-6.58020000	Nadia El Amrani	Presidente	n.elamrani@textile-moderne.ma	0662345679	t	2021-04-12	active	94	f	\N	\N	\N	\N	2026-01-27 16:35:00.590087	2026-01-29 23:06:18.929342
6d5fec6d-48b8-4e44-8c1e-da19a4eac52e	Services Pro Morocco	Services Pro Morocco SARL	002345678901242	RC567898	\N	\N	4	SARL	PME	42	7500000.00	info@servicespro.ma	0537901235	0664567891	\N	\N	67 Avenue de France	Rabat	Rabat	10000	33.98660000	-6.86980000	Zineb Chraibi	Directrice	z.chraibi@servicespro.ma	0664567891	t	2024-05-22	active	\N	f	\N	\N	\N	\N	2026-01-27 16:35:00.590087	2026-01-29 19:28:25.700244
c3aace76-be9e-44ae-aec9-50017786ca5b	Digital Solutions SA	Digital Solutions Societe Anonyme	002345678901235	RC567891	\N	\N	6	SA	PME	65	12000000.00	info@digitalsol.ma	0537654322	0661234568	\N	\N	78 Boulevard Mohammed V	Rabat	Rabat	10000	33.97160000	-6.84980000	Leila Benjelloun	CEO	l.benjelloun@digitalsol.ma	0661234568	t	2023-06-20	active	\N	f	\N	\N	\N	\N	2026-01-27 16:35:00.590087	2026-01-29 23:03:26.069664
c4a853a3-d6f7-4456-885a-4db4822162b6	InnovIT Morocco	InnovIT Morocco SARL	002345678901236	RC567892	\N	\N	6	SARL	TPE	12	2500000.00	contact@innovit.ma	0537654323	0661234569	\N	\N	12 Rue Patrice Lumumba	Rabat	Rabat	10000	33.97660000	-6.83980000	Mehdi Alaoui	Gerant	m.alaoui@innovit.ma	0661234569	t	2025-03-10	active	88	f	\N	\N	\N	\N	2026-01-27 16:35:00.590087	2026-01-29 23:06:18.931691
edc30357-cc91-418c-abd9-c89c84cb66ba	Construction Moderne SARL	Construction Moderne Societe A Responsabilite Limitee	002345678901245	RC567901	\N	\N	8	SARL	PME	95	22000000.00	info@construct-moderne.ma	0537123456	0666789012	\N	\N	88 Boulevard Al Qods	Rabat	Rabat	10000	33.98060000	-6.87480000	Jamal Lahlou	Directeur General	j.lahlou@construct-moderne.ma	0666789012	t	2022-12-10	active	93	f	\N	\N	\N	\N	2026-01-27 16:35:00.590087	2026-01-29 23:06:18.914521
163d5100-e16b-4a19-b15b-596ad176081a	Commerce International Maroc	Commerce International Maroc SA	002345678901240	RC567896	\N	\N	3	SA	PME	55	15000000.00	info@cim-maroc.ma	0537890124	0663456790	\N	\N	90 Boulevard Zerktouni	Rabat	Rabat	10000	33.97560000	-6.86480000	Samira Lazrak	Directrice Generale	s.lazrak@cim-maroc.ma	0663456790	t	2024-07-08	active	91	f	\N	\N	\N	\N	2026-01-27 16:35:00.590087	2026-01-29 23:06:18.933695
c8c7622b-610e-4b63-a2ac-504dfdc0bc0f	Agro Invest SARL	Agro Invest Societe A Responsabilite Limitee	002345678901244	RC567900	\N	\N	1	SARL	PME	75	12000000.00	contact@agroinvest.ma	0537012346	0665678902	\N	\N	Douar El Karma, Route de Kenitra	Sale	Rabat	11000	34.05810000	-6.78490000	Hassan Squalli	Directeur	h.squalli@agroinvest.ma	0665678902	t	2023-02-28	active	83	f	\N	\N	\N	\N	2026-01-27 16:35:00.590087	2026-01-29 23:06:18.916507
2cde67e4-2878-4c3f-bbff-bce974ddef48	Start-Up Tech	Start-Up Tech SARL	002345678901248	RC567904	\N	\N	6	SARL	TPE	6	800000.00	info@startup-tech.ma	0537234568	0667890124	\N	\N	15 Rue Abou Inane	Rabat	Rabat	10000	33.96560000	-6.85480000	Yousra Amrani	Gerante	y.amrani@startup-tech.ma	0667890124	f	\N	potential	65	f	\N	\N	\N	\N	2026-01-27 16:35:00.590087	2026-01-29 23:06:18.921951
6608b0d2-bf12-40fd-98c5-f912bfc4741b	TECHNOSOLUTIONS SARL	TechnoSolutions Societe a Responsabilite Limitee	001234567890001	RC123456	B123456	TF123456	\N	SARL	\N	\N	\N	contact@technosolutions.ma	+212522123456	+212661234567	\N	www.technosolutions.ma	123 Boulevard Mohammed V	Casablanca	Casablanca-Settat	20000	\N	\N	Ahmed Bennani	\N	\N	\N	f	\N	pending	\N	f	\N	\N	dfcc5a88-6560-4a87-86d5-8c9f4cf48f7d	\N	2026-01-29 22:04:34.536147	2026-01-29 23:32:23.835417
03c30d22-72d6-412d-8c93-f54214e27905	TechHub Maroc SARL	TechHub Maroc Societe A Responsabilite Limitee	002345678901234	RC567890	\N	\N	6	SARL	PME	45	8500000.00	contact@techhub.ma	0537654321	0661234567	\N	\N	25 Avenue Hassan II	Rabat	Rabat	10000	33.97360000	-6.84280000	Youssef Kabbaj	Directeur General	y.kabbaj@techhub.ma	0661234567	t	2024-01-15	active	95	f	\N	\N	\N	\N	2026-01-27 16:35:00.590087	2026-01-29 23:06:18.92366
78f34982-241b-4979-9452-c5fb09600f59	DIGITAL MAROC SA	Digital Maroc Societe Anonyme	001234567890002	RC789012	\N	\N	\N	SA	\N	\N	\N	info@digitalmaroc.ma	+212537654321	\N	\N	\N	456 Avenue Hassan II	Rabat	Rabat-Sale-Kenitra	10000	\N	\N	Fatima Alaoui	\N	\N	\N	f	\N	pending	\N	f	\N	\N	dfcc5a88-6560-4a87-86d5-8c9f4cf48f7d	\N	2026-01-29 22:04:34.536147	2026-01-29 23:32:23.835417
d6afcb0e-28e4-4977-aebf-9dffe3e20174	BTP Excellence SA	BTP Excellence Societe Anonyme	002345678901246	RC567902	\N	\N	8	SA	GE	280	75000000.00	contact@btp-excellence.ma	0537123457	0666789013	\N	\N	Zone Industrielle, Lot 45	Kenitra	Kenitra	14000	34.26600000	-6.57020000	Amina Berrada	Presidente	a.berrada@btp-excellence.ma	0666789013	t	2021-07-19	active	96	f	\N	\N	\N	\N	2026-01-27 16:35:00.590087	2026-01-29 23:06:18.935565
74ee80b7-5eff-4d16-a2e1-6f284168f9b7	Voyages Premium SARL	Voyages Premium Societe A Responsabilite Limitee	002345678901243	RC567899	\N	\N	5	SARL	TPE	15	2800000.00	contact@voyagespremium.ma	0537012345	0665678901	\N	\N	11 Avenue Mohammed VI	Rabat	Rabat	10000	33.99160000	-6.85480000	Kamal Idrissi	Gerant	k.idrissi@voyagespremium.ma	0665678901	t	2023-08-14	active	\N	f	\N	\N	\N	\N	2026-01-27 16:35:00.590087	2026-01-29 23:06:18.937531
\.


--
-- Data for Name: company_sectors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company_sectors (id, name, code, description) FROM stdin;
1	Agriculture	AGR	\N
2	Industrie	IND	\N
3	Commerce	COM	\N
4	Services	SRV	\N
5	Tourisme	TOU	\N
6	Technologies	TEC	\N
7	Artisanat	ART	\N
8	BTP	BTP	\N
\.


--
-- Data for Name: data_quality_issues; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.data_quality_issues (id, entity_type, entity_id, field_name, rule_id, issue_description, severity, status, detected_date, resolved_date, resolved_by, resolution_notes) FROM stdin;
\.


--
-- Data for Name: data_quality_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.data_quality_rules (id, entity_type, field_name, rule_type, validation_pattern, error_message, is_active, severity, created_at) FROM stdin;
1	company	name	required	\N	Le nom de l'entreprise est obligatoire	t	error	2026-01-24 22:41:41.13987
2	company	ice	format	\N	Le format ICE est invalide (15 chiffres)	t	warning	2026-01-24 22:41:41.13987
3	company	email	format	\N	Format email invalide	t	warning	2026-01-24 22:41:41.13987
5	activity	start_date	required	\N	La date de debut est obligatoire	t	error	2026-01-24 22:41:41.13987
4	activity	title	required	\N	Le titre de l'activite est obligatoire	t	error	2026-01-24 22:41:41.13987
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (id, name, code, location_id, parent_department_id, description, head_name, created_at) FROM stdin;
2	Relations Institutionnelles	RI	1	\N	Managing relations with elected officials and public administrations	\N	2026-01-24 22:41:39.150156
4	Appui et Promotion	AP	1	\N	Training, events, B2B meetings, economic monitoring	\N	2026-01-24 22:41:39.150156
5	Administratif et Financier	AF	1	\N	Accounting, personnel management, IT systems	\N	2026-01-24 22:41:39.150156
6	Services aux ressortissants et Veille Aconomique	SV	1	\N	Member services, databases, communication	\N	2026-01-24 22:41:39.150156
7	Audit et Contrele de Gestion	ACG	1	\N	Management reports, dashboards, internal audits	\N	2026-01-24 22:41:39.150156
3	Strategie et Partenariat	SP	1	\N	Elaborating CCIS strategies and partnership implementation	\N	2026-01-24 22:41:39.150156
1	Direction Regionale	DIR	1	\N	Regional Direction - Coordinates all departments	\N	2026-01-24 22:41:39.150156
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expenses (id, budget_id, activity_id, expense_date, description, amount, supplier, invoice_number, payment_status, payment_date, approved_by, approval_date, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: formations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.formations (id, activity_id, category_id, level, duration_hours, language, trainer_name, trainer_organization, trainer_bio, provides_certificate, certificate_type, prerequisites, target_audience, created_at) FROM stdin;
\.


--
-- Data for Name: import_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.import_logs (id, filename, file_hash, file_size, sheet_name, data_type, uploaded_by, upload_date, status, total_rows, rows_imported, rows_skipped, rows_with_errors, error_log, warnings_log, processing_started_at, processing_completed_at, notes) FROM stdin;
8686cd89-96da-4b49-ba0a-d512c80b7215	formations_janvier_2026.xlsx	z9y8x7w6v5u4t3s2r1q0	262144	Formations	activities	034bb1e5-033b-4150-b71e-4194a8efafb6	2026-01-27 16:35:01.452012	completed	50	48	2	0	\N	\N	\N	2026-01-12 16:35:01.452012	Import formations Q1 2026
6bc7dbb9-b63b-4f58-bae3-dbcd209cbd11	participants_formation_digital.xlsx	p0o9i8u7y6t5r4e3w2q1	131072	Participants	participants	d4e00279-18fd-42e3-80b2-074fafcf3795	2026-01-27 16:35:01.452012	completed	85	85	0	0	\N	\N	\N	2026-01-22 16:35:01.452012	Import participants formation marketing digital
50e05bdf-7a52-46dc-a1de-92266f8ae936	entreprises_rabat_2025.xlsx	a1b2c3d4e5f6g7h8i9j0	524288	Entreprises	companies	034bb1e5-033b-4150-b71e-4194a8efafb6	2026-01-27 16:35:01.452012	completed	150	145	3	2	\N	\N	\N	2025-12-28 16:35:01.452012	Import des entreprises region Rabat
397ab652-9fa3-46df-9c9f-fd38160b03a3	Template_Import_Entreprises.xlsx	\N	7258	Entreprises	company	dfcc5a88-6560-4a87-86d5-8c9f4cf48f7d	2026-01-29 23:31:54.818907	completed	2	2	\N	0	[]	\N	\N	2026-01-29 23:32:23.835417	\N
391e3194-507e-4e39-bd51-59ffc46285f6	Template_Import_Entreprises.xlsx	\N	7258	Entreprises	company	034bb1e5-033b-4150-b71e-4194a8efafb6	2026-01-29 19:51:34.173985	failed	2	\N	\N	\N	[{"error":"la colonne « processed_rows » de la relation « import_logs » n'existe pas"}]	\N	\N	\N	\N
57b9cf05-83be-492a-9d7b-3480ef31dd07	Template_Import_Entreprises.xlsx	\N	7258	Entreprises	company	034bb1e5-033b-4150-b71e-4194a8efafb6	2026-01-29 19:47:15.40443	failed	2	\N	\N	\N	[{"error":"la colonne « processed_rows » de la relation « import_logs » n'existe pas"}]	\N	\N	\N	\N
2c857305-2494-42c1-bf74-9018b38c969b	Template_Import_Entreprises.xlsx	\N	7258	Entreprises	company	034bb1e5-033b-4150-b71e-4194a8efafb6	2026-01-29 19:47:00.65992	completed	2	0	\N	0	[]	\N	\N	2026-01-29 21:56:16.910233	\N
3e7402d3-43d8-407b-a4c9-8b61b76e8fdc	Template_Import_Entreprises.xlsx	\N	7258	Entreprises	company	dfcc5a88-6560-4a87-86d5-8c9f4cf48f7d	2026-01-29 21:58:36.927507	completed	2	0	\N	2	[{"row":1,"error":"Missing required fields (name or ICE)"},{"row":2,"error":"Missing required fields (name or ICE)"}]	\N	\N	2026-01-29 21:59:14.152669	\N
51dec85c-9b67-45cf-84e1-a1f03f0f5461	Template_Import_Entreprises.xlsx	\N	7258	Entreprises	company	dfcc5a88-6560-4a87-86d5-8c9f4cf48f7d	2026-01-29 22:02:21.341193	completed	2	2	\N	0	[]	\N	\N	2026-01-29 22:04:34.536147	\N
8c00a566-f3dc-42ed-9067-87ba26669207	Template_Import_Participants.xlsx	\N	7081	Participants	participant	dfcc5a88-6560-4a87-86d5-8c9f4cf48f7d	2026-01-29 22:18:37.164111	completed	2	2	\N	0	[]	\N	\N	2026-01-29 22:19:45.135732	\N
12ed7fb8-ff40-4eab-9b30-f34908f9775f	Template_Import_Budgets.xlsx	\N	6995	Budgets	budget	dfcc5a88-6560-4a87-86d5-8c9f4cf48f7d	2026-01-29 22:19:56.525961	completed	3	0	\N	3	[{"row":1,"error":"Missing required fields (fiscal_year or allocated_amount)"},{"row":2,"error":"Missing required fields (fiscal_year or allocated_amount)"},{"row":3,"error":"Missing required fields (fiscal_year or allocated_amount)"}]	\N	\N	2026-01-29 22:23:19.960944	\N
8a8ecbe7-11dd-46d2-b42e-73dd0c9ae111	Template_Import_Budgets.xlsx	\N	6995	Budgets	budget	dfcc5a88-6560-4a87-86d5-8c9f4cf48f7d	2026-01-29 22:25:24.652608	completed	3	3	\N	0	[]	\N	\N	2026-01-29 22:25:32.614567	\N
64e752c0-f7cc-47b1-ab8b-987194217665	Template_Import_Activites.xlsx	\N	7102	Activites	activity	dfcc5a88-6560-4a87-86d5-8c9f4cf48f7d	2026-01-29 19:56:01.609168	pending	2	\N	\N	\N	\N	\N	\N	\N	\N
eae38927-65c5-48de-81fa-408dddf5587d	Template_Import_Activites.xlsx	\N	7102	Activites	activity	dfcc5a88-6560-4a87-86d5-8c9f4cf48f7d	2026-01-29 19:59:48.268725	failed	2	\N	\N	\N	[{"error":"la transaction est annulee, les commandes sont ignorees jusqu'a la fin du bloc\\nde la transaction"}]	\N	\N	\N	\N
fc9b9787-ea6a-40ed-92b2-f11553495047	Template_Import_Activites.xlsx	\N	7102	Activites	activity	dfcc5a88-6560-4a87-86d5-8c9f4cf48f7d	2026-01-29 22:12:23.836937	failed	2	\N	\N	\N	[{"error":"la transaction est annulee, les commandes sont ignorees jusqu'a la fin du bloc\\nde la transaction"}]	\N	\N	\N	\N
ddd5f534-32a7-4c95-8a12-7457922e80b5	Template_Import_Activites.xlsx	\N	7102	Activites	activity	dfcc5a88-6560-4a87-86d5-8c9f4cf48f7d	2026-01-29 22:18:09.091936	completed	2	2	\N	0	[]	\N	\N	2026-01-29 22:18:16.315041	\N
\.


--
-- Data for Name: kpi_definitions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.kpi_definitions (id, name, code, description, calculation_formula, unit, category) FROM stdin;
3	Taux de satisfaction moyen	AVG_SATISFACTION	\N	\N	percentage	quality
4	Budget utilisA	BUDGET_USED	\N	\N	currency	financial
1	Nombre total d'entreprises aidees	TOTAL_COMPANIES	\N	\N	number	impact
2	Nombre de formations realisees	TOTAL_FORMATIONS	\N	\N	number	activities
5	Nombre de beneficiaires	TOTAL_BENEFICIARIES	\N	\N	number	impact
\.


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.locations (id, name, type, address, city, postal_code, latitude, longitude, created_at) FROM stdin;
3	Annexe Khemisset	annexe	\N	Khemisset	\N	33.81670000	-6.06670000	2026-01-24 22:41:39.06212
2	Annexe Kenitra	annexe	\N	Kenitra	\N	34.26100000	-6.58020000	2026-01-24 22:41:39.06212
1	Siege Regional Rabat	siege	\N	Rabat	\N	33.97160000	-6.84980000	2026-01-24 22:41:39.06212
\.


--
-- Data for Name: participants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.participants (id, first_name, last_name, email, phone, company_id, job_title, department, activity_id, registration_date, registration_status, attendance_confirmed, attendance_date, certificate_issued, satisfaction_rating, feedback_comments, feedback_date, source_file, source_row, created_at) FROM stdin;
6676ddce-8e33-4a11-bda5-a7af8aa0a751	Mohammed	Tazi	mohammed.tazi@example.com	0661234567	\N	\N	Marketing	\N	2026-01-20 00:00:00	registered	f	\N	f	\N	\N	\N	Excel Import	1	2026-01-29 22:19:45.135732
ae9cd43d-66c0-4c45-a463-18c34993451d	Youssef	Kabbaj	y.kabbaj@techhub.ma	0661234567	03c30d22-72d6-412d-8c93-f54214e27905	Representant	\N	dcf6a7c4-5c76-4179-bbc9-70a5f0aed8ab	2026-01-27 16:35:00.864196	attended	t	\N	f	5	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
09ce7080-bdfe-480a-9e51-b9b00ae62eac	Rachid	Tazi	r.tazi@atlas-manuf.ma	0662345678	c9d9d97e-6b57-4392-9855-c1345dc6f59a	Representant	\N	dcf6a7c4-5c76-4179-bbc9-70a5f0aed8ab	2026-01-27 16:35:00.864196	attended	t	\N	f	4	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
d3fae1ba-4720-45a3-bd38-eb9bd5eac830	Leila	Benjelloun	l.benjelloun@digitalsol.ma	0661234568	c3aace76-be9e-44ae-aec9-50017786ca5b	Representant	\N	dcf6a7c4-5c76-4179-bbc9-70a5f0aed8ab	2026-01-27 16:35:00.864196	attended	t	\N	f	5	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
daa09181-b9b3-4e7d-991b-901e1526ca38	Hassan	Squalli	h.squalli@agroinvest.ma	0665678902	c8c7622b-610e-4b63-a2ac-504dfdc0bc0f	Representant	\N	dcf6a7c4-5c76-4179-bbc9-70a5f0aed8ab	2026-01-27 16:35:00.864196	attended	t	\N	f	3	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
f428cfe3-0fa1-428d-a777-658159facfae	Samira	Lazrak	s.lazrak@cim-maroc.ma	0663456790	163d5100-e16b-4a19-b15b-596ad176081a	Representant	\N	dcf6a7c4-5c76-4179-bbc9-70a5f0aed8ab	2026-01-27 16:35:00.864196	attended	t	\N	f	5	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
c4ae2e0e-40ca-4942-8ce6-90fbc13abdc2	Kamal	Idrissi	k.idrissi@voyagespremium.ma	0665678901	74ee80b7-5eff-4d16-a2e1-6f284168f9b7	Representant	\N	dcf6a7c4-5c76-4179-bbc9-70a5f0aed8ab	2026-01-27 16:35:00.864196	attended	t	\N	f	3	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
275350ac-adca-4a8c-a821-8ac52fac5040	Jamal	Lahlou	j.lahlou@construct-moderne.ma	0666789012	edc30357-cc91-418c-abd9-c89c84cb66ba	Representant	\N	dcf6a7c4-5c76-4179-bbc9-70a5f0aed8ab	2026-01-27 16:35:00.864196	attended	t	\N	f	3	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
8c0deefe-c35c-493d-8a16-7e528b3c3ee5	Nadia	El	n.elamrani@textile-moderne.ma	0662345679	234d55dc-c410-4c48-8290-a4e492fc8458	Representant	\N	dcf6a7c4-5c76-4179-bbc9-70a5f0aed8ab	2026-01-27 16:35:00.864196	attended	t	\N	f	5	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
3645fca2-9d93-40de-bd29-57ea6914cafa	Mohammed	Lamrani	m.lamrani@artisanat-maroc.ma	0667890123	5847047c-29f1-47bb-afbd-bdac8c047f05	Representant	\N	dcf6a7c4-5c76-4179-bbc9-70a5f0aed8ab	2026-01-27 16:35:00.864196	attended	t	\N	f	4	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
2cfe2e17-dc89-4662-8b67-08ac43c761d6	Hicham	Fassi	h.fassi@conseil-strategie.ma	0664567890	585724e4-9017-4594-a17a-6b870d031981	Representant	\N	dcf6a7c4-5c76-4179-bbc9-70a5f0aed8ab	2026-01-27 16:35:00.864196	attended	t	\N	f	5	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
a0814f73-68a3-410e-aa01-85348e65b4c7	Jamal	Lahlou	j.lahlou@construct-moderne.ma	0666789012	edc30357-cc91-418c-abd9-c89c84cb66ba	Representant	\N	718e03c7-09df-491d-9f2c-48fefe58bc66	2026-01-27 16:35:00.864196	attended	t	\N	f	4	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
ba25dfbf-46c8-4c86-a18d-36d6de04d5e4	Amina	Berrada	a.berrada@btp-excellence.ma	0666789013	d6afcb0e-28e4-4977-aebf-9dffe3e20174	Representant	\N	718e03c7-09df-491d-9f2c-48fefe58bc66	2026-01-27 16:35:00.864196	attended	t	\N	f	5	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
1921ad2d-d486-42ba-87e9-3d7e6b47c435	Zineb	Chraibi	z.chraibi@servicespro.ma	0664567891	6d5fec6d-48b8-4e44-8c1e-da19a4eac52e	Representant	\N	718e03c7-09df-491d-9f2c-48fefe58bc66	2026-01-27 16:35:00.864196	attended	t	\N	f	4	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
7272bd80-db8c-4f52-acab-acdf0ad0b4fc	Youssef	Kabbaj	y.kabbaj@techhub.ma	0661234567	03c30d22-72d6-412d-8c93-f54214e27905	Representant	\N	718e03c7-09df-491d-9f2c-48fefe58bc66	2026-01-27 16:35:00.864196	attended	t	\N	f	3	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
6b79c955-cc26-45f3-8285-6e5549e710cd	Kamal	Idrissi	k.idrissi@voyagespremium.ma	0665678901	74ee80b7-5eff-4d16-a2e1-6f284168f9b7	Representant	\N	718e03c7-09df-491d-9f2c-48fefe58bc66	2026-01-27 16:35:00.864196	attended	t	\N	f	4	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
a4ae0ea2-c91a-495c-87f4-520995db02b3	Omar	Bennis	o.bennis@distplus.ma	0663456789	b5232a9b-5200-42ce-88ff-416466171104	Representant	\N	718e03c7-09df-491d-9f2c-48fefe58bc66	2026-01-27 16:35:00.864196	attended	t	\N	f	4	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
5e8c3a76-cfcd-4949-bc28-75f4c8eefbfd	Nadia	El	n.elamrani@textile-moderne.ma	0662345679	234d55dc-c410-4c48-8290-a4e492fc8458	Representant	\N	718e03c7-09df-491d-9f2c-48fefe58bc66	2026-01-27 16:35:00.864196	attended	t	\N	f	5	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
65da65a2-e6f1-411f-b212-2c646bf6393f	Rachid	Tazi	r.tazi@atlas-manuf.ma	0662345678	c9d9d97e-6b57-4392-9855-c1345dc6f59a	Representant	\N	718e03c7-09df-491d-9f2c-48fefe58bc66	2026-01-27 16:35:00.864196	attended	t	\N	f	3	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
6e6ec47f-0a80-4f99-a98c-0816c9bae6da	Mohammed	Lamrani	m.lamrani@artisanat-maroc.ma	0667890123	5847047c-29f1-47bb-afbd-bdac8c047f05	Representant	\N	718e03c7-09df-491d-9f2c-48fefe58bc66	2026-01-27 16:35:00.864196	attended	t	\N	f	5	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
602c61c0-eea5-45dc-ab34-0557587d10f0	Leila	Benjelloun	l.benjelloun@digitalsol.ma	0661234568	c3aace76-be9e-44ae-aec9-50017786ca5b	Representant	\N	718e03c7-09df-491d-9f2c-48fefe58bc66	2026-01-27 16:35:00.864196	attended	t	\N	f	4	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
1aebc2fe-b9c0-4358-ac0b-9da422e5c5e1	Hassan	Squalli	h.squalli@agroinvest.ma	0665678902	c8c7622b-610e-4b63-a2ac-504dfdc0bc0f	Representant	\N	718e03c7-09df-491d-9f2c-48fefe58bc66	2026-01-27 16:35:00.864196	attended	t	\N	f	5	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
b1a1b5a1-b76f-45b7-aa30-091a7dc36387	Mehdi	Alaoui	m.alaoui@innovit.ma	0661234569	c4a853a3-d6f7-4456-885a-4db4822162b6	Representant	\N	718e03c7-09df-491d-9f2c-48fefe58bc66	2026-01-27 16:35:00.864196	attended	t	\N	f	4	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
360c34ba-18bd-4d2a-bfdf-a88bd10f1914	Hicham	Fassi	h.fassi@conseil-strategie.ma	0664567890	585724e4-9017-4594-a17a-6b870d031981	Representant	\N	718e03c7-09df-491d-9f2c-48fefe58bc66	2026-01-27 16:35:00.864196	attended	t	\N	f	4	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
97dfa4bb-7f2e-449e-9009-548fe7b5b69e	Samira	Lazrak	s.lazrak@cim-maroc.ma	0663456790	163d5100-e16b-4a19-b15b-596ad176081a	Representant	\N	718e03c7-09df-491d-9f2c-48fefe58bc66	2026-01-27 16:35:00.864196	attended	t	\N	f	4	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
e06ac1c9-ced6-4630-aee1-2b8644a36cd2	Samira	Lazrak	s.lazrak@cim-maroc.ma	0663456790	163d5100-e16b-4a19-b15b-596ad176081a	Representant	\N	b7ec6950-4ac6-4599-b6ff-fc93e5a3fe5e	2026-01-27 16:35:00.864196	attended	t	\N	f	4	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
6fc81060-e2d9-46ed-a7e6-025359a9d949	Youssef	Kabbaj	y.kabbaj@techhub.ma	0661234567	03c30d22-72d6-412d-8c93-f54214e27905	Representant	\N	b7ec6950-4ac6-4599-b6ff-fc93e5a3fe5e	2026-01-27 16:35:00.864196	attended	t	\N	f	4	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
73b6380e-c378-43ab-8976-01990c70d45a	Jamal	Lahlou	j.lahlou@construct-moderne.ma	0666789012	edc30357-cc91-418c-abd9-c89c84cb66ba	Representant	\N	b7ec6950-4ac6-4599-b6ff-fc93e5a3fe5e	2026-01-27 16:35:00.864196	attended	t	\N	f	5	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
c0099d13-9659-4a50-82b2-24f5b4a1b660	Hassan	Squalli	h.squalli@agroinvest.ma	0665678902	c8c7622b-610e-4b63-a2ac-504dfdc0bc0f	Representant	\N	b7ec6950-4ac6-4599-b6ff-fc93e5a3fe5e	2026-01-27 16:35:00.864196	attended	t	\N	f	4	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
362599e3-1523-4d28-8a8b-085a67aaa629	Nadia	El	n.elamrani@textile-moderne.ma	0662345679	234d55dc-c410-4c48-8290-a4e492fc8458	Representant	\N	b7ec6950-4ac6-4599-b6ff-fc93e5a3fe5e	2026-01-27 16:35:00.864196	attended	t	\N	f	4	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
06382df5-c99c-4eb6-8316-d5a83038028f	Mehdi	Alaoui	m.alaoui@innovit.ma	0661234569	c4a853a3-d6f7-4456-885a-4db4822162b6	Representant	\N	dcf6a7c4-5c76-4179-bbc9-70a5f0aed8ab	2026-01-27 16:35:00.864196	attended	t	\N	f	3	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
5893f504-d592-43d5-9c41-2966af616ea3	Amina	Berrada	a.berrada@btp-excellence.ma	0666789013	d6afcb0e-28e4-4977-aebf-9dffe3e20174	Representant	\N	dcf6a7c4-5c76-4179-bbc9-70a5f0aed8ab	2026-01-27 16:35:00.864196	attended	t	\N	f	5	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
4b81b2e6-d616-42a4-aad3-89ba99300e4c	Asmaa	Chraibi	asmaa.chraibi@example.com	0667890123	\N	\N	IT	\N	2026-01-21 00:00:00	registered	f	\N	f	\N	\N	\N	Excel Import	2	2026-01-29 22:19:45.135732
3bea3a36-ffea-424e-b2c6-f4e8b2cab0f6	Amina	Berrada	a.berrada@btp-excellence.ma	0666789013	d6afcb0e-28e4-4977-aebf-9dffe3e20174	Representant	\N	b7ec6950-4ac6-4599-b6ff-fc93e5a3fe5e	2026-01-27 16:35:00.864196	attended	t	\N	f	4	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
dc1bd02f-0594-40d8-bd93-61389dcdd72e	Omar	Bennis	o.bennis@distplus.ma	0663456789	b5232a9b-5200-42ce-88ff-416466171104	Representant	\N	b7ec6950-4ac6-4599-b6ff-fc93e5a3fe5e	2026-01-27 16:35:00.864196	attended	t	\N	f	3	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
849d198b-0d29-4ba7-b18a-a0deb1660d36	Mohammed	Lamrani	m.lamrani@artisanat-maroc.ma	0667890123	5847047c-29f1-47bb-afbd-bdac8c047f05	Representant	\N	b7ec6950-4ac6-4599-b6ff-fc93e5a3fe5e	2026-01-27 16:35:00.864196	attended	t	\N	f	3	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
c240ad77-2d30-4ea1-965c-31f80a67a82a	Leila	Benjelloun	l.benjelloun@digitalsol.ma	0661234568	c3aace76-be9e-44ae-aec9-50017786ca5b	Representant	\N	b7ec6950-4ac6-4599-b6ff-fc93e5a3fe5e	2026-01-27 16:35:00.864196	attended	t	\N	f	5	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
b0f75506-43ab-4725-a062-bd64da5d2e72	Rachid	Tazi	r.tazi@atlas-manuf.ma	0662345678	c9d9d97e-6b57-4392-9855-c1345dc6f59a	Representant	\N	b7ec6950-4ac6-4599-b6ff-fc93e5a3fe5e	2026-01-27 16:35:00.864196	attended	t	\N	f	3	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
6f093fe2-7a2a-4dcc-b52a-ba95fce6ec05	Mehdi	Alaoui	m.alaoui@innovit.ma	0661234569	c4a853a3-d6f7-4456-885a-4db4822162b6	Representant	\N	b7ec6950-4ac6-4599-b6ff-fc93e5a3fe5e	2026-01-27 16:35:00.864196	attended	t	\N	f	4	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
60da592d-7dfd-4921-befa-9662adfa3ebc	Mehdi	Alaoui	m.alaoui@innovit.ma	0661234569	c4a853a3-d6f7-4456-885a-4db4822162b6	Representant	\N	625ea33e-ecd8-488c-8a6d-efddd667511c	2026-01-27 16:35:00.864196	confirmed	t	\N	f	\N	\N	\N	\N	\N	2026-01-27 16:35:00.864196
199a2eb8-07fe-4610-938c-040ec70f7049	Kamal	Idrissi	k.idrissi@voyagespremium.ma	0665678901	74ee80b7-5eff-4d16-a2e1-6f284168f9b7	Representant	\N	625ea33e-ecd8-488c-8a6d-efddd667511c	2026-01-27 16:35:00.864196	confirmed	t	\N	f	\N	\N	\N	\N	\N	2026-01-27 16:35:00.864196
247501bf-8eee-4d0a-a52c-60dbd997b2e4	Nadia	El	n.elamrani@textile-moderne.ma	0662345679	234d55dc-c410-4c48-8290-a4e492fc8458	Representant	\N	625ea33e-ecd8-488c-8a6d-efddd667511c	2026-01-27 16:35:00.864196	confirmed	t	\N	f	\N	\N	\N	\N	\N	2026-01-27 16:35:00.864196
92020b7f-dadc-469f-9447-4c5e0c01c657	Hassan	Squalli	h.squalli@agroinvest.ma	0665678902	c8c7622b-610e-4b63-a2ac-504dfdc0bc0f	Representant	\N	625ea33e-ecd8-488c-8a6d-efddd667511c	2026-01-27 16:35:00.864196	confirmed	t	\N	f	\N	\N	\N	\N	\N	2026-01-27 16:35:00.864196
57e45556-4429-4cc8-98b0-d98511195c52	Samira	Lazrak	s.lazrak@cim-maroc.ma	0663456790	163d5100-e16b-4a19-b15b-596ad176081a	Representant	\N	625ea33e-ecd8-488c-8a6d-efddd667511c	2026-01-27 16:35:00.864196	confirmed	t	\N	f	\N	\N	\N	\N	\N	2026-01-27 16:35:00.864196
48073b80-8a74-4ff7-8cde-e0610fbc5131	Hicham	Fassi	h.fassi@conseil-strategie.ma	0664567890	585724e4-9017-4594-a17a-6b870d031981	Representant	\N	625ea33e-ecd8-488c-8a6d-efddd667511c	2026-01-27 16:35:00.864196	confirmed	t	\N	f	\N	\N	\N	\N	\N	2026-01-27 16:35:00.864196
a7c708fe-7c68-4194-b9e9-f86b0bef376e	Mohammed	Lamrani	m.lamrani@artisanat-maroc.ma	0667890123	5847047c-29f1-47bb-afbd-bdac8c047f05	Representant	\N	625ea33e-ecd8-488c-8a6d-efddd667511c	2026-01-27 16:35:00.864196	confirmed	t	\N	f	\N	\N	\N	\N	\N	2026-01-27 16:35:00.864196
bd33b22f-aae8-433f-a9cc-3d35482d2ce1	Jamal	Lahlou	j.lahlou@construct-moderne.ma	0666789012	edc30357-cc91-418c-abd9-c89c84cb66ba	Representant	\N	625ea33e-ecd8-488c-8a6d-efddd667511c	2026-01-27 16:35:00.864196	confirmed	t	\N	f	\N	\N	\N	\N	\N	2026-01-27 16:35:00.864196
b0d81cff-e369-4fe5-8a31-9b0b0c29a089	Youssef	Kabbaj	y.kabbaj@techhub.ma	0661234567	03c30d22-72d6-412d-8c93-f54214e27905	Representant	\N	625ea33e-ecd8-488c-8a6d-efddd667511c	2026-01-27 16:35:00.864196	confirmed	t	\N	f	\N	\N	\N	\N	\N	2026-01-27 16:35:00.864196
31446255-b47c-417b-9136-93bb2d4428e3	Omar	Bennis	o.bennis@distplus.ma	0663456789	b5232a9b-5200-42ce-88ff-416466171104	Representant	\N	625ea33e-ecd8-488c-8a6d-efddd667511c	2026-01-27 16:35:00.864196	confirmed	t	\N	f	\N	\N	\N	\N	\N	2026-01-27 16:35:00.864196
baac2af9-191a-4874-b81c-289b4aea6405	Amina	Berrada	a.berrada@btp-excellence.ma	0666789013	d6afcb0e-28e4-4977-aebf-9dffe3e20174	Representant	\N	625ea33e-ecd8-488c-8a6d-efddd667511c	2026-01-27 16:35:00.864196	confirmed	t	\N	f	\N	\N	\N	\N	\N	2026-01-27 16:35:00.864196
a58d8da4-f4cb-4146-b528-e04b230603ee	Zineb	Chraibi	z.chraibi@servicespro.ma	0664567891	6d5fec6d-48b8-4e44-8c1e-da19a4eac52e	Representant	\N	625ea33e-ecd8-488c-8a6d-efddd667511c	2026-01-27 16:35:00.864196	confirmed	t	\N	f	\N	\N	\N	\N	\N	2026-01-27 16:35:00.864196
34c51dec-6426-4a1b-9072-65e67f42c510	Rachid	Tazi	r.tazi@atlas-manuf.ma	0662345678	c9d9d97e-6b57-4392-9855-c1345dc6f59a	Representant	\N	625ea33e-ecd8-488c-8a6d-efddd667511c	2026-01-27 16:35:00.864196	confirmed	t	\N	f	\N	\N	\N	\N	\N	2026-01-27 16:35:00.864196
b8545481-f019-4bad-9b9b-7073e6302ed7	Leila	Benjelloun	l.benjelloun@digitalsol.ma	0661234568	c3aace76-be9e-44ae-aec9-50017786ca5b	Representant	\N	625ea33e-ecd8-488c-8a6d-efddd667511c	2026-01-27 16:35:00.864196	confirmed	t	\N	f	\N	\N	\N	\N	\N	2026-01-27 16:35:00.864196
9885064e-cb39-4543-860e-d4b9295d1367	Zineb	Chraibi	z.chraibi@servicespro.ma	0664567891	6d5fec6d-48b8-4e44-8c1e-da19a4eac52e	Representant	\N	5119f56f-6761-4a3f-a53a-5beada684953	2026-01-27 16:35:00.864196	confirmed	t	\N	f	\N	\N	\N	\N	\N	2026-01-27 16:35:00.864196
840a3564-5e76-48ef-9995-41c036366698	Rachid	Tazi	r.tazi@atlas-manuf.ma	0662345678	c9d9d97e-6b57-4392-9855-c1345dc6f59a	Representant	\N	5119f56f-6761-4a3f-a53a-5beada684953	2026-01-27 16:35:00.864196	confirmed	t	\N	f	\N	\N	\N	\N	\N	2026-01-27 16:35:00.864196
48925681-9919-4732-a7d4-d6bfcd35f56c	Samira	Lazrak	s.lazrak@cim-maroc.ma	0663456790	163d5100-e16b-4a19-b15b-596ad176081a	Representant	\N	5119f56f-6761-4a3f-a53a-5beada684953	2026-01-27 16:35:00.864196	confirmed	t	\N	f	\N	\N	\N	\N	\N	2026-01-27 16:35:00.864196
1d30f059-8458-445e-bf89-dc518cec3424	Mohammed	Lamrani	m.lamrani@artisanat-maroc.ma	0667890123	5847047c-29f1-47bb-afbd-bdac8c047f05	Representant	\N	5119f56f-6761-4a3f-a53a-5beada684953	2026-01-27 16:35:00.864196	confirmed	t	\N	f	\N	\N	\N	\N	\N	2026-01-27 16:35:00.864196
5eb5261c-9cfe-4618-9cc6-7df5185c7e0a	Kamal	Idrissi	k.idrissi@voyagespremium.ma	0665678901	74ee80b7-5eff-4d16-a2e1-6f284168f9b7	Representant	\N	5119f56f-6761-4a3f-a53a-5beada684953	2026-01-27 16:35:00.864196	confirmed	t	\N	f	\N	\N	\N	\N	\N	2026-01-27 16:35:00.864196
1b47a039-2c7f-46ec-997c-6f30f7cc153c	Nadia	El	n.elamrani@textile-moderne.ma	0662345679	234d55dc-c410-4c48-8290-a4e492fc8458	Representant	\N	5119f56f-6761-4a3f-a53a-5beada684953	2026-01-27 16:35:00.864196	confirmed	t	\N	f	\N	\N	\N	\N	\N	2026-01-27 16:35:00.864196
a61bf947-d428-4705-a711-d1d73d3ccf93	Youssef	Kabbaj	y.kabbaj@techhub.ma	0661234567	03c30d22-72d6-412d-8c93-f54214e27905	Representant	\N	5119f56f-6761-4a3f-a53a-5beada684953	2026-01-27 16:35:00.864196	confirmed	t	\N	f	\N	\N	\N	\N	\N	2026-01-27 16:35:00.864196
c387e7e3-cf8f-4509-80f1-d42abb77403b	Amina	Berrada	a.berrada@btp-excellence.ma	0666789013	d6afcb0e-28e4-4977-aebf-9dffe3e20174	Representant	\N	5119f56f-6761-4a3f-a53a-5beada684953	2026-01-27 16:35:00.864196	confirmed	t	\N	f	\N	\N	\N	\N	\N	2026-01-27 16:35:00.864196
e37f814d-a2fe-47f7-8021-7776b521cb7e	Omar	Bennis	o.bennis@distplus.ma	0663456789	b5232a9b-5200-42ce-88ff-416466171104	Representant	\N	5119f56f-6761-4a3f-a53a-5beada684953	2026-01-27 16:35:00.864196	confirmed	t	\N	f	\N	\N	\N	\N	\N	2026-01-27 16:35:00.864196
e05a0f3f-dae1-4af2-8479-3b34afb5ae94	Hassan	Squalli	h.squalli@agroinvest.ma	0665678902	c8c7622b-610e-4b63-a2ac-504dfdc0bc0f	Representant	\N	5119f56f-6761-4a3f-a53a-5beada684953	2026-01-27 16:35:00.864196	confirmed	t	\N	f	\N	\N	\N	\N	\N	2026-01-27 16:35:00.864196
4565a3c5-72b0-4aad-b922-ed9631551483	Leila	Benjelloun	l.benjelloun@digitalsol.ma	0661234568	c3aace76-be9e-44ae-aec9-50017786ca5b	Representant	\N	5119f56f-6761-4a3f-a53a-5beada684953	2026-01-27 16:35:00.864196	confirmed	t	\N	f	\N	\N	\N	\N	\N	2026-01-27 16:35:00.864196
7098ca43-013a-4a3a-84f1-c9f88711a2e4	Jamal	Lahlou	j.lahlou@construct-moderne.ma	0666789012	edc30357-cc91-418c-abd9-c89c84cb66ba	Representant	\N	5119f56f-6761-4a3f-a53a-5beada684953	2026-01-27 16:35:00.864196	confirmed	t	\N	f	\N	\N	\N	\N	\N	2026-01-27 16:35:00.864196
6cecefc4-f12f-4dda-b6d2-66e6970033f7	Hicham	Fassi	h.fassi@conseil-strategie.ma	0664567890	585724e4-9017-4594-a17a-6b870d031981	Representant	\N	5119f56f-6761-4a3f-a53a-5beada684953	2026-01-27 16:35:00.864196	confirmed	t	\N	f	\N	\N	\N	\N	\N	2026-01-27 16:35:00.864196
e973cac1-92fb-4c51-80b3-e78cde20cebb	Mehdi	Alaoui	m.alaoui@innovit.ma	0661234569	c4a853a3-d6f7-4456-885a-4db4822162b6	Representant	\N	5119f56f-6761-4a3f-a53a-5beada684953	2026-01-27 16:35:00.864196	confirmed	t	\N	f	\N	\N	\N	\N	\N	2026-01-27 16:35:00.864196
e2171471-64ac-45fe-8d8a-829e18a09940	Omar	Bennis	o.bennis@distplus.ma	0663456789	b5232a9b-5200-42ce-88ff-416466171104	Representant	\N	dcf6a7c4-5c76-4179-bbc9-70a5f0aed8ab	2026-01-27 16:35:00.864196	attended	t	\N	f	4	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
783bc1f0-462b-451d-becd-2ef95eb3b779	Kamal	Idrissi	k.idrissi@voyagespremium.ma	0665678901	74ee80b7-5eff-4d16-a2e1-6f284168f9b7	Representant	\N	b7ec6950-4ac6-4599-b6ff-fc93e5a3fe5e	2026-01-27 16:35:00.864196	attended	t	\N	f	5	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
61518e37-6b92-48e0-a859-a0e5645164ee	Zineb	Chraibi	z.chraibi@servicespro.ma	0664567891	6d5fec6d-48b8-4e44-8c1e-da19a4eac52e	Representant	\N	dcf6a7c4-5c76-4179-bbc9-70a5f0aed8ab	2026-01-27 16:35:00.864196	attended	t	\N	f	5	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
0c533f0d-6d04-4d8d-98cb-5bc6607dbba4	Zineb	Chraibi	z.chraibi@servicespro.ma	0664567891	6d5fec6d-48b8-4e44-8c1e-da19a4eac52e	Representant	\N	b7ec6950-4ac6-4599-b6ff-fc93e5a3fe5e	2026-01-27 16:35:00.864196	attended	t	\N	f	5	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
2480c13a-f0f5-4377-a401-bddd15a7eb8a	Hicham	Fassi	h.fassi@conseil-strategie.ma	0664567890	585724e4-9017-4594-a17a-6b870d031981	Representant	\N	b7ec6950-4ac6-4599-b6ff-fc93e5a3fe5e	2026-01-27 16:35:00.864196	attended	t	\N	f	5	Formation tres enrichissante et bien organisee	\N	\N	\N	2026-01-27 16:35:00.864196
\.


--
-- Data for Name: partner_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.partner_types (id, name, description) FROM stdin;
1	Institution publique	\N
2	Organisation professionnelle	\N
5	ONG	\N
7	Organisme international	\N
3	A‰tablissement de formation	\N
6	UniversitA	\N
4	Entreprise privee	\N
\.


--
-- Data for Name: partners; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.partners (id, name, partner_type_id, contact_person, email, phone, address, website, partnership_start_date, partnership_status, description, notes, created_at) FROM stdin;
b5981010-938b-4ee5-b4d0-f176c1331e6f	Maroc PME	1	Responsable Programmes Nadia Chraibi	n.chraibi@marocpme.ma	0537567890	Hay Riad, Rabat	\N	2022-09-05	active	Accompagnement et financement PME	\N	2026-01-27 16:35:01.197286
8df95f98-15a2-44bf-b9c1-0645e56fdb21	etijariwafa Bank	4	Directeur Entreprises Karim Fassi	k.fassi@attijariwafa.ma	0537707000	Siege Social, Casablanca	\N	2023-03-10	active	Partenariat financement PME	\N	2026-01-27 16:35:01.197286
0c4311c1-8880-4bf0-b1b5-aff92f7c0d00	CGEM Rabat	2	President Omar Bennani	contact@cgem-rabat.ma	0537345678	Boulevard Annakhil, Hay Riad	\N	2021-11-12	active	Collaboration institutionnelle	\N	2026-01-27 16:35:01.197286
fbd17c9f-2088-4daa-b119-2088f82db895	Universite Mohammed V	6	Pr. Hassan Benjelloun	contact@um5.ac.ma	0537271874	Avenue des Nations Unies, Agdal, Rabat	\N	2022-01-15	active	Partenariat pour formations et recherche	\N	2026-01-27 16:35:01.197286
cf48729e-4c46-481e-9211-377463d85ebf	OFPPT Rabat-Sale-Kenitra	3	Directeur Regional Ahmed Alami	direction@ofppt-rsk.ma	0537689012	Boulevard Mohamed Lyazidi, Rabat	\N	2021-06-20	active	Collaboration pour formations professionnelles	\N	2026-01-27 16:35:01.197286
aa45da69-963e-4a2d-be3d-1e535025ae9d	Ministere de l'Industrie	1	Directeur Developpement Industriel	contact@mcinet.gov.ma	0537761460	Quartier Administratif, Rabat	\N	2020-04-20	active	Partenariat institutionnel industrie	\N	2026-01-27 16:35:01.197286
0f615077-c1c6-4626-a5d5-6b625f83824c	AMITH	2	Deleguee Regionale Zineb Berrada	z.berrada@amith.ma	0537456789	Rue des Industries, Casablanca	\N	2023-07-15	active	Association marocaine industries textiles	\N	2026-01-27 16:35:01.197286
\.


--
-- Data for Name: raw_excel_data; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.raw_excel_data (id, import_log_id, row_number, raw_data, status, error_message, mapped_entity_type, mapped_entity_id, created_at) FROM stdin;
a126ea96-c67b-4132-b1e1-1b291114a11c	391e3194-507e-4e39-bd51-59ffc46285f6	1	{"RC": "RC123456", "ICE *": "001234567890001", "Ville": "Casablanca", "E-mail": "contact@technosolutions.ma", "Mobile": "0661234567", "Adresse": "123 Boulevard Mohammed V", "Province": "Casablanca-Settat", "Site web": "www.technosolutions.ma", "Code postal": "20000", "Téléphone": "0522123456", "Forme juridique": "SARL", "Raison sociale *": "TechnoSolutions SARL", "Numéro de brevet": "B123456", "Identifiant Fiscal": "TF123456", "Nom du représentant": "Ahmed Bennani", "Raison sociale légale": "TechnoSolutions Société à Responsabilité Limitée"}	\N	\N	\N	\N	2026-01-29 19:51:34.197502
7be1ec9a-fca8-4402-9cb2-d4e679bdecd3	391e3194-507e-4e39-bd51-59ffc46285f6	2	{"RC": "RC789012", "ICE *": "001234567890002", "Ville": "Rabat", "E-mail": "info@digitalmaroc.ma", "Mobile": null, "Adresse": "456 Avenue Hassan II", "Province": "Rabat-Salé-Kénitra", "Site web": null, "Code postal": "10000", "Téléphone": "0537654321", "Forme juridique": "SA", "Raison sociale *": "Digital Maroc SA", "Numéro de brevet": null, "Identifiant Fiscal": null, "Nom du représentant": "Fatima Alaoui", "Raison sociale légale": "Digital Maroc Société Anonyme"}	\N	\N	\N	\N	2026-01-29 19:51:34.197502
5bf27e7d-719e-41cc-a3a5-149df94d6ec7	64e752c0-f7cc-47b1-ab8b-987194217665	1	{"Lieu": "Casablanca", "Statut": "planned", "Titre *": "Formation en Digital Marketing", "Date fin *": "2026-02-17", "Description": "Formation intensive sur les stratégies de marketing digital pour les entreprises", "Capacité max": 30, "Date début *": "2026-02-15", "Budget alloué": 50000, "Gratuit (Oui/Non)": "Non", "Type d'activité *": "Formation", "Frais participation": 2000, "Date limite inscription": "2026-02-10"}	\N	\N	\N	\N	2026-01-29 19:56:01.618735
86412df2-75cd-4235-a5ea-a7c9796070da	64e752c0-f7cc-47b1-ab8b-987194217665	2	{"Lieu": "Rabat", "Statut": "planned", "Titre *": "Conférence Innovation 2026", "Date fin *": "2026-03-20", "Description": "Conférence annuelle sur l'innovation et la transformation digitale", "Capacité max": 100, "Date début *": "2026-03-20", "Budget alloué": 150000, "Gratuit (Oui/Non)": "Oui", "Type d'activité *": "Conférence", "Frais participation": 0, "Date limite inscription": "2026-03-15"}	\N	\N	\N	\N	2026-01-29 19:56:01.618735
f5db69fc-c11b-45a1-9efe-cb7199dcdd36	eae38927-65c5-48de-81fa-408dddf5587d	1	{"Lieu": "Casablanca", "Statut": "planned", "Titre *": "Formation en Digital Marketing", "Date fin *": "2026-02-17", "Description": "Formation intensive sur les stratégies de marketing digital pour les entreprises", "Capacité max": 30, "Date début *": "2026-02-15", "Budget alloué": 50000, "Gratuit (Oui/Non)": "Non", "Type d'activité *": "Formation", "Frais participation": 2000, "Date limite inscription": "2026-02-10"}	\N	\N	\N	\N	2026-01-29 19:59:48.281896
0a4e3e11-a96d-4996-b944-b17245ebe1f3	eae38927-65c5-48de-81fa-408dddf5587d	2	{"Lieu": "Rabat", "Statut": "planned", "Titre *": "Conférence Innovation 2026", "Date fin *": "2026-03-20", "Description": "Conférence annuelle sur l'innovation et la transformation digitale", "Capacité max": 100, "Date début *": "2026-03-20", "Budget alloué": 150000, "Gratuit (Oui/Non)": "Oui", "Type d'activité *": "Conférence", "Frais participation": 0, "Date limite inscription": "2026-03-15"}	\N	\N	\N	\N	2026-01-29 19:59:48.281896
8331b507-319d-4497-8cc0-2cc6de220aeb	3e7402d3-43d8-407b-a4c9-8b61b76e8fdc	1	{"RC": "RC123456", "ICE *": "001234567890001", "Ville": "Casablanca", "E-mail": "contact@technosolutions.ma", "Mobile": "0661234567", "Adresse": "123 Boulevard Mohammed V", "Province": "Casablanca-Settat", "Site web": "www.technosolutions.ma", "Code postal": "20000", "Téléphone": "0522123456", "Forme juridique": "SARL", "Raison sociale *": "TechnoSolutions SARL", "Numéro de brevet": "B123456", "Identifiant Fiscal": "TF123456", "Nom du représentant": "Ahmed Bennani", "Raison sociale légale": "TechnoSolutions Société à Responsabilité Limitée"}	\N	\N	\N	\N	2026-01-29 21:58:36.946974
25a348b0-37c8-49a9-895b-70c8aed1c3c9	3e7402d3-43d8-407b-a4c9-8b61b76e8fdc	2	{"RC": "RC789012", "ICE *": "001234567890002", "Ville": "Rabat", "E-mail": "info@digitalmaroc.ma", "Mobile": null, "Adresse": "456 Avenue Hassan II", "Province": "Rabat-Salé-Kénitra", "Site web": null, "Code postal": "10000", "Téléphone": "0537654321", "Forme juridique": "SA", "Raison sociale *": "Digital Maroc SA", "Numéro de brevet": null, "Identifiant Fiscal": null, "Nom du représentant": "Fatima Alaoui", "Raison sociale légale": "Digital Maroc Société Anonyme"}	\N	\N	\N	\N	2026-01-29 21:58:36.946974
92624f18-2b79-44c2-ba40-c6e67313215a	51dec85c-9b67-45cf-84e1-a1f03f0f5461	1	{"RC": "RC123456", "ICE *": "001234567890001", "Ville": "Casablanca", "E-mail": "contact@technosolutions.ma", "Mobile": "0661234567", "Adresse": "123 Boulevard Mohammed V", "Province": "Casablanca-Settat", "Site web": "www.technosolutions.ma", "Code postal": "20000", "Téléphone": "0522123456", "Forme juridique": "SARL", "Raison sociale *": "TechnoSolutions SARL", "Numéro de brevet": "B123456", "Identifiant Fiscal": "TF123456", "Nom du représentant": "Ahmed Bennani", "Raison sociale légale": "TechnoSolutions Société à Responsabilité Limitée"}	\N	\N	\N	\N	2026-01-29 22:02:21.364118
31053ef2-bb40-4d45-a873-069d36c60fc5	51dec85c-9b67-45cf-84e1-a1f03f0f5461	2	{"RC": "RC789012", "ICE *": "001234567890002", "Ville": "Rabat", "E-mail": "info@digitalmaroc.ma", "Mobile": null, "Adresse": "456 Avenue Hassan II", "Province": "Rabat-Salé-Kénitra", "Site web": null, "Code postal": "10000", "Téléphone": "0537654321", "Forme juridique": "SA", "Raison sociale *": "Digital Maroc SA", "Numéro de brevet": null, "Identifiant Fiscal": null, "Nom du représentant": "Fatima Alaoui", "Raison sociale légale": "Digital Maroc Société Anonyme"}	\N	\N	\N	\N	2026-01-29 22:02:21.364118
e1ccbd4b-3277-4795-b31b-f6ab85ecd94c	fc9b9787-ea6a-40ed-92b2-f11553495047	1	{"Lieu": "Casablanca", "Statut": "planned", "Titre *": "Formation en Digital Marketing", "Date fin *": "2026-02-17", "Description": "Formation intensive sur les stratégies de marketing digital pour les entreprises", "Capacité max": 30, "Date début *": "2026-02-15", "Budget alloué": 50000, "Gratuit (Oui/Non)": "Non", "Type d'activité *": "Formation", "Frais participation": 2000, "Date limite inscription": "2026-02-10"}	\N	\N	\N	\N	2026-01-29 22:12:23.854254
96986301-91dd-41dd-b480-a57594927093	fc9b9787-ea6a-40ed-92b2-f11553495047	2	{"Lieu": "Rabat", "Statut": "planned", "Titre *": "Conférence Innovation 2026", "Date fin *": "2026-03-20", "Description": "Conférence annuelle sur l'innovation et la transformation digitale", "Capacité max": 100, "Date début *": "2026-03-20", "Budget alloué": 150000, "Gratuit (Oui/Non)": "Oui", "Type d'activité *": "Conférence", "Frais participation": 0, "Date limite inscription": "2026-03-15"}	\N	\N	\N	\N	2026-01-29 22:12:23.854254
e0f50198-40e4-4f9a-9444-a54d055552bb	ddd5f534-32a7-4c95-8a12-7457922e80b5	1	{"Lieu": "Casablanca", "Statut": "planned", "Titre *": "Formation en Digital Marketing", "Date fin *": "2026-02-17", "Description": "Formation intensive sur les stratégies de marketing digital pour les entreprises", "Capacité max": 30, "Date début *": "2026-02-15", "Budget alloué": 50000, "Gratuit (Oui/Non)": "Non", "Type d'activité *": "Formation", "Frais participation": 2000, "Date limite inscription": "2026-02-10"}	\N	\N	\N	\N	2026-01-29 22:18:09.111747
815b1224-eaa9-42d1-89c1-bdcf8796572f	ddd5f534-32a7-4c95-8a12-7457922e80b5	2	{"Lieu": "Rabat", "Statut": "planned", "Titre *": "Conférence Innovation 2026", "Date fin *": "2026-03-20", "Description": "Conférence annuelle sur l'innovation et la transformation digitale", "Capacité max": 100, "Date début *": "2026-03-20", "Budget alloué": 150000, "Gratuit (Oui/Non)": "Oui", "Type d'activité *": "Conférence", "Frais participation": 0, "Date limite inscription": "2026-03-15"}	\N	\N	\N	\N	2026-01-29 22:18:09.111747
a9097851-7362-4af3-8442-ceb21b637ce4	8c00a566-f3dc-42ed-9067-87ba26669207	1	{"Nom *": "Tazi", "E-mail *": "mohammed.tazi@example.com", "Fonction": "Directeur Marketing", "Prénom *": "Mohammed", "Téléphone": "0661234567", "Département": "Marketing", "ID Activité": 1, "Nom Activité": "Formation en Digital Marketing", "ICE Entreprise": "001234567890001", "Nom Entreprise": "TechnoSolutions SARL", "Date inscription": "2026-01-20", "Statut inscription": "confirmed"}	\N	\N	\N	\N	2026-01-29 22:18:37.168258
9fdaacb4-9685-469d-84fc-335f0d004989	8c00a566-f3dc-42ed-9067-87ba26669207	2	{"Nom *": "Chraibi", "E-mail *": "asmaa.chraibi@example.com", "Fonction": "Chef de Projet Digital", "Prénom *": "Asmaa", "Téléphone": "0667890123", "Département": "IT", "ID Activité": 1, "Nom Activité": "Formation en Digital Marketing", "ICE Entreprise": "001234567890002", "Nom Entreprise": "Digital Maroc SA", "Date inscription": "2026-01-21", "Statut inscription": "confirmed"}	\N	\N	\N	\N	2026-01-29 22:18:37.168258
23814355-fc7c-49f9-a2bb-e6d59127bac6	12ed7fb8-ff40-4eab-9b30-f34908f9775f	1	{"Notes": "Incluant formations techniques et managériales", "Description": "Budget annuel pour les formations professionnelles", "Catégorie *": "Formation", "Département": "Ressources Humaines", "Année fiscale *": 2026, "Montant alloué *": 500000}	\N	\N	\N	\N	2026-01-29 22:19:56.560131
bf8be5cc-860b-4e38-8819-87a5f0175616	12ed7fb8-ff40-4eab-9b30-f34908f9775f	2	{"Notes": "Événements networking et conférences sectorielles", "Description": "Budget pour l'organisation de conférences et événements", "Catégorie *": "Conférences", "Département": "Communication", "Année fiscale *": 2026, "Montant alloué *": 300000}	\N	\N	\N	\N	2026-01-29 22:19:56.560131
c988f952-031e-4dc0-aa8a-dbcfd63da95e	12ed7fb8-ff40-4eab-9b30-f34908f9775f	3	{"Notes": "Publicité en ligne, SEO, réseaux sociaux", "Description": "Budget campagnes digitales et communication en ligne", "Catégorie *": "Marketing Digital", "Département": "Marketing", "Année fiscale *": 2026, "Montant alloué *": 200000}	\N	\N	\N	\N	2026-01-29 22:19:56.560131
eba4ccce-7fbd-4961-96f4-77a4c9c2bcad	8a8ecbe7-11dd-46d2-b42e-73dd0c9ae111	1	{"Notes": "Incluant formations techniques et managériales", "Description": "Budget annuel pour les formations professionnelles", "Catégorie *": "Formation", "Département": "Ressources Humaines", "Année fiscale *": 2026, "Montant alloué *": 500000}	\N	\N	\N	\N	2026-01-29 22:25:24.673762
81924384-b501-4149-b9df-c13d735a1ed4	8a8ecbe7-11dd-46d2-b42e-73dd0c9ae111	2	{"Notes": "Événements networking et conférences sectorielles", "Description": "Budget pour l'organisation de conférences et événements", "Catégorie *": "Conférences", "Département": "Communication", "Année fiscale *": 2026, "Montant alloué *": 300000}	\N	\N	\N	\N	2026-01-29 22:25:24.673762
af781fa1-169f-45af-9d60-96b460e2a4ca	8a8ecbe7-11dd-46d2-b42e-73dd0c9ae111	3	{"Notes": "Publicité en ligne, SEO, réseaux sociaux", "Description": "Budget campagnes digitales et communication en ligne", "Catégorie *": "Marketing Digital", "Département": "Marketing", "Année fiscale *": 2026, "Montant alloué *": 200000}	\N	\N	\N	\N	2026-01-29 22:25:24.673762
8779886f-2244-4faf-aac0-566c253db308	397ab652-9fa3-46df-9c9f-fd38160b03a3	1	{"RC": "RC123456", "ICE *": "001234567890001", "Ville": "Casablanca", "E-mail": "contact@technosolutions.ma", "Mobile": "0661234567", "Adresse": "123 Boulevard Mohammed V", "Province": "Casablanca-Settat", "Site web": "www.technosolutions.ma", "Code postal": "20000", "Téléphone": "0522123456", "Forme juridique": "SARL", "Raison sociale *": "TechnoSolutions SARL", "Numéro de brevet": "B123456", "Identifiant Fiscal": "TF123456", "Nom du représentant": "Ahmed Bennani", "Raison sociale légale": "TechnoSolutions Société à Responsabilité Limitée"}	\N	\N	\N	\N	2026-01-29 23:31:54.829443
d410191b-7c05-4427-a478-ec50c3cc0a9c	397ab652-9fa3-46df-9c9f-fd38160b03a3	2	{"RC": "RC789012", "ICE *": "001234567890002", "Ville": "Rabat", "E-mail": "info@digitalmaroc.ma", "Mobile": null, "Adresse": "456 Avenue Hassan II", "Province": "Rabat-Salé-Kénitra", "Site web": null, "Code postal": "10000", "Téléphone": "0537654321", "Forme juridique": "SA", "Raison sociale *": "Digital Maroc SA", "Numéro de brevet": null, "Identifiant Fiscal": null, "Nom du représentant": "Fatima Alaoui", "Raison sociale légale": "Digital Maroc Société Anonyme"}	\N	\N	\N	\N	2026-01-29 23:31:54.829443
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name, description, created_at) FROM stdin;
1	admin	Direction - Full access	2026-01-24 22:41:38.885456
2	service_user	Department users - Can upload and manage data	2026-01-24 22:41:38.885456
3	viewer	Read-only access	2026-01-24 22:41:38.885456
\.


--
-- Data for Name: service_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.service_types (id, name, code, category, description) FROM stdin;
1	Assistance fiscale	ASS-FISC	assistance	\N
2	Assistance juridique	ASS-JUR	assistance	\N
3	Assistance technique	ASS-TECH	assistance	\N
7	Arbitrage	ARB	mediation	\N
4	A‰tude de marchA	ETUDE-MARCH	eude	\N
5	Prospection internationale	PROSP-INT	developpement	\N
6	Mediation commerciale	MED-COM	mediation	\N
8	Comptabilite agrAee (CGC)	CGC	comptabilitA	\N
\.


--
-- Data for Name: services_provided; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.services_provided (id, service_type_id, company_id, department_id, request_date, request_description, assigned_to, status, priority, start_date, completion_date, cost, paid, payment_date, outcome, satisfaction_rating, requires_followup, followup_date, created_at, updated_at) FROM stdin;
fe571e5b-052c-4915-8f56-be8986ef85a2	1	03c30d22-72d6-412d-8c93-f54214e27905	4	2025-04-01	Demande de service conseil	034bb1e5-033b-4150-b71e-4194a8efafb6	in_progress	\N	2026-01-12	2025-12-14	639.47	f	\N	\N	5	f	\N	2026-01-27 16:35:01.353299	2026-01-27 16:35:01.353299
be9c2b34-ad86-4928-8b62-f36cb7b16d70	3	c8c7622b-610e-4b63-a2ac-504dfdc0bc0f	4	2025-02-14	Demande de service assistance	034bb1e5-033b-4150-b71e-4194a8efafb6	pending	\N	2026-01-14	\N	1819.92	t	\N	\N	\N	f	\N	2026-01-27 16:35:01.353299	2026-01-27 16:35:01.353299
56ba7305-270c-4d27-bed8-7651ff6d0591	3	585724e4-9017-4594-a17a-6b870d031981	4	2025-01-28	Demande de service conseil	034bb1e5-033b-4150-b71e-4194a8efafb6	pending	\N	2025-07-31	2025-12-21	981.96	t	\N	Service rendu avec succes	3	f	\N	2026-01-27 16:35:01.353299	2026-01-29 23:03:26.371835
ea2f9708-b702-41ff-9307-39e563944ae5	5	74ee80b7-5eff-4d16-a2e1-6f284168f9b7	4	2025-05-18	Demande de service assistance	034bb1e5-033b-4150-b71e-4194a8efafb6	completed	\N	2025-10-11	\N	1299.92	t	\N	Service rendu avec succes	5	f	\N	2026-01-27 16:35:01.353299	2026-01-29 23:03:26.375512
46710d7f-93e8-4328-8365-cabaa9e06065	1	c3aace76-be9e-44ae-aec9-50017786ca5b	4	2025-08-29	Demande de service eude	034bb1e5-033b-4150-b71e-4194a8efafb6	completed	\N	2025-04-11	2025-12-15	1159.68	f	\N	Service rendu avec succes	\N	f	\N	2026-01-27 16:35:01.353299	2026-01-29 23:03:26.378926
01d63f1d-552d-44cd-8d31-25791c5dd1a7	1	c9d9d97e-6b57-4392-9855-c1345dc6f59a	4	2025-09-27	Demande de service eude	034bb1e5-033b-4150-b71e-4194a8efafb6	in_progress	\N	2025-05-01	2025-11-13	2249.89	t	\N	Service rendu avec succes	5	f	\N	2026-01-27 16:35:01.353299	2026-01-29 23:03:26.38232
4e663cc4-811c-4d06-bb63-9034279b9476	1	5847047c-29f1-47bb-afbd-bdac8c047f05	4	2025-07-05	Demande de service eude	034bb1e5-033b-4150-b71e-4194a8efafb6	pending	\N	2025-12-10	2025-12-06	1188.61	t	\N	\N	3	f	\N	2026-01-27 16:35:01.353299	2026-01-29 23:03:26.3858
\.


--
-- Data for Name: training_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.training_categories (id, name, description) FROM stdin;
1	Management	\N
2	Digital & Technologies	\N
4	Marketing & Commerce	\N
5	Ressources Humaines	\N
7	Juridique & Fiscal	\N
8	Langues	\N
9	Export & International	\N
3	Finance & ComptabilitA	\N
6	Qualite & Normes	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password_hash, role_id, full_name, department_id, is_active, last_login, created_at, updated_at) FROM stdin;
d4e00279-18fd-42e3-80b2-074fafcf3795	fatima.service	fatima@ccis.ma	$2a$12$aUQDOU9pDXf1R2KIVLJTEuqTDz3xEo6SmKKisZBe4/tiut99aly.y	2	Fatima Bennani	6	t	\N	2026-01-27 16:35:00.510645	2026-01-27 16:35:00.510645
dc61ca92-42c5-4ce6-866d-6d540eaaf5df	sarah.admin	marocfiree@gmail.com	$2a$12$aUQDOU9pDXf1R2KIVLJTEuqTDz3xEo6SmKKisZBe4/tiut99aly.y	1	Sarah Alami	2	t	2026-01-29 19:36:51.812814	2026-01-27 16:35:00.510645	2026-01-29 19:36:51.812814
653e3a86-d372-481b-ae21-136a77838f68	viewer.user	viewer@ccis.ma	$2a$12$aUQDOU9pDXf1R2KIVLJTEuqTDz3xEo6SmKKisZBe4/tiut99aly.y	3	Ahmed Tazi	\N	t	2026-01-29 22:41:01.500981	2026-01-27 16:35:00.510645	2026-01-29 22:41:01.500981
034bb1e5-033b-4150-b71e-4194a8efafb6	karim.service	karim@ccis.ma	$2a$12$aUQDOU9pDXf1R2KIVLJTEuqTDz3xEo6SmKKisZBe4/tiut99aly.y	2	Karim El Fassi	4	t	2026-01-29 22:50:50.061923	2026-01-27 16:35:00.510645	2026-01-29 22:50:50.061923
dfcc5a88-6560-4a87-86d5-8c9f4cf48f7d	rajae.admin	rajae@ccis.ma	$2a$12$aUQDOU9pDXf1R2KIVLJTEuqTDz3xEo6SmKKisZBe4/tiut99aly.y	1	rajae	1	t	2026-02-01 19:13:36.443171	2026-01-27 16:35:00.510645	2026-02-01 19:13:36.443171
\.


--
-- Name: activity_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activity_types_id_seq', 6, true);


--
-- Name: alert_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.alert_types_id_seq', 5, true);


--
-- Name: budget_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.budget_categories_id_seq', 7, true);


--
-- Name: company_sectors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.company_sectors_id_seq', 8, true);


--
-- Name: data_quality_rules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.data_quality_rules_id_seq', 5, true);


--
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_id_seq', 7, true);


--
-- Name: kpi_definitions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.kpi_definitions_id_seq', 5, true);


--
-- Name: locations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.locations_id_seq', 3, true);


--
-- Name: partner_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.partner_types_id_seq', 7, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_seq', 3, true);


--
-- Name: service_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.service_types_id_seq', 8, true);


--
-- Name: training_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.training_categories_id_seq', 9, true);


--
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: activity_partners activity_partners_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_partners
    ADD CONSTRAINT activity_partners_pkey PRIMARY KEY (activity_id, partner_id);


--
-- Name: activity_types activity_types_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_types
    ADD CONSTRAINT activity_types_code_key UNIQUE (code);


--
-- Name: activity_types activity_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_types
    ADD CONSTRAINT activity_types_pkey PRIMARY KEY (id);


--
-- Name: alert_recipients alert_recipients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert_recipients
    ADD CONSTRAINT alert_recipients_pkey PRIMARY KEY (alert_id, user_id);


--
-- Name: alert_types alert_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert_types
    ADD CONSTRAINT alert_types_pkey PRIMARY KEY (id);


--
-- Name: alerts alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: budget_categories budget_categories_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_categories
    ADD CONSTRAINT budget_categories_code_key UNIQUE (code);


--
-- Name: budget_categories budget_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_categories
    ADD CONSTRAINT budget_categories_pkey PRIMARY KEY (id);


--
-- Name: budgets budgets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: company_sectors company_sectors_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_sectors
    ADD CONSTRAINT company_sectors_code_key UNIQUE (code);


--
-- Name: company_sectors company_sectors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_sectors
    ADD CONSTRAINT company_sectors_pkey PRIMARY KEY (id);


--
-- Name: data_quality_issues data_quality_issues_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data_quality_issues
    ADD CONSTRAINT data_quality_issues_pkey PRIMARY KEY (id);


--
-- Name: data_quality_rules data_quality_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data_quality_rules
    ADD CONSTRAINT data_quality_rules_pkey PRIMARY KEY (id);


--
-- Name: departments departments_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_code_key UNIQUE (code);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: formations formations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formations
    ADD CONSTRAINT formations_pkey PRIMARY KEY (id);


--
-- Name: import_logs import_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_logs
    ADD CONSTRAINT import_logs_pkey PRIMARY KEY (id);


--
-- Name: kpi_definitions kpi_definitions_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kpi_definitions
    ADD CONSTRAINT kpi_definitions_code_key UNIQUE (code);


--
-- Name: kpi_definitions kpi_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kpi_definitions
    ADD CONSTRAINT kpi_definitions_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: participants participants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT participants_pkey PRIMARY KEY (id);


--
-- Name: partner_types partner_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partner_types
    ADD CONSTRAINT partner_types_pkey PRIMARY KEY (id);


--
-- Name: partners partners_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_pkey PRIMARY KEY (id);


--
-- Name: raw_excel_data raw_excel_data_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raw_excel_data
    ADD CONSTRAINT raw_excel_data_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: service_types service_types_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_types
    ADD CONSTRAINT service_types_code_key UNIQUE (code);


--
-- Name: service_types service_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_types
    ADD CONSTRAINT service_types_pkey PRIMARY KEY (id);


--
-- Name: services_provided services_provided_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services_provided
    ADD CONSTRAINT services_provided_pkey PRIMARY KEY (id);


--
-- Name: training_categories training_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_categories
    ADD CONSTRAINT training_categories_pkey PRIMARY KEY (id);


--
-- Name: budgets unique_budget; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT unique_budget UNIQUE (fiscal_year, department_id, category_id);


--
-- Name: participants unique_participant_activity; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT unique_participant_activity UNIQUE (email, activity_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: dashboard_stats_last_updated_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX dashboard_stats_last_updated_idx ON public.dashboard_stats USING btree (last_updated);


--
-- Name: idx_activities_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activities_dates ON public.activities USING btree (start_date, end_date);


--
-- Name: idx_activities_department; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activities_department ON public.activities USING btree (department_id);


--
-- Name: idx_activities_department_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activities_department_dates ON public.activities USING btree (department_id, start_date, end_date);


--
-- Name: idx_activities_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activities_status ON public.activities USING btree (status);


--
-- Name: idx_activities_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activities_type ON public.activities USING btree (activity_type_id);


--
-- Name: idx_activities_type_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_activities_type_status ON public.activities USING btree (activity_type_id, status);


--
-- Name: idx_audit_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_date ON public.audit_log USING btree (changed_at);


--
-- Name: idx_audit_table_record; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_table_record ON public.audit_log USING btree (table_name, record_id);


--
-- Name: idx_audit_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_user ON public.audit_log USING btree (changed_by);


--
-- Name: idx_companies_city; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_companies_city ON public.companies USING btree (city);


--
-- Name: idx_companies_ice; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_companies_ice ON public.companies USING btree (ice);


--
-- Name: idx_companies_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_companies_name ON public.companies USING btree (name);


--
-- Name: idx_companies_name_trgm; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_companies_name_trgm ON public.companies USING gin (name public.gin_trgm_ops);


--
-- Name: idx_companies_sector; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_companies_sector ON public.companies USING btree (sector_id);


--
-- Name: idx_expenses_budget; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expenses_budget ON public.expenses USING btree (budget_id);


--
-- Name: idx_expenses_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_expenses_date ON public.expenses USING btree (expense_date);


--
-- Name: idx_participants_activity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_participants_activity ON public.participants USING btree (activity_id);


--
-- Name: idx_participants_activity_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_participants_activity_status ON public.participants USING btree (activity_id, registration_status);


--
-- Name: idx_participants_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_participants_company ON public.participants USING btree (company_id);


--
-- Name: idx_participants_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_participants_email ON public.participants USING btree (email);


--
-- Name: idx_quality_issues_entity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quality_issues_entity ON public.data_quality_issues USING btree (entity_type, entity_id);


--
-- Name: idx_quality_issues_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quality_issues_status ON public.data_quality_issues USING btree (status);


--
-- Name: idx_raw_excel_import; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_raw_excel_import ON public.raw_excel_data USING btree (import_log_id);


--
-- Name: idx_services_company; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_services_company ON public.services_provided USING btree (company_id);


--
-- Name: idx_services_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_services_date ON public.services_provided USING btree (request_date);


--
-- Name: idx_services_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_services_status ON public.services_provided USING btree (status);


--
-- Name: v_activities_summary _RETURN; Type: RULE; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW public.v_activities_summary AS
 SELECT a.id,
    a.title,
    a.description,
    a.activity_type_id,
    a.department_id,
    a.start_date,
    a.end_date,
    a.registration_deadline,
    a.location_id,
    a.venue_name,
    a.venue_address,
    a.is_online,
    a.max_participants,
    a.current_participants,
    a.waiting_list_count,
    a.budget_allocated,
    a.budget_spent,
    a.cost_per_participant,
    a.is_free,
    a.participation_fee,
    a.status,
    a.completion_percentage,
    a.actual_participants,
    a.satisfaction_score,
    a.impact_notes,
    a.partners,
    a.documents_path,
    a.version,
    a.previous_version_id,
    a.created_by,
    a.updated_by,
    a.created_at,
    a.updated_at,
    at.name AS activity_type_name,
    d.name AS department_name,
    l.name AS location_name,
    count(DISTINCT p.id) AS total_participants,
    count(DISTINCT
        CASE
            WHEN p.attendance_confirmed THEN p.id
            ELSE NULL::uuid
        END) AS confirmed_participants,
    COALESCE(avg(p.satisfaction_rating), (0)::numeric) AS avg_satisfaction,
    ((a.budget_spent / NULLIF(a.budget_allocated, (0)::numeric)) * (100)::numeric) AS budget_usage_percentage
   FROM ((((public.activities a
     LEFT JOIN public.activity_types at ON ((a.activity_type_id = at.id)))
     LEFT JOIN public.departments d ON ((a.department_id = d.id)))
     LEFT JOIN public.locations l ON ((a.location_id = l.id)))
     LEFT JOIN public.participants p ON ((p.activity_id = a.id)))
  GROUP BY a.id, at.name, d.name, l.name;


--
-- Name: v_companies_with_quality _RETURN; Type: RULE; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW public.v_companies_with_quality AS
 SELECT c.id,
    c.name,
    c.legal_name,
    c.ice,
    c.rc,
    c.patent_number,
    c.tax_id,
    c.sector_id,
    c.company_type,
    c.size_category,
    c.employee_count,
    c.annual_revenue,
    c.email,
    c.phone,
    c.mobile,
    c.fax,
    c.website,
    c.address,
    c.city,
    c.province,
    c.postal_code,
    c.latitude,
    c.longitude,
    c.representative_name,
    c.representative_title,
    c.representative_email,
    c.representative_phone,
    c.is_member,
    c.membership_date,
    c.membership_status,
    c.data_quality_score,
    c.needs_verification,
    c.verification_notes,
    c.duplicate_of,
    c.created_by,
    c.updated_by,
    c.created_at,
    c.updated_at,
    cs.name AS sector_name,
    (((((((((
        CASE
            WHEN ((c.name IS NOT NULL) AND (length((c.name)::text) > 0)) THEN 10
            ELSE 0
        END +
        CASE
            WHEN (c.ice IS NOT NULL) THEN 15
            ELSE 0
        END) +
        CASE
            WHEN (c.email IS NOT NULL) THEN 10
            ELSE 0
        END) +
        CASE
            WHEN (c.phone IS NOT NULL) THEN 10
            ELSE 0
        END) +
        CASE
            WHEN (c.address IS NOT NULL) THEN 10
            ELSE 0
        END) +
        CASE
            WHEN (c.city IS NOT NULL) THEN 10
            ELSE 0
        END) +
        CASE
            WHEN (c.sector_id IS NOT NULL) THEN 10
            ELSE 0
        END) +
        CASE
            WHEN (c.employee_count IS NOT NULL) THEN 5
            ELSE 0
        END) +
        CASE
            WHEN ((c.latitude IS NOT NULL) AND (c.longitude IS NOT NULL)) THEN 10
            ELSE 0
        END) +
        CASE
            WHEN (c.representative_name IS NOT NULL) THEN 10
            ELSE 0
        END) AS calculated_quality_score,
    count(dqi.id) AS open_quality_issues
   FROM ((public.companies c
     LEFT JOIN public.company_sectors cs ON ((c.sector_id = cs.id)))
     LEFT JOIN public.data_quality_issues dqi ON (((dqi.entity_id = c.id) AND ((dqi.status)::text = 'open'::text))))
  GROUP BY c.id, cs.name;


--
-- Name: activities update_activities_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: companies update_companies_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: services_provided update_services_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services_provided FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: activities activities_activity_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_activity_type_id_fkey FOREIGN KEY (activity_type_id) REFERENCES public.activity_types(id);


--
-- Name: activities activities_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: activities activities_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: activities activities_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: activities activities_previous_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_previous_version_id_fkey FOREIGN KEY (previous_version_id) REFERENCES public.activities(id);


--
-- Name: activities activities_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: activity_partners activity_partners_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_partners
    ADD CONSTRAINT activity_partners_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE;


--
-- Name: activity_partners activity_partners_partner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activity_partners
    ADD CONSTRAINT activity_partners_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.partners(id) ON DELETE CASCADE;


--
-- Name: alert_recipients alert_recipients_alert_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert_recipients
    ADD CONSTRAINT alert_recipients_alert_id_fkey FOREIGN KEY (alert_id) REFERENCES public.alerts(id) ON DELETE CASCADE;


--
-- Name: alert_recipients alert_recipients_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert_recipients
    ADD CONSTRAINT alert_recipients_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: alerts alerts_alert_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_alert_type_id_fkey FOREIGN KEY (alert_type_id) REFERENCES public.alert_types(id);


--
-- Name: alerts alerts_read_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts
    ADD CONSTRAINT alerts_read_by_fkey FOREIGN KEY (read_by) REFERENCES public.users(id);


--
-- Name: audit_log audit_log_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id);


--
-- Name: budget_categories budget_categories_parent_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budget_categories
    ADD CONSTRAINT budget_categories_parent_category_id_fkey FOREIGN KEY (parent_category_id) REFERENCES public.budget_categories(id);


--
-- Name: budgets budgets_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.budget_categories(id);


--
-- Name: budgets budgets_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: companies companies_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: companies companies_duplicate_of_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_duplicate_of_fkey FOREIGN KEY (duplicate_of) REFERENCES public.companies(id);


--
-- Name: companies companies_sector_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES public.company_sectors(id);


--
-- Name: companies companies_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: data_quality_issues data_quality_issues_resolved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data_quality_issues
    ADD CONSTRAINT data_quality_issues_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id);


--
-- Name: data_quality_issues data_quality_issues_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.data_quality_issues
    ADD CONSTRAINT data_quality_issues_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES public.data_quality_rules(id);


--
-- Name: departments departments_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id);


--
-- Name: departments departments_parent_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_parent_department_id_fkey FOREIGN KEY (parent_department_id) REFERENCES public.departments(id);


--
-- Name: expenses expenses_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activities(id);


--
-- Name: expenses expenses_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: expenses expenses_budget_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_budget_id_fkey FOREIGN KEY (budget_id) REFERENCES public.budgets(id);


--
-- Name: expenses expenses_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: users fk_users_department; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: formations formations_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formations
    ADD CONSTRAINT formations_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE;


--
-- Name: formations formations_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.formations
    ADD CONSTRAINT formations_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.training_categories(id);


--
-- Name: import_logs import_logs_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.import_logs
    ADD CONSTRAINT import_logs_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: participants participants_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT participants_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activities(id);


--
-- Name: participants participants_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT participants_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: partners partners_partner_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.partners
    ADD CONSTRAINT partners_partner_type_id_fkey FOREIGN KEY (partner_type_id) REFERENCES public.partner_types(id);


--
-- Name: raw_excel_data raw_excel_data_import_log_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.raw_excel_data
    ADD CONSTRAINT raw_excel_data_import_log_id_fkey FOREIGN KEY (import_log_id) REFERENCES public.import_logs(id);


--
-- Name: services_provided services_provided_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services_provided
    ADD CONSTRAINT services_provided_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- Name: services_provided services_provided_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services_provided
    ADD CONSTRAINT services_provided_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id);


--
-- Name: services_provided services_provided_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services_provided
    ADD CONSTRAINT services_provided_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: services_provided services_provided_service_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services_provided
    ADD CONSTRAINT services_provided_service_type_id_fkey FOREIGN KEY (service_type_id) REFERENCES public.service_types(id);


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: dashboard_stats; Type: MATERIALIZED VIEW DATA; Schema: public; Owner: postgres
--

REFRESH MATERIALIZED VIEW public.dashboard_stats;


--
-- PostgreSQL database dump complete
--

\unrestrict y090Rnmp0uaFI4Fl0OBK0jsvBw8KCRtof5KAVnOjohvKCtL2AgQF6uWxaTIbSl9

