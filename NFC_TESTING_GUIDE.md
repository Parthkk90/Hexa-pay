# NFC Payment Testing Guide for Android

## 🎯 Overview

This guide explains how to test **real NFC card payments** on your Android phone using the Hexa Credit payment terminal.

---

## 📱 Requirements

### Device Requirements
- ✅ Android phone with NFC capability
- ✅ Chrome browser (version 89+)
- ✅ NFC enabled in phone settings
- ✅ NFC card or tag (any NDEF-compatible tag)

### Development Requirements
- ✅ Dev server running on localhost
- ✅ USB cable for ADB debugging OR ngrok for remote access
- ✅ Android Debug Bridge (ADB) installed (optional)

---

## 🔧 Setup Methods

### Method 1: Chrome Remote Debugging (Recommended)

This allows you to access your localhost from your Android device.

#### Step 1: Enable USB Debugging on Android

1. Go to **Settings** → **About Phone**
2. Tap **Build Number** 7 times (Developer mode enabled)
3. Go to **Settings** → **Developer Options**
4. Enable **USB Debugging**
5. Connect phone to computer via USB

#### Step 2: Enable Port Forwarding in Chrome

1. On your computer, open Chrome
2. Navigate to: **chrome://inspect#devices**
3. Click **Port forwarding** button
4. Add port mapping:
   ```
   Port: 5175
   IP address and port: localhost:5175
   ```
5. Check **Enable port forwarding**
6. Click **Done**

#### Step 3: Access on Android

1. On your Android phone, open Chrome
2. Navigate to: **http://localhost:5175/pay**
3. You should see the Payment Terminal page
4. MetaMask will prompt you to connect (install MetaMask mobile if needed)

---

### Method 2: Using ngrok (Internet Access)

If you want to share your local server over the internet:

#### Step 1: Install ngrok

```bash
# Download from https://ngrok.com/download
# Or use package manager:
npm install -g ngrok

# Or chocolatey on Windows:
choco install ngrok
```

#### Step 2: Start ngrok Tunnel

```bash
# In a new terminal, run:
ngrok http 5175
```

**Output will show:**
```
Forwarding    https://abc123.ngrok.io -> http://localhost:5175
```

#### Step 3: Access on Android

1. Open Chrome on your Android phone
2. Navigate to the **https** URL shown by ngrok (e.g., `https://abc123.ngrok.io/pay`)
3. **Important:** Use HTTPS, not HTTP (Web NFC requires secure context)

---

### Method 3: ADB Port Forwarding (Advanced)

If Chrome Remote Debugging doesn't work:

#### Step 1: Install ADB

**Windows:**
```bash
choco install adb
```

**Mac:**
```bash
brew install android-platform-tools
```

**Linux:**
```bash
sudo apt install adb
```

#### Step 2: Connect and Forward Port

```bash
# Connect phone via USB
adb devices

# Forward port 5175
adb reverse tcp:5175 tcp:5175
```

#### Step 3: Access on Android

1. Open Chrome on Android
2. Navigate to: **http://localhost:5175/pay**

---

## 🔍 Testing NFC Payment Flow

### Step 1: Setup Credit Line (One-time)

