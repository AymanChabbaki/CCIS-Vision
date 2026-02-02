-- ============================================================================
-- CCIS-Vision - Drop KPI Tables
-- Description: Clean up script to remove all KPI tables and related objects
-- Version: 1.0.0
-- Date: 2026-02-02
-- ============================================================================

-- This script safely drops all KPI-related tables, views, functions, and triggers
-- Run this before recreating the KPI schema

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS v_kpis_complete CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS update_kpi_periods_timestamp ON kpi_periods CASCADE;
DROP TRIGGER IF EXISTS update_audit_timestamp ON kpi_audit_control CASCADE;
DROP TRIGGER IF EXISTS update_relations_timestamp ON kpi_relations_institutionnelles CASCADE;
DROP TRIGGER IF EXISTS update_synthese_timestamp ON kpi_synthese_departements CASCADE;
DROP TRIGGER IF EXISTS update_admin_financier_timestamp ON kpi_admin_financier CASCADE;
DROP TRIGGER IF EXISTS update_appui_promotion_timestamp ON kpi_appui_promotion CASCADE;
DROP TRIGGER IF EXISTS update_services_ressortissants_timestamp ON kpi_services_ressortissants CASCADE;
DROP TRIGGER IF EXISTS update_strategie_partenariat_timestamp ON kpi_strategie_partenariat CASCADE;

-- Drop trigger function
DROP FUNCTION IF EXISTS update_kpi_timestamp() CASCADE;

-- Drop KPI tables (in reverse order due to foreign key dependencies)
DROP TABLE IF EXISTS kpi_strategie_partenariat CASCADE;
DROP TABLE IF EXISTS kpi_services_ressortissants CASCADE;
DROP TABLE IF EXISTS kpi_appui_promotion CASCADE;
DROP TABLE IF EXISTS kpi_admin_financier CASCADE;
DROP TABLE IF EXISTS kpi_synthese_departements CASCADE;
DROP TABLE IF EXISTS kpi_relations_institutionnelles CASCADE;
DROP TABLE IF EXISTS kpi_audit_control CASCADE;
DROP TABLE IF EXISTS kpi_periods CASCADE;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'All KPI tables, views, triggers, and functions have been dropped successfully';
    RAISE NOTICE 'You can now run kpis_schema.sql to recreate the tables';
END $$;
