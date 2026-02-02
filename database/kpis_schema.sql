-- ============================================================================
-- CCIS-Vision - KPI Management Schema
-- Description: Schema for tracking KPIs across all CCIS departments
-- Version: 1.0.0
-- Date: 2026-02-02
-- ============================================================================

-- Table: kpi_periods
-- Description: Define reporting periods for KPIs (monthly, quarterly, annual)
CREATE TABLE IF NOT EXISTS kpi_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('monthly', 'quarterly', 'annual')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_period UNIQUE (type, start_date, end_date)
);

-- Table: kpi_audit_control
-- Description: KPIs for Audit & Control department
CREATE TABLE IF NOT EXISTS kpi_audit_control (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID NOT NULL REFERENCES kpi_periods(id) ON DELETE CASCADE,
    
    -- Metrics
    nombre_rapports_gestion INTEGER DEFAULT 0 CHECK (nombre_rapports_gestion >= 0),
    nombre_tableaux_bord INTEGER DEFAULT 0 CHECK (nombre_tableaux_bord >= 0),
    nombre_missions_audit INTEGER DEFAULT 0 CHECK (nombre_missions_audit >= 0),
    taux_mise_en_oeuvre_recommandations DECIMAL(5,2) DEFAULT 0 CHECK (taux_mise_en_oeuvre_recommandations BETWEEN 0 AND 100),
    nombre_procedures_ameliorees INTEGER DEFAULT 0 CHECK (nombre_procedures_ameliorees >= 0),
    
    -- Metadata
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_audit_period UNIQUE (period_id)
);

-- Table: kpi_relations_institutionnelles
-- Description: KPIs for Institutional Relations department
CREATE TABLE IF NOT EXISTS kpi_relations_institutionnelles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID NOT NULL REFERENCES kpi_periods(id) ON DELETE CASCADE,
    
    -- Metrics
    nombre_reunions_ag_bureau_commissions INTEGER DEFAULT 0 CHECK (nombre_reunions_ag_bureau_commissions >= 0),
    nombre_conventions_partenariats INTEGER DEFAULT 0 CHECK (nombre_conventions_partenariats >= 0),
    nombre_pv_rapports INTEGER DEFAULT 0 CHECK (nombre_pv_rapports >= 0),
    nombre_relations_administrations INTEGER DEFAULT 0 CHECK (nombre_relations_administrations >= 0),
    taux_realisation_plan_action DECIMAL(5,2) DEFAULT 0 CHECK (taux_realisation_plan_action BETWEEN 0 AND 100),
    
    -- Metadata
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_relations_period UNIQUE (period_id)
);

-- Table: kpi_synthese_departements
-- Description: Synthesis KPIs for different departments
CREATE TABLE IF NOT EXISTS kpi_synthese_departements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID NOT NULL REFERENCES kpi_periods(id) ON DELETE CASCADE,
    
    -- Stratégie & Partenariat
    opportunites_internationales INTEGER DEFAULT 0 CHECK (opportunites_internationales >= 0),
    
    -- Services aux Ressortissants
    demandes_traitees INTEGER DEFAULT 0 CHECK (demandes_traitees >= 0),
    
    -- Appui & Promotion
    entreprises_accompagnees INTEGER DEFAULT 0 CHECK (entreprises_accompagnees >= 0),
    
    -- Administratif & Financier
    prestations_realisees INTEGER DEFAULT 0 CHECK (prestations_realisees >= 0),
    
    -- Metadata
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_synthese_period UNIQUE (period_id)
);

-- Table: kpi_admin_financier
-- Description: KPIs for Administrative & Financial department
CREATE TABLE IF NOT EXISTS kpi_admin_financier (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID NOT NULL REFERENCES kpi_periods(id) ON DELETE CASCADE,
    
    -- Metrics
    assemblees_generales_organisees INTEGER DEFAULT 0 CHECK (assemblees_generales_organisees >= 0),
    prestations_logistiques INTEGER DEFAULT 0 CHECK (prestations_logistiques >= 0),
    services_restauration INTEGER DEFAULT 0 CHECK (services_restauration >= 0),
    salles_mises_disposition INTEGER DEFAULT 0 CHECK (salles_mises_disposition >= 0),
    attestations_delivrees INTEGER DEFAULT 0 CHECK (attestations_delivrees >= 0),
    locations_salles INTEGER DEFAULT 0 CHECK (locations_salles >= 0),
    services_agenda_organises INTEGER DEFAULT 0 CHECK (services_agenda_organises >= 0),
    
    -- Metadata
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_admin_financier_period UNIQUE (period_id)
);

