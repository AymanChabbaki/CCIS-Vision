-- =====================================================
-- CCIS-Vision PostgreSQL Database Schema
-- Handles migration from decentralized Excel files
-- =====================================================

-- Enable UUID extension for better ID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS & AUTHENTICATION
-- =====================================================

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES 
    ('admin', 'Direction - Full access'),
    ('service_user', 'Department users - Can upload and manage data'),
    ('viewer', 'Read-only access');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER REFERENCES roles(id),
    full_name VARCHAR(255),
    department_id INTEGER, -- Will be referenced later
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. ORGANIZATIONAL STRUCTURE
-- =====================================================

CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'siege', 'annexe'
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert main locations
INSERT INTO locations (name, type, city) VALUES 
    ('Siège Régional Rabat', 'siege', 'Rabat'),
    ('Annexe Kénitra', 'annexe', 'Kénitra'),
    ('Annexe Khémisset', 'annexe', 'Khémisset');

CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    location_id INTEGER REFERENCES locations(id),
    parent_department_id INTEGER REFERENCES departments(id), -- For sub-services
    description TEXT,
    head_name VARCHAR(255), -- Department head
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert main departments
INSERT INTO departments (name, code, location_id, description) VALUES 
    ('Direction Régionale', 'DIR', 1, 'Regional Direction - Coordinates all departments'),
    ('Relations Institutionnelles', 'RI', 1, 'Managing relations with elected officials and public administrations'),
    ('Stratégie et Partenariat', 'SP', 1, 'Elaborating CCIS strategies and partnership implementation'),
    ('Appui et Promotion', 'AP', 1, 'Training, events, B2B meetings, economic monitoring'),
    ('Administratif et Financier', 'AF', 1, 'Accounting, personnel management, IT systems'),
    ('Services aux ressortissants et Veille économique', 'SV', 1, 'Member services, databases, communication'),
    ('Audit et Contrôle de Gestion', 'ACG', 1, 'Management reports, dashboards, internal audits');

-- Add foreign key constraint to users after departments table is created
ALTER TABLE users ADD CONSTRAINT fk_users_department 
    FOREIGN KEY (department_id) REFERENCES departments(id);

-- =====================================================
-- 3. COMPANIES/MEMBERS (RESSORTISSANTS)
-- =====================================================

CREATE TABLE company_sectors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    description TEXT
);

-- Common sectors in Morocco
INSERT INTO company_sectors (name, code) VALUES 
    ('Agriculture', 'AGR'),
    ('Industrie', 'IND'),
    ('Commerce', 'COM'),
    ('Services', 'SRV'),
    ('Tourisme', 'TOU'),
    ('Technologies', 'TEC'),
    ('Artisanat', 'ART'),
    ('BTP', 'BTP');

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Information (often messy in Excel)
    name VARCHAR(500) NOT NULL,
    legal_name VARCHAR(500), -- Official name vs common name
    ice VARCHAR(50), -- Identifiant Commun de l'Entreprise (Morocco)
    rc VARCHAR(100), -- Registre de Commerce
    patent_number VARCHAR(100), -- Numéro de patente
    tax_id VARCHAR(100), -- Identifiant Fiscal
    
    -- Classification
    sector_id INTEGER REFERENCES company_sectors(id),
    company_type VARCHAR(100), -- SARL, SA, Auto-entrepreneur, etc.
    size_category VARCHAR(50), -- TPE, PME, GE (Very Small, SME, Large)
    employee_count INTEGER,
    annual_revenue DECIMAL(15, 2),
    
    -- Contact Information (often duplicated/inconsistent in Excel)
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    fax VARCHAR(50),
    website VARCHAR(255),
    
    -- Address (may be incomplete in Excel)
    address TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 8), -- For map feature
    longitude DECIMAL(11, 8),
    
    -- Representative
    representative_name VARCHAR(255),
    representative_title VARCHAR(100),
    representative_email VARCHAR(255),
    representative_phone VARCHAR(50),
    
    -- Status & Membership
    is_member BOOLEAN DEFAULT FALSE,
    membership_date DATE,
    membership_status VARCHAR(50), -- 'active', 'inactive', 'suspended'
    
    -- Data Quality Tracking (important for messy Excel migration)
    data_quality_score INTEGER, -- 0-100 based on completeness
    needs_verification BOOLEAN DEFAULT FALSE,
    verification_notes TEXT,
    duplicate_of UUID REFERENCES companies(id), -- Track potential duplicates
    
    -- Audit fields
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for searching and deduplication
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_ice ON companies(ice);
CREATE INDEX idx_companies_sector ON companies(sector_id);
CREATE INDEX idx_companies_city ON companies(city);

