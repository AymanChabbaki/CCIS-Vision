-- =====================================================
-- CCIS-Vision Database Seed Data
-- Populate database with sample data for testing
-- =====================================================

-- Clear existing data (in reverse order of dependencies)
TRUNCATE TABLE audit_log CASCADE;
TRUNCATE TABLE alerts, alert_recipients CASCADE;
TRUNCATE TABLE expenses CASCADE;
TRUNCATE TABLE budgets CASCADE;
TRUNCATE TABLE services_provided CASCADE;
TRUNCATE TABLE activity_partners CASCADE;
TRUNCATE TABLE partners CASCADE;
TRUNCATE TABLE participants CASCADE;
TRUNCATE TABLE formations CASCADE;
TRUNCATE TABLE activities CASCADE;
TRUNCATE TABLE companies CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE import_logs, raw_excel_data CASCADE;
TRUNCATE TABLE data_quality_issues CASCADE;

-- =====================================================
-- 1. USERS (Sample users for testing)
-- =====================================================

-- Password: Admin123! (hashed with bcryptjs, 12 salt rounds)
-- Hash: $2a$12$aUQDOU9pDXf1R2KIVLJTEuqTDz3xEo6SmKKisZBe4/tiut99aly.y

INSERT INTO users (username, email, password_hash, role_id, full_name, department_id, is_active) VALUES 
    ('ayman', 'ayman@ccis.ma', '$2a$12$aUQDOU9pDXf1R2KIVLJTEuqTDz3xEo6SmKKisZBe4/tiut99aly.y', 1, 'Ayman Benali', 1, true),
    ('sarah.admin', 'sarah@ccis.ma', '$2a$12$aUQDOU9pDXf1R2KIVLJTEuqTDz3xEo6SmKKisZBe4/tiut99aly.y', 1, 'Sarah Alami', 2, true),
    ('karim.service', 'karim@ccis.ma', '$2a$12$aUQDOU9pDXf1R2KIVLJTEuqTDz3xEo6SmKKisZBe4/tiut99aly.y', 2, 'Karim El Fassi', 4, true),
    ('fatima.service', 'fatima@ccis.ma', '$2a$12$aUQDOU9pDXf1R2KIVLJTEuqTDz3xEo6SmKKisZBe4/tiut99aly.y', 2, 'Fatima Bennani', 6, true),
    ('viewer.user', 'viewer@ccis.ma', '$2a$12$aUQDOU9pDXf1R2KIVLJTEuqTDz3xEo6SmKKisZBe4/tiut99aly.y', 3, 'Ahmed Tazi', NULL, true);

-- =====================================================
-- 2. COMPANIES (Moroccan companies)
-- =====================================================