-- Table: kpi_appui_promotion
-- Description: KPIs for Business Support & Promotion department
CREATE TABLE IF NOT EXISTS kpi_appui_promotion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID NOT NULL REFERENCES kpi_periods(id) ON DELETE CASCADE,
    
    -- Metrics
    porteurs_projets_accompagnes INTEGER DEFAULT 0 CHECK (porteurs_projets_accompagnes >= 0),
    createurs_entreprise_accompagnes INTEGER DEFAULT 0 CHECK (createurs_entreprise_accompagnes >= 0),
    entreprises_guichets_proximite INTEGER DEFAULT 0 CHECK (entreprises_guichets_proximite >= 0),
    demandes_administratives_traitees INTEGER DEFAULT 0 CHECK (demandes_administratives_traitees >= 0),
    porteurs_projets_satisfaits INTEGER DEFAULT 0 CHECK (porteurs_projets_satisfaits >= 0),
    entrepreneurs_satisfaits INTEGER DEFAULT 0 CHECK (entrepreneurs_satisfaits >= 0),
    taux_satisfaction DECIMAL(5,2) DEFAULT 0 CHECK (taux_satisfaction BETWEEN 0 AND 100),
    entrepreneurs_financement INTEGER DEFAULT 0 CHECK (entrepreneurs_financement >= 0),
    formations_employes INTEGER DEFAULT 0 CHECK (formations_employes >= 0),
    entreprises_radiees INTEGER DEFAULT 0 CHECK (entreprises_radiees >= 0),
    entreprises_beneficiaires_services INTEGER DEFAULT 0 CHECK (entreprises_beneficiaires_services >= 0),
    
    -- Metadata
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_appui_promotion_period UNIQUE (period_id)
);

-- Table: kpi_services_ressortissants
-- Description: KPIs for Services to Nationals department
CREATE TABLE IF NOT EXISTS kpi_services_ressortissants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID NOT NULL REFERENCES kpi_periods(id) ON DELETE CASCADE,
    
    -- Metrics
    newsletters_editees INTEGER DEFAULT 0 CHECK (newsletters_editees >= 0),
    demandes_ressortissants INTEGER DEFAULT 0 CHECK (demandes_ressortissants >= 0),
    indicateurs_economiques_suivis INTEGER DEFAULT 0 CHECK (indicateurs_economiques_suivis >= 0),
    
    -- Metadata
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_services_ressortissants_period UNIQUE (period_id)
);

-- Table: kpi_strategie_partenariat
-- Description: KPIs for Strategy & Partnership department
CREATE TABLE IF NOT EXISTS kpi_strategie_partenariat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID NOT NULL REFERENCES kpi_periods(id) ON DELETE CASCADE,
    
    -- Metrics
    actions_realisees INTEGER DEFAULT 0 CHECK (actions_realisees >= 0),
    ressortissants_satisfaits_evenements INTEGER DEFAULT 0 CHECK (ressortissants_satisfaits_evenements >= 0),
    entreprises_potentiel_export INTEGER DEFAULT 0 CHECK (entreprises_potentiel_export >= 0),
    entreprises_accompagnees INTEGER DEFAULT 0 CHECK (entreprises_accompagnees >= 0),
    delegations INTEGER DEFAULT 0 CHECK (delegations >= 0),
    opportunites_affaires_internationales INTEGER DEFAULT 0 CHECK (opportunites_affaires_internationales >= 0),
    
    -- Metadata
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_strategie_partenariat_period UNIQUE (period_id)
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================

CREATE INDEX idx_kpi_periods_type ON kpi_periods(type);
CREATE INDEX idx_kpi_periods_dates ON kpi_periods(start_date, end_date);
CREATE INDEX idx_kpi_periods_active ON kpi_periods(is_active);

CREATE INDEX idx_audit_period ON kpi_audit_control(period_id);
CREATE INDEX idx_relations_period ON kpi_relations_institutionnelles(period_id);
CREATE INDEX idx_synthese_period ON kpi_synthese_departements(period_id);
CREATE INDEX idx_admin_financier_period ON kpi_admin_financier(period_id);
CREATE INDEX idx_appui_promotion_period ON kpi_appui_promotion(period_id);
CREATE INDEX idx_services_ressortissants_period ON kpi_services_ressortissants(period_id);
CREATE INDEX idx_strategie_partenariat_period ON kpi_strategie_partenariat(period_id);

