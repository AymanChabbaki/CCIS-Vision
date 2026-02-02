# KPI Database Setup Instructions

## Overview
This guide explains how to set up the KPI (Key Performance Indicators) system in your CCIS-Vision database.

## Files
- `drop_kpis.sql` - Cleanup script to remove existing KPI tables
- `kpis_schema.sql` - Main schema with table definitions and sample data
- `seed_kpis.sql` - Additional seed data for testing

## Setup Steps

### Option 1: Fresh Install (Recommended)
If you haven't created the KPI tables yet, simply run:

```sql
-- In Neon SQL Editor, run:
kpis_schema.sql
```

Then optionally add more sample data:
```sql
seed_kpis.sql
```

### Option 2: Recreate Tables (If tables already exist with wrong structure)
Follow these steps in order:

1. **Drop existing tables:**
   ```sql
   -- Run this in Neon SQL Editor:
   drop_kpis.sql
   ```

2. **Create new tables:**
   ```sql
   -- Run this in Neon SQL Editor:
   kpis_schema.sql
   ```

3. **Add sample data (optional):**
   ```sql
   -- Run this in Neon SQL Editor:
   seed_kpis.sql
   ```

## What Gets Created

### Tables (8 total)
1. `kpi_periods` - Defines reporting periods (monthly, quarterly, annual)
2. `kpi_audit_control` - Audit & Control department KPIs
3. `kpi_relations_institutionnelles` - Institutional Relations KPIs
4. `kpi_synthese_departements` - Department Synthesis KPIs
5. `kpi_admin_financier` - Administrative & Financial KPIs
6. `kpi_appui_promotion` - Business Support & Promotion KPIs
7. `kpi_services_ressortissants` - Services to Nationals KPIs
8. `kpi_strategie_partenariat` - Strategy & Partnership KPIs

### Sample Data Included
- **Periods:**
  - Février 2026 (monthly, active)
  - Q1 2026 (quarterly, active)
  - Q2-Q4 2026 (quarterly, inactive)
  - Année 2026 (annual, active)

- **KPI Data:**
  - Sample data for Q1 2026 across all 7 KPI categories

### Extended Sample Data (seed_kpis.sql)
Additional detailed data for:
- Q1 2026 (quarterly summary)
- Janvier 2026 (monthly)
- Février 2026 (monthly)

## Verification

After running the scripts, verify the setup:

```sql
-- Check periods
SELECT * FROM kpi_periods ORDER BY start_date;

-- Check Q1 2026 data
SELECT * FROM kpi_audit_control WHERE period_id = (SELECT id FROM kpi_periods WHERE name = 'Q1 2026');

-- View all KPIs combined
SELECT * FROM v_kpis_complete;
```

## KPI Categories Structure

### 1. Audit & Control (5 metrics)
- Nombre rapports gestion
- Nombre tableaux bord
- Nombre missions audit
- Taux mise en œuvre recommandations
- Nombre procédures améliorées

### 2. Relations Institutionnelles (5 metrics)
- Conventions signées
- Partenariats actifs
- Réunions stratégiques
- Actions lobbying
- Satisfaction partenaires

### 3. Synthèse Départements (4 metrics)
- Nombre projets réalisés
- Taux réalisation objectifs
- Nombre formations organisées
- Nombre participants formations

### 4. Admin & Financier (7 metrics)
- Budget alloué
- Budget consommé
- Taux exécution budgétaire
- Nombre factures traitées
- Délai moyen paiement
- Nombre marchés publics
- Taux conformité procédures

### 5. Appui Promotion (11 metrics)
- Nombre entreprises accompagnées
- Missions économiques organisées
- Salons participations
- Investissements générés
- Emplois créés
- Entreprises inscrites
- Entreprises inscrites secteur cible
- Entreprises actives
- Entreprises radiation volontaire
- Entreprises radiées
- Entreprises bénéficiaires services

### 6. Services Ressortissants (3 metrics)
- Newsletters éditées
- Demandes ressortissants
- Indicateurs économiques suivis

### 7. Stratégie Partenariat (6 metrics)
- Actions réalisées
- Ressortissants satisfaits événements
- Entreprises potentiel export
- Entreprises accompagnées
- Délégations
- Opportunités affaires internationales

## Troubleshooting

**Error: "relation already exists"**
- Solution: Run `drop_kpis.sql` first to remove existing tables

**Error: "date/time field value out of range"**
- This should be fixed now (February 2026 has 28 days, not 29)

**Error: "column does not exist"**
- Make sure you're using the latest version of `kpis_schema.sql`
- The schema has been updated to match the seed data structure

## Notes
- All tables have UUID primary keys
- Automatic timestamp triggers update the `updated_at` field
- Foreign key constraints ensure data integrity
- Unique constraints prevent duplicate KPIs for the same period
- All numeric fields have check constraints for valid ranges
