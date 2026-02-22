# Hexa-cred Deployment Guide

## Vercel Deployment (Recommended)

### Prerequisites
- GitHub/GitLab/Bitbucket account
- Vercel account (free tier works)
- Your repository pushed to git

### Quick Deploy

1. **Push to Git Repository**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your git repository
   - Configure project:
     - **Framework Preset**: Vite
     - **Root Directory**: `web`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
   - Click "Deploy"

3. **Environment Variables** (Optional)
   If you need custom RPC endpoints:
   - Go to Project Settings → Environment Variables
   - Add: `VITE_MONAD_RPC_URL` = `https://testnet-rpc.monad.xyz`
   - Add: `VITE_MONAD_EXPLORER` = `https://testnet.monadexplorer.com`

### Post-Deployment

Your app will be available at: `https://your-project.vercel.app`

**For Mobile NFC Testing:**
1. Open MetaMask app on Android
2. Tap Browser (☰ menu)
3. Enter your Vercel URL: `https://your-project.vercel.app`
4. Connect wallet and use NFC payments

**Benefits of Vercel Deployment:**
- ✓ Automatic HTTPS (required for Web NFC)
- ✓ Global CDN for fast loading
- ✓ Automatic deployments on git push
- ✓ Free custom domain support
- ✓ No USB debugging needed anymore

---

## Alternative: Netlify

1. **Deploy via Netlify CLI**
   ```bash
   cd web
   npm install -g netlify-cli
   netlify deploy --prod
   ```

2. **Or via Netlify Dashboard**
   - Connect your repository
   - Set build settings:
     - **Base directory**: `web`
     - **Build command**: `npm run build`
     - **Publish directory**: `web/dist`

---

## Important Notes

### No Backend Required
This is a **pure client-side application**:
- Frontend connects directly to Monad Testnet RPC
- Smart contracts already deployed on-chain
- MetaMask handles all signing and transactions
- No server-side code needed

### Security
- Private keys never leave MetaMask
- All transactions signed client-side
- Smart contracts are non-upgradeable (immutable)

### Mobile Access
Once deployed:
- No more USB debugging
- No more port forwarding
- Direct access via HTTPS URL
- Works on any Android device with Chrome/MetaMask

### Contract Addresses
Your deployed contracts (immutable):
- **CreditManager**: `0x455AC5919140d0149aad95D8242a04c1462eA986`
- **MockUSDC**: `0xDB8127513663b991A1A24BdA4F9f2f02A112D974`
- **Network**: Monad Testnet (Chain ID: 10143)

---

## Troubleshooting

### Build Errors
```bash
cd web
npm install
npm run build
```

### MetaMask Not Connecting
- Make sure you're on the deployed URL (not localhost)
- Use MetaMask app browser on mobile
- Check Monad Testnet is added to MetaMask

### NFC Not Working
- Android Chrome or MetaMask app browser only
- HTTPS required (Vercel provides automatically)
- Enable NFC in device settings
- Grant browser NFC permissions

---

## Custom Domain (Optional)

### Add Custom Domain on Vercel
1. Go to Project Settings → Domains
2. Add your domain: `hexacred.com`
3. Configure DNS:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```

### Add Custom Domain on Netlify
1. Go to Domain Settings
2. Add custom domain
3. Follow DNS configuration instructions

---

## Continuous Deployment

Once deployed, any push to your main branch will automatically:
1. Build the project
2. Run tests (if configured)
3. Deploy to production
4. Update your live URL

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main
# Vercel/Netlify auto-deploys!
```

---

## Monitoring

### Check Deployment Status
- Vercel: https://vercel.com/dashboard
- Netlify: https://app.netlify.com

### View Logs
```bash
# Vercel CLI
vercel logs

# Netlify CLI
netlify logs
```

---

## Cost

**Completely Free!**
- Vercel Free Tier: 100GB bandwidth/month
- Netlify Free Tier: 100GB bandwidth/month
- Monad Testnet: Free (no gas costs)
- Blockchain interactions: Only testnet fees

No credit card required for deployment.
