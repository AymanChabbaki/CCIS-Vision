# CCIS-Vision Backend - Vercel Deployment Guide

## ✅ What We Fixed for Vercel

### 1. ✅ File Uploads - Cloudinary Storage
- **Problem**: Vercel filesystem is ephemeral
- **Solution**: Implemented Cloudinary cloud storage
- **Files Changed**:
  - `src/middleware/upload.cloudinary.js` - Cloudinary integration
  - `src/routes/excel.routes.js` - Updated to use Cloudinary upload

### 2. ✅ Database Connection Pool
- **Problem**: Serverless needs minimal connections
- **Solution**: Set `max: 1` connection for production
- **Files Changed**:
  - `src/config/database.js` - Serverless-friendly pool configuration

### 3. ✅ Long-running Processes
- **Problem**: Vercel has 60s timeout on Pro plan
- **Solution**: Set `maxDuration: 60` in vercel.json
- **Files Changed**:
  - `vercel.json` - Function configuration

### 4. ⚠️ Background Jobs (Alert Service)
- **Problem**: Vercel doesn't support background jobs
- **Workaround Options**:
  - Use Vercel Cron Jobs (add vercel cron config)
  - Use external service like cron-job.org
  - Disable for now (alerts won't auto-send)

## 🚀 Deployment Steps

### Step 1: Setup Cloudinary Account

1. Go to https://cloudinary.com
2. Sign up for free account
3. Get your credentials from Dashboard:
   - Cloud Name
   - API Key
   - API Secret

### Step 2: Push to GitHub

\`\`\`bash
cd backend
git add .
git commit -m "Configure for Vercel deployment with Cloudinary"
git push origin main
\`\`\`

### Step 3: Deploy to Vercel

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: Leave empty
   - **Output Directory**: Leave empty

### Step 4: Add Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

\`\`\`
NODE_ENV=production
PORT=5000
API_VERSION=v1

# Database
DATABASE_URL=postgresql://neondb_owner:npg_4Mrw9fyNgSqG@ep-sparkling-darkness-ahwmfcfu-pooler.us-east-1.aws.neon.tech/ccis_vision?sslmode=require

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here

# CORS
CORS_ORIGIN=https://ccis-vision.vercel.app

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Pagination
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
\`\`\`

### Step 5: Deploy

Click "Deploy" - Vercel will give you a URL like:
`https://ccis-vision-backend.vercel.app`

### Step 6: Update Frontend

In Vercel Dashboard for your **frontend** project:

1. Settings → Environment Variables
2. Update or add:
   \`\`\`
   VITE_API_URL=https://ccis-vision-backend.vercel.app/api/v1
   \`\`\`
3. Redeploy frontend

## 🧪 Testing

Test all endpoints:

\`\`\`bash
# Health check
curl https://ccis-vision-backend.vercel.app/api/v1/health

# Login
curl -X POST https://ccis-vision-backend.vercel.app/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"admin@ccis.ma","password":"admin123"}'

# Test file upload (with token)
# Files will now be stored on Cloudinary instead of local filesystem
\`\`\`

## ⚠️ Known Limitations on Vercel

1. **Alert Service**: Won't run automatically. Options:
   - Add Vercel Cron (create `vercel.json` cron config)
   - Use external cron service
   - Manual trigger only

2. **Cold Starts**: First request may be slow (~1-2s)

3. **Execution Time**: Max 60s on Hobby plan (your current plan)

4. **File Processing**: Large Excel files (>50MB) may timeout

## 📝 What Changed in Code

### Before (Local Storage):
\`\`\`javascript
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => cb(null, uniqueName)
});
\`\`\`

### After (Cloudinary):
\`\`\`javascript
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ccis-vision/uploads',
    allowed_formats: ['xlsx', 'xls', 'csv'],
    resource_type: 'raw'
  }
});
\`\`\`

### Database Connection:
\`\`\`javascript
// Before
max: 20

// After (production)
max: isProduction ? 1 : 20
\`\`\`

## ✅ Checklist

- [ ] Cloudinary account created
- [ ] Cloudinary credentials obtained
- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables set
- [ ] Backend deployed successfully
- [ ] Backend URL obtained
- [ ] Frontend environment updated
- [ ] Frontend redeployed
- [ ] Login tested
- [ ] File upload tested (should upload to Cloudinary)
- [ ] Database queries working

## 🔗 Your Production URLs

- Frontend: https://ccis-vision.vercel.app
- Backend: https://YOUR-BACKEND.vercel.app (get after deployment)
- Database: Neon (already configured)
- File Storage: Cloudinary (to configure)

---

**Total Cost: $0/month** ✅ (All free tiers)