1. On **Desktop** (http://localhost:5175/app):
   - Connect MetaMask wallet
   - Approve 100 USDC
   - Stake collateral
   - Verify credit line is active

### Step 2: Open Payment Terminal on Android

1. Navigate to: **http://localhost:5175/pay**
2. Connect the **same wallet** you used on desktop
3. You should see:
   ```
   ✓ Web NFC Ready on Android Chrome
   Tap "Start NFC Scan" then hold your NFC card to the back of your phone
   ```

### Step 3: Initiate NFC Scan

1. Enter merchant name (e.g., "Coffee Shop")
2. Enter amount (e.g., "12.50")
3. Tap **"🔍 Start NFC Scan"** button
4. Chrome will ask for **NFC permission** → Tap **Allow**
5. Status changes to **"Waiting for tap..."**

### Step 4: Tap NFC Card

1. Hold your NFC card to the **back** of your Android phone
2. You'll feel a vibration when card is detected
3. Payment automatically executes
4. Status changes to **"Approved ✓"**
5. Transaction hash appears with explorer link

### Step 5: Verify Payment

1. Go back to **http://localhost:5175/app** (dashboard)
2. Within 5 seconds, credit line updates:
   - Amount Used increases by payment amount
   - Available Credit decreases

---

## 🐛 Troubleshooting

### Issue: "NFC not supported"

**Causes:**
- Not using Chrome browser
- Not on Android device
- Android version too old

**Fix:**
- Use Chrome browser (not Firefox, Samsung Internet, etc.)
- Android 10+ recommended
- Update Chrome to latest version

---

### Issue: "NFC permission denied"

**Causes:**
- User denied permission
- NFC disabled in browser

**Fix:**
1. Go to Chrome settings
2. Navigate to: **Settings** → **Site Settings** → **NFC**
3. Find your site (localhost or ngrok URL)
4. Change permission to **Allow**
5. Refresh page and try again

Alternatively:
1. Tap menu (3 dots) on page
2. Tap **Site settings**
3. Enable **NFC**

---

### Issue: NFC doesn't trigger on tap

**Causes:**
- NFC disabled on phone
- Card not compatible
- Card too far from NFC antenna

**Fix:**
1. Enable NFC:
   - Go to **Settings** → **Connected devices** → **Connection preferences**
   - Enable **NFC**
2. Try different card position (NFC antenna usually at top back of phone)
3. Make sure card is NDEF-compatible (most modern NFC cards are)
4. Try a different NFC tag

---

### Issue: "MetaMask not detected"

**Causes:**
- MetaMask mobile app not installed
- Need to use in-app browser

**Fix:**
1. Install **MetaMask Mobile** from Play Store
2. Import your wallet using the same seed phrase
3. In MetaMask app, tap **Browser** tab
4. Navigate to your URL (localhost:5175/pay or ngrok URL)
5. MetaMask will auto-connect

---

### Issue: Page loads but button says "Manual Payment"

**Causes:**
- Web NFC API not detected
- Site not in secure context

**Fix:**
1. Ensure using HTTPS (for ngrok) or localhost
2. Check Chrome version (must be 89+)
3. Navigate to: **chrome://flags**
4. Search for "Web NFC"
5. Ensure it's **Enabled**
6. Restart Chrome

---

### Issue: Permission prompt doesn't appear

**Causes:**
- Permission already denied
- Site settings blocking NFC

**Fix:**
1. Clear site data:
   - Tap menu → **Settings** → **Site Settings**
   - Tap your site → **Clear & reset**
2. Refresh page
3. Try NFC scan again

---

## 📋 Pre-Testing Checklist

Before testing NFC on Android:

- [ ] Dev server running (`npm run dev` in web directory)
- [ ] Port forwarding enabled (Chrome inspect or ADB)
- [ ] Android phone connected (USB or same network)
- [ ] NFC enabled on Android phone
- [ ] Chrome browser updated to latest version
- [ ] Credit line already opened on desktop
- [ ] Same MetaMask wallet on both devices
- [ ] NFC card ready
- [ ] Test NFC card detection (Settings → Connected devices → NFC)

---

## 🧪 Testing Scenarios

### Scenario 1: Basic NFC Payment
```
1. Navigate to /pay on Android
2. Start NFC scan
3. Tap card → Payment executes
4. Verify on dashboard
```

### Scenario 2: Multiple Cards
```
1. Start NFC scan
2. Tap Card A → Payment 1
3. Start new scan
4. Tap Card B → Payment 2
5. Any NFC tag works (no data needed from tag)
```

### Scenario 3: Error Handling
```
1. Start scan without credit line → Error
2. Start scan with zero amount → Error
3. Exceed credit limit → Transaction reverts
```

---

## 🎯 What Happens When NFC Card is Tapped

The Web NFC API flow:

1. **User taps "Start NFC Scan"**
   - `NDEFReader.scan()` called
   - Chrome requests NFC permission
   - Scanning begins

2. **User taps NFC card**
   - `onreading` event fires
   - Card data received (but we don't use it)
   - `executePayment()` function triggered

3. **Payment executes**
   - Contract call: `creditManager.executePayment(wallet, amount)`
   - Transaction sent to Monad Testnet
   - Wait for confirmation

4. **Success**
   - Transaction hash displayed
   - Explorer link shown
   - Dashboard updates

**Note:** The NFC card itself doesn't store payment data. We only use the tap as a trigger. The payment amount comes from the form fields.

---

## 🔐 Security Considerations

### Secure Context Required

Web NFC API only works in secure contexts:
- ✅ **https://** URLs (production)
- ✅ **http://localhost** (development)
- ❌ **http://192.168.x.x** (insecure)
- ❌ **http://** over internet (insecure)

### Permission Model

- User must explicitly grant NFC permission
- Permission is per-origin (domain)
- Can be revoked in Site Settings
- Re-prompts if previously denied and cleared

### Wallet Security

- MetaMask requests approval for each transaction
- Private keys never exposed
- User confirms transaction before execution
- Enable biometric unlock on MetaMask mobile

---

## 📊 NFC Status Indicators

The payment terminal shows different messages:

| Message | Meaning | Action |
|---------|---------|--------|
| ✓ Web NFC Ready on Android Chrome | NFC API detected, ready to use | Tap "Start NFC Scan" |
| ⚠ NFC permission denied | User denied permission | Enable in Site Settings |
| ⚠ NFC requires Android Chrome | Using desktop or non-Chrome browser | Use fallback (click waiting status) |
| NFC not supported | Browser/device doesn't support Web NFC | Use fallback mode |
| Waiting for tap... | Actively scanning for NFC | Tap your card now |

---

## 🚀 Production Deployment

For production (real-world merchant terminals):

### Option 1: PWA (Progressive Web App)
```
- Deploy to Vercel/Netlify with HTTPS
- Add manifest.json for installable app
- Users install on phone home screen
- Works offline after install
```

### Option 2: Dedicated Tablet
```
- Use Android tablet as payment terminal
- Install Chrome in kiosk mode
- Pin payment page URL
- Keep device charged and connected
```

### Option 3: Physical NFC Terminal
```
- Embed web app in custom hardware
- Use Android Things OS
- Direct NFC hardware integration
- Merchant-specific branding
```

---

## 📚 Additional Resources

### Documentation
- [Web NFC API Spec](https://w3c.github.io/web-nfc/)
- [Chrome NFC Support](https://developer.chrome.com/articles/nfc/)
- [NDEF Message Format](https://learn.adafruit.com/adafruit-pn532-rfid-nfc/ndef)

### Testing Tools
- **NFC TagInfo** app - Test if your card is NDEF-compatible
- **Chrome DevTools** - Debug NFC events (chrome://inspect)
- **ngrok** - Expose localhost to internet with HTTPS

### Troubleshooting
- Check browser console for NFC errors (F12 on Android Chrome)
- Test NFC with other apps to verify hardware works
- Use `console.log()` in the code to debug event flow

---

## ✅ Quick Test Commands

```bash
# Start dev server
cd F:\W3\monand_mumbai\Hexa\web
npm run dev

# In new terminal: Start ngrok (if using Method 2)
ngrok http 5175

# Connect Android via ADB (if using Method 3)
adb devices
adb reverse tcp:5175 tcp:5175

# Check if NFC is working (from Android Chrome console)
# Navigate to: chrome://inspect#devices
# Open DevTools for your page
# Run in console:
'NDEFReader' in window  // Should return true
```

---

## 🎉 Success Criteria

Your NFC payment is working correctly when:

- ✅ Android Chrome shows "Web NFC Ready"
- ✅ NFC permission granted (no errors)
- ✅ "Start NFC Scan" button shows 🔍 icon
- ✅ Status changes to "Waiting for tap..."
- ✅ Phone vibrates when card is tapped
- ✅ Payment executes automatically
- ✅ Transaction hash appears
- ✅ Dashboard updates showing reduced credit

**You're ready for real NFC payments! 📱💳**

---

## 🆘 Still Having Issues?

1. **Check browser console** (F12 in Chrome DevTools)
2. **Test with different NFC card/tag**
3. **Verify NFC works in other apps** (Google Pay, etc.)
4. **Check phone's NFC antenna location** (usually top-back)
5. **Update Chrome to latest version**
6. **Try different port forwarding method**
7. **Check MetaMask mobile is connected to Monad Testnet**

If all else fails, the fallback mode on desktop still works perfectly for testing the payment flow!