-- =====================================================
-- 4. ACTIVITIES MODULE
-- =====================================================

-- Activity Categories
CREATE TABLE activity_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    icon VARCHAR(100) -- For UI
);

INSERT INTO activity_types (name, code, description) VALUES 
    ('Formation', 'FORM', 'Training programs and workshops'),
    ('Événement', 'EVENT', 'Events, seminars, conferences, B2B meetings'),
    ('Projet', 'PROJ', 'Development projects and partnerships'),
    ('Service', 'SERV', 'Services provided to companies (assistance, mediation, etc.)'),
    ('Mission', 'MISS', 'International prospecting missions'),
    ('Étude', 'STUD', 'Market studies and research');

-- Main Activities Table
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic Information
    title VARCHAR(500) NOT NULL,
    description TEXT,
    activity_type_id INTEGER REFERENCES activity_types(id),
    department_id INTEGER REFERENCES departments(id),
    
    -- Dates (Excel often has inconsistent date formats)
    start_date DATE,
    end_date DATE,
    registration_deadline DATE,
    
    -- Location
    location_id INTEGER REFERENCES locations(id),
    venue_name VARCHAR(255),
    venue_address TEXT,
    is_online BOOLEAN DEFAULT FALSE,
    
    -- Capacity & Participants
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    waiting_list_count INTEGER DEFAULT 0,
    
    -- Financial
    budget_allocated DECIMAL(15, 2),
    budget_spent DECIMAL(15, 2),
    cost_per_participant DECIMAL(10, 2),
    is_free BOOLEAN DEFAULT FALSE,
    participation_fee DECIMAL(10, 2),
    
    -- Status
    status VARCHAR(50) NOT NULL, -- 'planned', 'ongoing', 'completed', 'cancelled'
    completion_percentage INTEGER DEFAULT 0,
    
    -- Results & Impact (filled after completion)
    actual_participants INTEGER,
    satisfaction_score DECIMAL(3, 2), -- Average score from surveys
    impact_notes TEXT,
    
    -- Partners (stored as JSON for flexibility)
    partners JSONB,
    
    -- Files & Documents
    documents_path TEXT, -- Path to uploaded files
    
    -- Historization - Track changes
    version INTEGER DEFAULT 1,
    previous_version_id UUID REFERENCES activities(id),
    
    -- Audit
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activities_type ON activities(activity_type_id);
CREATE INDEX idx_activities_department ON activities(department_id);
CREATE INDEX idx_activities_dates ON activities(start_date, end_date);
CREATE INDEX idx_activities_status ON activities(status);

-- =====================================================
-- 5. FORMATIONS (TRAINING) - Detailed tracking
-- =====================================================

CREATE TABLE training_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT
);

INSERT INTO training_categories (name) VALUES 
    ('Management'),
    ('Digital & Technologies'),
    ('Finance & Comptabilité'),
    ('Marketing & Commerce'),
    ('Ressources Humaines'),
    ('Qualité & Normes'),
    ('Juridique & Fiscal'),
    ('Langues'),
    ('Export & International');

CREATE TABLE formations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
    
    -- Training Specific Fields
    category_id INTEGER REFERENCES training_categories(id),
    level VARCHAR(50), -- 'débutant', 'intermédiaire', 'avancé'
    duration_hours DECIMAL(5, 1),
    language VARCHAR(50),
    
    -- Trainer Information
    trainer_name VARCHAR(255),
    trainer_organization VARCHAR(255),
    trainer_bio TEXT,
    
    -- Certification
    provides_certificate BOOLEAN DEFAULT FALSE,
    certificate_type VARCHAR(255),
    
    -- Requirements
    prerequisites TEXT,
    target_audience TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 6. PARTICIPANTS & BENEFICIARIES
-- =====================================================

CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Personal Information
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    
    -- Professional Information
    company_id UUID REFERENCES companies(id),
    job_title VARCHAR(255),
    department VARCHAR(255),
    
    -- Registration for activity
    activity_id UUID REFERENCES activities(id),
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registration_status VARCHAR(50), -- 'registered', 'confirmed', 'attended', 'cancelled', 'no-show'
    
    -- Participation details
    attendance_confirmed BOOLEAN DEFAULT FALSE,
    attendance_date TIMESTAMP,
    certificate_issued BOOLEAN DEFAULT FALSE,
    
    -- Feedback
    satisfaction_rating INTEGER, -- 1-5 stars
    feedback_comments TEXT,
    feedback_date TIMESTAMP,
    
    -- Tracking duplicates from Excel
    source_file VARCHAR(255), -- Original Excel file name
    source_row INTEGER, -- Original row number in Excel
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_participant_activity UNIQUE (email, activity_id)
);

