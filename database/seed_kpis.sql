-- ============================================================================
-- CCIS-Vision - KPI Sample Data Seeding Script
-- Description: Populate KPI tables with realistic sample data
-- Version: 1.0.0
-- Date: 2026-02-02
-- ============================================================================

-- This script inserts sample KPI data for Q1 2026
-- Run this after creating the KPI schema (kpis_schema.sql)

-- ============================================================================
-- Insert Periods
-- ============================================================================

INSERT INTO kpi_periods (name, type, start_date, end_date, is_active) VALUES
('Janvier 2026', 'monthly', '2026-01-01', '2026-01-31', FALSE),
('Février 2026', 'monthly', '2026-02-01', '2026-02-29', TRUE),
('Mars 2026', 'monthly', '2026-03-01', '2026-03-31', FALSE),
('Q1 2026', 'quarterly', '2026-01-01', '2026-03-31', TRUE),
('Q2 2026', 'quarterly', '2026-04-01', '2026-06-30', FALSE),
('Q3 2026', 'quarterly', '2026-07-01', '2026-09-30', FALSE),
('Q4 2026', 'quarterly', '2026-10-01', '2026-12-31', FALSE),
('Année 2026', 'annual', '2026-01-01', '2026-12-31', TRUE)
ON CONFLICT (type, start_date, end_date) DO NOTHING;

-- ============================================================================
-- Sample KPI Data for Q1 2026
-- ============================================================================

DO $$
DECLARE
    v_q1_period_id UUID;
    v_jan_period_id UUID;
    v_feb_period_id UUID;
    v_user_id UUID;
