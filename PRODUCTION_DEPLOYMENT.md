# CCIS-Vision Production Deployment Guide

## 🎯 Current Status
- ✅ Frontend: Deployed on Vercel at `ccis-vision.vercel.app`
- ⏳ Backend: To be deployed
- ⏳ Database: To be hosted

---

## 📊 Free PostgreSQL Database Hosting Options

### Option 1: Neon (Recommended) ⭐
**Best for: Production-ready, serverless PostgreSQL**

- **Free Tier**: 
  - 10 GB storage
  - Unlimited databases
  - Auto-scaling
  - Daily backups
  - No sleep time

**Setup Steps:**
1. Go to https://neon.tech
2. Sign up with GitHub
3. Create new project
4. Copy connection string
5. Use format: `postgresql://user:password@host/dbname?sslmode=require`

**Pros:**
- ✅ No sleep time
- ✅ Serverless (auto-scales)
- ✅ Fast cold starts
- ✅ Built for Vercel

**Cons:**
- ⚠️ 10 GB limit on free tier

---

### Option 2: Supabase
**Best for: Full backend-as-a-service**

- **Free Tier**:
  - 500 MB database
  - 1 GB file storage
  - 2 GB bandwidth
  - No sleep time

**Setup Steps:**
1. Go to https://supabase.com
2. Create new project
3. Wait 2-3 minutes for database provisioning
4. Get connection string from Settings > Database
5. Use connection pooling URL for serverless: `postgresql://...?pgbouncer=true`

**Pros:**
- ✅ Includes auth, storage, real-time
- ✅ Auto-backups
- ✅ Good dashboard

**Cons:**
- ⚠️ 500 MB limit
- ⚠️ Paused after 1 week inactivity

---

### Option 3: Railway
**Best for: Simple deployment**

- **Free Tier**:
  - $5 free credits/month
  - No automatic sleep
  - 1 GB RAM, 1 vCPU

**Setup Steps:**
1. Go to https://railway.app
2. Create PostgreSQL database
3. Copy connection URL
4. No configuration needed

**Pros:**
- ✅ Very simple
- ✅ Can host backend too

**Cons:**
- ⚠️ Limited free credits

---

## ⚙️ Backend Deployment: Vercel vs Alternatives

### ⚠️ IMPORTANT: Vercel Backend Limitations

Vercel is designed for **serverless functions**, not traditional Express servers. Here are the issues:

#### Won't Work on Vercel:
1. ❌ Long-running processes (max 10s hobby, 60s pro)
2. ❌ WebSockets (for real-time features)
3. ❌ File uploads to local filesystem (ephemeral)
4. ❌ Cron jobs / scheduled tasks
5. ❌ Server-side sessions (use JWT instead)
6. ❌ Background jobs
7. ❌ Database connections pool (use serverless-friendly pools)

#### Your Project Issues on Vercel:
1. ⚠️ **File Uploads**: Your `uploads/` folder is ephemeral
2. ⚠️ **Excel Processing**: Large files may timeout
3. ⚠️ **Alert Service**: Background tasks won't work
4. ⚠️ **Database Pool**: Need to use connection pooling

---

## 🚀 Recommended Backend Solutions

### Solution A: Railway (Recommended) ⭐
**Best for: Traditional Node.js apps like yours**

**Why Railway:**
- ✅ Supports long-running processes
- ✅ Persistent file storage
- ✅ Background jobs work
- ✅ WebSockets support
- ✅ Traditional deployment (like Heroku)
- ✅ Free $5/month credits

**Deployment Steps:**

1. **Install Railway CLI:**
```bash
npm i -g @railway/cli
```

2. **Login:**
```bash
railway login
```

3. **Initialize Project:**
```bash
cd backend
railway init
```

4. **Add PostgreSQL:**
```bash
railway add postgresql
```

5. **Set Environment Variables:**
```bash
railway variables set NODE_ENV=production
railway variables set PORT=5000
railway variables set JWT_SECRET=your-secret-here
railway variables set CORS_ORIGIN=https://ccis-vision.vercel.app
```

6. **Deploy:**
```bash
railway up
```

7. **Get Backend URL:**
```bash
railway domain
```

**Cost:** $0/month (with $5 free credits)

---

### Solution B: Render (Alternative)
**Best for: Free tier with auto-deploy**

**Free Tier:**
- ✅ 750 hours/month
- ✅ Auto-deploy from GitHub
- ✅ Persistent disk (paid)

**Limitations:**
- ⚠️ Spins down after 15 min inactivity
- ⚠️ Cold start ~30s