CREATE INDEX idx_participants_activity ON participants(activity_id);
CREATE INDEX idx_participants_company ON participants(company_id);
CREATE INDEX idx_participants_email ON participants(email);

-- =====================================================
-- 7. PARTNERSHIPS & COLLABORATIONS
-- =====================================================

CREATE TABLE partner_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

INSERT INTO partner_types (name) VALUES 
    ('Institution publique'),
    ('Organisation professionnelle'),
    ('Établissement de formation'),
    ('Entreprise privée'),
    ('ONG'),
    ('Université'),
    ('Organisme international');

CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    name VARCHAR(500) NOT NULL,
    partner_type_id INTEGER REFERENCES partner_types(id),
    
    -- Contact
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    website VARCHAR(255),
    
    -- Relationship
    partnership_start_date DATE,
    partnership_status VARCHAR(50), -- 'active', 'inactive', 'suspended'
    
    description TEXT,
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activity_partners (
    activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
    contribution_type VARCHAR(255), -- 'financial', 'expertise', 'venue', 'materials', etc.
    contribution_amount DECIMAL(15, 2),
    notes TEXT,
    PRIMARY KEY (activity_id, partner_id)
);

-- =====================================================
-- 8. SERVICES PROVIDED TO COMPANIES
-- =====================================================

CREATE TABLE service_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    category VARCHAR(100), -- 'assistance', 'mediation', 'study', etc.
    description TEXT
);

INSERT INTO service_types (name, code, category) VALUES 
    ('Assistance fiscale', 'ASS-FISC', 'assistance'),
    ('Assistance juridique', 'ASS-JUR', 'assistance'),
    ('Assistance technique', 'ASS-TECH', 'assistance'),
    ('Étude de marché', 'ETUDE-MARCH', 'étude'),
    ('Prospection internationale', 'PROSP-INT', 'développement'),
    ('Médiation commerciale', 'MED-COM', 'mediation'),
    ('Arbitrage', 'ARB', 'mediation'),
    ('Comptabilité agréée (CGC)', 'CGC', 'comptabilité');

CREATE TABLE services_provided (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    service_type_id INTEGER REFERENCES service_types(id),
    company_id UUID REFERENCES companies(id),
    department_id INTEGER REFERENCES departments(id),
    
    -- Request details
    request_date DATE NOT NULL,
    request_description TEXT,
    
    -- Processing
    assigned_to UUID REFERENCES users(id),
    status VARCHAR(50), -- 'pending', 'in_progress', 'completed', 'cancelled'
    priority VARCHAR(20), -- 'low', 'medium', 'high', 'urgent'
    
    start_date DATE,
    completion_date DATE,
    
    -- Financial
    cost DECIMAL(10, 2),
    paid BOOLEAN DEFAULT FALSE,
    payment_date DATE,
    
    -- Results
    outcome TEXT,
    satisfaction_rating INTEGER,
    
    -- Follow-up
    requires_followup BOOLEAN DEFAULT FALSE,
    followup_date DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_services_company ON services_provided(company_id);
CREATE INDEX idx_services_status ON services_provided(status);
CREATE INDEX idx_services_date ON services_provided(request_date);

-- =====================================================
-- 9. BUDGET & FINANCIAL TRACKING
-- =====================================================

CREATE TABLE budget_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    parent_category_id INTEGER REFERENCES budget_categories(id),
    description TEXT
);

INSERT INTO budget_categories (name, code) VALUES 
    ('Formation', 'FORM'),
    ('Événements', 'EVENT'),
    ('Communication', 'COMM'),
    ('Études', 'ETUDE'),
    ('Personnel', 'PERS'),
    ('Fonctionnement', 'FONC'),
    ('Investissement', 'INV');

CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    fiscal_year INTEGER NOT NULL,
    department_id INTEGER REFERENCES departments(id),
    category_id INTEGER REFERENCES budget_categories(id),
    
    allocated_amount DECIMAL(15, 2) NOT NULL,
    spent_amount DECIMAL(15, 2) DEFAULT 0,
    committed_amount DECIMAL(15, 2) DEFAULT 0, -- Engagements
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_budget UNIQUE (fiscal_year, department_id, category_id)
);

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    budget_id UUID REFERENCES budgets(id),
    activity_id UUID REFERENCES activities(id), -- Optional: link to activity
    
    expense_date DATE NOT NULL,
    description VARCHAR(500) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    
    supplier VARCHAR(255),
    invoice_number VARCHAR(100),
    payment_status VARCHAR(50), -- 'pending', 'paid', 'cancelled'
    payment_date DATE,
    
    approved_by UUID REFERENCES users(id),
    approval_date DATE,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expenses_budget ON expenses(budget_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);

-- =====================================================
-- 10. EXCEL IMPORT & DATA QUALITY
-- =====================================================

-- Track imported Excel files
CREATE TABLE import_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    filename VARCHAR(500) NOT NULL,
    file_hash VARCHAR(64), -- MD5/SHA256 to detect duplicate imports
    file_size BIGINT,
    
    sheet_name VARCHAR(255),
    data_type VARCHAR(100), -- 'companies', 'activities', 'participants', etc.
    
    uploaded_by UUID REFERENCES users(id),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Processing results
    status VARCHAR(50), -- 'pending', 'processing', 'completed', 'failed'
    total_rows INTEGER,
    rows_imported INTEGER,
    rows_skipped INTEGER,
    rows_with_errors INTEGER,
    
    error_log TEXT, -- JSON array of errors
    warnings_log TEXT, -- JSON array of warnings
    
    processing_started_at TIMESTAMP,
    processing_completed_at TIMESTAMP,
    
    notes TEXT
);

-- Store raw Excel data before cleaning (for backup/audit)
CREATE TABLE raw_excel_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    import_log_id UUID REFERENCES import_logs(id),
    
    row_number INTEGER,
    raw_data JSONB, -- Store entire row as JSON
    
    status VARCHAR(50), -- 'pending', 'processed', 'error', 'duplicate'
    error_message TEXT,
    
    mapped_entity_type VARCHAR(100), -- 'company', 'activity', etc.
    mapped_entity_id UUID, -- Reference to created entity
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_raw_excel_import ON raw_excel_data(import_log_id);

-- =====================================================
-- 11. DATA QUALITY & VALIDATION
-- =====================================================

CREATE TABLE data_quality_rules (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(100) NOT NULL, -- 'company', 'activity', 'participant'
    field_name VARCHAR(100) NOT NULL,
    
    rule_type VARCHAR(50), -- 'required', 'format', 'range', 'unique', 'reference'
    validation_pattern TEXT, -- Regex or rule definition
    error_message TEXT,
    
    is_active BOOLEAN DEFAULT TRUE,
    severity VARCHAR(20), -- 'error', 'warning', 'info'
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert common validation rules
INSERT INTO data_quality_rules (entity_type, field_name, rule_type, error_message, severity) VALUES 
    ('company', 'name', 'required', 'Le nom de l''entreprise est obligatoire', 'error'),
    ('company', 'ice', 'format', 'Le format ICE est invalide (15 chiffres)', 'warning'),
    ('company', 'email', 'format', 'Format email invalide', 'warning'),
    ('activity', 'title', 'required', 'Le titre de l''activité est obligatoire', 'error'),
    ('activity', 'start_date', 'required', 'La date de début est obligatoire', 'error');

CREATE TABLE data_quality_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    field_name VARCHAR(100),
    
    rule_id INTEGER REFERENCES data_quality_rules(id),
    issue_description TEXT,
    severity VARCHAR(20),
    
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'resolved', 'ignored'
    
    detected_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_date TIMESTAMP,
    resolved_by UUID REFERENCES users(id),
    resolution_notes TEXT
);

CREATE INDEX idx_quality_issues_entity ON data_quality_issues(entity_type, entity_id);
CREATE INDEX idx_quality_issues_status ON data_quality_issues(status);

-- =====================================================
-- 12. HISTORY & AUDIT TRAIL (for Data Historization)
-- =====================================================

-- Generic audit table for all changes
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    
    old_values JSONB, -- Previous state
    new_values JSONB, -- New state
    changed_fields TEXT[], -- Array of changed field names
    
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_audit_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_user ON audit_log(changed_by);
CREATE INDEX idx_audit_date ON audit_log(changed_at);

-- =====================================================
-- 13. ALERTS & NOTIFICATIONS
-- =====================================================

