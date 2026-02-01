# CCIS-Vision Backend - Quick Start Guide

## 1. Install Dependencies

```bash
cd backend
npm install
```

## 2. Setup Database

```bash
# Create database
psql -U postgres
CREATE DATABASE ccis_vision;
\q

# Run schema
psql -U postgres -d ccis_vision -f ../database_design.sql
psql -U postgres -d ccis_vision -f ../data_cleaning_queries.sql
```

## 3. Configure Environment

```bash
copy .env.example .env
```

Edit `.env` and set:
- Database credentials
- JWT secrets (change defaults!)
- SMTP settings (optional)

## 4. Start Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server runs on: http://localhost:5000

## 5. Test the API

```bash
# Health check
curl http://localhost:5000/api/v1/health
```

## 6. Create First User

The default roles are already inserted by the database schema. To create the first admin user:

```sql
-- Insert admin user (password: Admin123!)
INSERT INTO users (username, email, password_hash, full_name, role_id, is_active)
VALUES ('ayman', 'ayman@ccis.ma', 
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIwSg5Remu',
        'ayman CCIS', 1, true);
```

## 7. Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ayman","password":"Admin123!"}'
```

Copy the `accessToken` from the response.

## 8. Test Protected Endpoint

```bash
curl http://localhost:5000/api/v1/companies \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Next Steps

- Import Excel files via `/api/v1/excel/upload`
- Create companies, activities, participants
- View dashboard analytics
- Configure alerts

See [README.md](README.md) for full API documentation.
