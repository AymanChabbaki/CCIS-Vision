# CCIS-Vision API - Testing with Postman/Insomnia

## Variables Setup

Create these environment variables in your API client:

```
base_url: http://localhost:5000/api/v1
access_token: (will be set after login)
```

## 1. Authentication Tests

### 1.1 Login (Get Token)
```
POST {{base_url}}/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin123!"
}
```

Save the `accessToken` from response to `access_token` variable.

### 1.2 Get Current User Profile
```
GET {{base_url}}/auth/me
Authorization: Bearer {{access_token}}
```

### 1.3 Change Password
```
POST {{base_url}}/auth/change-password
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "currentPassword": "Admin123!",
  "newPassword": "NewPassword123!"
}
```

## 2. Company Tests

### 2.1 Get All Companies
```
GET {{base_url}}/companies?page=1&limit=10
Authorization: Bearer {{access_token}}
```

### 2.2 Search Companies
```
GET {{base_url}}/companies?search=SARL&quality_min=70
Authorization: Bearer {{access_token}}
```

### 2.3 Create Company
```
POST {{base_url}}/companies
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "name": "SARL TEST COMPANY",
  "ice_number": "000123456789012",
  "rc_number": "12345",
  "phone": "0612345678",
  "email": "contact@testcompany.ma",
  "website": "https://testcompany.ma",
  "address_line1": "123 Rue Test",
  "city": "Rabat",
  "postal_code": "10000",
  "region": "Rabat-Salé-Kénitra",
  "legal_form": "SARL",
  "activity_sector": "Technology",
  "status": "active"
}
```

### 2.4 Update Company
```
PUT {{base_url}}/companies/{company_id}
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "phone": "+212612345678",
  "email": "newemail@testcompany.ma"
}
```

### 2.5 Get Company by ID
```
GET {{base_url}}/companies/{company_id}
Authorization: Bearer {{access_token}}
```

### 2.6 Get Company Statistics
```
GET {{base_url}}/companies/stats
Authorization: Bearer {{access_token}}
```

### 2.7 Find Duplicate Companies
```
GET {{base_url}}/companies/duplicates
Authorization: Bearer {{access_token}}
```

### 2.8 Merge Companies
```
POST {{base_url}}/companies/merge
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "keepId": "uuid-to-keep",
  "mergeIds": ["uuid-to-merge-1", "uuid-to-merge-2"]
}
```

### 2.9 Delete Company
```
DELETE {{base_url}}/companies/{company_id}
Authorization: Bearer {{access_token}}
```

## 3. Activity Tests

### 3.1 Get All Activities
```
GET {{base_url}}/activities?page=1&limit=10
Authorization: Bearer {{access_token}}
```

### 3.2 Filter Activities
```
GET {{base_url}}/activities?type=formation&status=completed&year=2024
Authorization: Bearer {{access_token}}
```

### 3.3 Create Activity
```
POST {{base_url}}/activities
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "company_id": "company-uuid-here",
  "type": "formation",
  "title": "Formation Digital Marketing 2024",
  "description": "Formation intensive sur les stratégies digitales",
  "start_date": "2024-02-15",
  "end_date": "2024-02-17",
  "location": "CCIS Rabat",
  "status": "planned",
  "notes": "Public cible: PME du secteur digital"
}
```

### 3.4 Update Activity
```
PUT {{base_url}}/activities/{activity_id}
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "status": "in_progress",
  "notes": "Formation en cours"
}
```

### 3.5 Get Activity by ID
```
GET {{base_url}}/activities/{activity_id}
Authorization: Bearer {{access_token}}
```

### 3.6 Get Activity Statistics
```
GET {{base_url}}/activities/stats?year=2024
Authorization: Bearer {{access_token}}
```

### 3.7 Delete Activity
```
DELETE {{base_url}}/activities/{activity_id}
Authorization: Bearer {{access_token}}
```

## 4. Excel Import Tests