CREATE TABLE alert_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    default_threshold DECIMAL(15, 2),
    is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO alert_types (name, description, default_threshold) VALUES 
    ('Budget dépassé', 'Alerte quand le budget est dépassé', 100.00),
    ('Budget proche limite', 'Alerte à 90% du budget', 90.00),
    ('Capacité atteinte', 'Activité complète', 100.00),
    ('Date limite proche', 'Échéance approche (7 jours)', NULL),
    ('Données incomplètes', 'Score qualité < 50%', 50.00);

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    alert_type_id INTEGER REFERENCES alert_types(id),
    
    entity_type VARCHAR(100), -- 'activity', 'budget', 'company', etc.
    entity_id UUID,
    
    title VARCHAR(500) NOT NULL,
    message TEXT,
    severity VARCHAR(20), -- 'info', 'warning', 'critical'
    
    threshold_value DECIMAL(15, 2),
    current_value DECIMAL(15, 2),
    
    is_active BOOLEAN DEFAULT TRUE,
    is_read BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP,
    read_by UUID REFERENCES users(id)
);

CREATE TABLE alert_recipients (
    alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notification_method VARCHAR(50), -- 'email', 'sms', 'in_app'
    notified_at TIMESTAMP,
    PRIMARY KEY (alert_id, user_id)
);

-- =====================================================
-- 14. STATISTICS & KPIs (for Dashboard)
-- =====================================================

CREATE TABLE kpi_definitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    calculation_formula TEXT,
    unit VARCHAR(50), -- 'number', 'percentage', 'currency', etc.
    category VARCHAR(100)
);

INSERT INTO kpi_definitions (name, code, category, unit) VALUES 
    ('Nombre total d''entreprises aidées', 'TOTAL_COMPANIES', 'impact', 'number'),
    ('Nombre de formations réalisées', 'TOTAL_FORMATIONS', 'activities', 'number'),
    ('Taux de satisfaction moyen', 'AVG_SATISFACTION', 'quality', 'percentage'),
    ('Budget utilisé', 'BUDGET_USED', 'financial', 'currency'),
    ('Nombre de bénéficiaires', 'TOTAL_BENEFICIARIES', 'impact', 'number');

-- Materialized view for performance (refresh periodically)
CREATE MATERIALIZED VIEW dashboard_stats AS
SELECT 
    COUNT(DISTINCT c.id) as total_companies,
    COUNT(DISTINCT CASE WHEN c.is_member THEN c.id END) as member_companies,
    COUNT(DISTINCT a.id) as total_activities,
    COUNT(DISTINCT CASE WHEN a.activity_type_id = 1 THEN a.id END) as total_formations,
    COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_activities,
    COUNT(DISTINCT p.id) as total_participants,
    COALESCE(AVG(p.satisfaction_rating), 0) as avg_satisfaction,
    COALESCE(SUM(b.allocated_amount), 0) as total_budget_allocated,
    COALESCE(SUM(b.spent_amount), 0) as total_budget_spent,
    COALESCE(SUM(e.amount), 0) as total_expenses,
    CURRENT_TIMESTAMP as last_updated
FROM companies c
FULL OUTER JOIN activities a ON TRUE
FULL OUTER JOIN participants p ON TRUE
FULL OUTER JOIN budgets b ON TRUE
FULL OUTER JOIN expenses e ON TRUE;

-- Refresh index for materialized view
CREATE UNIQUE INDEX ON dashboard_stats ((last_updated));

-- =====================================================
-- 15. USEFUL VIEWS FOR COMMON QUERIES
-- =====================================================

-- View: Complete company information with quality score
CREATE VIEW v_companies_with_quality AS
SELECT 
    c.*,
    cs.name as sector_name,
    -- Calculate data quality score based on completeness
    (
        (CASE WHEN c.name IS NOT NULL AND LENGTH(c.name) > 0 THEN 10 ELSE 0 END) +
        (CASE WHEN c.ice IS NOT NULL THEN 15 ELSE 0 END) +
        (CASE WHEN c.email IS NOT NULL THEN 10 ELSE 0 END) +
        (CASE WHEN c.phone IS NOT NULL THEN 10 ELSE 0 END) +
        (CASE WHEN c.address IS NOT NULL THEN 10 ELSE 0 END) +
        (CASE WHEN c.city IS NOT NULL THEN 10 ELSE 0 END) +
        (CASE WHEN c.sector_id IS NOT NULL THEN 10 ELSE 0 END) +
        (CASE WHEN c.employee_count IS NOT NULL THEN 5 ELSE 0 END) +
        (CASE WHEN c.latitude IS NOT NULL AND c.longitude IS NOT NULL THEN 10 ELSE 0 END) +
        (CASE WHEN c.representative_name IS NOT NULL THEN 10 ELSE 0 END)
    ) as calculated_quality_score,
    COUNT(dqi.id) as open_quality_issues
