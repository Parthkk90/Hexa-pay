# Complete Testing Guide - Monad Credit Protocol

## ✅ Current Status

**All systems operational:**
- ✅ Smart contracts deployed to Monad Testnet
- ✅ Frontend running at http://localhost:5175/
- ✅ 94 test cases passing
- ✅ Production build successful

---

## 🚀 Quick Start Testing

### 1. Access the Application

**Open your browser:**
```
http://localhost:5175/
```

You'll see three pages:
- **/** - Landing page with project overview
- **/app** - Borrower Dashboard (your screenshot shows this page)
- **/pay** - Merchant Payment Terminal for NFC payments

---

## 📱 Testing Flow: Borrower Dashboard

Based on your screenshot, you've already completed Steps 1 & 2! Here's the complete flow:

### ✅ Step 1: Connect Wallet (DONE)
Your wallet is connected: `0xd92e...1ceb`  
Balance: 5000.00 USDC ✓

### ✅ Step 2: Approve USDC (DONE)
USDC has been approved for staking ✓

### 🔄 Step 3: Stake Collateral & Open Credit Line

**What you should see now:**

After Step 2 is complete, a **Step 3** should appear below showing:
```
Step 3: Stake & Open Credit Line
[Button: Stake 100 USDC & Open Line]
```

**Action Required:**
1. Click the "Stake 100 USDC & Open Line" button
2. MetaMask will prompt you to confirm the transaction
3. Wait for transaction confirmation (~3-5 seconds on Monad)
4. Step 3 will show a ✓ checkmark

### 📊 Step 4: View Your Credit Summary

After staking, a green box should appear showing:

```
Your Credit Line
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Collateral:         100.00 USDC
Credit Limit:       $80.00        <- 80% LTV (starting tier)
Amount Used:        0.00 USDC
Available:          $80.00
Reputation Score:   0
```

**What this means:**
- You staked 100 USDC
- You can now spend up to $80 (80% loan-to-value ratio)
- As you repay on time, your reputation increases
- Higher reputation = higher LTV (up to 100%)

---

## 💳 Testing Flow: Merchant Terminal

### Navigate to Payment Terminal

1. Open new browser tab or click navigation
2. Go to http://localhost:5175/pay
3. You'll see the **Merchant Payment Terminal**

### Test Payment Execution

**Current Wallet Status:**
- Connected: 0xd92e...1ceb
- Active Credit Line: Yes (after Step 3 above)
- Available Credit: $80.00

**Steps to Test Payment:**

1. **Set Merchant Details:**
   - Merchant Name: "Coffee Shop" (default is fine)
   - Amount: Enter `12.50` (or any amount up to $80)

2. **Execute Payment:**
   - Click "Start NFC Scan" button
   - On desktop/laptop (no NFC): Click the status text to trigger fallback payment
   - On Android phone with NFC: Tap your NFC card

3. **Watch for Success:**
   ```
   Status: ✓ Approved
   Transaction Hash: 0x...
   [View on Explorer →]
   ```

4. **Verify Update:**
   - Go back to /app (Borrower Dashboard)
   - Within 5 seconds, you should see:
     - Amount Used: 12.50 USDC
     - Available: $67.50 (80 - 12.50)

---

## 🧪 Complete Test Scenarios

### Scenario 1: Basic Credit Flow ✅

```
1. Connect wallet          → 0xd92e...1ceb connected
2. Approve 100 USDC        → Transaction confirmed
3. Stake 100 USDC          → Credit line opened
4. Check credit summary    → $80 limit, $80 available
5. Go to /pay              → Make $12.50 payment
6. Return to /app          → See $67.50 available
```

### Scenario 2: Multiple Payments 💰

```
1. Start with $80 available credit
2. Payment #1: $12.50  → Available: $67.50
3. Payment #2: $20.00  → Available: $47.50
4. Payment #3: $15.00  → Available: $32.50
5. Try $50 payment     → Should FAIL (exceeds limit)
```

### Scenario 3: Reputation Building 📈

*Note: This requires implementing repayment UI (future enhancement)*

