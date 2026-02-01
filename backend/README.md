# CCIS-Vision Backend API

Complete Node.js/Express backend for the CCIS-Vision centralized data management system.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based permissions
- **Company Management**: CRUD operations with data quality scoring
- **Activity Management**: Track formations, missions, consultations
- **Excel Import**: Upload, parse, validate, and process messy Excel data
- **Data Cleaning**: Automatic normalization and validation
- **Dashboard Analytics**: KPIs, charts, statistics
- **Alert System**: Configurable alerts for thresholds and issues
- **Audit Trail**: Complete activity logging
- **Interactive Map**: Geo-located company data
- **RESTful API**: Clean, consistent API design

## 📋 Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- npm >= 9.0.0

## 🛠️ Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy the example environment file and configure it:

```bash
copy .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ccis_vision
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Secrets (change these!)
JWT_SECRET=your_super_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key

# Server
PORT=5000
NODE_ENV=development
```

### 3. Setup Database

Make sure PostgreSQL is running and the database is created:

```bash
psql -U postgres
CREATE DATABASE ccis_vision;
\q
```

Run the database schema (from the root directory):

```bash
psql -U postgres -d ccis_vision -f database_design.sql
psql -U postgres -d ccis_vision -f data_cleaning_queries.sql
```

## 🚀 Running the Application

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Base URL

```
http://localhost:5000/api/v1
```

### Authentication Endpoints

#### Register New User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@ccis.ma",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "roleId": "uuid-of-role",
  "departmentId": "uuid-of-department",
  "annexId": "uuid-of-annex"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "SecurePass123"
}
```

Returns:
```json
{
  "status": "success",
  "data": {
    "user": {...},
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

#### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer {accessToken}
```

### Company Endpoints

#### Get All Companies
```http
GET /api/v1/companies?page=1&limit=20&search=SARL&quality_min=50
Authorization: Bearer {accessToken}
```

Query Parameters:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `search` (optional): Search in name, ICE, email
- `quality_min` (optional): Minimum quality score
- `quality_max` (optional): Maximum quality score
- `sort` (optional): Sort field (name, created_at, quality_score)
- `order` (optional): ASC or DESC

#### Get Company by ID
```http
GET /api/v1/companies/:id
Authorization: Bearer {accessToken}
```

#### Create Company
```http
POST /api/v1/companies
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "name": "SARL EXAMPLE",
  "ice_number": "000123456789012",
  "phone": "0612345678",
  "email": "contact@example.ma",
  "city": "Rabat",
  "region": "Rabat-Salé-Kénitra",
  "status": "active"
}
```

#### Update Company
```http
PUT /api/v1/companies/:id
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "phone": "+212612345678",
  "email": "new@example.ma"
}
```

#### Delete Company
```http
DELETE /api/v1/companies/:id
Authorization: Bearer {accessToken}
```

#### Find Duplicate Companies
```http
GET /api/v1/companies/duplicates
Authorization: Bearer {accessToken}
```

#### Merge Companies
```http
POST /api/v1/companies/merge
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "keepId": "uuid-to-keep",
  "mergeIds": ["uuid-to-merge-1", "uuid-to-merge-2"]
}
```

### Activity Endpoints

#### Get All Activities
```http
GET /api/v1/activities?page=1&limit=20&type=formation&status=completed&year=2024
Authorization: Bearer {accessToken}
```

#### Create Activity
```http
POST /api/v1/activities
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "company_id": "company-uuid",
  "type": "formation",
  "title": "Formation en Digital Marketing",
  "description": "Formation intensive de 3 jours",
  "start_date": "2024-01-15",
  "end_date": "2024-01-17",
  "location": "Rabat",
  "status": "planned"
}
```

### Excel Import Endpoints

#### Upload Excel File
```http
POST /api/v1/excel/upload
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