BEGIN
    -- Get period IDs
    SELECT id INTO v_q1_period_id FROM kpi_periods WHERE name = 'Q1 2026' LIMIT 1;
    SELECT id INTO v_jan_period_id FROM kpi_periods WHERE name = 'Janvier 2026' LIMIT 1;
    SELECT id INTO v_feb_period_id FROM kpi_periods WHERE name = 'Février 2026' LIMIT 1;
    
    -- Get a user ID (first admin user or any user)
    SELECT id INTO v_user_id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'Admin' LIMIT 1) LIMIT 1;
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id FROM users LIMIT 1;
    END IF;
    
    -- ====================
    -- Q1 2026 KPIs
    -- ====================
    
    -- Audit Control Q1
    INSERT INTO kpi_audit_control (period_id, nombre_rapports_gestion, nombre_tableaux_bord, nombre_missions_audit, taux_mise_en_oeuvre_recommandations, nombre_procedures_ameliorees, created_by, notes)
    VALUES (v_q1_period_id, 12, 8, 5, 85.50, 7, v_user_id, 'Q1: Excellent progress on audit missions. 5 audits completed with strong recommendation implementation rate.')
    ON CONFLICT (period_id) DO UPDATE SET
        nombre_rapports_gestion = EXCLUDED.nombre_rapports_gestion,
        nombre_tableaux_bord = EXCLUDED.nombre_tableaux_bord,
        nombre_missions_audit = EXCLUDED.nombre_missions_audit,
        taux_mise_en_oeuvre_recommandations = EXCLUDED.taux_mise_en_oeuvre_recommandations,
        nombre_procedures_ameliorees = EXCLUDED.nombre_procedures_ameliorees,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Relations Institutionnelles Q1
    INSERT INTO kpi_relations_institutionnelles (period_id, conventions_signees, partenariats_actifs, reunions_strategiques, actions_lobbying, satisfaction_partenaires, created_by, notes)
    VALUES (v_q1_period_id, 6, 15, 18, 12, 88.00, v_user_id, 'Q1: Strong partnership development. 6 new conventions signed including agreement with Ministry of Commerce.')
    ON CONFLICT (period_id) DO UPDATE SET
        conventions_signees = EXCLUDED.conventions_signees,
        partenariats_actifs = EXCLUDED.partenariats_actifs,
        reunions_strategiques = EXCLUDED.reunions_strategiques,
        actions_lobbying = EXCLUDED.actions_lobbying,
        satisfaction_partenaires = EXCLUDED.satisfaction_partenaires,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Synthèse Départements Q1
    INSERT INTO kpi_synthese_departements (period_id, nombre_projets_realises, taux_realisation_objectifs, nombre_formations_organisees, nombre_participants_formations, created_by, notes)
    VALUES (v_q1_period_id, 24, 82.50, 14, 320, v_user_id, 'Q1: Successful training programs across all departments. Digital transformation workshop had highest attendance.')
    ON CONFLICT (period_id) DO UPDATE SET
        nombre_projets_realises = EXCLUDED.nombre_projets_realises,
        taux_realisation_objectifs = EXCLUDED.taux_realisation_objectifs,
        nombre_formations_organisees = EXCLUDED.nombre_formations_organisees,
        nombre_participants_formations = EXCLUDED.nombre_participants_formations,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Admin Financier Q1
    INSERT INTO kpi_admin_financier (period_id, budget_alloue, budget_consomme, taux_execution_budgetaire, nombre_factures_traitees, delai_moyen_paiement, nombre_marches_publics, taux_conformite_procedures, created_by, notes)
    VALUES (v_q1_period_id, 5000000.00, 3750000.00, 75.00, 156, 25, 8, 95.50, v_user_id, 'Q1: Budget execution on track. 8 public procurement contracts awarded. Average payment delay reduced to 25 days.')
    ON CONFLICT (period_id) DO UPDATE SET
        budget_alloue = EXCLUDED.budget_alloue,
        budget_consomme = EXCLUDED.budget_consomme,
        taux_execution_budgetaire = EXCLUDED.taux_execution_budgetaire,
        nombre_factures_traitees = EXCLUDED.nombre_factures_traitees,
        delai_moyen_paiement = EXCLUDED.delai_moyen_paiement,
        nombre_marches_publics = EXCLUDED.nombre_marches_publics,
        taux_conformite_procedures = EXCLUDED.taux_conformite_procedures,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Appui Promotion Q1
    INSERT INTO kpi_appui_promotion (period_id, nombre_entreprises_accompagnees, missions_economiques_organisees, salons_participations, investissements_generes, emplois_crees, entreprises_inscrites, entreprises_inscrites_secteur_cible, entreprises_actives, entreprises_radiation_volontaire, entreprises_radiees, entreprises_beneficiaires_services, created_by, notes)
    VALUES (v_q1_period_id, 85, 4, 7, 12500000.00, 145, 92, 67, 520, 8, 12, 78, v_user_id, 'Q1: Strong business support. 85 companies received consulting. 145 jobs created. Major success at Dubai trade fair.')
    ON CONFLICT (period_id) DO UPDATE SET
        nombre_entreprises_accompagnees = EXCLUDED.nombre_entreprises_accompagnees,
        missions_economiques_organisees = EXCLUDED.missions_economiques_organisees,
        salons_participations = EXCLUDED.salons_participations,
        investissements_generes = EXCLUDED.investissements_generes,
        emplois_crees = EXCLUDED.emplois_crees,
        entreprises_inscrites = EXCLUDED.entreprises_inscrites,
        entreprises_inscrites_secteur_cible = EXCLUDED.entreprises_inscrites_secteur_cible,
        entreprises_actives = EXCLUDED.entreprises_actives,
        entreprises_radiation_volontaire = EXCLUDED.entreprises_radiation_volontaire,
        entreprises_radiees = EXCLUDED.entreprises_radiees,
        entreprises_beneficiaires_services = EXCLUDED.entreprises_beneficiaires_services,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Services Ressortissants Q1
    INSERT INTO kpi_services_ressortissants (period_id, newsletters_editees, demandes_ressortissants, indicateurs_economiques_suivis, created_by, notes)
    VALUES (v_q1_period_id, 12, 156, 24, v_user_id, 'Q1: Comprehensive support to nationals abroad. 156 requests processed. 12 newsletters with economic updates sent.')
    ON CONFLICT (period_id) DO UPDATE SET
        newsletters_editees = EXCLUDED.newsletters_editees,
        demandes_ressortissants = EXCLUDED.demandes_ressortissants,
        indicateurs_economiques_suivis = EXCLUDED.indicateurs_economiques_suivis,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Stratégie Partenariat Q1
    INSERT INTO kpi_strategie_partenariat (period_id, actions_realisees, ressortissants_satisfaits_evenements, entreprises_potentiel_export, entreprises_accompagnees, delegations, opportunites_affaires_internationales, created_by, notes)
    VALUES (v_q1_period_id, 28, 92, 45, 67, 11, 34, v_user_id, 'Q1: Strong international business development. 11 delegations received. 34 international business opportunities identified.')
    ON CONFLICT (period_id) DO UPDATE SET
        actions_realisees = EXCLUDED.actions_realisees,
        ressortissants_satisfaits_evenements = EXCLUDED.ressortissants_satisfaits_evenements,
        entreprises_potentiel_export = EXCLUDED.entreprises_potentiel_export,
        entreprises_accompagnees = EXCLUDED.entreprises_accompagnees,
        delegations = EXCLUDED.delegations,
        opportunites_affaires_internationales = EXCLUDED.opportunites_affaires_internationales,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP;
    
    -- ====================
    -- January 2026 KPIs
    -- ====================
    
    -- Audit Control January
    INSERT INTO kpi_audit_control (period_id, nombre_rapports_gestion, nombre_tableaux_bord, nombre_missions_audit, taux_mise_en_oeuvre_recommandations, nombre_procedures_ameliorees, created_by, notes)
    VALUES (v_jan_period_id, 4, 3, 2, 80.00, 2, v_user_id, 'Janvier: 2 audits completed, focusing on financial procedures.')
    ON CONFLICT (period_id) DO NOTHING;
    
    -- Relations Institutionnelles January
    INSERT INTO kpi_relations_institutionnelles (period_id, conventions_signees, partenariats_actifs, reunions_strategiques, actions_lobbying, satisfaction_partenaires, created_by, notes)
    VALUES (v_jan_period_id, 2, 15, 6, 4, 85.00, v_user_id, 'Janvier: 2 new partnership agreements signed.')
    ON CONFLICT (period_id) DO NOTHING;
    
    -- Synthèse Départements January
    INSERT INTO kpi_synthese_departements (period_id, nombre_projets_realises, taux_realisation_objectifs, nombre_formations_organisees, nombre_participants_formations, created_by, notes)
    VALUES (v_jan_period_id, 8, 78.00, 5, 110, v_user_id, 'Janvier: Strong start with 5 training sessions.')
    ON CONFLICT (period_id) DO NOTHING;
    
    -- Admin Financier January
    INSERT INTO kpi_admin_financier (period_id, budget_alloue, budget_consomme, taux_execution_budgetaire, nombre_factures_traitees, delai_moyen_paiement, nombre_marches_publics, taux_conformite_procedures, created_by, notes)
    VALUES (v_jan_period_id, 1666666.67, 1200000.00, 72.00, 48, 28, 3, 94.00, v_user_id, 'Janvier: Budget execution starting well.')
    ON CONFLICT (period_id) DO NOTHING;
    
    -- Appui Promotion January
    INSERT INTO kpi_appui_promotion (period_id, nombre_entreprises_accompagnees, missions_economiques_organisees, salons_participations, investissements_generes, emplois_crees, entreprises_inscrites, entreprises_inscrites_secteur_cible, entreprises_actives, entreprises_radiees, entreprises_beneficiaires_services, created_by, notes)
    VALUES (v_jan_period_id, 28, 1, 2, 4000000.00, 45, 30, 22, 520, 4, 25, v_user_id, 'Janvier: Good start with trade fair participation.')
    ON CONFLICT (period_id) DO NOTHING;
    
    -- Services Ressortissants January
    INSERT INTO kpi_services_ressortissants (period_id, newsletters_editees, demandes_ressortissants, indicateurs_economiques_suivis, created_by, notes)
    VALUES (v_jan_period_id, 4, 50, 24, v_user_id, 'Janvier: 50 requests processed.')
    ON CONFLICT (period_id) DO NOTHING;
    
    -- Stratégie Partenariat January
    INSERT INTO kpi_strategie_partenariat (period_id, actions_realisees, ressortissants_satisfaits_evenements, entreprises_potentiel_export, entreprises_accompagnees, delegations, opportunites_affaires_internationales, created_by, notes)
    VALUES (v_jan_period_id, 9, 30, 15, 22, 4, 11, v_user_id, 'Janvier: 4 delegations received.')
    ON CONFLICT (period_id) DO NOTHING;
    
    -- ====================
    -- February 2026 KPIs
    -- ====================
    
    -- Audit Control February
    INSERT INTO kpi_audit_control (period_id, nombre_rapports_gestion, nombre_tableaux_bord, nombre_missions_audit, taux_mise_en_oeuvre_recommandations, nombre_procedures_ameliorees, created_by, notes)
    VALUES (v_feb_period_id, 4, 3, 2, 87.00, 3, v_user_id, 'Février: Excellent recommendation implementation rate.')
    ON CONFLICT (period_id) DO NOTHING;
    
    -- Relations Institutionnelles February
    INSERT INTO kpi_relations_institutionnelles (period_id, conventions_signees, partenariats_actifs, reunions_strategiques, actions_lobbying, satisfaction_partenaires, created_by, notes)
    VALUES (v_feb_period_id, 2, 15, 6, 4, 90.00, v_user_id, 'Février: High partner satisfaction.')
    ON CONFLICT (period_id) DO NOTHING;
    
    -- Synthèse Départements February
    INSERT INTO kpi_synthese_departements (period_id, nombre_projets_realises, taux_realisation_objectifs, nombre_formations_organisees, nombre_participants_formations, created_by, notes)
    VALUES (v_feb_period_id, 8, 84.00, 5, 115, v_user_id, 'Février: Increased training participation.')
    ON CONFLICT (period_id) DO NOTHING;
    
    -- Admin Financier February
    INSERT INTO kpi_admin_financier (period_id, budget_alloue, budget_consomme, taux_execution_budgetaire, nombre_factures_traitees, delai_moyen_paiement, nombre_marches_publics, taux_conformite_procedures, created_by, notes)
    VALUES (v_feb_period_id, 1666666.67, 1300000.00, 78.00, 54, 23, 3, 96.00, v_user_id, 'Février: Payment delays reduced.')
    ON CONFLICT (period_id) DO NOTHING;
    
    -- Appui Promotion February
    INSERT INTO kpi_appui_promotion (period_id, nombre_entreprises_accompagnees, missions_economiques_organisees, salons_participations, investissements_generes, emplois_crees, entreprises_inscrites, entreprises_inscrites_secteur_cible, entreprises_actives, entreprises_radiees, entreprises_beneficiaires_services, created_by, notes)
    VALUES (v_feb_period_id, 30, 2, 3, 4500000.00, 52, 32, 24, 520, 4, 28, v_user_id, 'Février: Strong job creation momentum.')
    ON CONFLICT (period_id) DO NOTHING;
    
    -- Services Ressortissants February
    INSERT INTO kpi_services_ressortissants (period_id, newsletters_editees, demandes_ressortissants, indicateurs_economiques_suivis, created_by, notes)
    VALUES (v_feb_period_id, 4, 56, 24, v_user_id, 'Février: Growing demand from nationals.')
    ON CONFLICT (period_id) DO NOTHING;
    
    -- Stratégie Partenariat February
    INSERT INTO kpi_strategie_partenariat (period_id, actions_realisees, ressortissants_satisfaits_evenements, entreprises_potentiel_export, entreprises_accompagnees, delegations, opportunites_affaires_internationales, created_by, notes)
    VALUES (v_feb_period_id, 10, 32, 16, 23, 4, 12, v_user_id, 'Février: Consistent international activity.')
    ON CONFLICT (period_id) DO NOTHING;
    
    RAISE NOTICE 'KPI seed data inserted successfully for Q1 2026, January 2026, and February 2026';
END $$;
