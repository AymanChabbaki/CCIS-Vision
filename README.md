
# CCIS-Vision: Fullstack Project Documentation

## Table of Contents
- [Project Overview](#project-overview)
- [Frontend (React + Vite)](#frontend-react--vite)
- [Backend (Node.js/Express)](#backend-nodejsexpress)
- [Database (PostgreSQL)](#database-postgresql)
- [Intelligent Chatbot](#intelligent-chatbot)
- [API Documentation](#api-documentation)
- [Security & Data Validation](#security--data-validation)
- [Testing & Troubleshooting](#testing--troubleshooting)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Support & License](#support--license)

---

## Project Overview
CCIS-Vision is a centralized data management system for the CCIS organization, providing robust tools for company and activity management, data import/cleaning, analytics, and alerting. The project is built as a fullstack application with a React frontend, Node.js/Express backend, and PostgreSQL database.

---

## Frontend (React + Vite)
- **Framework**: React, bootstrapped with Vite for fast development and HMR.
- **Features**:
  - Modern SPA with responsive UI.
  - API integration for all backend endpoints.
  - Authentication flows (login, register, JWT token handling).
  - Dashboard with charts, KPIs, and interactive maps.
  - Excel import interface for bulk data upload.
  - Alerts and notifications system.
  - Integrated chatbot for instant help and support.
- **Development**:
  - Uses [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) for fast refresh.
  - ESLint configured for code quality.
  - Easily extendable to TypeScript and advanced linting.
- **Getting Started**:
  - `cd frontend && npm install && npm run dev`
  - See Vite/React documentation for advanced configuration.

---

## Backend (Node.js/Express)
- **Features**:
  - JWT-based authentication and role-based authorization.
  - CRUD for companies, activities, alerts, and more.
  - Excel import: upload, parse, validate, and process data.
  - Data cleaning and normalization (company names, ICE, emails, phones, dates).
  - Dashboard analytics: KPIs, trends, financials, maps.
  - Alert system: configurable, with severity/status, and audit trail.
  - **Intelligent Chatbot**: AI assistant for user support, troubleshooting, and template downloads.
  - RESTful API design with consistent error handling.
- **Installation**:
  1. `cd backend && npm install`
  2. Copy `.env.example` to `.env` and configure DB/JWT/server settings.
  3. Ensure PostgreSQL is running and create the database:
     ```bash
     psql -U postgres
     CREATE DATABASE ccis_vision;
     \q
     psql -U postgres -d ccis_vision -f database_design.sql
     psql -U postgres -d ccis_vision -f data_cleaning_queries.sql
     ```
  4. Start server: `npm run dev` (dev) or `npm start` (prod)

---

## Database (PostgreSQL)
- **Schema**: Designed for companies, activities, users, roles, alerts, and more.
- **Data Cleaning**: SQL scripts for normalization and validation.
- **Connection**: Managed via `src/config/database.js`.

---

## Intelligent Chatbot
The CCIS-Vision chatbot is an AI-powered assistant that helps users navigate the platform, troubleshoot issues, and access information quickly.

### Features
- **Smart Tracking & Monitoring**: Get real-time statistics about companies, activities, and alerts
- **Troubleshooting Assistant**: Resolve common errors (import issues, connection problems, validation errors)
- **Information Retrieval**: Access detailed help, FAQ, and documentation instantly
- **Template Downloads**: Download Excel templates for companies and activities import
- **Context-Aware Responses**: Intelligent understanding of user queries with similarity matching
- **Conversation History**: Maintains conversation log for continuous support
- **Quick Help Topics**: Pre-categorized help topics for faster assistance

### Chatbot Capabilities

#### 1. Statistics & Tracking
Ask questions like:
- "Voir mes statistiques"
- "Combien d'entreprises?"
- "Nombre d'activités"
- "Alertes non lues"

#### 2. Troubleshooting
Get help with:
- "Erreur import Excel" - Solutions for import errors
- "Problème de connexion" - Login/authentication issues
- "Fichier trop volumineux" - File size problems
- "Token expiré" - Session expiration

#### 3. Templates & Downloads
- "Télécharger modèle entreprises"
- "Modèle activités"
- "Template Excel"

#### 4. General Help
- "Comment ajouter une entreprise?"
- "Comment créer une activité?"
- "Format numéro ICE"
- "Comment fusionner des doublons?"

### API Endpoints

#### Send Message to Chatbot
```http
POST /api/v1/chatbot/message
Authorization: Bearer {token}
Content-Type: application/json

{
  "message": "Comment importer des entreprises?"
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "response": {
      "type": "text",
      "message": "Téléchargez le modèle Excel via le chatbot...",
      "suggestions": ["Télécharger modèle", "Résoudre erreur d'import"]
    },
    "timestamp": "2026-02-01T12:00:00Z"
  }
}
```

#### Get Conversation History
```http
GET /api/v1/chatbot/history?limit=10
Authorization: Bearer {token}
```

#### Download Template
```http
GET /api/v1/chatbot/templates/companies
Authorization: Bearer {token}
```

Downloads `template_companies.xlsx`

#### Get Available Templates
```http
GET /api/v1/chatbot/templates
Authorization: Bearer {token}
```

#### Get Help Topics
```http
GET /api/v1/chatbot/help
Authorization: Bearer {token}
```

#### Get FAQ
```http
GET /api/v1/chatbot/faq
Authorization: Bearer {token}
```

### Knowledge Base
The chatbot includes comprehensive knowledge about:
- Authentication & access management
- Company management (CRUD, import, validation)
- Activity management (types, creation, tracking)
- Excel import procedures and formats
- Dashboard usage and data export
- Alert configuration and management
- Data quality improvement
- Common troubleshooting scenarios

---

## API Documentation
- **Base URL**: `http://localhost:5000/api/v1`
- **Endpoints**:
  - **Auth**: `/auth/register`, `/auth/login`, `/auth/me`
  - **Companies**: `/companies`, `/companies/:id`, `/companies/duplicates`, `/companies/merge`
  - **Activities**: `/activities`, `/activities/:id`
  - **Excel Import**: `/excel/upload`, `/excel/:importId/validate`, `/excel/:importId/process`, `/excel/history`
  - **Dashboard**: `/dashboard/overview`, `/dashboard/kpis`, `/dashboard/map`, `/dashboard/data-quality`, `/dashboard/financial`, `/dashboard/participants`
  - **Alerts**: `/alerts`, `/alerts/:id/status`
  - **Chatbot**: `/chatbot/message`, `/chatbot/history`, `/chatbot/templates`, `/chatbot/templates/:type`, `/chatbot/help`, `/chatbot/faq`
- **Authentication**: All endpoints (except `/auth/login` and `/auth/register`) require Bearer token.
- **Permissions**: Role-based, assigned in DB (see backend README for full table).
- **Example Requests**: See backend README for detailed request/response samples.

---

## Security & Data Validation
- **Security**:
  - Helmet, CORS, rate limiting, parameterized queries.
  - Passwords hashed with bcryptjs.
  - JWT tokens for authentication.
- **Data Validation**:
  - Joi schemas for all input.
  - Company names normalized, ICE numbers validated, emails/phones cleaned, dates parsed from multiple formats.
- **Error Handling**:
  - Consistent JSON error format.
  - HTTP status codes: 200, 201, 204, 400, 401, 403, 404, 500.

---

## Testing & Troubleshooting
- **Testing**:
  - Use Postman, Insomnia, or curl for endpoint testing.
  - Health check, login, and authenticated requests.
- **Troubleshooting**:
  - Database connection, file upload, and JWT expiration errors documented with solutions in backend README.

---

## Deployment
- **Production Checklist**:
  1. Change JWT secrets in `.env`.
  2. Set `NODE_ENV=production`.
  3. Configure production database.
  4. Set up HTTPS/SSL, SMTP, log rotation, firewall, backups.
- **Environment Variables**:
  - See backend README for full list and examples.

---

## Project Structure
```
CCIS-Vision/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.js
│   ├── logs/
│   ├── uploads/
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── README.md
├── frontend/
│   ├── src/
│   ├── public/
│   ├── .eslintrc.cjs
│   ├── index.html
│   ├── package.json
│   └── README.md
├── README.md
```

---

## Support & License
- For issues or questions, contact the CCIS-Vision development team.
- Internal use only – CCIS Organization.