INSERT INTO companies (name, legal_name, ice, rc, email, phone, mobile, address, city, province, postal_code, sector_id, company_type, size_category, employee_count, annual_revenue, is_member, membership_status, membership_date, representative_name, representative_title, representative_email, representative_phone, data_quality_score, latitude, longitude) VALUES 
    -- Technology Companies
    ('TechHub Maroc SARL', 'TechHub Maroc Société à Responsabilité Limitée', '002345678901234', 'RC567890', 'contact@techhub.ma', '0537654321', '0661234567', '25 Avenue Hassan II', 'Rabat', 'Rabat', '10000', 6, 'SARL', 'PME', 45, 8500000, true, 'active', '2024-01-15', 'Youssef Kabbaj', 'Directeur Général', 'y.kabbaj@techhub.ma', '0661234567', 95, 33.9716, -6.8498),
    
    ('Digital Solutions SA', 'Digital Solutions Société Anonyme', '002345678901235', 'RC567891', 'info@digitalsol.ma', '0537654322', '0661234568', '78 Boulevard Mohammed V', 'Rabat', 'Rabat', '10000', 6, 'SA', 'PME', 65, 12000000, true, 'active', '2023-06-20', 'Leila Benjelloun', 'CEO', 'l.benjelloun@digitalsol.ma', '0661234568', 92, 33.9715, -6.8497),
    
    ('InnovIT Morocco', 'InnovIT Morocco SARL', '002345678901236', 'RC567892', 'contact@innovit.ma', '0537654323', '0661234569', '12 Rue Patrice Lumumba', 'Rabat', 'Rabat', '10000', 6, 'SARL', 'TPE', 12, 2500000, true, 'active', '2025-03-10', 'Mehdi Alaoui', 'Gérant', 'm.alaoui@innovit.ma', '0661234569', 88, 33.9714, -6.8496),
    
    -- Industrial Companies
    ('Manufacture Atlas SARL', 'Manufacture Atlas Société à Responsabilité Limitée', '002345678901237', 'RC567893', 'contact@atlas-manuf.ma', '0537789012', '0662345678', 'Zone Industrielle Technopolis', 'Salé', 'Salé', '11000', 2, 'SARL', 'PME', 120, 25000000, true, 'active', '2022-09-05', 'Rachid Tazi', 'Directeur Général', 'r.tazi@atlas-manuf.ma', '0662345678', 90, 34.0209, -6.8416),
    
    ('Textile Moderne SA', 'Textile Moderne Société Anonyme', '002345678901238', 'RC567894', 'info@textile-moderne.ma', '0537789013', '0662345679', 'Rue de l''Industrie, Zone Industrielle', 'Kénitra', 'Kénitra', '14000', 2, 'SA', 'GE', 350, 85000000, true, 'active', '2021-04-12', 'Nadia El Amrani', 'Présidente', 'n.elamrani@textile-moderne.ma', '0662345679', 94, 34.2549, -6.5890),
    
    -- Commerce Companies
    ('Distribution Plus SARL', 'Distribution Plus Société à Responsabilité Limitée', '002345678901239', 'RC567895', 'contact@distplus.ma', '0537890123', '0663456789', '45 Avenue Allal Ben Abdellah', 'Rabat', 'Rabat', '10000', 3, 'SARL', 'PME', 85, 18000000, true, 'active', '2023-11-20', 'Omar Bennis', 'Directeur', 'o.bennis@distplus.ma', '0663456789', 87, 33.9713, -6.8495),
    
    ('Commerce International Maroc', 'Commerce International Maroc SA', '002345678901240', 'RC567896', 'info@cim-maroc.ma', '0537890124', '0663456790', '90 Boulevard Zerktouni', 'Rabat', 'Rabat', '10000', 3, 'SA', 'PME', 55, 15000000, true, 'active', '2024-07-08', 'Samira Lazrak', 'Directrice Générale', 's.lazrak@cim-maroc.ma', '0663456790', 91, 33.9712, -6.8494),
    
    -- Services Companies
    ('Conseil & Stratégie SARL', 'Conseil & Stratégie Société à Responsabilité Limitée', '002345678901241', 'RC567897', 'contact@conseil-strategie.ma', '0537901234', '0664567890', '33 Rue Oqba', 'Rabat', 'Rabat', '10000', 4, 'SARL', 'TPE', 18, 3500000, true, 'active', '2025-01-15', 'Hicham Fassi', 'Gérant', 'h.fassi@conseil-strategie.ma', '0664567890', 85, 33.9711, -6.8493),
    
    ('Services Pro Morocco', 'Services Pro Morocco SARL', '002345678901242', 'RC567898', 'info@servicespro.ma', '0537901235', '0664567891', '67 Avenue de France', 'Rabat', 'Rabat', '10000', 4, 'SARL', 'PME', 42, 7500000, true, 'active', '2024-05-22', 'Zineb Chraibi', 'Directrice', 'z.chraibi@servicespro.ma', '0664567891', 89, 33.9710, -6.8492),
    
    -- Tourism Companies
    ('Voyages Premium SARL', 'Voyages Premium Société à Responsabilité Limitée', '002345678901243', 'RC567899', 'contact@voyagespremium.ma', '0537012345', '0665678901', '11 Avenue Mohammed VI', 'Rabat', 'Rabat', '10000', 5, 'SARL', 'TPE', 15, 2800000, true, 'active', '2023-08-14', 'Kamal Idrissi', 'Gérant', 'k.idrissi@voyagespremium.ma', '0665678901', 86, 33.9709, -6.8491),
    
    -- Agriculture Companies
    ('Agro Invest SARL', 'Agro Invest Société à Responsabilité Limitée', '002345678901244', 'RC567900', 'contact@agroinvest.ma', '0537012346', '0665678902', 'Douar El Karma, Route de Kénitra', 'Salé', 'Salé', '11000', 1, 'SARL', 'PME', 75, 12000000, true, 'active', '2023-02-28', 'Hassan Squalli', 'Directeur', 'h.squalli@agroinvest.ma', '0665678902', 83, 34.0308, -6.8315),
    
    -- BTP Companies
    ('Construction Moderne SARL', 'Construction Moderne Société à Responsabilité Limitée', '002345678901245', 'RC567901', 'info@construct-moderne.ma', '0537123456', '0666789012', '88 Boulevard Al Qods', 'Rabat', 'Rabat', '10000', 8, 'SARL', 'PME', 95, 22000000, true, 'active', '2022-12-10', 'Jamal Lahlou', 'Directeur Général', 'j.lahlou@construct-moderne.ma', '0666789012', 93, 33.9708, -6.8490),
    
    ('BTP Excellence SA', 'BTP Excellence Société Anonyme', '002345678901246', 'RC567902', 'contact@btp-excellence.ma', '0537123457', '0666789013', 'Zone Industrielle, Lot 45', 'Kénitra', 'Kénitra', '14000', 8, 'SA', 'GE', 280, 75000000, true, 'active', '2021-07-19', 'Amina Berrada', 'Présidente', 'a.berrada@btp-excellence.ma', '0666789013', 96, 34.2650, -6.5790),
    
    -- Artisanat Companies
    ('Artisanat Marocain SARL', 'Artisanat Marocain Société à Responsabilité Limitée', '002345678901247', 'RC567903', 'contact@artisanat-maroc.ma', '0537234567', '0667890123', '5 Rue des Consuls', 'Rabat', 'Rabat', '10000', 7, 'SARL', 'TPE', 8, 1500000, true, 'active', '2024-09-05', 'Mohammed Lamrani', 'Gérant', 'm.lamrani@artisanat-maroc.ma', '0667890123', 78, 33.9707, -6.8489),
    
    -- Non-member companies
    ('Start-Up Tech', 'Start-Up Tech SARL', '002345678901248', 'RC567904', 'info@startup-tech.ma', '0537234568', '0667890124', '15 Rue Abou Inane', 'Rabat', 'Rabat', '10000', 6, 'SARL', 'TPE', 6, 800000, false, 'potential', NULL, 'Yousra Amrani', 'Gérante', 'y.amrani@startup-tech.ma', '0667890124', 65, 33.9706, -6.8488),
    
    ('Commerce Local', 'Commerce Local', '002345678901249', 'RC567905', 'contact@commerce-local.ma', '0537234569', '0667890125', '22 Avenue Bir Anzarane', 'Salé', 'Salé', '11000', 3, 'Auto-entrepreneur', 'TPE', 3, 450000, false, 'inactive', NULL, 'Khalid Ziani', 'Propriétaire', 'k.ziani@commerce-local.ma', '0667890125', 55, 34.0407, -6.8214);