```
1. Borrow $50 from credit line
2. Repay $50 (requires calling repay() function)
3. Reputation Score increases by +5
4. Credit limit recalculates based on new score
5. At score 10: Limit increases to 85% LTV ($85)
```

**Reputation Tiers:**
- Score 0-9:   80% LTV
- Score 10-24: 85% LTV
- Score 25-49: 90% LTV
- Score 50-99: 95% LTV
- Score 100+:  100% LTV

---

## 🔍 Troubleshooting Common Issues

### Issue: "Step 3" button not appearing

**Cause:** Step 2 state not updated properly

**Fix:**
1. Refresh the page
2. Your wallet should still be connected
3. If Step 2 shows ✓, you can proceed
4. If not showing, click "Approve" again

### Issue: "Credit limit exceeded" error

**Cause:** Trying to spend more than available credit

**Check:**
- Available credit on /app dashboard
- Ensure payment amount ≤ available credit
- Remember: Initial limit is 80% of collateral

### Issue: MetaMask not switching to Monad

**Cause:** Network not added to MetaMask

**Fix:**
1. The app auto-adds Monad Testnet
2. If it fails, manually add:
   - Network Name: Monad Testnet
   - RPC URL: https://testnet-rpc.monad.xyz
   - Chain ID: 10143
   - Currency: MON
   - Explorer: https://testnet.monadexplorer.com

### Issue: Transaction pending forever

**Cause:** Insufficient MON for gas

**Fix:**
1. Your wallet (0xd92e...1ceb) should have 50 MON
2. Check balance on explorer
3. If low, request more from faucet

### Issue: "No active credit line" error

**Cause:** Haven't completed Step 3 (staking)

**Fix:**
1. Return to /app
2. Complete Step 3: Stake collateral
3. Wait for transaction confirmation
4. Return to /pay

---

## 📊 Deployed Contract Addresses

**Monad Testnet (Chain ID: 10143)**

```
MockUSDC:        0xDB8127513663b991A1A24BdA4F9f2f02A112D974
CreditManager:   0x455AC5919140d0149aad95D8242a04c1462eA986
Deployer:        0xD92E59A5a242BeC9A74C6e0b0f68cDc726eC1Ceb
```

**View Contracts:**
- Explorer: https://testnet.monadexplorer.com
- CreditManager: https://testnet.monadexplorer.com/address/0x455AC5919140d0149aad95D8242a04c1462eA986
- MockUSDC: https://testnet.monadexplorer.com/address/0xDB8127513663b991A1A24BdA4F9f2f02A112D974

---

## 🎯 Next Steps & Recommendations

### Immediate Testing Priorities

1. **✅ Complete Step 3** - Stake collateral to open credit line
2. **✅ Test Payment Flow** - Navigate to /pay and make a test payment
3. **✅ Verify Live Updates** - Watch dashboard auto-update every 5 seconds
4. **✅ Test Edge Cases** - Try exceeding credit limit, zero amounts, etc.

### Demo Preparation

**For presenting to judges/users:**

1. **Pre-load Scenario:**
   - Already have wallet connected
   - Credit line active with visible balance
   - Navigate directly to /pay for demo

2. **Talking Points:**
   - "Built on Monad Testnet for instant settlement"
   - "NFC card payments with crypto credit"
   - "Dynamic reputation system - borrow responsibly, unlock higher limits"
   - "No banks, no traditional credit checks"

3. **Live Demo Flow:**
   ```
   1. Show /app with active credit line (30 seconds)
   2. Navigate to /pay terminal (10 seconds)
   3. Enter amount, execute payment (20 seconds)
   4. Back to /app to show updated balance (15 seconds)
   5. Explain reputation system (25 seconds)
   Total: ~100 seconds
   ```

### Production Deployment Options

**Option 1: Static Hosting (Recommended for Hackathon)**
```bash
cd web
npm run build
# Upload dist/ folder to:
# - Vercel
# - Netlify
# - GitHub Pages
# - Fleek (Web3 hosting)
```

**Option 2: Keep Local Dev Server**
- Already running on http://localhost:5175/
- Good for testing and local demos
- Not accessible externally

