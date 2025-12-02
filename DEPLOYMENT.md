# 🚀 Deployment Guide

Complete guide for deploying Parlay Market to production.

---

## 📦 Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

---

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Configure Environment Variables:**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add:
     - `VITE_API_BASE_URL`
     - `VITE_API_KEY`

4. **Custom Domain (Optional):**
   - Go to Project Settings → Domains
   - Add your custom domain

---

### Option 2: Netlify

1. **Connect Repository:**
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub/GitLab repository

2. **Build Settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18` or higher

3. **Environment Variables:**
   - Go to Site Settings → Environment Variables
   - Add:
     - `VITE_API_BASE_URL`
     - `VITE_API_KEY`

4. **Deploy:**
   - Netlify will automatically deploy on every push to main branch

---

### Option 3: Cloudflare Pages

1. **Connect Repository:**
   - Go to Cloudflare Dashboard → Pages
   - Click "Create a project"
   - Connect your repository

2. **Build Settings:**
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`

3. **Environment Variables:**
   - Go to Settings → Environment Variables
   - Add:
     - `VITE_API_BASE_URL`
     - `VITE_API_KEY`

---

### Option 4: Self-Hosted

1. **Build:**
   ```bash
   npm run build
   ```

2. **Serve with Nginx:**
   ```nginx
   server {
     listen 80;
     server_name your-domain.com;

     root /path/to/parlay-market/dist;
     index index.html;

     location / {
       try_files $uri $uri/ /index.html;
     }
   }
   ```

3. **Or use any static file server:**
   - Apache
   - Caddy
   - Serve with `npm run preview`

---

## 🔧 Backend Function Deployment

Backend functions are located in `backend/functions/`. Deploy them using your preferred backend service (Deno Deploy, Cloudflare Workers, or similar).

The backend function can be deployed as an edge function to any compatible platform.

---

## ✅ Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] Backend function deployed
- [ ] Production build tested locally (`npm run preview`)
- [ ] All API endpoints working
- [ ] Error handling in place
- [ ] Analytics/tracking configured (optional)
- [ ] Custom domain configured (if needed)

---

## 🔐 Environment Variables

**Required for Frontend:**
- `VITE_API_BASE_URL` - Your backend project URL
- `VITE_API_KEY` - Your backend anonymous key

**For Backend Function:**
- Configure environment variables in your backend service dashboard
- Backend function is located in `backend/functions/polymarket/`

---

## 📊 Post-Deployment

1. **Test Production Build:**
   - Verify all routes work
   - Test market data loading
   - Check charts rendering
   - Test parlay builder

2. **Monitor:**
   - Check function logs for errors
   - Monitor API rate limits
   - Track error rates

3. **Optimize:**
   - Enable CDN caching
   - Configure proper cache headers
   - Set up error monitoring

---

## 🐛 Troubleshooting

### Build Fails
- Check Node.js version (18+)
- Clear `node_modules` and reinstall
- Check for TypeScript errors

### Function Not Working
- Verify function is deployed
- Check function logs
- Verify environment variables

### Assets Not Loading
- Check base path configuration
- Verify all assets in `dist/`
- Check CORS settings

---

## 📝 Notes

- **Vite Build:** Production builds are optimized automatically
- **Environment Variables:** Must be set in hosting platform, not in code
- **Backend:** Function deployment is separate from frontend deployment
- **HTTPS:** Always use HTTPS in production

---

**Need help?** Open an issue on GitHub.