-- =====================================================
-- 3. ACTIVITIES (Formations, Events, Projects)
-- =====================================================

INSERT INTO activities (title, description, activity_type_id, department_id, start_date, end_date, registration_deadline, location_id, venue_name, is_online, max_participants, current_participants, budget_allocated, budget_spent, is_free, participation_fee, status, actual_participants, satisfaction_score, completion_percentage) VALUES 
    -- Completed Formations
    ('Formation Marketing Digital 2025', 'Formation intensive sur les stratégies de marketing digital pour les PME', 1, 4, '2025-01-15', '2025-01-17', '2025-01-10', 1, 'Salle de conférence - Siège CCIS', false, 30, 28, 25000, 23500, false, 500, 'completed', 28, 4.5, 100),
    
    ('Comptabilité et Gestion Financière', 'Formation sur les bases de la comptabilité et la gestion financière pour entrepreneurs', 1, 4, '2025-02-10', '2025-02-12', '2025-02-05', 1, 'Salle de formation - Siège CCIS', false, 25, 22, 18000, 17200, false, 400, 'completed', 22, 4.3, 100),
    
    ('Export et Commerce International', 'Maîtriser les techniques d''exportation et le commerce international', 1, 4, '2024-11-20', '2024-11-22', '2024-11-15', 1, 'Centre de formation CCIS', false, 20, 18, 22000, 20800, false, 600, 'completed', 18, 4.7, 100),
    
    -- Ongoing Activities
    ('Transformation Digitale des Entreprises', 'Programme d''accompagnement pour la digitalisation des PME', 1, 4, '2026-01-20', '2026-01-24', '2026-01-15', 1, 'Salle multimédia - Siège CCIS', true, 35, 32, 30000, 15000, false, 450, 'ongoing', NULL, NULL, 60),
    
    ('Management et Leadership', 'Développer ses compétences en management et leadership', 1, 4, '2026-02-05', '2026-02-07', '2026-01-30', 2, 'Annexe Kénitra', false, 20, 18, 20000, 8000, false, 500, 'ongoing', NULL, NULL, 40),
    
    -- Planned Activities
    ('Stratégies de Développement Commercial', 'Techniques avancées pour développer son activité commerciale', 1, 4, '2026-03-10', '2026-03-12', '2026-03-05', 1, 'Siège CCIS Rabat', false, 30, 0, 22000, 0, false, 400, 'planned', NULL, NULL, 0),
    
    ('Fiscalité des Entreprises 2026', 'Mise à jour sur la fiscalité et les nouvelles réglementations', 1, 4, '2026-03-20', '2026-03-21', '2026-03-15', 1, 'Salle de conférence', false, 40, 0, 15000, 0, true, 0, 'planned', NULL, NULL, 0),
    
    -- Events
    ('Salon B2B - Rabat-Salé-Kénitra 2026', 'Rencontres B2B pour favoriser les partenariats entre entreprises de la région', 2, 4, '2026-04-15', '2026-04-17', '2026-04-10', 1, 'Palais des Congrès Rabat', false, 200, 0, 150000, 0, false, 1000, 'planned', NULL, NULL, 0),
    
    ('Conférence Innovation et Entrepreneuriat', 'Grande conférence sur l''innovation et l''entrepreneuriat au Maroc', 2, 2, '2026-05-20', '2026-05-20', '2026-05-15', 1, 'Théâtre Mohammed V', false, 300, 0, 80000, 0, true, 0, 'planned', NULL, NULL, 0),
    
    ('Forum Investissement RSK 2026', 'Forum régional pour attirer les investissements dans la région', 2, 3, '2026-06-10', '2026-06-11', '2026-06-05', 1, 'Hôtel Hilton Rabat', false, 150, 0, 200000, 0, false, 2000, 'planned', NULL, NULL, 0),
    
    -- Services/Missions
    ('Mission Prospection Europe', 'Mission de prospection commerciale en Europe (France, Espagne, Allemagne)', 5, 3, '2026-07-15', '2026-07-25', '2026-07-01', NULL, 'Paris, Madrid, Berlin', false, 15, 0, 120000, 0, false, 5000, 'planned', NULL, NULL, 0),
    
    ('Mission Prospection Afrique', 'Mission commerciale vers les pays d''Afrique de l''Ouest', 5, 3, '2025-12-10', '2025-12-20', '2025-12-01', NULL, 'Dakar, Abidjan, Lagos', false, 12, 10, 100000, 85000, false, 6000, 'completed', 10, 4.2, 100);

