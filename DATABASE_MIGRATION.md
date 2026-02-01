# Export Local Database and Import to Neon

## Step 1: Export Your Local Database

### Export Full Database (Data + Schema)

```bash
# Export to SQL file
pg_dump -U postgres -d ccis_vision -F p -f ccis_vision_backup.sql

# Or with verbose output
pg_dump -U postgres -d ccis_vision -F p -v -f ccis_vision_backup.sql
```

### Export Only Schema (No Data)

```bash
pg_dump -U postgres -d ccis_vision -s -f ccis_vision_schema.sql
```

### Export Only Data

```bash
pg_dump -U postgres -d ccis_vision -a -f ccis_vision_data.sql
```

### Export Specific Tables

```bash
pg_dump -U postgres -d ccis_vision -t companies -t activities -f specific_tables.sql
```

---

## Step 2: Get Neon Connection String

1. Go to https://neon.tech
2. Create account and new project
3. Go to **Dashboard** > **Connection Details**
4. Copy the connection string:
   ```
   postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

---

## Step 3: Import to Neon

### Method 1: Using psql (Recommended)

```bash
# Import the full backup
psql "postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require" -f ccis_vision_backup.sql

# Or with progress
psql "postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require" -f ccis_vision_backup.sql -v ON_ERROR_STOP=1
```

### Method 2: Using Neon SQL Editor

1. Open the SQL file in a text editor
2. Copy all content
3. Go to Neon Dashboard > SQL Editor
4. Paste and click "Run"
5. May need to run in chunks if file is large

---

## Complete Step-by-Step Commands

```bash
# 1. Export your local database
cd "C:\Users\HP ZBOOK\Desktop\CCIS-Vision"
pg_dump -U postgres -d ccis_vision -F p -f database/ccis_vision_export.sql

# You'll be prompted for password

# 2. Verify the export
ls database/ccis_vision_export.sql

# 3. Import to Neon (replace with your actual connection string)
psql "postgresql://YOUR_USER:YOUR_PASSWORD@ep-xxx.neon.tech/neondb?sslmode=require" -f database/ccis_vision_export.sql
```

---

## Alternative: Export with Custom Format (Faster for Large DBs)

```bash
# Export with custom format
pg_dump -U postgres -d ccis_vision -Fc -f ccis_vision_backup.dump

# Import to Neon
pg_restore -d "postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require" ccis_vision_backup.dump
```

---

## Troubleshooting

### Issue: "command not found: pg_dump"

**Windows:**
```bash
# Add PostgreSQL to PATH or use full path
"C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -U postgres -d ccis_vision -f backup.sql
```

### Issue: "permission denied"

```bash
# Use administrator PowerShell
# Or specify password in command (not secure)
set PGPASSWORD=your_password
pg_dump -U postgres -d ccis_vision -f backup.sql
```

### Issue: Import fails with errors

```bash
# Stop on first error
psql "connection_string" -f backup.sql -v ON_ERROR_STOP=1

# Or import with verbose error messages
psql "connection_string" -f backup.sql --echo-errors
```

### Issue: File too large

```bash
# Compress the export
pg_dump -U postgres -d ccis_vision | gzip > backup.sql.gz

# Decompress and import
gunzip -c backup.sql.gz | psql "connection_string"
```

---

## Export Specific Data

### Export only recent data (last 30 days)

Create a custom export script:

```sql
-- Export only recent activities
COPY (SELECT * FROM activities WHERE created_at > NOW() - INTERVAL '30 days') 
TO '/path/to/recent_activities.csv' WITH CSV HEADER;

-- Export only active companies
COPY (SELECT * FROM companies WHERE status = 'active') 
TO '/path/to/active_companies.csv' WITH CSV HEADER;
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Export everything | `pg_dump -U postgres -d ccis_vision -f backup.sql` |
| Export schema only | `pg_dump -U postgres -d ccis_vision -s -f schema.sql` |
| Export data only | `pg_dump -U postgres -d ccis_vision -a -f data.sql` |
| Import to Neon | `psql "neon_connection_string" -f backup.sql` |
| Check export size | `ls -lh backup.sql` |

---

## After Import: Verify Data

```sql
-- Connect to Neon
psql "postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"

-- Check tables
\dt

-- Count records
SELECT 'companies' as table_name, COUNT(*) FROM companies
UNION ALL
SELECT 'activities', COUNT(*) FROM activities
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'alerts', COUNT(*) FROM alerts;

-- Check recent data
SELECT * FROM companies ORDER BY created_at DESC LIMIT 5;
SELECT * FROM activities ORDER BY created_at DESC LIMIT 5;
```

---

## Best Practice: Automate Backups

Create a backup script `backup.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="ccis_vision_backup_$DATE.sql"

pg_dump -U postgres -d ccis_vision -f "database/backups/$BACKUP_FILE"

echo "Backup created: $BACKUP_FILE"
```

Run weekly:
```bash
chmod +x backup.sh
./backup.sh
```

---

## Size Optimization

If your database is large:

```bash
# Export with compression
pg_dump -U postgres -d ccis_vision -Fc -f backup.dump

# Check size
ls -lh backup.dump

# Import compressed
pg_restore -d "neon_connection_string" backup.dump
```
