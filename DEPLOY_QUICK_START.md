# 🚀 Quick Deployment Guide

## Backend Deployment (Railway) - 5 Minutes

### 1. Sign up & Create Project
- Go to [railway.app](https://railway.app) → Sign up with GitHub
- Click "New Project" → "Deploy from GitHub repo"
- Select your repository

### 2. Add Database
- Click "+ New" → "Database" → "Add PostgreSQL"
- Railway automatically adds `DATABASE_URL` ✅

### 3. Set Environment Variables
Click on your service → "Variables" → Add these:

**Copy-paste these (update values):**
```
APP_NAME=Locafy
PORT=7000
NODE_ENV=production
BACKEND_URL=https://your-app-name.railway.app
FRONTEND_URL=https://your-frontend.vercel.app
JWT_SECRET=<generate-random-string>
JWT_REFRESH_SECRET=<generate-random-string>
SMTP_HOST=smtp.gmail.com
SMTP_SECURE=false
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
SMTP_FROM=your-email@gmail.com
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-app-name.railway.app/api/auth/v1/google/callback
```

**Generate JWT secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Run Migrations
- Go to "Settings" → "Deploy" → Add one-time command:
  ```
  npx prisma migrate deploy
  ```
- Or use Railway CLI:
  ```bash
  railway run npx prisma migrate deploy
  ```

### 5. Deploy
- Railway auto-deploys on push to main
- Or click "Deploy" button
- Get your URL: `https://your-app-name.railway.app`

### 6. Update OAuth Callbacks
- **Google**: [console.cloud.google.com](https://console.cloud.google.com)
  - Add: `https://your-app-name.railway.app/api/auth/v1/google/callback`
- **GitHub**: GitHub → Settings → Developer settings → OAuth Apps
  - Update callback: `https://your-app-name.railway.app/api/auth/v1/github/callback`

### 7. Update Frontend
In Vercel, add environment variable:
```
NEXT_PUBLIC_API_URL=https://your-app-name.railway.app/api
```

## ✅ Done!

Your backend is live at: `https://your-app-name.railway.app`

---

## 📝 Important Notes

1. **Gmail App Password**: Create at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. **OAuth URLs**: Must match exactly (including https://)
3. **CORS**: Backend `FRONTEND_URL` must match your Vercel frontend URL
4. **Database**: Railway provides free PostgreSQL (500MB)

---

## 🆘 Troubleshooting

**Build fails?**
- Check Railway logs
- Ensure all dependencies in `package.json`

**Database connection fails?**
- Verify `DATABASE_URL` is set
- Run migrations: `railway run npx prisma migrate deploy`

**CORS errors?**
- Update `FRONTEND_URL` in Railway variables
- Must match exactly (including https://)

---

For detailed instructions, see [BACKEND_DEPLOYMENT.md](./BACKEND_DEPLOYMENT.md)

