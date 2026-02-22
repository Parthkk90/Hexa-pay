# Pre-Deployment Checklist

## ✅ Environment Setup

### Contracts (.env file)
- [ ] `MONAD_RPC_URL` set to `https://testnet-rpc.monad.xyz`
- [ ] `MONAD_CHAIN_ID` set to `10143`
- [ ] `DEPLOYER_PRIVATE_KEY` filled (private key without 0x prefix)
- [ ] `NFC_BRIDGE_ADDRESS` set to deployer wallet address
- [ ] `DEMO_WALLETS` contains comma-separated borrower addresses
- [ ] `DEMO_MINT_AMOUNT` set (e.g., `10000`)
- [ ] Deployer wallet has MON tokens for gas (check balance)

### Frontend (.env file - optional)
- [ ] `VITE_MONAD_RPC_URL` set (or using default)
- [ ] `VITE_MONAD_EXPLORER` set (or using default)

---

## ✅ Code Verification

### Critical Fixes Applied
- [x] BorrowerDashboard approves to `CREDIT_MANAGER_ADDRESS` (not zero address)
- [x] Dashboard polls credit every 5 seconds for live updates
- [x] MerchantTerminal validates active credit line before payment
- [x] All USDC amounts use `toUSDC()` / `fromUSDC()` helpers
- [x] Monad network chainId is `0x279F` (10143 decimal)
- [x] Contract addresses read from deployment artifact JSON
- [x] NFC guards check wallet, credit line, and amount

### Build Status
- [x] Contracts compile: `cd contracts && npm run compile`
- [x] Frontend builds: `cd web && npm run build`
- [ ] No TypeScript errors
- [ ] No console warnings (deployment-blocking)

---

## ✅ Deployment Sequence

### Step 1: Deploy Contracts
```bash
cd contracts
npm run deploy:monad
```

**Verify output:**
- [ ] MockUSDC deployed successfully
- [ ] USDC minted to each wallet in DEMO_WALLETS
- [ ] CreditManager deployed successfully
- [ ] Artifacts written to `deployments/monad-testnet.json`
- [ ] Artifacts written to `web/src/generated/monad-testnet.json`
- [ ] All transaction hashes logged

**Save these values:**
- MockUSDC address: `____________________`
- CreditManager address: `____________________`
- Deploy tx hash: `____________________`

### Step 2: Verify on Explorer
- [ ] Visit `https://testnet.monadexplorer.com/tx/[DEPLOY_TX_HASH]`
- [ ] Deployment transaction confirmed
- [ ] Contract visible on explorer

### Step 3: Start Frontend
```bash
cd web
npm run dev
```

**Verify:**
- [ ] Dev server starts on `http://localhost:5173`
- [ ] No console errors on page load
- [ ] All three routes render: `/`, `/app`, `/pay`

---

## ✅ Pre-Demo Testing

### Test 1: Borrower Flow (Laptop)
1. [ ] Navigate to `http://localhost:5173`
2. [ ] Click "Launch App" → routes to `/app`
3. [ ] Click "Connect MetaMask"
   - [ ] MetaMask prompts for connection
   - [ ] Network switches to Monad Testnet (or prompts to add)
   - [ ] Wallet address displayed
   - [ ] USDC balance shows (should be 10,000 if wallet in DEMO_WALLETS)
4. [ ] Enter stake amount: `100`
5. [ ] Click "Approve USDC"
   - [ ] MetaMask popup shows: `approve(CreditManager, 100 USDC)`
   - [ ] Confirm transaction
   - [ ] Wait for confirmation
   - [ ] Step 2 marked complete
6. [ ] Click "Stake & Open Credit Line"
   - [ ] MetaMask popup shows: `stakeCollateral(100 USDC)`
   - [ ] Confirm transaction
   - [ ] Wait for confirmation
   - [ ] Credit summary card appears:
     - [ ] Collateral: 100.00 USDC
     - [ ] Credit Limit: $80.00
     - [ ] Amount Used: 0.00 USDC
     - [ ] Available: $80.00
     - [ ] Reputation Score: 0

### Test 2: Merchant Flow (Phone - Android Chrome)
1. [ ] Navigate to `http://localhost:5173/pay` on Android phone
2. [ ] Click "Connect Wallet"
   - [ ] MetaMask mobile connects (same wallet as laptop)
   - [ ] Address displayed