-- =====================================================
-- 4. FORMATIONS (Training-specific details)
-- =====================================================

INSERT INTO formations (activity_id, category_id, level, duration_hours, language, trainer_name, trainer_organization, provides_certificate, certificate_type, prerequisites, target_audience) 
SELECT 
    a.id,
    CASE 
        WHEN a.title LIKE '%Marketing%' THEN 4
        WHEN a.title LIKE '%Comptabilité%' OR a.title LIKE '%Financière%' THEN 3
        WHEN a.title LIKE '%Export%' THEN 9
        WHEN a.title LIKE '%Digital%' OR a.title LIKE '%Transformation%' THEN 2
        WHEN a.title LIKE '%Management%' OR a.title LIKE '%Leadership%' THEN 1
        WHEN a.title LIKE '%Commercial%' THEN 4
        WHEN a.title LIKE '%Fiscalité%' THEN 7
        ELSE 1
    END,
    CASE 
        WHEN a.title LIKE '%avancé%' THEN 'avancé'
        WHEN a.title LIKE '%base%' THEN 'débutant'
        ELSE 'intermédiaire'
    END,
    EXTRACT(DAY FROM (a.end_date - a.start_date)) * 7 + 7,
    'Français',
    CASE 
        WHEN a.title LIKE '%Marketing%' THEN 'Dr. Ahmed Lahlou'
        WHEN a.title LIKE '%Comptabilité%' THEN 'Expert Comptable Fatima Bennani'
        WHEN a.title LIKE '%Export%' THEN 'Youssef El Amrani'
        WHEN a.title LIKE '%Digital%' THEN 'Mehdi Alaoui - Digital Expert'
        WHEN a.title LIKE '%Management%' THEN 'Coach Nadia Berrada'
        WHEN a.title LIKE '%Commercial%' THEN 'Consultant Karim Fassi'
        WHEN a.title LIKE '%Fiscalité%' THEN 'Fiscaliste Rachid Tazi'
        ELSE 'Formateur CCIS'
    END,
    'CCIS Formation',
    true,
    'Certificat de participation CCIS',
    CASE 
        WHEN a.title LIKE '%avancé%' THEN 'Expérience préalable dans le domaine'
        ELSE 'Aucun prérequis'
    END,
    'Dirigeants et cadres de PME/TPE'
