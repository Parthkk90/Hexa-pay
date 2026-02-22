# Vercel Production Deployment Guide

## 🚀 Quick Deploy

### One-Click Deploy
1. Push code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/new)
3. Import your repository: `https://github.com/Parthkk90/Hexa-pay`
4. Vercel will auto-detect the configuration
5. Click **Deploy**

✅ Done! Your app will be live at `https://hexa-cred.vercel.app`

## 📋 What's Included

This deployment includes:
- ✅ **Frontend** (React + Vite) - Deployed from `web/` directory
- ✅ **API Functions** (Serverless) - Deployed from `api/` directory
- ✅ **NFC Bridge** - `/api/tap` endpoint for split-device mode
- ✅ **Automatic HTTPS** - Secure by default
- ✅ **CORS enabled** - API accessible from phone/desktop

## 🔧 Architecture

```
https://hexa-cred.vercel.app/
├── /                    → Frontend (React app)
├── /merchant           → Merchant Terminal page
├── /api/tap            → NFC Bridge API (serverless function)
└── /api/health         → Health check endpoint
```

## 🌐 How Split-Device Works in Production

### Desktop (Laptop)
```
https://hexa-cred.vercel.app/merchant
→ Choose Desktop Mode
→ Connect MetaMask
→ Polls: GET https://hexa-cred.vercel.app/api/tap (every 1 sec)
```

### Phone (Android Chrome)
```
https://hexa-cred.vercel.app/merchant
→ Choose Phone Mode
→ Read NFC card
→ Send: POST https://hexa-cred.vercel.app/api/tap
```

**Same domain = No CORS issues!** ✅

## ⚙️ Environment Variables (Optional)

You can customize these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | (empty) | API URL - leave empty to use same domain |
| `VITE_CHAIN_ID` | 10143 | Monad Testnet chain ID |
| `VITE_RPC_URL` | https://testnet-rpc.monad.xyz | Blockchain RPC endpoint |
| `VITE_CREDIT_MANAGER_ADDRESS` | 0x455AC... | Credit Manager contract |
| `VITE_MOCK_USDC_ADDRESS` | 0xDB8127... | Mock USDC contract |

**Note:** Leave `VITE_API_URL` empty for production - it will use relative URLs automatically.

## 📱 Testing Production Deployment

### Desktop Test:
1. Open `https://hexa-cred.vercel.app/merchant` on laptop
2. Choose **Desktop Mode**
3. Connect MetaMask
4. Click "Start Waiting for Phone Tap"
5. Open browser console → should see polling logs

### Phone Test:
1. Open `https://hexa-cred.vercel.app/merchant` on Android Chrome
2. Choose **Phone Mode**
3. Click "Start NFC Scanning"
4. Tap NFC card → Should see "Sent to desktop"

### Full Flow Test:
1. Desktop waiting → Phone taps → Desktop pays ✅

## 🔄 Redeployment

### Automatic (Recommended):
```bash
git add .
git commit -m "Your changes"
git push
```
Vercel auto-deploys on every push to `main` branch.

### Manual:
1. Go to Vercel Dashboard
2. Select your project
3. Click "Redeploy" → Choose last deployment → Redeploy

### Force Fresh Build:
```bash
# In Vercel Dashboard
Settings → General → Clear Build Cache
Then redeploy
```

## 🐛 Troubleshooting

### API not responding
- Check: `https://hexa-cred.vercel.app/api/tap`
- Should return: `{"tap":null}`
- If 404: Check `vercel.json` routing

### Phone can't send to desktop
- Verify both devices use same URL (production URL)
- Check browser console for CORS errors
- Ensure HTTPS (required for NFC on production)

### Desktop not polling
- Check browser console for errors
- Verify Desktop Mode is selected
- Ensure "waiting" status is active

### MetaMask not working
- Only works on desktop/laptop (not mobile)
- Install MetaMask extension in Chrome
- Switch to Monad Testnet in MetaMask

## 🏗️ Build Configuration

### Vercel Settings (Auto-detected from `vercel.json`):

**Framework:** Vite  
**Build Command:** `cd web && npm install && npm run build`  
**Output Directory:** `web/dist`  
**Install Command:** `npm install --prefix web && npm install --prefix api`  

**Functions:**
- `api/*.js` → Serverless functions
- Memory: 128 MB
- Timeout: 10 seconds

### Custom Build (if needed):
1. Vercel Dashboard → Project Settings → General
2. Override build settings if necessary
3. Most settings are in `vercel.json` and should work automatically

## 📊 Monitoring

### View Logs:
1. Vercel Dashboard → Your Project
2. Click on any deployment
3. View → Function Logs
4. See API calls and errors in real-time

### Analytics:
- Vercel Dashboard → Analytics
- Track API calls, response times, errors
- Monitor split-device usage patterns

## 🔐 Security Notes

- ✅ HTTPS enforced (required for NFC)
- ✅ Security headers enabled (CSP, XSS protection)
- ✅ CORS properly configured for API
- ✅ No sensitive data in frontend code
- ✅ Private keys stored in browser localStorage only

### Production Checklist:
- [ ] Deployed to Vercel
- [ ] Tested desktop mode with MetaMask
- [ ] Tested phone mode with NFC
- [ ] Tested full split-device flow
- [ ] Verified API endpoints work
- [ ] Checked browser console for errors
- [ ] Confirmed HTTPS on all pages

## 🎯 Performance

### Expected Response Times:
- Frontend load: < 2s
- API tap endpoint: < 100ms
- Desktop polling: 1s interval
- Phone → Desktop: < 2s total

### Optimization Tips:
- Vercel CDN caches static assets globally
- Serverless functions are edge-deployed
- Keep tap data minimal (just card ID)
- Poll interval is balanced (1s = responsive + efficient)

## 🆘 Support

### If deployment fails:
1. Check build logs in Vercel Dashboard
2. Verify `package.json` in both `web/` and `api/`
3. Ensure `vercel.json` is at repository root
4. Check Node.js version (should be 18.x or 20.x)

### If split-device fails:
1. Ensure both devices use production URL
2. Check that API is deployed (test `/api/tap`)
3. Verify phone has NFC enabled
4. Confirm desktop has MetaMask installed

## 🔗 Useful Links

- **Live App:** https://hexa-cred.vercel.app
- **GitHub:** https://github.com/Parthkk90/Hexa-pay
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Monad Explorer:** https://testnet-explorer.monad.xyz

---

## 🎬 Demo Script

Perfect for showing investors/judges:

1. **Setup** (30 seconds)
   - Open laptop: hexa-cred.vercel.app/merchant → Desktop Mode
   - Open phone: Same URL → Phone Mode

2. **Connect** (30 seconds)
   - Desktop: Click "Connect MetaMask" → Approve
   - Phone: Click "Start NFC Scanning" → Allow NFC

3. **Transaction** (15 seconds)
   - Desktop: Enter amount → "Start Waiting"
   - Phone: Tap card → Desktop auto-pays!

4. **Result** (15 seconds)
   - MetaMask confirmation → Transaction hash
   - View on Monad Explorer

**Total demo: ~90 seconds** ⚡

This looks professional and works flawlessly!
