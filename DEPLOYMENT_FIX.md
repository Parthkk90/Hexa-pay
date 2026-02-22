# 🚨 Vercel Deployment Fix Applied

## Issue Resolved
✅ **Fixed:** Conflicting `vercel.json` files  
✅ **Removed:** `web/vercel.json` (old single-app config)  
✅ **Kept:** Root `vercel.json` (monorepo config with API)  
✅ **Pushed:** Commit df8fb8b to GitHub

## What Was Wrong?

You had TWO `vercel.json` files:
- ❌ `/web/vercel.json` - Old config (single app, no API)
- ✅ `/vercel.json` - New config (monorepo with API functions)

Vercel was using the OLD configuration, which didn't include the API functions or the new device mode features.

## Vercel Auto-Deploy Status

Vercel will automatically detect the new push and redeploy within 2-3 minutes.

**Check deployment status:**
1. Go to https://vercel.com/dashboard
2. Click on your project (hexa-cred)
3. You should see a new deployment starting/building

**Look for:**
- Deployment triggered by commit: "Fix: Remove conflicting web/vercel.json"
- Build status: Building → Ready
- Build time: ~2 minutes

## Clear Browser Cache

Even after Vercel deploys, you might see old content due to browser cache.

### Quick Cache Clear:

**Chrome/Edge:**
1. Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
2. Select "Cached images and files"
3. Click "Clear data"

**OR use Incognito/Private mode:**
- `Ctrl + Shift + N` (Chrome/Edge)
- `Ctrl + Shift + P` (Firefox)

**OR Hard Refresh:**
- `Ctrl + Shift + R` (Windows)
- `Cmd + Shift + R` (Mac)

### Mobile (Android Chrome):
1. Chrome → Three dots → Settings
2. Privacy and security → Clear browsing data
3. Select "Cached images and files"
4. Clear data

## Verify Deployment

After Vercel finishes deploying (~2-3 minutes), check these:

### 1. API Endpoints (Should work now)
```bash
# Health check - should return JSON
curl https://hexa-cred.vercel.app/api/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": 1234567890,
#   "message": "Hexa-cred NFC Bridge API is running"
# }

# Tap endpoint - should return null
curl https://hexa-cred.vercel.app/api/tap

# Expected response:
# {"tap":null}
```

### 2. Frontend (Should show device mode selection)

Open in **Incognito/Private mode** to avoid cache:
```
https://hexa-cred.vercel.app/merchant
```

**You should see:**
- ✅ "Choose Device Mode" screen
- ✅ Two buttons: "💻 Desktop Mode" and "📱 Phone Mode"
- ✅ Description about split-device setup

**If you still see old layout:**
- Wait 1-2 more minutes (DNS propagation)
- Clear browser cache again
- Try different device/browser
- Check Vercel dashboard for deployment status

### 3. Desktop Mode Test
1. Click "💻 Desktop Mode"
2. Should see:
   - ✅ "Desktop Mode - Payment Processor" header
   - ✅ "← Change Mode" button
   - ✅ "Connect MetaMask" button
   - ✅ "Use Embedded Wallet" option
   - ✅ "Import Authorized Wallet" option

### 4. Phone Mode Test (Android Chrome)
1. Open same URL on phone
2. Click "📱 Phone Mode"
3. Should see:
   - ✅ "Phone Mode - NFC Reader" header
   - ✅ "← Change Mode" button  
   - ✅ "Start NFC Scanning" button

## Troubleshooting

### "Still seeing old version after 5 minutes"

**Check Vercel Dashboard:**
1. Go to https://vercel.com/dashboard
2. Click your project
3. Check if build succeeded
4. Look at "Function Logs" - should show API functions deployed

**If build failed:**
- Click into the failed deployment
- View build logs
- Look for errors
- May need to check `vercel.json` syntax

**If build succeeded but still old:**
- Vercel caches might be stale
- Go to Project Settings → General
- Scroll to "Clear Build Cache"
- Click "Clear Build Cache"
- Then click "Redeploy" on your latest deployment

### "API endpoints returning 404"

This means the API functions didn't deploy. Check:
1. Is `api/tap.js` in your GitHub repo?
2. Is `api/health.js` in your GitHub repo?
3. Is root `vercel.json` configured with `"functions": {"api/*.js": {...}}`?
4. Check Vercel Function Logs for errors

### "Device mode selection not showing"

**Likely browser cache. Try:**
1. Open Incognito/Private window
2. Or clear browser cache completely
3. Or try different browser
4. Or try on mobile device

**Check browser console:**
1. Press F12 (Chrome DevTools)
2. Go to Console tab
3. Look for React errors or loading issues
4. Should see no errors

### "TypeError or module errors"

Check Vercel build logs:
1. Dashboard → Your deployment → Build logs
2. Look for TypeScript or module errors
3. Might need to rebuild with cache cleared

## Manual Redeploy (If Needed)

If auto-deploy doesn't trigger:

1. **Vercel Dashboard:**
   - Go to https://vercel.com/dashboard
   - Select hexa-cred project
   - Click on latest deployment
   - Three dots → "Redeploy"
   - ✅ Check "Use existing Build Cache" = OFF
   - Click "Redeploy"

2. **Wait 2-3 minutes** for build to complete

3. **Clear browser cache** and try again

## Expected Timeline

- ✅ Push to GitHub: **Done** (commit df8fb8b)
- ⏳ Vercel detects push: **~30 seconds**
- ⏳ Vercel builds: **~2 minutes**
- ⏳ Deployment live: **~2-3 minutes total**
- ⏳ DNS propagation: **Up to 5 minutes** (rare)

## Quick Test Commands

```bash
# Test 1: API health (most important)
curl https://hexa-cred.vercel.app/api/health

# Test 2: Tap endpoint  
curl https://hexa-cred.vercel.app/api/tap

# Test 3: Frontend loads
curl -I https://hexa-cred.vercel.app/merchant
```

All should return 200 OK status.

## Success Criteria

✅ `curl api/health` returns JSON with "status": "ok"  
✅ `curl api/tap` returns {"tap":null}  
✅ Frontend shows device mode selection  
✅ Can select Desktop Mode  
✅ Can select Phone Mode  
✅ No errors in browser console  
✅ MetaMask connection works in Desktop Mode  
✅ NFC scanning works in Phone Mode  

## Current Deployment

**Latest Commit:** df8fb8b  
**Message:** "Fix: Remove conflicting web/vercel.json - use root config for monorepo"  
**Status:** Pushed to GitHub  
**Vercel:** Should auto-deploy within 2-3 minutes  

## Next Steps

1. ⏳ **Wait 2-3 minutes** for Vercel to build and deploy
2. 🔍 **Check** Vercel dashboard for deployment status
3. 🧹 **Clear** browser cache (or use Incognito)
4. ✅ **Test** https://hexa-cred.vercel.app/merchant
5. 🎯 **Verify** device mode selection appears

If you still have issues after 5 minutes, check the Vercel dashboard logs and let me know what errors you see!

---

**Last Update:** Commit df8fb8b pushed to GitHub  
**Deployment:** In progress (Vercel auto-deploying)  
**ETA:** 2-3 minutes from now
