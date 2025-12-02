# 🚀 Setup New Repository - Parlay Market

This guide will help you create a new GitHub repository and deploy Parlay Market.

## Step 1: Commit Current Changes

All changes are already staged. Now commit them:

```bash
git commit -m "Complete project setup

- Update project name to 'Parlay Market'
- Add comprehensive documentation
- Fix chart display and volume formatting
- Add deployment guides and testing documentation
- Update all meta tags and package info"
```

## Step 2: Create New Repository on GitHub

### Option A: Via GitHub Website

1. Go to https://github.com/new
2. Repository name: `parlay-market` or `Parlay-Market`
3. Description: "Prediction Markets Platform with Multi-Leg Parlay Builder"
4. Set to **Public** or **Private** (your choice)
5. **DO NOT** initialize with README, .gitignore, or license
6. Click "Create repository"

### Option B: Via GitHub CLI (if installed)

```bash
gh repo create parlay-market \
  --public \
  --description "Prediction Markets Platform with Multi-Leg Parlay Builder" \
  --source=. \
  --remote=new-origin \
  --push
```

## Step 3: Update Remote and Push

### If creating completely new repo:

```bash
# Remove old remote
git remote remove origin

# Add new remote
git remote add origin https://github.com/YOUR_USERNAME/parlay-market.git

# Push to new repo
git branch -M main
git push -u origin main
```

### If keeping old repo but want new one too:

```bash
# Add new remote (keeping old one)
git remote add new-origin https://github.com/YOUR_USERNAME/parlay-market.git

# Push to new repo
git push -u new-origin main
```

## Step 4: Deploy to Production

### Option 1: Vercel (Recommended)

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New..." → "Project"
4. Import your `parlay-market` repository
5. Configure:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Root Directory: `./`
6. Add Environment Variables:
   - `VITE_API_BASE_URL`
   - `VITE_API_KEY`
7. Click "Deploy"

Your site will be live at: `https://parlay-market.vercel.app`

### Option 2: Netlify

1. Go to https://netlify.com
2. Sign in with GitHub
3. Click "Add new site" → "Import an existing project"
4. Select your `parlay-market` repository
5. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Add Environment Variables:
   - `VITE_API_BASE_URL`
   - `VITE_API_KEY`
7. Click "Deploy site"

### Option 3: GitHub Pages

1. Install GitHub Pages dependency:
   ```bash
   npm install --save-dev gh-pages
   ```

2. Add to package.json scripts:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

3. Deploy:
   ```bash
   npm run deploy
   ```

## Step 5: Custom Domain (Optional)

### Vercel:
- Go to Project Settings → Domains
- Add your custom domain
- Follow DNS instructions

### Netlify:
- Go to Site Settings → Domain Management
- Add custom domain
- Configure DNS

## ✅ Post-Deployment Checklist

- [ ] Repository created on GitHub
- [ ] Code pushed to repository
- [ ] Site deployed to hosting platform
- [ ] Environment variables configured
- [ ] Site is accessible
- [ ] All features working
- [ ] Custom domain configured (if needed)

## 🎉 Done!

Your Parlay Market is now live!

---

**Need help?** Check [DEPLOYMENT.md](./DEPLOYMENT.md) for more details.

