# Instructions pour Activer les KPIs

## Étape 1: Se connecter à Neon

1. Aller sur https://console.neon.tech
2. Se connecter à votre compte
3. Sélectionner le projet `ccis_vision`
4. Cliquer sur "SQL Editor" dans le menu de gauche

## Étape 2: Exécuter le Schéma KPI

1. Ouvrir le fichier `database/kpis_schema.sql` dans un éditeur de texte
2. Copier **tout le contenu** du fichier (Ctrl+A, Ctrl+C)
3. Retourner sur Neon SQL Editor
4. Coller le contenu (Ctrl+V)
5. Cliquer sur "Run" (ou appuyer sur Ctrl+Enter)

## Étape 3: Vérifier l'Installation

Exécuter cette requête pour vérifier que les tables sont créées:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'kpi%';
```

Vous devriez voir 8 tables:
- kpi_periods
- kpi_audit_control
- kpi_relations_institutionnelles
- kpi_synthese_departements
- kpi_admin_financier
- kpi_appui_promotion
- kpi_services_ressortissants
- kpi_strategie_partenariat

## Étape 4: Tester l'API

Une fois les tables créées, tester:

```bash
curl https://ccis-vision-3l72.vercel.app/api/v1/kpis/health
```

Devrait retourner: `{"status":"success","message":"KPI routes are working"}`

## Étape 5: Utiliser l'Interface

1. Aller sur https://ccis-vision.vercel.app
2. Se connecter
3. Cliquer sur "KPIs" dans le menu
4. Sélectionner une période
5. Cliquer sur "Gérer les KPIs" pour un département
6. Remplir les valeurs
7. Sauvegarder

---

## Alternative: Via psql (ligne de commande)

Si vous préférez utiliser psql:

```bash
psql "postgresql://neondb_owner:npg_4Mrw9fyNgSqG@ep-sparkling-darkness-a hwmfcfu-pooler.us-east-1.aws.neon.tech/ccis_vision?sslmode=require" -f database/kpis_schema.sql
```

---

## En cas de problème

Si vous voyez l'erreur "relation does not exist", c'est que les tables n'ont pas été créées.
Répétez les étapes 1-2 ci-dessus.

Pour supprimer toutes les tables KPI et recommencer:

```sql
DROP TABLE IF EXISTS kpi_audit_control CASCADE;
DROP TABLE IF EXISTS kpi_relations_institutionnelles CASCADE;
DROP TABLE IF EXISTS kpi_synthese_departements CASCADE;
DROP TABLE IF EXISTS kpi_admin_financier CASCADE;
DROP TABLE IF EXISTS kpi_appui_promotion CASCADE;
DROP TABLE IF EXISTS kpi_services_ressortissants CASCADE;
DROP TABLE IF EXISTS kpi_strategie_partenariat CASCADE;
DROP TABLE IF EXISTS kpi_periods CASCADE;
DROP FUNCTION IF EXISTS update_kpi_timestamp CASCADE;
DROP VIEW IF EXISTS v_kpis_complete CASCADE;
```

Puis réexécutez le schéma complet.
