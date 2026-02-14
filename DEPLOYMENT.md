# PropControl Deployment Guide

## Status: Ready to Deploy ✅

**Last Build:** 2026-02-12 05:02 UTC  
**Build Status:** ✅ PASSING (no TypeScript errors)  
**Commits Ahead:** 2 (need to push)

---

## Recent Fixes Applied

1. ✅ Removed invalid `cornerRadius` prop from Dashboard Pie chart
2. ✅ Added type assertion for AssetHealth default object
3. ✅ Fixed investmentTabs type comparison warning

---

## Deployment Steps

### 1. Push to GitHub

**Option A: Using GitHub CLI (if authenticated)**
```bash
cd /root/clawd/propcontrol
git push origin main
```

**Option B: Using Personal Access Token**
```bash
cd /root/clawd/propcontrol
# Replace TOKEN with your GitHub PAT (stored in ~/.clawdbot/.secrets/github-token)
git push https://WaltLuv:TOKEN@github.com/WaltLuv/prop-control-saas.git main
```

**Commits to push:**
- c3c8a1b: Fix TypeScript errors in App.tsx
- b2e9718: Fix cornerRadius prop from Pie chart

---

### 2. Deploy to Netlify

**Repository:** https://github.com/WaltLuv/prop-control-saas  
**Hosting:** Netlify (detected from `netlify.toml`)

**Option A: Automatic Deploy (if Netlify connected to GitHub)**
- Push will trigger auto-deploy if repository is linked

**Option B: Manual Deploy via Netlify CLI**
```bash
cd /root/clawd/propcontrol
netlify login
netlify init  # Link to existing site or create new
netlify deploy --prod
```

**Option C: Manual Deploy via Netlify Web UI**
1. Go to https://app.netlify.com
2. Import from GitHub: WaltLuv/prop-control-saas
3. Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Add environment variables (see below)

---

### 3. Environment Variables Required

Set these in Netlify dashboard (Site settings → Environment variables):

**Required:**
- `GEMINI_API_KEY` - Google Gemini API key (for AI features)

**Stripe (if billing enabled):**
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

**Supabase:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for Edge Functions)

**Check these files for reference:**
- `supabase/config.toml` (Supabase config)
- `lib/stripe.ts` (Stripe integration)
- `geminiService.ts` (Gemini AI usage)

---

### 4. Post-Deploy Testing

**Critical paths to test:**
1. Dashboard loads without errors
2. Asset table displays correctly
3. Pie chart renders (cornerRadius fix)
4. Investment module tabs work
5. Stripe checkout (if applicable)
6. AI features (Gemini-powered)

---

## Build Output

```
dist/index.html                     2.61 kB │ gzip:   0.84 kB
dist/assets/index-CIGW-MKW.css     15.61 kB │ gzip:   6.46 kB
dist/assets/index-Dn-iXvmC.js   3,007.20 kB │ gzip: 911.70 kB
```

⚠️ **Note:** Bundle is 3MB (large). Consider code-splitting for performance optimization in future releases.

---

## Rollback Plan

If deployment fails:
```bash
cd /root/clawd/propcontrol
git revert HEAD  # Revert latest fix
git push origin main
```

Or revert to last known good commit:
```bash
git reset --hard 86f3eb5  # "Final Polish" commit
git push origin main --force
```

---

## Next Steps After Deploy

1. Monitor Netlify build logs for errors
2. Test production URL
3. Set up custom domain (if needed)
4. Enable HTTPS (auto via Netlify)
5. Configure DNS records

---

## Support

- **Repository:** https://github.com/WaltLuv/prop-control-saas
- **Netlify Docs:** https://docs.netlify.com
- **Build logs:** Check Netlify dashboard after push