-- ============================================================================
-- TRIGGERS for auto-update timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_kpi_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kpi_periods_timestamp
    BEFORE UPDATE ON kpi_periods
    FOR EACH ROW
    EXECUTE FUNCTION update_kpi_timestamp();

CREATE TRIGGER update_audit_timestamp
    BEFORE UPDATE ON kpi_audit_control
    FOR EACH ROW
    EXECUTE FUNCTION update_kpi_timestamp();

CREATE TRIGGER update_relations_timestamp
    BEFORE UPDATE ON kpi_relations_institutionnelles
    FOR EACH ROW
    EXECUTE FUNCTION update_kpi_timestamp();

CREATE TRIGGER update_synthese_timestamp
    BEFORE UPDATE ON kpi_synthese_departements
    FOR EACH ROW
    EXECUTE FUNCTION update_kpi_timestamp();

CREATE TRIGGER update_admin_financier_timestamp
    BEFORE UPDATE ON kpi_admin_financier
    FOR EACH ROW
    EXECUTE FUNCTION update_kpi_timestamp();

CREATE TRIGGER update_appui_promotion_timestamp
    BEFORE UPDATE ON kpi_appui_promotion
    FOR EACH ROW
    EXECUTE FUNCTION update_kpi_timestamp();

CREATE TRIGGER update_services_ressortissants_timestamp
    BEFORE UPDATE ON kpi_services_ressortissants
    FOR EACH ROW
    EXECUTE FUNCTION update_kpi_timestamp();

CREATE TRIGGER update_strategie_partenariat_timestamp
    BEFORE UPDATE ON kpi_strategie_partenariat
    FOR EACH ROW
    EXECUTE FUNCTION update_kpi_timestamp();

-- ============================================================================
-- SAMPLE DATA - Default Periods
-- ============================================================================

-- Insert current year quarters
INSERT INTO kpi_periods (name, type, start_date, end_date, is_active) VALUES
('Février 2026', 'monthly', '2026-02-01', '2026-02-28', TRUE),
('Q1 2026', 'quarterly', '2026-01-01', '2026-03-31', TRUE),
('Q2 2026', 'quarterly', '2026-04-01', '2026-06-30', FALSE),
('Q3 2026', 'quarterly', '2026-07-01', '2026-09-30', FALSE),
('Q4 2026', 'quarterly', '2026-10-01', '2026-12-31', FALSE),
('Année 2026', 'annual', '2026-01-01', '2026-12-31', TRUE)
ON CONFLICT (type, start_date, end_date) DO NOTHING;

-- ============================================================================
-- SAMPLE KPI DATA for Q1 2026
-- ============================================================================

-- Get the Q1 2026 period ID
DO $$
DECLARE
    v_period_id UUID;
    v_user_id UUID;