### 4.1 Upload Excel File
```
POST {{base_url}}/excel/upload
Authorization: Bearer {{access_token}}
Content-Type: multipart/form-data

file: [Select Excel file]
entity_type: company
description: Import test December 2024
```

### 4.2 Get Import History
```
GET {{base_url}}/excel/history?page=1&limit=20
Authorization: Bearer {{access_token}}
```

### 4.3 Get Import Details
```
GET {{base_url}}/excel/{import_id}
Authorization: Bearer {{access_token}}
```

### 4.4 Validate Import Data
```
POST {{base_url}}/excel/{import_id}/validate
Authorization: Bearer {{access_token}}
```

### 4.5 Process Import
```
POST {{base_url}}/excel/{import_id}/process
Authorization: Bearer {{access_token}}
```

## 5. Dashboard Tests

### 5.1 Get Dashboard Overview
```
GET {{base_url}}/dashboard/overview?year=2024
Authorization: Bearer {{access_token}}
```

### 5.2 Get KPIs
```
GET {{base_url}}/dashboard/kpis
Authorization: Bearer {{access_token}}
```

### 5.3 Get Companies Map Data
```
GET {{base_url}}/dashboard/map?region=Rabat-Salé-Kénitra
Authorization: Bearer {{access_token}}
```

### 5.4 Get Data Quality Overview
```
GET {{base_url}}/dashboard/data-quality
Authorization: Bearer {{access_token}}
```

### 5.5 Get Financial Analytics
```
GET {{base_url}}/dashboard/financial?year=2024
Authorization: Bearer {{access_token}}
```

### 5.6 Get Participant Analytics
```
GET {{base_url}}/dashboard/participants?year=2024
Authorization: Bearer {{access_token}}
```

## 6. Alert Tests

### 6.1 Get All Alerts
```
GET {{base_url}}/alerts?page=1&limit=20
Authorization: Bearer {{access_token}}
```

### 6.2 Filter Alerts
```
GET {{base_url}}/alerts?status=active&severity=high
Authorization: Bearer {{access_token}}
```

### 6.3 Create Alert
```
POST {{base_url}}/alerts
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "type": "data_quality",
  "severity": "medium",
  "title": "Incomplete Company Data",
  "message": "50 companies have incomplete contact information",
  "related_entity_type": "company",
  "related_entity_id": null
}
```

### 6.4 Update Alert Status
```
PUT {{base_url}}/alerts/{alert_id}/status
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "status": "resolved",
  "resolution_notes": "Data completed by data entry team"
}
```

### 6.5 Get Alert Statistics
```
GET {{base_url}}/alerts/stats
Authorization: Bearer {{access_token}}
```

### 6.6 Delete Alert
```
DELETE {{base_url}}/alerts/{alert_id}
Authorization: Bearer {{access_token}}
```

## 7. Health Check

### 7.1 API Health Check
```
GET {{base_url}}/health
```

Expected response:
```json
{
  "status": "success",
  "message": "CCIS-Vision API is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Testing Workflow

1. **Start with Authentication**: Login to get access token
2. **Test Company CRUD**: Create, read, update, delete companies
3. **Test Excel Import**: Upload file → Validate → Process
4. **Test Activities**: Create activities linked to companies
5. **Test Dashboard**: View analytics and statistics
6. **Test Alerts**: Create and manage alerts

## Common Response Formats

### Success Response
```json
{
  "status": "success",
  "data": {
    ...
  }
}
```

### Paginated Response
```json
{
  "status": "success",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

### Error Response
```json
{
  "status": "fail",
  "message": "Error description"
}
```

## Tips

1. **Save Tokens**: After login, save `accessToken` to variable for reuse
2. **UUID Format**: All IDs are UUIDs (e.g., `550e8400-e29b-41d4-a716-446655440000`)
3. **Dates**: Use ISO format `YYYY-MM-DD` for dates
4. **Pagination**: Most list endpoints support `?page=1&limit=20`
5. **Filtering**: Use query parameters for filtering (e.g., `?status=active&year=2024`)
