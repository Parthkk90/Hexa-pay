# Quick NFC Testing Setup

## 🚀 Fastest Way to Test NFC on Android (3 Steps)

### Step 1: Enable USB Debugging on Android (1 minute)

1. Open **Settings** on your Android phone
2. Go to **About Phone**
3. Tap **Build Number** 7 times rapidly
4. A message appears: "You are now a developer!"
5. Go back to **Settings** → **Developer Options**
6. Enable **USB Debugging**
7. Connect phone to computer with USB cable
8. Tap **Allow** when prompt appears on phone

---

### Step 2: Enable Port Forwarding in Chrome (30 seconds)

1. On your **computer**, open Chrome browser
2. Type in address bar: `chrome://inspect#devices`
3. Press Enter
4. Click **Port forwarding...** button
5. Add this:
   ```
   Port: 5175
   IP address and port: localhost:5175
   ```
6. Check ✓ **Enable port forwarding**
7. Click **Done**

Your phone should now appear in the devices list!

---

### Step 3: Access on Android (30 seconds)

1. On your **Android phone**, open **Chrome** browser
2. Navigate to: `http://localhost:5175/pay`
3. Install MetaMask mobile app if you haven't
4. Import your wallet using the same seed phrase
5. Connect wallet on the page

**Done!** Now you can test NFC payments.

---

## 🧪 Test NFC Payment

1. Make sure you completed setup on desktop:
   - Go to http://localhost:5175/app
   - Connect wallet → Approve → Stake collateral
   - Verify credit line is active

2. On **Android**, at http://localhost:5175/pay:
   ```
   Merchant: Coffee Shop
   Amount: 12.50
   ```

3. Tap **"🔍 Start NFC Scan"**

4. When prompted, tap **Allow** for NFC permission

5. You'll see: **"Waiting for tap..."**

6. **Hold your NFC card to the back of your phone**

7. Payment executes! ✅

---

## 🔧 Alternative: Use ngrok (If USB doesn't work)

### Install ngrok:
```bash
# Windows (PowerShell as Admin):
choco install ngrok

# Or download from: https://ngrok.com/download
```

### Run ngrok:
```bash
ngrok http 5175
```

### Copy the HTTPS URL:
```
Forwarding   https://abc123.ngrok.io -> http://localhost:5175
```

### On Android:
- Open Chrome
- Navigate to the **https** URL (e.g., `https://abc123.ngrok.io/pay`)
- **Important:** Must use HTTPS for Web NFC to work

---

## ✅ Success Checklist

Working correctly when you see:

- ✅ On Android page: "✓ Web NFC Ready on Android Chrome"
- ✅ Button says "🔍 Start NFC Scan" (not "Manual Payment")
- ✅ Status changes to "Waiting for tap..." in blue box
- ✅ Hold NFC card → Phone vibrates → Payment processes
- ✅ Transaction hash appears
- ✅ Go to /app → Credit updates within 5 seconds

---

## 🐛 Quick Troubleshooting

### "NFC not supported"
→ Make sure you're using **Chrome** browser on Android (not Firefox, Samsung Browser)

### "NFC permission denied"
→ Chrome menu (3 dots) → **Site settings** → Enable **NFC** → Refresh

### "MetaMask not detected"
→ Open page in **MetaMask app's browser** instead
→ MetaMask app → **Browser** tab → Enter URL

### Phone doesn't detect card
→ Try different positions on back of phone (NFC antenna location varies)
→ Settings → Connected devices → Enable **NFC**

---

## 📱 Test Your Setup

Run this in Chrome DevTools on Android:

1. On Android Chrome, open your page
2. On computer, go to `chrome://inspect#devices`
3. Find your phone → Click **inspect** next to your page
4. In console, type:
   ```javascript
   'NDEFReader' in window
   ```
5. Should return: **true** ✅

If false, your browser doesn't support Web NFC (update Chrome).

---

## 🎯 Full Test Flow (2 minutes)

```
Desktop (http://localhost:5175/app):
1. Connect wallet          [20 sec]
2. Approve 100 USDC        [15 sec]
3. Stake collateral        [15 sec]
4. Verify credit line      [5 sec]

Android (http://localhost:5175/pay):
1. Connect same wallet     [15 sec]
2. Enter amount: 12.50     [5 sec]
3. Start NFC scan          [5 sec]
4. Allow NFC permission    [5 sec]
5. Tap NFC card            [2 sec]
6. Payment confirmed!      [10 sec]

Back to Desktop (/app):
1. See updated credit      [auto-refresh]
```

**Total: ~2 minutes for complete NFC payment test!**

---

Need detailed instructions? See [NFC_TESTING_GUIDE.md](./NFC_TESTING_GUIDE.md)