BEGIN
    -- Get the period ID for Q1 2026
    SELECT id INTO v_period_id FROM kpi_periods WHERE name = 'Q1 2026' LIMIT 1;
    
    -- Get a user ID (first admin user or any user)
    SELECT id INTO v_user_id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'Admin' LIMIT 1) LIMIT 1;
    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id FROM users LIMIT 1;
    END IF;
    
    -- Insert Audit Control KPIs
    INSERT INTO kpi_audit_control (period_id, nombre_rapports_gestion, nombre_tableaux_bord, nombre_missions_audit, taux_mise_en_oeuvre_recommandations, nombre_procedures_ameliorees, created_by, notes)
    VALUES (v_period_id, 12, 8, 5, 85.50, 7, v_user_id, 'Q1 2026: Excellent progress on audit missions and recommendations')
    ON CONFLICT (period_id) DO UPDATE SET
        nombre_rapports_gestion = EXCLUDED.nombre_rapports_gestion,
        nombre_tableaux_bord = EXCLUDED.nombre_tableaux_bord,
        nombre_missions_audit = EXCLUDED.nombre_missions_audit,
        taux_mise_en_oeuvre_recommandations = EXCLUDED.taux_mise_en_oeuvre_recommandations,
        nombre_procedures_ameliorees = EXCLUDED.nombre_procedures_ameliorees,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Insert Relations Institutionnelles KPIs
    INSERT INTO kpi_relations_institutionnelles (period_id, conventions_signees, partenariats_actifs, reunions_strategiques, actions_lobbying, satisfaction_partenaires, created_by, notes)
    VALUES (v_period_id, 6, 15, 18, 12, 88.00, v_user_id, 'Q1 2026: Strong partnership development')
    ON CONFLICT (period_id) DO UPDATE SET
        conventions_signees = EXCLUDED.conventions_signees,
        partenariats_actifs = EXCLUDED.partenariats_actifs,
        reunions_strategiques = EXCLUDED.reunions_strategiques,
        actions_lobbying = EXCLUDED.actions_lobbying,
        satisfaction_partenaires = EXCLUDED.satisfaction_partenaires,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Insert Synthèse Départements KPIs
    INSERT INTO kpi_synthese_departements (period_id, nombre_projets_realises, taux_realisation_objectifs, nombre_formations_organisees, nombre_participants_formations, created_by, notes)
    VALUES (v_period_id, 24, 82.50, 14, 320, v_user_id, 'Q1 2026: Successful training programs')
    ON CONFLICT (period_id) DO UPDATE SET
        nombre_projets_realises = EXCLUDED.nombre_projets_realises,
        taux_realisation_objectifs = EXCLUDED.taux_realisation_objectifs,
        nombre_formations_organisees = EXCLUDED.nombre_formations_organisees,
        nombre_participants_formations = EXCLUDED.nombre_participants_formations,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Insert Admin Financier KPIs
    INSERT INTO kpi_admin_financier (period_id, budget_alloue, budget_consomme, taux_execution_budgetaire, nombre_factures_traitees, delai_moyen_paiement, nombre_marches_publics, taux_conformite_procedures, created_by, notes)
    VALUES (v_period_id, 5000000.00, 3750000.00, 75.00, 156, 25, 8, 95.50, v_user_id, 'Q1 2026: Budget execution on track')
    ON CONFLICT (period_id) DO UPDATE SET
        budget_alloue = EXCLUDED.budget_alloue,
        budget_consomme = EXCLUDED.budget_consomme,
        taux_execution_budgetaire = EXCLUDED.taux_execution_budgetaire,
        nombre_factures_traitees = EXCLUDED.nombre_factures_traitees,
        delai_moyen_paiement = EXCLUDED.delai_moyen_paiement,
        nombre_marches_publics = EXCLUDED.nombre_marches_publics,
        taux_conformite_procedures = EXCLUDED.taux_conformite_procedures,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Insert Appui Promotion KPIs
    INSERT INTO kpi_appui_promotion (period_id, nombre_entreprises_accompagnees, missions_economiques_organisees, salons_participations, investissements_generes, emplois_crees, entreprises_inscrites, entreprises_inscrites_secteur_cible, entreprises_actives, entreprises_radiation_volontaire, entreprises_radiees, entreprises_beneficiaires_services, created_by, notes)
    VALUES (v_period_id, 85, 4, 7, 12500000.00, 145, 92, 67, 520, 8, 12, 78, v_user_id, 'Q1 2026: Strong business support and job creation')
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
        updated_at = CURRENT_TIMESTAMP;
    
    -- Insert Services Ressortissants KPIs
    INSERT INTO kpi_services_ressortissants (period_id, newsletters_editees, demandes_ressortissants, indicateurs_economiques_suivis, created_by, notes)
    VALUES (v_period_id, 12, 156, 24, v_user_id, 'Q1 2026: Comprehensive support to nationals abroad')
    ON CONFLICT (period_id) DO UPDATE SET
        newsletters_editees = EXCLUDED.newsletters_editees,
        demandes_ressortissants = EXCLUDED.demandes_ressortissants,
        indicateurs_economiques_suivis = EXCLUDED.indicateurs_economiques_suivis,
        updated_at = CURRENT_TIMESTAMP;
    
    -- Insert Stratégie Partenariat KPIs
    INSERT INTO kpi_strategie_partenariat (period_id, actions_realisees, ressortissants_satisfaits_evenements, entreprises_potentiel_export, entreprises_accompagnees, delegations, opportunites_affaires_internationales, created_by, notes)
    VALUES (v_period_id, 28, 92, 45, 67, 11, 34, v_user_id, 'Q1 2026: Strong international business development')
    ON CONFLICT (period_id) DO UPDATE SET
        actions_realisees = EXCLUDED.actions_realisees,
        ressortissants_satisfaits_evenements = EXCLUDED.ressortissants_satisfaits_evenements,
        entreprises_potentiel_export = EXCLUDED.entreprises_potentiel_export,
        entreprises_accompagnees = EXCLUDED.entreprises_accompagnees,
        delegations = EXCLUDED.delegations,
        opportunites_affaires_internationales = EXCLUDED.opportunites_affaires_internationales,
        updated_at = CURRENT_TIMESTAMP;