**Option 3: Deploy with ngrok (Share Demo)**
```bash
ngrok http 5175
# Gives you public URL like: https://xyz.ngrok.io
```

---

## 🐛 Known Limitations & Future Enhancements

### Current Limitations

1. **No Repayment UI:**
   - Can only test repayment via contract interaction
   - Enhancement: Add "Repay Credit" button on /app

2. **NFC Fallback Required:**
   - Desktop browsers don't support Web NFC API
   - Mobile Android Chrome required for real NFC
   - Current: Click status text as fallback trigger

3. **No Multi-Wallet Support:**
   - One wallet per session
   - Enhancement: "Switch Wallet" button

4. **Hard-Coded Demo Values:**
   - Merchant name defaults to "Coffee Shop"
   - Payment amount defaults to "$12.50"
   - Enhancement: Make these persistent/customizable

### Suggested Next Features

**High Priority:**
1. ✨ Repayment UI on dashboard
2. ✨ Transaction history list
3. ✨ QR code generation for payments
4. ✨ Better mobile responsive design

**Medium Priority:**
5. ✨ Multi-currency support (not just USDC)
6. ✨ Analytics dashboard (total volume, APR, etc.)
7. ✨ Notifications for low credit/payment success
8. ✨ Dark/light theme toggle

**Low Priority:**
9. ✨ Social features (reputation leaderboard)
10. ✨ Merchant dashboard (separate from borrower)
11. ✨ Admin panel for protocol parameters
12. ✨ Integration with real NFC payment hardware

---

## 📞 Support & Resources

### Documentation
- Main README: `/Hexa/README.md`
- Deployment Checklist: `/Hexa/contracts/DEPLOYMENT_CHECKLIST.md`
- Test Documentation: `/Hexa/contracts/TEST_DOCUMENTATION.md`
- Verification Report: `/Hexa/contracts/VERIFICATION_REPORT.md`

### Key Files
- Smart Contracts: `/Hexa/contracts/contracts/`
- Frontend Pages: `/Hexa/web/src/pages/`
- Contract Config: `/Hexa/web/src/config/contracts.ts`
- Network Config: `/Hexa/web/src/config/chains.ts`

### Testing Commands
```bash
# Run smart contract tests
cd contracts
npm test

# Build frontend
cd web
npm run build

# Start dev server
cd web
npm run dev
```

---

## ✅ Pre-Demo Checklist

**Before your presentation:**

- [ ] Dev server running on http://localhost:5175/
- [ ] MetaMask installed and unlocked
- [ ] Monad Testnet added to MetaMask
- [ ] Wallet has MON for gas (check balance)
- [ ] Credit line already opened (pre-complete Steps 1-3)
- [ ] Test payment flow works (make 1-2 test transactions)
- [ ] Browser console cleared (press F12 → Clear)
- [ ] Close unnecessary browser tabs
- [ ] Have contract addresses ready to share
- [ ] Have explorer links bookmarked
- [ ] Prepare 90-second elevator pitch
- [ ] Screenshot backup of working UI
- [ ] Video recording of full flow (backup)

**Recommended Demo Order:**
1. Show landing page (/, 10 sec)
2. Show borrower dashboard with active credit (15 sec)
3. Navigate to payment terminal (5 sec)
4. Execute live payment (20 sec)
5. Back to dashboard showing updated balance (10 sec)
6. Explain reputation system and future vision (30 sec)

---

## 🎉 Success Criteria

**Your application is working correctly if:**

✅ Wallet connects to 0xd92e...1ceb  
✅ USDC balance shows 5000.00  
✅ Approval transaction confirms  
✅ Staking transaction confirms  
✅ Credit line shows $80 limit (80% of 100 USDC)  
✅ Payment on /pay executes successfully  
✅ Dashboard updates within 5 seconds  
✅ Transaction hash appears with explorer link  
✅ All 94 tests pass in contracts  
✅ Frontend builds without errors  

**You're ready to demo! 🚀**

---

**Need help?** Check the console (F12) for any error messages and refer to the troubleshooting section above.
