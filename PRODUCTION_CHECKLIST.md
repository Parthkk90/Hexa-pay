# 🚀 Production Deployment Checklist

## Pre-Deployment Verification

### ✅ Code Quality
- [x] All TypeScript errors resolved
- [x] Build completes successfully (`npm run build`)
- [x] No console errors in development
- [x] Environment variables configured

### ✅ API Configuration
- [x] Serverless functions created (`api/tap.js`, `api/health.js`)
- [x] Express server maintained for local dev (`api/server.js`)
- [x] CORS headers configured
- [x] Health check endpoint working

### ✅ Frontend Configuration
- [x] API URL uses relative paths in production
- [x] Environment variables properly set
- [x] Device mode selection implemented
- [x] Split-device flow tested locally

### ✅ Vercel Configuration
- [x] `vercel.json` at repository root
- [x] Build commands configured
- [x] Output directory set (`web/dist`)
- [x] API routes configured (`/api/:path*`)
- [x] Rewrites for SPA configured

## Deployment Steps

### 1. Push to GitHub
```bash
cd f:\W3\monand_mumbai\Hexa
git add .
git commit -m "Production-ready: Vercel serverless API + split-device mode"
git push origin main
```

### 2. Deploy to Vercel
- Option A: **Auto-Deploy** (if connected)
  - Push triggers automatic deployment
  - Wait ~2 minutes for build
  
- Option B: **Manual Deploy**
  1. Go to https://vercel.com/dashboard
  2. Click "Import Project"
  3. Select GitHub repository
  4. Vercel auto-detects settings from `vercel.json`
  5. Click "Deploy"

### 3. Verify Deployment
```bash
# Test health endpoint
curl https://hexa-cred.vercel.app/api/health

# Test tap endpoint
curl https://hexa-cred.vercel.app/api/tap
# Should return: {"tap":null}

# Open in browser
https://hexa-cred.vercel.app
https://hexa-cred.vercel.app/merchant
```

## Post-Deployment Testing

### Desktop Test (Laptop)
1. Open https://hexa-cred.vercel.app/merchant
2. Choose **💻 Desktop Mode**
3. Click "Connect MetaMask"
   - [ ] MetaMask popup appears
   - [ ] Wallet connects successfully
   - [ ] Address displayed correctly
4. Enter merchant name and amount
5. Click "Start Waiting for Phone Tap"
   - [ ] Status changes to "Waiting"
   - [ ] Console shows polling logs (every 1 sec)
   - [ ] No CORS errors

### Phone Test (Android Chrome)
1. Open https://hexa-cred.vercel.app/merchant on phone
2. Choose **📱 Phone Mode**
3. Click "Start NFC Scanning"
   - [ ] NFC permission requested
   - [ ] Permission granted
   - [ ] Status shows "Waiting for tap"
4. Tap NFC card
   - [ ] Card detected
   - [ ] Data sent to API
   - [ ] Success message shown
   - [ ] No errors in console

### Full Split-Device Flow
1. Desktop: Waiting for tap
2. Phone: Tap card
   - [ ] Desktop detects tap within 1-2 seconds
   - [ ] MetaMask popup appears on desktop
   - [ ] Transaction details correct (amount, recipient)
3. Desktop: Confirm transaction
   - [ ] Transaction submits
   - [ ] Success message appears
   - [ ] Transaction hash displayed
   - [ ] Explorer link works
4. Both devices show success

## Production URLs

### Frontend
- Landing: https://hexa-cred.vercel.app
- Dashboard: https://hexa-cred.vercel.app/
- Merchant Terminal: https://hexa-cred.vercel.app/merchant

### API Endpoints
- Health: https://hexa-cred.vercel.app/api/health
- Tap Bridge: https://hexa-cred.vercel.app/api/tap

### Blockchain
- Network: Monad Testnet
- Chain ID: 10143
- RPC: https://testnet-rpc.monad.xyz
- Explorer: https://testnet-explorer.monad.xyz

## Environment Variables (Vercel Dashboard)

Set these in: Vercel Dashboard → Project → Settings → Environment Variables