END $$;

-- ============================================================================
-- VIEWS for easy reporting
-- ============================================================================

-- View: All KPIs by Period
CREATE OR REPLACE VIEW v_kpis_complete AS
SELECT 
    p.id as period_id,
    p.name as period_name,
    p.type as period_type,
    p.start_date,
    p.end_date,
    
    -- Audit Control
    ac.nombre_rapports_gestion,
    ac.nombre_tableaux_bord,
    ac.nombre_missions_audit,
    ac.taux_mise_en_oeuvre_recommandations,
    ac.nombre_procedures_ameliorees,
    
    -- Relations Institutionnelles
    ri.nombre_reunions_ag_bureau_commissions,
    ri.nombre_conventions_partenariats,
    ri.nombre_pv_rapports,
    ri.nombre_relations_administrations,
    ri.taux_realisation_plan_action,
    
    -- Synthèse
    sd.opportunites_internationales,
    sd.demandes_traitees,
    sd.entreprises_accompagnees as synthese_entreprises,
    sd.prestations_realisees,
    
    -- Admin Financier
    af.assemblees_generales_organisees,
    af.prestations_logistiques,
    af.services_restauration,
    af.salles_mises_disposition,
    af.attestations_delivrees,
    af.locations_salles,
    af.services_agenda_organises,
    
    -- Appui Promotion
    ap.porteurs_projets_accompagnes,
    ap.createurs_entreprise_accompagnes,
    ap.entreprises_guichets_proximite,
    ap.demandes_administratives_traitees,
    ap.porteurs_projets_satisfaits,
    ap.entrepreneurs_satisfaits,
    ap.taux_satisfaction,
    ap.entrepreneurs_financement,
    ap.formations_employes,
    ap.entreprises_radiees,
    ap.entreprises_beneficiaires_services,
    
    -- Services Ressortissants
    sr.newsletters_editees,
    sr.demandes_ressortissants,
    sr.indicateurs_economiques_suivis,
    
    -- Stratégie Partenariat
    sp.actions_realisees,
    sp.ressortissants_satisfaits_evenements,
    sp.entreprises_potentiel_export,
    sp.entreprises_accompagnees as strategie_entreprises,
    sp.delegations,
    sp.opportunites_affaires_internationales
    
FROM kpi_periods p
LEFT JOIN kpi_audit_control ac ON p.id = ac.period_id
LEFT JOIN kpi_relations_institutionnelles ri ON p.id = ri.period_id
LEFT JOIN kpi_synthese_departements sd ON p.id = sd.period_id
LEFT JOIN kpi_admin_financier af ON p.id = af.period_id
LEFT JOIN kpi_appui_promotion ap ON p.id = ap.period_id
LEFT JOIN kpi_services_ressortissants sr ON p.id = sr.period_id
LEFT JOIN kpi_strategie_partenariat sp ON p.id = sp.period_id
ORDER BY p.start_date DESC;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE kpi_periods IS 'Reporting periods for KPI tracking';
COMMENT ON TABLE kpi_audit_control IS 'KPIs for Audit & Control department';
COMMENT ON TABLE kpi_relations_institutionnelles IS 'KPIs for Institutional Relations';
COMMENT ON TABLE kpi_synthese_departements IS 'Synthesis KPIs across departments';
COMMENT ON TABLE kpi_admin_financier IS 'KPIs for Administrative & Financial';
COMMENT ON TABLE kpi_appui_promotion IS 'KPIs for Business Support & Promotion';
COMMENT ON TABLE kpi_services_ressortissants IS 'KPIs for Services to Nationals';
COMMENT ON TABLE kpi_strategie_partenariat IS 'KPIs for Strategy & Partnership';
