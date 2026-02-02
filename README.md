# 🏢 CCIS-Vision

**Système de Gestion Centralisée des Données - Centre de Commerce et d'Investissement de Souss**

Application web complète pour la gestion des entreprises, activités, budgets et participants du CCIS avec système d'importation Excel, tableaux de bord analytiques et chatbot intelligent.

---

## 📋 Table des Matières

- [Vue d'ensemble](#-vue-densemble)
- [Fonctionnalités](#-fonctionnalités)
- [Architecture Technique](#-architecture-technique)
- [Prérequis](#-prérequis)
- [Installation Locale](#-installation-locale)
- [Configuration](#-configuration)
- [Déploiement Production](#-déploiement-production)
- [Utilisation](#-utilisation)
- [API Documentation](#-api-documentation)
- [Base de Données](#-base-de-données)
- [Tests](#-tests)
- [Dépannage](#-dépannage)
- [Contribuer](#-contribuer)

---

## 🎯 Vue d'ensemble

CCIS-Vision est une plateforme de gestion complète permettant au Centre de Commerce et d'Investissement de Souss de:
- **Centraliser** toutes les données des entreprises et activités
- **Analyser** les performances via des tableaux de bord interactifs
- **Automatiser** l'importation de données via Excel
- **Suivre** les budgets et dépenses par département
- **Gérer** les formations, missions et consultations
- **Assister** les utilisateurs via un chatbot intelligent

### 🌍 URLs de Production

- **Frontend**: https://ccis-vision.vercel.app
- **Backend API**: https://ccis-vision-3l72.vercel.app/api/v1
- **Base de Données**: Neon PostgreSQL (Serverless)
- **Stockage Fichiers**: Cloudinary

---

## ✨ Fonctionnalités

### 👥 Gestion des Utilisateurs
- ✅ Authentification sécurisée (JWT)
- ✅ Système de rôles (Admin, Gestionnaire, Consultant)
- ✅ Gestion des permissions par rôle
- ✅ Profils utilisateurs personnalisables

### 🏢 Gestion des Entreprises
- ✅ CRUD complet des entreprises
- ✅ Validation automatique des données (ICE, email, téléphone)
- ✅ Normalisation des noms d'entreprises
- ✅ Géolocalisation sur carte interactive (Leaflet)
- ✅ Recherche et filtres avancés
- ✅ Export Excel des données

### 📊 Gestion des Activités
- ✅ 3 types d'activités: Formations, Missions, Consultations
- ✅ Association entreprises bénéficiaires
- ✅ Suivi des participants
- ✅ Calendrier interactif
- ✅ Gestion des budgets par activité

### 💰 Gestion Budgétaire
- ✅ Budgets par département et activité
- ✅ Suivi des dépenses réelles vs prévues
- ✅ Alertes automatiques (seuils dépassés)
- ✅ Rapports financiers détaillés
- ✅ Visualisations graphiques (Chart.js)

### 📁 Import/Export Excel
- ✅ Import massif via templates Excel
- ✅ Validation des données avant importation
- ✅ Prévisualisation des données
- ✅ Traitement par lots avec logs détaillés
- ✅ Templates téléchargeables pour chaque entité
- ✅ Stockage cloud (Cloudinary) en production

### 📈 Tableaux de Bord Analytiques
- ✅ Vue d'ensemble des KPIs
- ✅ Graphiques interactifs (entreprises, activités, budgets)
- ✅ Cartes thermiques géographiques
- ✅ Statistiques en temps réel
- ✅ Filtres par période et département

### 🤖 Chatbot Intelligent
- ✅ Assistant IA pour les utilisateurs
- ✅ Base de connaissances (75+ questions/réponses)
- ✅ Téléchargement de templates
- ✅ Statistiques et rapports
- ✅ Aide contextuelle
- ✅ Résolution de problèmes guidée

### � Indicateurs de Performance (KPIs)
- ✅ 7 catégories de KPIs par département
- ✅ Gestion périodique (mensuelle, trimestrielle, annuelle)
- ✅ Audit & Contrôle (5 indicateurs)
- ✅ Relations Institutionnelles (5 indicateurs)
- ✅ Synthèse Départements (4 indicateurs)
- ✅ Administratif & Financier (7 indicateurs)
- ✅ Appui & Promotion (11 indicateurs)
- ✅ Services aux Ressortissants (3 indicateurs)
- ✅ Stratégie & Partenariat (6 indicateurs)
- ✅ Interface de gestion avec formulaires dédiés
- ✅ Visualisations interactives et cartes KPI
- ✅ Suivi de l'évolution dans le temps

### �🔔 Système d'Alertes
- ✅ Alertes automatiques par email
- ✅ Notifications budgétaires (seuils)
- ✅ Rappels d'échéances
- ✅ Historique des alertes
- ✅ Configuration personnalisable

---

## 🏗️ Architecture Technique

### Stack Frontend
```
React 18.3 + Vite 5.4
├── React Router 7.1 (Navigation)
├── Axios (API Client)
├── Chart.js 4.4 (Graphiques)
├── Leaflet 1.9 (Cartes)
├── date-fns 4.1 (Dates)
└── CSS3 Moderne (Responsive)
```

### Stack Backend
```
Node.js 18+ / Express 4.18
├── PostgreSQL 16 (Base de données)
├── JWT (Authentification)
├── Bcrypt (Hashing mots de passe)
├── ExcelJS 4.4 (Import/Export Excel)
├── Cloudinary (Stockage fichiers)
├── Nodemailer (Emails)
├── Winston (Logs)
└── Helmet + CORS (Sécurité)
```

### Infrastructure Cloud
```
Production (100% Gratuit)
├── Frontend: Vercel (SPA hosting)
├── Backend: Vercel Serverless Functions
├── Database: Neon PostgreSQL (Serverless)
├── Storage: Cloudinary (Files)
└── DNS: Vercel Domains
```

### Architecture Système
```
┌─────────────────┐
│   React SPA     │ ← Vercel (ccis-vision.vercel.app)
└────────┬────────┘
         │ HTTPS/REST
         ↓
┌─────────────────┐
│  Express API    │ ← Vercel Serverless (ccis-vision-3l72.vercel.app)
└────────┬────────┘
         │
    ┌────┴────┬───────────┐
    ↓         ↓           ↓
┌────────┐ ┌──────┐ ┌──────────┐
│ Neon   │ │Cloud │ │Nodemailer│
│  DB    │ │inary │ │  SMTP    │
└────────┘ └──────┘ └──────────┘
```

---

## 🔧 Prérequis

### Logiciels Requis
- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **PostgreSQL**: >= 16.0 (local) ou compte Neon (production)
- **Git**: >= 2.0

### Comptes Cloud (Production)
- [Vercel](https://vercel.com) - Déploiement frontend/backend
- [Neon](https://neon.tech) - Base de données PostgreSQL
- [Cloudinary](https://cloudinary.com) - Stockage fichiers
- [Gmail](https://gmail.com) - SMTP pour emails (ou autre)

---

## 💻 Installation Locale

### 1. Cloner le Projet
```bash
git clone https://github.com/AymanChabbaki/CCIS-Vision.git
cd CCIS-Vision
```

### 2. Configuration Base de Données Locale

#### Installer PostgreSQL
```bash
# Windows: Télécharger depuis postgresql.org
# Linux: 
sudo apt update
sudo apt install postgresql postgresql-contrib
```

#### Créer la Base de Données
```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base
CREATE DATABASE ccis_vision;

# Se connecter à la base
\c ccis_vision

# Exécuter les schémas
\i database/database_design.sql
\i database/chatbot_schema.sql

# Quitter
\q
```

### 3. Configuration Backend

```bash
cd backend
npm install

# Créer .env
cp .env.example .env
```

Éditer `backend/.env`:
```env
NODE_ENV=development
PORT=5000

# Database Local
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ccis_vision
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe

# JWT
JWT_SECRET=votre_secret_super_long_minimum_32_caracteres
JWT_REFRESH_SECRET=votre_refresh_secret_32_caracteres
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# CORS
CORS_ORIGIN=http://localhost:3000

# Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Email (optionnel pour dev)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre_email@gmail.com
SMTP_PASSWORD=votre_app_password
EMAIL_FROM=noreply@ccis.ma

# Logs
LOG_LEVEL=debug
```

### 4. Configuration Frontend

```bash
cd ../frontend
npm install

# Créer .env
cp .env.example .env
```

Éditer `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api/v1
```

### 5. Démarrer l'Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Ouvrir: http://localhost:3000

### 6. Compte Admin Par Défaut
```
Email: admin@ccis.ma
Mot de passe: admin123
```

⚠️ **Important**: Changez ces identifiants en production!

---

## ⚙️ Configuration

### Variables d'Environnement Backend

| Variable | Description | Exemple |
|----------|-------------|---------|
| `NODE_ENV` | Environnement | `production` ou `development` |
| `PORT` | Port serveur | `5000` |
| `DATABASE_URL` | URL PostgreSQL (prod) | `postgresql://user:pass@host/db` |
| `DB_HOST` | Hôte DB (dev) | `localhost` |
| `DB_PORT` | Port DB | `5432` |
| `DB_NAME` | Nom DB | `ccis_vision` |
| `DB_USER` | Utilisateur DB | `postgres` |
| `DB_PASSWORD` | Mot de passe DB | `secret` |
| `JWT_SECRET` | Secret JWT | Min 32 caractères |
| `JWT_REFRESH_SECRET` | Secret refresh token | Min 32 caractères |
| `CORS_ORIGIN` | URL frontend autorisée | `https://ccis-vision.vercel.app` |
| `CLOUDINARY_CLOUD_NAME` | Nom cloud Cloudinary | `dqn8k0w2y` |
| `CLOUDINARY_API_KEY` | Clé API Cloudinary | `963356721128592` |
| `CLOUDINARY_API_SECRET` | Secret API Cloudinary | `YqQD8lxHWp0fYQvAetYNaeJBWOo` |
| `VERCEL` | Mode Vercel | `1` (en production Vercel) |

### Variables d'Environnement Frontend

| Variable | Description | Exemple |
|----------|-------------|---------|
| `VITE_API_URL` | URL API backend | `https://ccis-vision-3l72.vercel.app/api/v1` |

---

## 🚀 Déploiement Production

### Étape 1: Base de Données (Neon)

1. Aller sur https://neon.tech
2. Créer un compte gratuit
3. Créer un nouveau projet "ccis-vision"
4. Copier la connection string:
   ```
   postgresql://user:pass@host/db?sslmode=require
   ```
5. Importer le schéma:
   ```bash
   psql "votre_connection_string" -f database/database_design.sql
   psql "votre_connection_string" -f database/chatbot_schema.sql
   ```

### Étape 2: Stockage Fichiers (Cloudinary)

1. Aller sur https://cloudinary.com
2. Créer un compte gratuit
3. Dashboard → Copier:
   - Cloud Name
   - API Key
   - API Secret
4. Uploader les templates:
   - Aller dans Media Library
   - Créer dossier `ccis-vision/uploads`
   - Uploader les 4 fichiers Excel depuis `backend/uploads/templates/`
   - Copier les URLs publiques

### Étape 3: Backend (Vercel)

1. Push le code sur GitHub
2. Aller sur https://vercel.com
3. New Project → Import votre repo
4. Configuration:
   - **Root Directory**: `backend`
   - **Framework Preset**: Other
5. Environment Variables (Settings → Environment Variables):
   ```
   NODE_ENV=production
   PORT=5000
   VERCEL=1
   DATABASE_URL=votre_connection_string_neon
   CORS_ORIGIN=https://ccis-vision.vercel.app
   JWT_SECRET=votre_secret_32_chars
   JWT_REFRESH_SECRET=votre_refresh_secret_32_chars
   CLOUDINARY_CLOUD_NAME=votre_cloud_name
   CLOUDINARY_API_KEY=votre_api_key
   CLOUDINARY_API_SECRET=votre_api_secret
   ```
6. Deploy!
7. Copier l'URL (ex: `ccis-vision-3l72.vercel.app`)

### Étape 4: Frontend (Vercel)

1. Vercel → New Project → même repo
2. Configuration:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
3. Environment Variables:
   ```
   VITE_API_URL=https://votre-backend.vercel.app/api/v1
   ```
4. Deploy!

### Étape 5: Vérification

Tester l'API:
```bash
curl https://votre-backend.vercel.app/api/v1/health
```

Devrait retourner:
```json
{
  "status": "success",
  "message": "CCIS-Vision API is running",
  "timestamp": "2026-02-02T..."
}
```

---

## 📖 Utilisation

### Première Connexion

1. Ouvrir https://ccis-vision.vercel.app
2. Se connecter avec `admin@ccis.ma` / `admin123`
3. Changer le mot de passe (Profil → Sécurité)

### Importer des Entreprises

1. Aller dans **Entreprises**
2. Cliquer **Importer Excel**
3. Télécharger le template
4. Remplir les données dans Excel
5. Uploader le fichier
6. Prévisualiser et valider
7. Traiter l'import

### Créer une Formation

1. Aller dans **Activités**
2. Cliquer **Nouvelle Formation**
3. Remplir les informations
4. Sélectionner les entreprises bénéficiaires
5. Ajouter les participants
6. Définir le budget
7. Sauvegarder

### Utiliser le Chatbot

1. Cliquer sur l'icône 💬 en bas à droite
2. Poser une question (ex: "comment créer une entreprise?")
3. Le chatbot répond avec des instructions détaillées
4. Télécharger les templates directement depuis le chat

### Voir les Statistiques

1. Aller dans **Tableau de Bord**
2. Sélectionner la période
3. Voir les KPIs, graphiques et cartes
4. Exporter les rapports en Excel

---

## 📡 API Documentation

### Base URL
```
Production: https://ccis-vision-3l72.vercel.app/api/v1
Local: http://localhost:5000/api/v1
```

### Authentification

Toutes les routes (sauf `/auth/login`) nécessitent un token JWT:
```http
Authorization: Bearer <token>
```

### Endpoints Principaux

#### 🔐 Auth
```http
POST /auth/login
POST /auth/register
POST /auth/refresh
GET  /auth/me
POST /auth/logout
```

#### 🏢 Companies
```http
GET    /companies          # Liste avec pagination
GET    /companies/:id      # Détails
POST   /companies          # Créer
PUT    /companies/:id      # Modifier
DELETE /companies/:id      # Supprimer
GET    /companies/search   # Recherche
```

#### 📊 Activities
```http
GET    /activities         # Liste
GET    /activities/:id     # Détails
POST   /activities         # Créer
PUT    /activities/:id     # Modifier
DELETE /activities/:id     # Supprimer
```

#### 💰 Budgets
```http
GET    /budgets            # Liste
GET    /budgets/:id        # Détails
POST   /budgets            # Créer
PUT    /budgets/:id        # Modifier
GET    /budgets/department/:id # Par département
```

#### 📁 Excel
```http
POST   /excel/upload       # Upload fichier
POST   /excel/process/:id  # Traiter import
GET    /excel/logs         # Historique imports
GET    /excel/templates/:type # Télécharger template
```

#### 🤖 Chatbot
```http
POST   /chatbot/message    # Envoyer message
GET    /chatbot/history    # Historique conversation
GET    /chatbot/templates  # Liste templates
GET    /chatbot/faq        # Questions fréquentes
```

#### � KPIs
```http
GET    /kpis/periods                     # Liste toutes les périodes
GET    /kpis/periods/active              # Période active
POST   /kpis/periods                     # Créer période (Admin)
PUT    /kpis/periods/:id                 # Modifier période (Admin)
DELETE /kpis/periods/:id                 # Supprimer période (Admin)

GET    /kpis/audit-control/:periodId     # KPIs Audit & Contrôle
POST   /kpis/audit-control               # Créer/Modifier KPIs Audit

GET    /kpis/relations-institutionnelles/:periodId  # KPIs Relations
POST   /kpis/relations-institutionnelles           # Créer/Modifier KPIs Relations

GET    /kpis/synthese-departements/:periodId       # KPIs Synthèse
POST   /kpis/synthese-departements                 # Créer/Modifier KPIs Synthèse

GET    /kpis/admin-financier/:periodId   # KPIs Admin & Financier
POST   /kpis/admin-financier             # Créer/Modifier KPIs Admin

GET    /kpis/appui-promotion/:periodId   # KPIs Appui & Promotion
POST   /kpis/appui-promotion             # Créer/Modifier KPIs Appui

GET    /kpis/services-ressortissants/:periodId  # KPIs Services Ressortissants
POST   /kpis/services-ressortissants           # Créer/Modifier KPIs Services

GET    /kpis/strategie-partenariat/:periodId   # KPIs Stratégie & Partenariat
POST   /kpis/strategie-partenariat             # Créer/Modifier KPIs Stratégie

GET    /kpis/all/:periodId               # Tous les KPIs d'une période
```

#### �📈 Dashboard
```http
GET    /dashboard/stats    # Statistiques générales
GET    /dashboard/charts   # Données graphiques
GET    /dashboard/recent   # Activités récentes
```

### Exemples de Requêtes

#### Login
```bash
curl -X POST https://ccis-vision-3l72.vercel.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ccis.ma",
    "password": "admin123"
  }'
```

Réponse:
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "name": "Admin CCIS",
      "email": "admin@ccis.ma",
      "role": "Admin"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Créer Entreprise
```bash
curl -X POST https://ccis-vision-3l72.vercel.app/api/v1/companies \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "nom_entreprise": "TechCorp SA",
    "ice": "001234567000012",
    "secteur_activite": "Technologie",
    "telephone": "0612345678",
    "email": "contact@techcorp.ma",
    "adresse": "Casablanca",
    "ville": "Casablanca"
  }'
```

---

## 🗄️ Base de Données

### Schéma Principal

```sql
┌──────────────┐
│    users     │
├──────────────┤
│ id (PK)      │
│ username     │
│ email        │
│ password     │
│ role_id (FK) │
└──────────────┘
       │
       ├── has role ──→ ┌─────────┐
       │                │  roles  │
       │                ├─────────┤
       │                │ id (PK) │
       │                │ name    │
       │                └─────────┘
       │
       └── creates ──→ ┌──────────────┐
                       │  companies   │
                       ├──────────────┤
                       │ id (PK)      │
                       │ nom          │
                       │ ice          │
                       │ secteur      │
                       │ created_by   │
                       └──────────────┘
                              │
                              └── benefits ──→ ┌──────────────┐
                                                │  activities  │
                                                ├──────────────┤
                                                │ id (PK)      │
                                                │ titre        │
                                                │ type         │
                                                │ date_debut   │
                                                │ budget_id    │
                                                └──────────────┘
                                                       │
                                                       └── has budget ──→ ┌──────────┐
                                                                          │ budgets  │
                                                                          ├──────────┤
                                                                          │ id (PK)  │
                                                                          │ montant  │
                                                                          │ depense  │
                                                                          └──────────┘
```

### Tables Principales

| Table | Description | Lignes (~) |
|-------|-------------|-----------|
| `users` | Utilisateurs système | 10-50 |
| `roles` | Rôles et permissions | 5 |
| `companies` | Entreprises | 1000+ |
| `activities` | Formations/Missions | 500+ |
| `participants` | Participants activités | 5000+ |
| `budgets` | Budgets et dépenses | 200+ |
| `import_logs` | Historique imports | Illimité |
| `chatbot_conversations` | Conversations chatbot | Illimité |

---

## 🧪 Tests

### Tests Manuels

Utiliser le script de test:
```bash
.\test-production.ps1
```

Ou tester avec Postman/Thunder Client:
- Importer `test-production.http`
- Modifier `@baseUrl` avec votre URL
- Exécuter les requêtes

---

## 🔍 Dépannage

### Problèmes Communs

#### ❌ CORS Error
**Symptôme**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**:
1. Vérifier `CORS_ORIGIN` dans Vercel backend = URL frontend exact
2. Redéployer le backend après modification
3. Vider cache navigateur (Ctrl+Shift+Del)

#### ❌ Database Connection Timeout
**Symptôme**: `Connection terminated due to connection timeout`

**Solution**:
1. Vérifier `DATABASE_URL` dans Vercel est correct
2. S'assurer que `?sslmode=require` est dans l'URL
3. Vérifier que `VERCEL=1` est défini

#### ❌ File Upload Fails
**Symptôme**: `ENOENT: no such file or directory`

**Solution**:
1. Vérifier les credentials Cloudinary dans Vercel
2. S'assurer que `NODE_ENV=production`
3. Format accepté: `.xlsx`, `.xls`, `.csv`

#### ❌ 404 on Page Refresh
**Symptôme**: Page not found après refresh d'une route

**Solution**: `frontend/vercel.json` doit contenir les rewrites SPA

---

## 🤝 Contribuer

### Workflow Git

```bash
# Créer une branche
git checkout -b feature/ma-nouvelle-fonctionnalite

# Faire les modifications
git add .
git commit -m "feat: description"

# Pusher
git push origin feature/ma-nouvelle-fonctionnalite
```

### Conventions
- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation
- `refactor:` Refactoring

---

## 📝 Licence

Propriété du **Centre de Commerce et d'Investissement de Souss (CCIS)**.

Tous droits réservés © 2026 CCIS.

---

## 👥 Équipe

- **Développement**: Ayman Chabbaki
- **Client**: CCIS - Centre de Commerce et d'Investissement de Souss
- **Contact**: ccisvision1@gmail.com

---

## 🔗 Liens Utiles

- 🌐 Application: https://ccis-vision.vercel.app
- 🔌 API: https://ccis-vision-3l72.vercel.app/api/v1
- 📊 Database: Neon PostgreSQL
- ☁️ Vercel: https://vercel.com
- 🐘 Neon: https://neon.tech
- ☁️ Cloudinary: https://cloudinary.com

---

## 📊 Statistiques

```
Lignes de Code: ~15,000
Fichiers: ~150
Technologies: 25+
Déploiement: 100% Cloud (Gratuit)
Uptime: 99.9%
```

---

**Version**: 1.0.0  
**Dernière Mise à Jour**: 02 Février 2026  
**Status**: ✅ En Production

Made with ❤️ for CCIS Souss