3. [ ] Enter merchant name: `Coffee Shop`
4. [ ] Enter amount: `12.50`
5. [ ] Click "Start NFC Scan"
   - [ ] Status shows: "Waiting for tap..."
   - [ ] Page says "Web NFC Ready" (if supported)
6. **Option A - NFC Card:**
   - [ ] Hold NFC card to back of phone
   - [ ] Status changes to "Processing..."
   - [ ] Status changes to "Approved ✓"
   - [ ] Transaction hash displayed
   - [ ] Explorer link clickable
7. **Option B - Fallback (if NFC fails):**
   - [ ] Click on "Waiting for tap..." status badge
   - [ ] Payment triggers manually
   - [ ] Status changes to "Approved ✓"

### Test 3: Dashboard Live Update (Laptop)
1. [ ] After payment on phone, watch laptop dashboard
2. [ ] Within 5 seconds, credit summary updates:
   - [ ] Amount Used: 12.50 USDC
   - [ ] Available: $67.50 (was $80.00)
3. [ ] Verify polling is working (check network tab for periodic getCredit calls)

### Test 4: Explorer Verification
1. [ ] Click transaction hash link on `/pay` page
2. [ ] Opens Monad Testnet explorer in new tab
3. [ ] Transaction details visible:
   - [ ] From: Connected wallet address
   - [ ] To: CreditManager contract
   - [ ] Status: Success
   - [ ] Method: `executePayment`

---

## ✅ Edge Cases to Test

### Invalid States
- [ ] Try to stake without MetaMask connected → shows error
- [ ] Try to pay without wallet connected → shows error  
- [ ] Try to pay with 0 amount → validation error
- [ ] Try to pay more than credit limit → transaction reverts with clear error
- [ ] Try to approve/stake on wrong network → MetaMask prompts network switch

### Recovery Scenarios
- [ ] Reject MetaMask transaction → error displayed, state resets
- [ ] Close MetaMask during transaction → timeout handled gracefully
- [ ] Refresh page mid-flow → state preserved (or resets cleanly)

---

## ✅ Demo Readiness

### Physical Setup
- [ ] Laptop with Chrome/Brave browser
- [ ] Android phone with Chrome browser
- [ ] NFC card (or prepared to use fallback)
- [ ] Both devices on same/stable WiFi
- [ ] Phone NFC sensor position identified (center-back)
- [ ] MetaMask installed on both devices
- [ ] Same wallet imported on both devices

### Narrative Prepared
- [ ] Opening line: "This is Nexo — crypto credit you can pay with."
- [ ] Collateral → credit limit explanation rehearsed
- [ ] "Settles on Monad in under 2 seconds" line practiced
- [ ] Explorer tx display prepared (know where to click)
- [ ] Fallback plan if NFC fails (click status, narrate "card tapped")

### Backup Plans
- [ ] If MetaMask fails: Have test wallet already connected
- [ ] If NFC fails: Use hidden fallback click
- [ ] If network fails: Have recorded video of successful flow
- [ ] If demo crashes: Have screenshots of each step

---

## ✅ Final Verification (Day of Demo)

### 30 Minutes Before
- [ ] Run full flow one more time (laptop + phone)
- [ ] Verify contract still has available credit
- [ ] Check Monad Testnet RPC is responsive (ping endpoint)
- [ ] Confirm both devices have battery/are charging

### 5 Minutes Before
- [ ] Open laptop to `/app` page (already connected wallet)
- [ ] Open phone to `/pay` page (already connected wallet)
- [ ] Clear any error messages
- [ ] Have explorer tab ready to show tx hash

### During Demo
- [ ] Speak clearly and walk slowly through each step
- [ ] Point to screen elements before clicking
- [ ] Let transactions confirm fully before moving on
- [ ] Show tx hash and emphasize "on-chain, verifiable"

---

## ✅ Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "Missing required environment variables" | Fill all values in `contracts/.env` |
| "Insufficient MON balance" | Fund deployer wallet from Monad faucet |
| "Transaction reverted" | Check available credit on dashboard |
| "MetaMask not detected" | Install extension or open in MetaMask browser |
| "Network not supported" | Let app auto-add Monad Testnet |
| "Approval failed" | Check USDC balance, retry transaction |
| "NFC not working" | Use fallback click on status badge |
| "Dashboard not updating" | Wait for 5s polling cycle, or refresh manually |
| "Contract address 0x000..." | Re-run deploy script, check artifact JSON |

---

## 🚀 You're Ready to Ship

All checklist items complete? Deploy, test 3x, and demo with confidence.

**Good luck! 🎉**