FROM companies c
LEFT JOIN company_sectors cs ON c.sector_id = cs.id
LEFT JOIN data_quality_issues dqi ON dqi.entity_id = c.id AND dqi.status = 'open'
GROUP BY c.id, cs.name;

-- View: Activities with participant counts and budget info
CREATE VIEW v_activities_summary AS
SELECT 
    a.*,
    at.name as activity_type_name,
    d.name as department_name,
    l.name as location_name,
    COUNT(DISTINCT p.id) as total_participants,
    COUNT(DISTINCT CASE WHEN p.attendance_confirmed THEN p.id END) as confirmed_participants,
    COALESCE(AVG(p.satisfaction_rating), 0) as avg_satisfaction,
    (a.budget_spent / NULLIF(a.budget_allocated, 0) * 100) as budget_usage_percentage
FROM activities a
LEFT JOIN activity_types at ON a.activity_type_id = at.id
LEFT JOIN departments d ON a.department_id = d.id
LEFT JOIN locations l ON a.location_id = l.id
LEFT JOIN participants p ON p.activity_id = a.id
GROUP BY a.id, at.name, d.name, l.name;

-- View: Monthly activity statistics
CREATE VIEW v_monthly_statistics AS
SELECT 
    DATE_TRUNC('month', a.start_date) as month,
    COUNT(*) as total_activities,
    COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_activities,
    SUM(a.budget_allocated) as total_budget,
    SUM(a.budget_spent) as total_spent,
    COUNT(DISTINCT p.id) as total_participants
FROM activities a
LEFT JOIN participants p ON p.activity_id = a.id
WHERE a.start_date IS NOT NULL
GROUP BY DATE_TRUNC('month', a.start_date)
ORDER BY month DESC;

-- =====================================================
-- 16. TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services_provided
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Apply audit triggers to key tables (optional - can be performance intensive)
-- Uncomment if full audit trail is needed:
-- CREATE TRIGGER audit_companies AFTER INSERT OR UPDATE OR DELETE ON companies
--     FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- CREATE TRIGGER audit_activities AFTER INSERT OR UPDATE OR DELETE ON activities
--     FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- =====================================================
-- 17. HELPER FUNCTIONS
-- =====================================================

-- Function to calculate company data quality score
CREATE OR REPLACE FUNCTION calculate_company_quality_score(company_uuid UUID)
RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql;

-- Function to detect potential duplicate companies
CREATE OR REPLACE FUNCTION find_duplicate_companies(company_name VARCHAR, company_ice VARCHAR DEFAULT NULL)
RETURNS TABLE(id UUID, name VARCHAR, ice VARCHAR, similarity_score INTEGER) AS $$
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
$$ LANGUAGE plpgsql;

-- =====================================================
-- 18. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE companies IS 'Central table for all companies/members. Handles messy Excel data with quality tracking.';
COMMENT ON TABLE activities IS 'Main table for all types of activities (formations, events, projects, services). Includes historization via version field.';
COMMENT ON TABLE import_logs IS 'Tracks all Excel file imports with detailed error/warning logs for data quality monitoring.';
COMMENT ON TABLE raw_excel_data IS 'Stores raw Excel data before processing - enables audit trail and reprocessing if needed.';
COMMENT ON TABLE data_quality_issues IS 'Tracks data quality problems detected during import or validation.';
COMMENT ON TABLE audit_log IS 'Complete audit trail of all changes to critical data.';

-- =====================================================
-- 19. INDEXES FOR PERFORMANCE
-- =====================================================

-- Full-text search indexes for searching companies
CREATE INDEX idx_companies_name_trgm ON companies USING gin(name gin_trgm_ops);
-- Note: Requires pg_trgm extension: CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Composite indexes for common queries
CREATE INDEX idx_activities_type_status ON activities(activity_type_id, status);
CREATE INDEX idx_activities_department_dates ON activities(department_id, start_date, end_date);
CREATE INDEX idx_participants_activity_status ON participants(activity_id, registration_status);

-- =====================================================
-- END OF SCHEMA
-- =====================================================
