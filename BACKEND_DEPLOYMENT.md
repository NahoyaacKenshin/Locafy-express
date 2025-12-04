# Backend Deployment Guide

This guide will help you deploy your Express.js backend to Railway (recommended) or Render.

## 🚀 Quick Start: Railway Deployment (Recommended)

Railway is the easiest platform for deploying Node.js backends with PostgreSQL.

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (recommended) or email
3. Click "New Project"

### Step 2: Connect Your Repository
1. Click "Deploy from GitHub repo"
2. Select your repository
3. Railway will automatically detect it's a Node.js project

### Step 3: Add PostgreSQL Database
1. In your Railway project, click "+ New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will automatically create a PostgreSQL database
4. The `DATABASE_URL` environment variable will be automatically added

### Step 4: Configure Environment Variables
Click on your service → "Variables" tab, and add:

#### Required Variables:
```
APP_NAME=Locafy
PORT=7000
NODE_ENV=production
BACKEND_URL=https://your-app-name.railway.app
FRONTEND_URL=https://your-frontend.vercel.app
```

#### JWT Secrets (Generate strong random strings):
```bash
# Generate random secrets (run in terminal):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```
JWT_SECRET=<generated-secret-1>
JWT_REFRESH_SECRET=<generated-secret-2>
```

#### Email Configuration (Gmail):
```
SMTP_HOST=smtp.gmail.com
SMTP_SECURE=false
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
SMTP_FROM=your-email@gmail.com
```

**Note**: For Gmail, you need to create an [App Password](https://support.google.com/accounts/answer/185833):
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Generate App Password for "Mail"

#### OAuth Credentials:
Update your OAuth providers with the Railway URL:

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Update authorized redirect URIs:
   - `https://your-app-name.railway.app/api/auth/v1/google/callback`
3. Add to Railway:
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-app-name.railway.app/api/auth/v1/google/callback
```

**GitHub OAuth (if used):**
1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Update Authorization callback URL:
   - `https://your-app-name.railway.app/api/auth/v1/github/callback`
3. Add to Railway:
```
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=https://your-app-name.railway.app/api/auth/v1/github/callback
```

### Step 5: Run Database Migrations
1. In Railway, go to your service → "Settings"
2. Scroll to "Deploy" section
3. Add a one-time command:
   ```
   npx prisma migrate deploy
   ```
4. Or use Railway CLI:
   ```bash
   npm install -g @railway/cli
   railway login
   railway link
   railway run npx prisma migrate deploy
   ```

### Step 6: Deploy
1. Railway will automatically deploy when you push to your main branch
2. Or click "Deploy" in the Railway dashboard
3. Wait for deployment to complete
4. Your API will be available at: `https://your-app-name.railway.app`

### Step 7: Update Frontend
Update your Vercel environment variable:
```
NEXT_PUBLIC_API_URL=https://your-app-name.railway.app/api
```

---

## 🌐 Alternative: Render Deployment

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### Step 2: Create Web Service
1. Click "New" → "Web Service"
2. Connect your repository
3. Configure:
   - **Name**: `locafy-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build && npx prisma generate`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for better performance)

### Step 3: Add PostgreSQL Database
1. Click "New" → "PostgreSQL"
2. Create database
3. Copy the "Internal Database URL"
4. Add to Web Service environment variables as `DATABASE_URL`

### Step 4: Add Environment Variables
Same as Railway (see Step 4 above)

### Step 5: Run Migrations
1. In Render dashboard, go to your Web Service
2. Click "Shell" tab
3. Run: `npx prisma migrate deploy`

### Step 6: Deploy
Render will automatically deploy. Your API URL will be:
`https://your-app-name.onrender.com`

---

## 🔧 Manual Deployment Commands

### Using Railway CLI:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Set environment variables
railway variables set NODE_ENV=production
railway variables set PORT=7000
# ... add all other variables

# Deploy
railway up

# Run migrations
railway run npx prisma migrate deploy
```

### Using Render CLI:
```bash
# Install Render CLI
npm install -g render-cli

# Login
render login

# Deploy
render deploy
```

---

## 📋 Pre-Deployment Checklist

- [ ] All environment variables are set
- [ ] Database migrations are ready
- [ ] OAuth redirect URLs are updated
- [ ] CORS is configured for frontend URL
- [ ] Email SMTP credentials are correct
- [ ] JWT secrets are strong and unique
- [ ] `NODE_ENV=production` is set
- [ ] Frontend URL is updated in backend CORS
- [ ] Backend URL is updated in frontend environment variables

---

## 🔍 Troubleshooting

### Build Fails
- Check build logs in Railway/Render dashboard
- Ensure `tsconfig.json` is correct
- Verify all dependencies are in `package.json`

### Database Connection Fails
- Verify `DATABASE_URL` is set correctly
- Check if database is running
- Ensure migrations have been run

### API Returns 404
- Check if routes are properly configured
- Verify server is listening on correct port
- Check Railway/Render logs

### CORS Errors
- Update `FRONTEND_URL` in backend environment variables
- Ensure frontend URL matches exactly (including https://)
- Check `src/app.ts` CORS configuration

### OAuth Not Working
- Verify callback URLs match exactly
- Check OAuth credentials are correct
- Ensure redirect URLs are added in OAuth provider settings

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** - Use environment variables in deployment platform
2. **Use strong JWT secrets** - Generate random 32+ character strings
3. **Enable HTTPS** - Railway and Render provide this automatically
4. **Set `NODE_ENV=production`** - Enables production optimizations
5. **Regular updates** - Keep dependencies updated
6. **Database backups** - Railway and Render provide automatic backups

---

## 📊 Monitoring

### Railway:
- View logs in the "Deployments" tab
- Monitor metrics in the "Metrics" tab
- Set up alerts in "Settings"

### Render:
- View logs in the "Logs" tab
- Monitor metrics in the "Metrics" tab
- Set up alerts in "Settings"

---

## 🆘 Support

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Prisma Docs**: [prisma.io/docs](https://www.prisma.io/docs)

---

## 🎉 After Deployment

1. Test your API endpoints
2. Test authentication flow
3. Test OAuth login
4. Test email functionality
5. Update frontend with backend URL
6. Test full application flow

Your backend is now live! 🚀

