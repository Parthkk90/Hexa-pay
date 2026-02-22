# Nexo - Crypto Credit & NFC Payments on Monad

**Crypto credit. Tap to pay. No bank.**

A decentralized credit protocol built on Monad Testnet with NFC payment capabilities. Stake USDC collateral, get instant credit lines, and pay at merchants with a tap.

---

## Project Structure

```
Hexa/
├── contracts/          # Smart contracts (Hardhat)
│   ├── contracts/
│   │   ├── CreditManager.sol
│   │   └── MockUSDC.sol
│   ├── scripts/
│   │   └── deploy.ts
│   └── deployments/
│       └── monad-testnet.json
├── web/                # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/      # Landing, Dashboard, Terminal
│   │   ├── lib/        # Wallet & contract integration
│   │   ├── config/     # Chain & contract addresses
│   │   └── utils/      # USDC decimal utils
│   └── dist/           # Production build output
```

---

## Quick Start (Deploy & Run)

### Prerequisites

- Node.js v18+ and npm
- MetaMask with Monad Testnet configured
- Deployer wallet with MON tokens (for gas)
- Test USDC will be minted automatically

### 1. Install Dependencies

```bash
# Install contracts dependencies
cd contracts
npm install

# Install web dependencies
cd ../web
npm install
```

### 2. Configure Environment (CRITICAL)

**Contracts environment** (`contracts/.env`):

```bash
# Copy example and fill values
cp .env.example .env
```

Edit `contracts/.env`:

```env
# Monad
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
MONAD_CHAIN_ID=10143

# Deployer
DEPLOYER_PRIVATE_KEY=your_private_key_here_without_0x

# Demo config
NFC_BRIDGE_ADDRESS=0xYourDeployerWalletAddress
DEMO_WALLETS=0xBorrower1,0xBorrower2,0xBorrower3
DEMO_MINT_AMOUNT=10000
```

**Frontend environment** (`web/.env`):

```bash
# Copy example (optional - has fallbacks)
cp .env.example .env
```

Edit `web/.env`:

```env
VITE_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
VITE_MONAD_EXPLORER=https://testnet.monadexplorer.com
```

---

### 3. Deploy Contracts

```bash
cd contracts
npm run deploy:monad
```

**Expected output:**
```
✓ MockUSDC deployed: 0xabcd...
✓ Minted 10000 mUSDC to 0xBorrower1
✓ Minted 10000 mUSDC to 0xBorrower2
✓ CreditManager deployed: 0xef12...
✓ Deploy tx: 0x789...
✓ Artifacts saved to deployments/ and web/src/generated/
```

---

### 4. Run Frontend

**Development mode:**

```bash
cd web
npm run dev
```

Visit: `http://localhost:5173`

**Production build:**

```bash
cd web
npm run build
npm run preview
```

---

## User Flow Demo

### Laptop - Borrower Flow

1. **Navigate to app**: `http://localhost:5173`
2. **Click "Launch App"** → routes to `/app`
3. **Step 1**: Connect MetaMask
   - MetaMask prompts to switch to Monad Testnet (auto-configured)
   - Shows connected wallet and USDC balance
4. **Step 2**: Input stake amount (default: 100 USDC) → Click "Approve"
   - MetaMask transaction: `usdc.approve(CreditManager, amount)`
5. **Step 3**: Click "Stake & Open Credit Line"
   - MetaMask transaction: `creditManager.stakeCollateral(amount)`
   - Dashboard shows credit summary:
     - Collateral: 100 USDC
     - Credit Limit: $80 (80% LTV)
     - Available: $80
     - Reputation: 0

**Dashboard auto-refreshes every 5 seconds** to show credit changes from payments.

### Android Phone - Merchant Flow

1. **Navigate to**: `http://localhost:5173/pay` (on Android Chrome)
2. **Connect wallet**: Same MetaMask wallet as above
3. **Enter merchant name**: e.g., "Coffee Shop"
4. **Enter amount**: e.g., "12.50"
5. **Click "Start NFC Scan"**:
   - Status: "Waiting for tap..."
   - Tap NFC card to phone (or click status badge as fallback)
   - Status: "Processing..."
   - Status: "Approved ✓"
   - Shows transaction hash with explorer link
6. **Verify on laptop**: Dashboard now shows:
   - Available: $67.50 (reduced by $12.50)

---

## Key Features Implemented

### Smart Contracts

✅ **Single-call credit opening**: `stakeCollateral()` deposits USDC and calculates credit limit  
✅ **Reputation tiers**: Score-based LTV (80% → 85% → 90% → 95% → 100%)  
✅ **Payment authorization**: Only `nfcBridge` or `owner` can call `executePayment()`  
✅ **Event logging**: All actions emit events for explorer visibility  
✅ **Repayment rewards**: +5 reputation per on-time repayment  
✅ **Collateral withdrawal**: Only when debt is paid off  

**Credit Limit Formula:**
```
Base: collateral * 80%
+ Reputation 10: 85%
+ Reputation 25: 90%
+ Reputation 50: 95%
+ Reputation 100: 100% (unsecured threshold)
```

### Frontend

✅ **3-page routing**: `/` (landing), `/app` (dashboard), `/pay` (terminal)  
✅ **MetaMask-first flow**: Wallet connection before any contract calls  
✅ **Monad network enforcement**: Auto-switch to chainId 10143  
✅ **Live dashboard polling**: Credit updates every 5s  
✅ **USDC approval flow**: Two-step UX (approve → stake)  
✅ **NFC integration**: Web NFC API on Android Chrome  
✅ **Payment guards**: Validates wallet, credit line, and amount before scan  
✅ **Hidden fallback**: Click status badge to trigger payment if NFC fails  
✅ **Explorer links**: All transaction hashes link to Monad explorer  