FROM activities a
WHERE a.activity_type_id = 1;

-- =====================================================
-- 5. PARTICIPANTS
-- =====================================================

-- Function to generate participants for activities
DO $$
DECLARE
    activity_record RECORD;
    company_record RECORD;
    participant_count INT;
    i INT;
BEGIN
    FOR activity_record IN 
        SELECT id, current_participants, actual_participants, status 
        FROM activities 
        WHERE activity_type_id = 1 -- Only formations
    LOOP
        participant_count := COALESCE(activity_record.actual_participants, activity_record.current_participants, 0);
        
        IF participant_count > 0 THEN
            i := 1;
            FOR company_record IN 
                SELECT id, name, representative_name, representative_email, representative_phone 
                FROM companies 
                WHERE is_member = true 
                ORDER BY RANDOM() 
                LIMIT participant_count
            LOOP
                INSERT INTO participants (
                    first_name, 
                    last_name, 
                    email, 
                    phone, 
                    company_id, 
                    job_title, 
                    activity_id,
                    registration_status,
                    attendance_confirmed,
                    satisfaction_rating,
                    feedback_comments
                ) VALUES (
                    SPLIT_PART(company_record.representative_name, ' ', 1),
                    COALESCE(NULLIF(SPLIT_PART(company_record.representative_name, ' ', 2), ''), 'N/A'),
                    COALESCE(company_record.representative_email, 'participant' || i || '@' || LOWER(REPLACE(company_record.name, ' ', '')) || '.ma'),
                    COALESCE(company_record.representative_phone, '066' || LPAD((1000000 + i)::TEXT, 7, '0')),
                    company_record.id,
                    'Représentant',
                    activity_record.id,
                    CASE 
                        WHEN activity_record.status = 'completed' THEN 'attended'
                        WHEN activity_record.status = 'ongoing' THEN 'confirmed'
                        ELSE 'registered'
                    END,
                    activity_record.status IN ('completed', 'ongoing'),
                    CASE 
                        WHEN activity_record.status = 'completed' THEN 3 + FLOOR(RANDOM() * 3)::INT
                        ELSE NULL
                    END,
                    CASE 
                        WHEN activity_record.status = 'completed' THEN 'Formation très enrichissante et bien organisée'
                        ELSE NULL
                    END
                );
                i := i + 1;
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- 6. PARTNERS
-- =====================================================

