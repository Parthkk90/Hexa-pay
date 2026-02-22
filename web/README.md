# Hexa-cred Frontend

Crypto credit card protocol with NFC tap-to-pay on Monad Testnet.

## Quick Start

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

## Deploy to Vercel

### Option 1: Vercel Dashboard
1. Push code to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Set **Root Directory**: `web`
4. Deploy! ✨

### Option 2: Vercel CLI
```bash
npm install -g vercel
vercel --prod
```

## Configuration

The app uses environment variables for RPC endpoints (optional):

```bash
# .env (optional - has sensible defaults)
VITE_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
VITE_MONAD_EXPLORER=https://testnet.monadexplorer.com
```

## Architecture

**Client-Side Only** (No Backend Required):
- React 18 + Vite
- TypeScript
- React Router v7
- Ethers.js v6
- Web NFC API (Android)

**Blockchain**:
- Monad Testnet (Chain ID: 10143)
- CreditManager: `0x455AC5919140d0149aad95D8242a04c1462eA986`
- MockUSDC: `0xDB8127513663b991A1A24BdA4F9f2f02A112D974`

## Features

✓ Connect wallet (MetaMask)
✓ Stake USDC as collateral
✓ Instant credit line (80-100% LTV)
✓ NFC tap-to-pay (Android Chrome)
✓ Reputation-based credit increases
✓ Real-time dashboard

## Mobile Access

Once deployed, access from Android:
1. Open MetaMask app
2. Go to Browser
3. Enter your Vercel URL
4. Use NFC payments!

## Deployment Benefits

- ✓ HTTPS automatic (required for NFC)
- ✓ Global CDN
- ✓ Zero downtime updates
- ✓ Free hosting
- ✓ No USB debugging needed

See [DEPLOYMENT.md](../DEPLOYMENT.md) for detailed instructions.