### Configuration

✅ **Zero hardcoding**: Contract addresses read from deployment artifact  
✅ **Decimal safety**: All transformations use `toUSDC()` / `fromUSDC()`  
✅ **Chain config DRY**: Single source of truth in `chains.ts`  
✅ **Env validation**: Deploy script fails loud on missing variables  
✅ **Artifact sync**: Deploy writes to both `contracts/` and `web/src/generated/`  

---

## Contract Addresses (After Deploy)

Check `contracts/deployments/monad-testnet.json` for:

```json
{
  "mockUsdc": {
    "address": "0x..."
  },
  "creditManager": {
    "address": "0x...",
    "nfcBridge": "0x..."
  },
  "transactions": {
    "mockUsdcDeployTx": "0x...",
    "creditManagerDeployTx": "0x..."
  }
}
```

Frontend automatically imports these values.

---

## Testing Checklist

### Pre-Demo Dry Run (3x minimum)

- [ ] Step 1: Laptop `/app` → Connect → See USDC balance
- [ ] Step 2: Approve 100 USDC → MetaMask popup → Confirm
- [ ] Step 3: Stake → MetaMask popup → Confirm → See credit summary
- [ ] Step 4: Phone `/pay` → Connect → Enter merchant + amount
- [ ] Step 5: NFC scan → Tap card → See "Approved ✓" + tx hash
- [ ] Step 6: Laptop dashboard refreshes → Available credit reduced
- [ ] Step 7: Click explorer link → Verify tx on Monad Testnet
- [ ] Step 8: Test fallback → Click "Waiting for tap..." status manually

### NFC Troubleshooting

**If NFC fails:**
1. Verify Android Chrome supports Web NFC (Android 9+)
2. Check browser permissions: Settings → Chrome → Permissions → NFC
3. Find device NFC sensor position (usually center-back near camera)
4. Hold card flat 1-2 seconds, don't slide
5. Use hidden fallback: click status badge when "Waiting for tap..."

---

## Architecture Notes

### Why Single Collateral Call?

One transaction = one MetaMask popup = simpler UX. `stakeCollateral()` internally calculates and sets the credit limit, no separate `openCreditLine()` call needed during demo.

### Why Approve First?

Standard ERC-20 pattern. The contract needs permission to call `transferFrom()` to pull your USDC. Two-step flow (approve → stake) is standard DeFi UX.

### Why NFC Bridge Auth?

Security pattern. Without access control, anyone could call `executePayment(borrower, amount)` and drain credit lines. Production system would have a backend service as the bridge; hackathon version uses deployer wallet.

### Why Polling Instead of Events?

Simplicity. Event listeners require persistent connection and complex state management. 5-second polling is hackathon-fast and works reliably for demo.

---

## Production Considerations (Not Implemented)

These are architectural notes for judges, not in MVP:

- [ ] Interest rates on borrowed amounts
- [ ] Liquidation when collateral value drops
- [ ] Multi-collateral support (ETH, BTC, etc.)
- [ ] Off-chain reputation oracle
- [ ] Credit delegation to secondary wallets
- [ ] Payment splitting (merchant vs protocol fees)
- [ ] Backend NFC bridge service with fraud detection
- [ ] Mobile native app (React Native)

---

## Commands Reference

### Contracts

```bash
npm run compile              # Compile Solidity
npm run deploy:monad         # Deploy to Monad Testnet
npm run test                 # Run tests (not implemented)
```

### Frontend

```bash
npm run dev                  # Start dev server (hot reload)
npm run build                # Production build
npm run preview              # Preview production build
```

---

## Network Details

**Monad Testnet:**
- Chain ID: `10143` (hex: `0x279F`)
- RPC: `https://testnet-rpc.monad.xyz`
- Explorer: `https://testnet.monadexplorer.com`
- Currency: MON (for gas)

**Add to MetaMask:**
Frontend automatically prompts to add network on first connect.

---

## Troubleshooting

### "Missing required environment variables"

→ Check `contracts/.env` has all values filled (no empty strings)

### "MetaMask not detected"

→ Install MetaMask browser extension

### "Insufficient balance" during deploy

→ Get MON tokens from Monad Testnet faucet

### "Transaction reverted: credit limit exceeded"

→ Available credit < payment amount. Check dashboard `/app`

### Frontend shows "0x0000..." addresses

→ Run deploy script first, artifact JSON must be populated

### Dashboard doesn't show credit reduction

→ Wait 5 seconds for polling cycle, or manually refresh page

---

## Tech Stack

- **Contracts**: Solidity 0.8.24, Hardhat, OpenZeppelin patterns
- **Frontend**: React 18, Vite, TypeScript, React Router
- **Wallet**: ethers.js v6, MetaMask provider
- **Network**: Monad Testnet (EVM-compatible)
- **Payment**: Web NFC API (Android Chrome)

---

## License

MIT

---

## Demo Narrative (for Judges)

**"This is Nexo — crypto credit you can pay with."**

1. *[Show laptop]* "I stake 100 USDC as collateral..."
2. *[MetaMask popup]* "...and instantly get an $80 credit line."
3. *[Show dashboard]* "My credit limit, available balance, reputation score — all on-chain."
4. *[Switch to phone]* "Now I'm at a coffee shop. Merchant enters $12.50..."
5. *[Tap NFC card]* "...I tap my card..."
6. *[Show 'Approved' status]* "...payment settles on Monad in under 2 seconds."
7. *[Show tx hash]* "Here's the transaction hash. Fully auditable."
8. *[Switch back to laptop]* "And my dashboard updates automatically — $67.50 available."

**"No bank. No credit check. Just stake, tap, pay. Built on Monad."**

---

**Ship it. 🚀**