INSERT INTO partners (name, partner_type_id, contact_person, email, phone, address, partnership_start_date, partnership_status, description) VALUES 
    ('Université Mohammed V', 6, 'Pr. Hassan Benjelloun', 'contact@um5.ac.ma', '0537271874', 'Avenue des Nations Unies, Agdal, Rabat', '2022-01-15', 'active', 'Partenariat pour formations et recherche'),
    ('OFPPT Rabat-Salé-Kénitra', 3, 'Directeur Régional Ahmed Alami', 'direction@ofppt-rsk.ma', '0537689012', 'Boulevard Mohamed Lyazidi, Rabat', '2021-06-20', 'active', 'Collaboration pour formations professionnelles'),
    ('Attijariwafa Bank', 4, 'Directeur Entreprises Karim Fassi', 'k.fassi@attijariwafa.ma', '0537707000', 'Siège Social, Casablanca', '2023-03-10', 'active', 'Partenariat financement PME'),
    ('Maroc PME', 1, 'Responsable Programmes Nadia Chraibi', 'n.chraibi@marocpme.ma', '0537567890', 'Hay Riad, Rabat', '2022-09-05', 'active', 'Accompagnement et financement PME'),
    ('CGEM Rabat', 2, 'Président Omar Bennani', 'contact@cgem-rabat.ma', '0537345678', 'Boulevard Annakhil, Hay Riad', '2021-11-12', 'active', 'Collaboration institutionnelle'),
    ('Ministère de l''Industrie', 1, 'Directeur Développement Industriel', 'contact@mcinet.gov.ma', '0537761460', 'Quartier Administratif, Rabat', '2020-04-20', 'active', 'Partenariat institutionnel industrie'),
    ('AMITH', 2, 'Déléguée Régionale Zineb Berrada', 'z.berrada@amith.ma', '0537456789', 'Rue des Industries, Casablanca', '2023-07-15', 'active', 'Association marocaine industries textiles');

-- =====================================================
-- 7. ACTIVITY PARTNERS (Link partners to activities)
-- =====================================================

INSERT INTO activity_partners (activity_id, partner_id, contribution_type, contribution_amount, notes)
SELECT 
    a.id,
    p.id,
    CASE 
        WHEN p.name LIKE '%Bank%' THEN 'financial'
        WHEN p.name LIKE '%Université%' OR p.name LIKE '%OFPPT%' THEN 'expertise'
        WHEN p.name LIKE '%Ministère%' THEN 'institutional'
        ELSE 'support'
    END,
    CASE 
        WHEN p.name LIKE '%Bank%' THEN 10000 + RANDOM() * 20000
        ELSE NULL
    END,
    'Partenariat établi pour soutien de l''activité'
FROM activities a
CROSS JOIN partners p
WHERE a.activity_type_id IN (1, 2) -- Formations and Events
AND RANDOM() < 0.3 -- 30% chance of partnership
LIMIT 15;

-- =====================================================
-- 8. BUDGETS (Annual budgets per department)
-- =====================================================