**Deployment:**
1. Go to https://render.com
2. Connect GitHub repo
3. Create new Web Service
4. Select `backend` directory
5. Build: `npm install`
6. Start: `npm start`
7. Add environment variables

---

### Solution C: Vercel (With Modifications)

If you MUST use Vercel for backend, you need major changes:

#### 1. Create `vercel.json` in backend:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### 2. Modify Database Connection (use connection pooling):
```javascript
// backend/src/config/database.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 1, // Important for serverless
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
```

#### 3. File Uploads - Use Cloud Storage:
```bash
npm install @vercel/blob
# OR
npm install cloudinary
```

Replace `multer` with cloud storage.

#### 4. Remove Background Jobs:
- Alert service won't work
- Use external cron service (https://cron-job.org)

---

## 🎯 My Recommendation for Your Project

### **Use Railway for Backend + Neon for Database**

**Why:**
1. Your app has file uploads → Need persistent storage
2. Your app has alert service → Need background jobs
3. Excel processing → Need longer execution time
4. Traditional Express app → Railway is perfect

**Total Cost:** **$0/month** (within free tier)

---

## 📝 Step-by-Step Production Deployment

### Step 1: Setup Database (Neon)

1. **Create Neon Account:**
   - Go to https://neon.tech
   - Sign up with GitHub

2. **Create Database:**
   - Click "New Project"
   - Name: `ccis-vision-db`
   - Region: Choose closest to your users
   - Click "Create"

3. **Get Connection String:**
   ```
   postgresql://user:pass@ep-xxx.neon.tech/ccisdb?sslmode=require
   ```

4. **Run Database Schema:**
   ```bash
   # Download and install psql locally or use Neon SQL Editor
   
   # Using psql:
   psql "postgresql://user:pass@ep-xxx.neon.tech/ccisdb?sslmode=require" -f database/database_design.sql
   psql "postgresql://user:pass@ep-xxx.neon.tech/ccisdb?sslmode=require" -f database/chatbot_schema.sql
   
   # OR use Neon SQL Editor in dashboard and paste SQL
   ```

---

### Step 2: Setup Backend (Railway)

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login:**
   ```bash
   railway login
   ```

3. **Go to Backend Directory:**
   ```bash
   cd backend
   ```

4. **Initialize Railway:**
   ```bash
   railway init
   ```

5. **Set Environment Variables:**
   ```bash
   # Database
   railway variables set DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/ccisdb?sslmode=require"
   
   # Server
   railway variables set NODE_ENV=production
   railway variables set PORT=5000
   
   # JWT
   railway variables set JWT_SECRET="your-super-secret-jwt-key-change-this"
   railway variables set JWT_REFRESH_SECRET="your-refresh-secret-key"
   
   # CORS
   railway variables set CORS_ORIGIN="https://ccis-vision.vercel.app"
   
   # Optional: Email (if using)
   railway variables set SMTP_HOST="smtp.gmail.com"
   railway variables set SMTP_PORT=587
   railway variables set SMTP_USER="your-email@gmail.com"
   railway variables set SMTP_PASS="your-app-password"
   ```

6. **Deploy:**
   ```bash
   railway up
   ```

7. **Generate Public URL:**
   ```bash
   railway domain
   ```
   
   This will give you something like: `https://ccis-vision-backend.up.railway.app`

---

### Step 3: Update Frontend Environment Variables

1. **Go to Vercel Dashboard:**
   - Open your project `ccis-vision`

2. **Settings > Environment Variables:**
   ```
   VITE_API_BASE_URL=https://ccis-vision-backend.up.railway.app/api/v1
   ```

3. **Redeploy Frontend:**
   - Trigger a new deployment
   - OR: In Vercel dashboard, click "Redeploy"

---

### Step 4: Update Backend CORS

Make sure your backend `.env` or Railway environment has:

```bash
CORS_ORIGIN=https://ccis-vision.vercel.app
```

---

### Step 5: Test Production

1. **Test Backend:**
   ```bash
   curl https://ccis-vision-backend.up.railway.app/api/v1/health
   ```

2. **Test Frontend:**
   - Visit https://ccis-vision.vercel.app
   - Try login, companies, activities
   - Test chatbot
   - Test Excel upload

---

## 🔒 Production Security Checklist

### Backend:

- [ ] Change all JWT secrets (strong random strings)
- [ ] Update CORS to only allow your frontend domain
- [ ] Enable rate limiting (already configured)
- [ ] Use HTTPS only
- [ ] Set secure cookie flags
- [ ] Enable Helmet security headers (already configured)
- [ ] Validate all inputs (already configured)
- [ ] Use environment variables for all secrets

### Database:

- [ ] Use SSL connection (sslmode=require)
- [ ] Strong database password
- [ ] Limit database user permissions
- [ ] Enable backups
- [ ] Monitor query performance

### Frontend:

- [ ] Never expose API keys
- [ ] Validate user inputs
- [ ] Sanitize HTML
- [ ] Use HTTPS
- [ ] Implement CSP headers

---

## 🎛️ Environment Variables Summary

### Backend (Railway):

```bash
# Database
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Server
NODE_ENV=production
PORT=5000

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars

# CORS
CORS_ORIGIN=https://ccis-vision.vercel.app

# Optional
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAX_FILE_SIZE=10485760
```

### Frontend (Vercel):

```bash
VITE_API_BASE_URL=https://ccis-vision-backend.up.railway.app/api/v1
```

---

## 🐛 Common Issues & Solutions

### Issue 1: CORS Error
**Error:** "Access to fetch at '...' from origin '...' has been blocked"

**Solution:**
```bash
# Railway backend
railway variables set CORS_ORIGIN="https://ccis-vision.vercel.app"

# Check backend logs
railway logs
```

### Issue 2: Database Connection Fails
**Error:** "Failed to connect to database"

**Solution:**
```bash
# Test connection string locally
psql "your-connection-string-here"

# Ensure SSL mode
?sslmode=require

# Check Neon database is not paused
```

### Issue 3: 502 Bad Gateway
**Error:** Backend returns 502

**Solution:**
```bash
# Check Railway logs
railway logs

# Verify PORT is set correctly
railway variables set PORT=5000

# Ensure server.js listens on process.env.PORT
```

### Issue 4: File Upload Fails
**Error:** "Cannot upload file"

**Solution:**
- Railway has persistent storage ✅
- Check upload directory exists
- Verify MAX_FILE_SIZE environment variable

---

## 📊 Monitoring & Logs

### Railway:
```bash
# View logs
railway logs

# Follow logs in real-time
railway logs --follow

# View specific service
railway logs -s backend
```

### Neon:
- Use Neon dashboard for query analytics
- Monitor connection counts
- Check slow queries

### Vercel (Frontend):
- Use Vercel Analytics
- Check deployment logs
- Monitor function execution time

---

## 💰 Cost Comparison

| Service | Database | Backend | Total/Month |
|---------|----------|---------|-------------|
| **Neon + Railway** | Free (10GB) | Free ($5 credits) | **$0** ⭐ |
| Supabase + Railway | Free (500MB) | Free ($5 credits) | **$0** |
| Neon + Render | Free (10GB) | Free (750h) | **$0** |
| Railway (DB + Backend) | Credits | Credits | ~**$5** |
| Vercel (modified) | External | Free | **$0-10** ⚠️ |

---

## 🚀 Quick Start Commands

```bash
# 1. Setup Neon Database
# Go to https://neon.tech, create project, get connection string

# 2. Deploy to Railway
cd backend
npm install -g @railway/cli
railway login
railway init
railway variables set DATABASE_URL="your-neon-connection-string"
railway variables set NODE_ENV=production
railway variables set JWT_SECRET="your-secret"
railway variables set CORS_ORIGIN="https://ccis-vision.vercel.app"
railway up
railway domain  # Get your backend URL

# 3. Update Vercel Frontend
# Go to Vercel dashboard > Settings > Environment Variables
# Add: VITE_API_BASE_URL=https://your-railway-url.up.railway.app/api/v1
# Redeploy

# 4. Test
curl https://your-railway-url.up.railway.app/api/v1/health
```

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Neon Documentation](https://neon.tech/docs)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [PostgreSQL SSL](https://www.postgresql.org/docs/current/ssl-tcp.html)

---

## ✅ Final Checklist

- [ ] Database created on Neon
- [ ] Database schema deployed
- [ ] Backend deployed to Railway
- [ ] Environment variables set on Railway
- [ ] Railway public domain generated
- [ ] Frontend environment variables updated on Vercel
- [ ] Frontend redeployed
- [ ] CORS configured correctly
- [ ] API health endpoint working
- [ ] Login/authentication working
- [ ] Database queries working
- [ ] File uploads working
- [ ] Chatbot working
- [ ] SSL certificates valid
- [ ] Monitoring setup
- [ ] Backups configured

---

**Need Help?** Check Railway logs: `railway logs --follow`