| Variable | Value | Required |
|----------|-------|----------|
| `VITE_API_URL` | (empty) | No - uses same domain |
| `VITE_CHAIN_ID` | 10143 | No - has default |
| `VITE_RPC_URL` | https://testnet-rpc.monad.xyz | No - has default |
| `VITE_CREDIT_MANAGER_ADDRESS` | 0x455AC5919140d0149aad95D8242a04c1462eA986 | No - in code |
| `VITE_MOCK_USDC_ADDRESS` | 0xDB8127513663b991A1A24BdA4F9f2f02A112D974 | No - in code |

**Note:** All variables have defaults in code, so no environment variables are required for basic deployment.

## Monitoring

### Check Deployment Status
1. Vercel Dashboard → Your Project
2. View latest deployment
3. Check build logs for errors
4. Monitor function logs for API calls

### Real-Time Logs
```bash
# Install Vercel CLI (optional)
npm i -g vercel

# View logs
vercel logs hexa-cred
```

### Analytics
- Vercel Dashboard → Analytics
- Track page views, API calls, errors
- Monitor performance metrics

## Rollback Plan

### If deployment fails:
1. Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Redeploy"

### If API issues:
1. Check `/api/health` endpoint
2. Review function logs in Vercel
3. Verify `api/tap.js` and `api/health.js` deployed
4. Check CORS headers in response

### If frontend issues:
1. Check build logs for errors
2. Verify `web/dist` was created
3. Test locally: `npm run preview`
4. Check browser console for errors

## Performance Targets

- [ ] Frontend load: < 2 seconds
- [ ] API response: < 100ms
- [ ] Desktop polling: 1 second interval
- [ ] Phone → Desktop: < 2 seconds total
- [ ] Transaction submission: ~15 seconds (blockchain)

## Security Checklist

- [x] HTTPS enforced (Vercel default)
- [x] Security headers enabled (CSP, XSS protection)
- [x] CORS properly configured
- [x] No private keys in frontend code
- [x] Environment variables not exposed
- [x] .env files in .gitignore
- [x] API endpoints secured with input validation

## Demo Preparation

### Before Demo:
1. [ ] MetaMask installed on laptop
2. [ ] MetaMask switched to Monad Testnet
3. [ ] Wallet has test MON for gas
4. [ ] NFC enabled on phone
5. [ ] Both devices connected to internet
6. [ ] NFC card has wallet address written

### Demo Script:
1. **Setup** (30s): Open both devices, select modes
2. **Connect** (30s): Desktop MetaMask, phone NFC permission
3. **Transaction** (15s): Enter amount, tap card, auto-pay
4. **Result** (15s): Confirm, show transaction hash

**Total: ~90 seconds**

## Troubleshooting

### Common Issues:

**"API not found"**
- Check `/api/health` returns 200
- Verify `vercel.json` routing
- Redeploy with cache cleared

**"CORS error"**
- Check API response headers include CORS
- Verify both devices use same domain (production URL)
- No localhost mixing with production

**"NFC permission denied"**
- Phone settings → Chrome → Site settings → NFC
- Enable for hexa-cred.vercel.app
- Clear site data and retry

**"MetaMask not detected"**
- Desktop only (not mobile)
- Install MetaMask extension
- Refresh page after installation

## Success Criteria

✅ Health check returns `{"status":"ok"}`  
✅ Desktop can connect MetaMask  
✅ Phone can scan NFC cards  
✅ Split-device flow completes end-to-end  
✅ Transactions appear on Monad Explorer  
✅ No console errors on either device  
✅ Response times under performance targets  

## Final Verification

```bash
# Health check
curl https://hexa-cred.vercel.app/api/health

# Should return:
# {
#   "status": "ok",
#   "timestamp": 1234567890,
#   "message": "Hexa-cred NFC Bridge API is running"
# }

# Tap endpoint
curl https://hexa-cred.vercel.app/api/tap

# Should return:
# {"tap":null}
```

## 🎉 Deployment Complete!

Your app is production-ready at:
**https://hexa-cred.vercel.app**

Test the split-device flow and you're ready to demo! 🚀

---

**Last Updated:** Before production deployment  
**Status:** ✅ Ready to deploy  
**Build:** ✅ Passing  
**Tests:** ✅ Local flow verified