INSERT INTO budgets (fiscal_year, department_id, category_id, allocated_amount, spent_amount, committed_amount) VALUES 
    -- 2026 Budgets
    (2026, 4, 1, 500000, 88200, 120000), -- Appui et Promotion - Formation
    (2026, 4, 2, 800000, 0, 430000), -- Appui et Promotion - Événements
    (2026, 3, 4, 200000, 0, 0), -- Stratégie et Partenariat - Études
    (2026, 2, 5, 300000, 0, 0), -- Relations Institutionnelles - Personnel
    (2026, 5, 6, 400000, 0, 0), -- Administratif et Financier - Fonctionnement
    (2026, 6, 3, 150000, 0, 0), -- Services aux ressortissants - Communication
    
    -- 2025 Budgets (Historical)
    (2025, 4, 1, 450000, 380000, 0), -- Appui et Promotion - Formation
    (2025, 4, 2, 750000, 620000, 0), -- Appui et Promotion - Événements
    (2025, 3, 4, 180000, 150000, 0), -- Stratégie et Partenariat - Études
    (2025, 2, 5, 280000, 280000, 0), -- Relations Institutionnelles - Personnel
    (2025, 5, 6, 380000, 365000, 0); -- Administratif et Financier - Fonctionnement

-- =====================================================
-- 9. EXPENSES
-- =====================================================

INSERT INTO expenses (budget_id, activity_id, expense_date, description, amount, supplier, invoice_number, payment_status, payment_date, approved_by, approval_date, created_by)
SELECT 
    b.id,
    a.id,
    a.start_date - INTERVAL '10 days',
    'Frais de formation: ' || a.title,
    a.budget_spent * 0.4,
    'Formateur ' || f.trainer_name,
    'INV-' || TO_CHAR(a.start_date, 'YYYY-MM') || '-' || LPAD((ROW_NUMBER() OVER ())::TEXT, 4, '0'),
    'paid',
    a.start_date + INTERVAL '30 days',
    (SELECT id FROM users WHERE role_id = 1 LIMIT 1),
    a.start_date - INTERVAL '5 days',
    (SELECT id FROM users WHERE role_id = 2 LIMIT 1)
FROM activities a
JOIN formations f ON f.activity_id = a.id
JOIN budgets b ON b.category_id = 1 AND b.fiscal_year = EXTRACT(YEAR FROM a.start_date)
WHERE a.budget_spent > 0
AND a.status = 'completed';

-- =====================================================
-- 10. SERVICES PROVIDED
-- =====================================================

INSERT INTO services_provided (service_type_id, company_id, department_id, request_date, request_description, assigned_to, status, start_date, completion_date, cost, paid, satisfaction_rating, outcome)
SELECT 
    (ARRAY[1,2,3,4,5])[FLOOR(RANDOM() * 5 + 1)],
    c.id,
    4, -- Appui et Promotion
    CURRENT_DATE - (RANDOM() * 365)::INT,
    'Demande de service ' || (ARRAY['assistance', 'conseil', 'étude'])[FLOOR(RANDOM() * 3 + 1)],
    (SELECT id FROM users WHERE role_id = 2 LIMIT 1),
    (ARRAY['completed', 'in_progress', 'pending'])[FLOOR(RANDOM() * 3 + 1)],
    CURRENT_DATE - (RANDOM() * 300)::INT,
    CASE WHEN RANDOM() > 0.5 THEN CURRENT_DATE - (RANDOM() * 100)::INT ELSE NULL END,
    500 + RANDOM() * 2000,
    RANDOM() > 0.3,
    CASE WHEN RANDOM() > 0.5 THEN 3 + FLOOR(RANDOM() * 3)::INT ELSE NULL END,
    CASE WHEN RANDOM() > 0.5 THEN 'Service rendu avec succès' ELSE NULL END
FROM companies c
WHERE c.is_member = true
AND RANDOM() < 0.4
LIMIT 20;

-- =====================================================
-- 11. ALERTS
-- =====================================================