file: [Excel file]
entity_type: company
description: Import December 2024 companies
```

#### Validate Import Data
```http
POST /api/v1/excel/:importId/validate
Authorization: Bearer {accessToken}
```

Returns validation results showing which rows are valid/invalid.

#### Process Import
```http
POST /api/v1/excel/:importId/process
Authorization: Bearer {accessToken}
```

Processes the validated data and inserts into database.

#### Get Import History
```http
GET /api/v1/excel/history?page=1&limit=20
Authorization: Bearer {accessToken}
```

### Dashboard Endpoints

#### Get Dashboard Overview
```http
GET /api/v1/dashboard/overview?year=2024
Authorization: Bearer {accessToken}
```

Returns:
- Total companies, activities, participants
- Budget vs expenses
- Activity trends
- Top activities
- Regional distribution

#### Get KPIs
```http
GET /api/v1/dashboard/kpis
Authorization: Bearer {accessToken}
```

#### Get Companies Map Data
```http
GET /api/v1/dashboard/map?region=Rabat-Salé-Kénitra
Authorization: Bearer {accessToken}
```

#### Get Data Quality Overview
```http
GET /api/v1/dashboard/data-quality
Authorization: Bearer {accessToken}
```

#### Get Financial Analytics
```http
GET /api/v1/dashboard/financial?year=2024
Authorization: Bearer {accessToken}
```

#### Get Participant Analytics
```http
GET /api/v1/dashboard/participants?year=2024
Authorization: Bearer {accessToken}
```

### Alert Endpoints

#### Get All Alerts
```http
GET /api/v1/alerts?status=active&severity=high
Authorization: Bearer {accessToken}
```

#### Create Alert
```http
POST /api/v1/alerts
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "type": "budget_threshold",
  "severity": "high",
  "title": "Budget Threshold Exceeded",
  "message": "Department budget 90% consumed",
  "related_entity_type": "budget",
  "related_entity_id": "budget-uuid"
}
```

#### Update Alert Status
```http
PUT /api/v1/alerts/:id/status
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "status": "resolved",
  "resolution_notes": "Issue fixed"
}
```

## 🔒 Authentication & Permissions

All endpoints (except `/auth/login` and `/auth/register`) require authentication via Bearer token.

### Required Permissions

| Endpoint | Permission |
|----------|------------|
| GET /companies | `view_companies` |
| POST /companies | `manage_companies` |
| GET /activities | `view_activities` |
| POST /activities | `manage_activities` |
| POST /excel/upload | `import_data` |
| GET /dashboard/* | `view_dashboard` |
| POST /alerts | `manage_alerts` |

Permissions are assigned via roles in the database. Super Admin has all permissions.

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── database.js   # PostgreSQL connection
│   │   └── index.js      # App configuration
│   ├── controllers/      # Request handlers
│   │   ├── authController.js
│   │   ├── companyController.js
│   │   ├── activityController.js
│   │   ├── excelController.js
│   │   ├── dashboardController.js
│   │   └── alertController.js
│   ├── middleware/       # Express middleware
│   │   ├── auth.js       # Authentication & authorization
│   │   ├── errorHandler.js
│   │   ├── validate.js   # Joi validation
│   │   └── upload.js     # File upload (Multer)
│   ├── routes/           # API routes
│   │   ├── auth.routes.js
│   │   ├── company.routes.js
│   │   ├── activity.routes.js
│   │   ├── excel.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── alert.routes.js
│   │   └── index.js
│   ├── utils/            # Utility functions
│   │   ├── logger.js     # Winston logger
│   │   ├── validators.js # Data cleaning functions
│   │   └── AppError.js   # Custom error class
│   └── server.js         # Express app & server
├── logs/                 # Log files
├── uploads/              # Uploaded Excel files
├── .env                  # Environment variables
├── .env.example          # Example environment file
├── .gitignore
├── package.json
└── README.md
```

## 🧪 Testing

Test endpoints using tools like Postman, Insomnia, or curl:

```bash
# Health check
curl http://localhost:5000/api/v1/health

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Get companies (with token)
curl http://localhost:5000/api/v1/companies \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🛡️ Security Features

- **Helmet**: Security headers
- **CORS**: Configurable cross-origin requests
- **Rate Limiting**: Prevents brute-force attacks
- **Input Validation**: Joi schema validation
- **SQL Injection Protection**: Parameterized queries
- **Password Hashing**: bcryptjs with salt rounds
- **JWT Tokens**: Secure authentication with expiration

## 📊 Data Validation & Cleaning

The backend automatically cleans and validates imported data:

- **Company Names**: Normalized (SARL ABC, S.A.R.L abc → SARL ABC)
- **ICE Numbers**: 15-digit validation, zero-padding
- **Email**: Format validation, lowercase normalization
- **Phone**: Morocco format (+212...), validation
- **Dates**: Multiple format parsing (DD/MM/YYYY, ISO, Excel serial)

## 🐛 Error Handling

All errors return consistent JSON format:

```json
{
  "status": "fail",
  "message": "Error description"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `204` - No Content (successful delete)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## 📝 Logging

Logs are stored in `/logs` directory:
- `combined.log` - All logs
- `error.log` - Errors only

In development mode, logs also appear in console with colors.

## 🔧 Troubleshooting

### Database Connection Failed

```
Error: Failed to connect to database
```

**Solution**: 
1. Check PostgreSQL is running: `pg_isready`
2. Verify credentials in `.env`
3. Ensure database exists: `psql -l`

### File Upload Error

```
Error: File too large
```

**Solution**: Increase `MAX_FILE_SIZE` in `.env` (default 10MB)

### JWT Token Expired

```
Error: Token expired. Please log in again
```

**Solution**: Use refresh token endpoint or login again

## 🚀 Deployment

### Production Checklist

1. ✅ Change JWT secrets in `.env`
2. ✅ Set `NODE_ENV=production`
3. ✅ Configure production database
4. ✅ Set up HTTPS/SSL
5. ✅ Configure SMTP for emails
6. ✅ Set up log rotation
7. ✅ Configure firewall rules
8. ✅ Enable database backups

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
DB_HOST=production-db-host
DB_PASSWORD=strong-password
JWT_SECRET=very-long-random-secret
CORS_ORIGIN=https://your-frontend-domain.com
```

## 📧 Support

For issues or questions, contact the CCIS-Vision development team.

## 📄 License

Internal use only - CCIS Organization