INSERT INTO alerts (alert_type_id, entity_type, entity_id, title, message, severity, threshold_value, current_value, is_active, is_read) VALUES 
    (2, 'budget', (SELECT id FROM budgets WHERE fiscal_year = 2026 AND category_id = 1), 
     'Budget Formation proche de la limite', 
     'Le budget formation a atteint 90% de consommation', 
     'warning', 90, 88.2, true, false),
    
    (5, 'company', (SELECT id FROM companies WHERE name = 'Start-Up Tech'), 
     'Données entreprise incomplètes', 
     'Le profil de l''entreprise Start-Up Tech a un score de qualité faible (65%)', 
     'info', 70, 65, true, false),
    
    (4, 'activity', (SELECT id FROM activities WHERE title = 'Stratégies de Développement Commercial'), 
     'Date limite inscription approche', 
     'La date limite d''inscription pour la formation approche dans 7 jours', 
     'info', NULL, NULL, true, false);

-- =====================================================
-- 12. IMPORT LOGS (Sample Excel imports)
-- =====================================================

INSERT INTO import_logs (filename, file_hash, file_size, sheet_name, data_type, uploaded_by, status, total_rows, rows_imported, rows_skipped, rows_with_errors, processing_completed_at, notes) VALUES 
    ('entreprises_rabat_2025.xlsx', 'a1b2c3d4e5f6g7h8i9j0', 524288, 'Entreprises', 'companies', 
     (SELECT id FROM users WHERE username = 'karim.service'), 'completed', 150, 145, 3, 2, 
     CURRENT_TIMESTAMP - INTERVAL '30 days', 'Import des entreprises région Rabat'),
    
    ('formations_janvier_2026.xlsx', 'z9y8x7w6v5u4t3s2r1q0', 262144, 'Formations', 'activities', 
     (SELECT id FROM users WHERE username = 'karim.service'), 'completed', 50, 48, 2, 0, 
     CURRENT_TIMESTAMP - INTERVAL '15 days', 'Import formations Q1 2026'),
    
    ('participants_formation_digital.xlsx', 'p0o9i8u7y6t5r4e3w2q1', 131072, 'Participants', 'participants', 
     (SELECT id FROM users WHERE username = 'fatima.service'), 'completed', 85, 85, 0, 0, 
     CURRENT_TIMESTAMP - INTERVAL '5 days', 'Import participants formation marketing digital');

-- =====================================================
-- 13. DATA QUALITY ISSUES
-- =====================================================

INSERT INTO data_quality_issues (entity_type, entity_id, field_name, rule_id, issue_description, severity, status)
SELECT 
    'company',
    c.id,
    'ice',
    2, -- ICE format validation
    'Format ICE invalide ou incomplet',
    'warning',
    'open'
FROM companies c
WHERE c.data_quality_score < 80
AND (c.ice IS NULL OR LENGTH(c.ice) < 15)
LIMIT 5;

-- =====================================================
-- Refresh materialized view
-- =====================================================

REFRESH MATERIALIZED VIEW dashboard_stats;

-- =====================================================
-- Final Summary
-- =====================================================

DO $$
DECLARE
    company_count INT;
    activity_count INT;
    participant_count INT;
    budget_total DECIMAL;
BEGIN
    SELECT COUNT(*) INTO company_count FROM companies;
    SELECT COUNT(*) INTO activity_count FROM activities;
    SELECT COUNT(*) INTO participant_count FROM participants;
    SELECT SUM(allocated_amount) INTO budget_total FROM budgets WHERE fiscal_year = 2026;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CCIS-Vision Database Seeded Successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Companies created: %', company_count;
    RAISE NOTICE 'Activities created: %', activity_count;
    RAISE NOTICE 'Participants registered: %', participant_count;
    RAISE NOTICE 'Total budget 2026: % MAD', budget_total;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Login credentials:';
    RAISE NOTICE 'Username: ayman | Password: Admin123!';
    RAISE NOTICE '========================================';
END $$;
