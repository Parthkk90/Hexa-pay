# Split-Device NFC Payment Demo Guide

## Overview
This setup splits NFC reading and payment processing across two devices for the best demo experience:
- **Phone (Android Chrome)**: Reads NFC cards only
- **Desktop (Laptop Chrome + MetaMask)**: Processes payments via MetaMask

## Architecture
```
┌─────────────┐                ┌─────────────┐                ┌──────────────┐
│   Phone     │                │  Backend    │                │   Desktop    │
│  (Chrome)   │                │   API       │                │ (MetaMask)   │
├─────────────┤                ├─────────────┤                ├──────────────┤
│             │  POST /tap     │             │  GET /tap      │              │
│ Read NFC ───┼───────────────>│  Store Tap  ├───────────────>│ Poll & Pay   │
│   Card      │                │   (1 sec)   │                │              │
└─────────────┘                └─────────────┘                └──────────────┘
```

## Setup Instructions

### Step 1: Start the Backend API (Bridge)
```bash
cd api
npm install
npm start
```

The API will run on `http://localhost:3001`

**Endpoints:**
- `POST /api/tap` - Phone sends NFC taps here
- `GET /api/tap/latest` - Desktop polls this every second
- `GET /api/health` - Health check

### Step 2: Configure Network Access

For the phone to reach your laptop's API:

#### Option A: Use ngrok (Easiest)
```bash
# Install ngrok: https://ngrok.com/download
ngrok http 3001
```

Copy the ngrok URL (e.g., `https://abc123.ngrok.io`) and update `web/.env`:
```
VITE_API_URL=https://abc123.ngrok.io
```

#### Option B: Local Network (Same WiFi)
1. Find your laptop's local IP:
   ```bash
   # Windows
   ipconfig | findstr IPv4
   
   # Mac/Linux
   ifconfig | grep inet
   ```

2. Update `web/.env`:
   ```
   VITE_API_URL=http://192.168.1.X:3001
   ```

3. Make sure your firewall allows port 3001

### Step 3: Build Frontend
```bash
cd web
npm run build
npm run dev
```

Access the app at `http://localhost:5173/merchant`

### Step 4: Open on Desktop (Laptop)

1. Open Chrome on your laptop
2. Navigate to `http://localhost:5173/merchant`
3. Select **💻 Desktop Mode**
4. Click **"Connect MetaMask"**
5. Connect your MetaMask wallet
6. Set merchant name and amount
7. Click **"💻 Start Waiting for Phone Tap"**

**Desktop is now listening** - it polls every second for NFC taps from the phone.

### Step 5: Open on Phone (Android)

1. Open Chrome on Android
2. Navigate to the same URL (use ngrok URL or local IP)
3. Select **📱 Phone Mode**
4. Click **"🔍 Start NFC Scanning"**
5. Grant NFC permission when prompted

**Phone is now ready** - waiting for NFC card tap.

### Step 6: Demo the Payment

1. **Tap NFC card** on the phone
2. Phone reads the card → Sends to API
3. Desktop polls API → Gets tap → Executes payment via MetaMask
4. MetaMask popup appears on desktop
5. Confirm transaction
6. Both devices show success!

## Troubleshooting

### Phone can't reach API
- Check firewall settings on laptop
- Verify phone and laptop are on same WiFi
- Try using ngrok instead
- Test API health: `curl http://YOUR_IP:3001/api/health`

### Desktop not detecting taps
- Check browser console for polling errors
- Verify API is running (`GET /api/tap/latest` should return `{tap: null}`)
- Wait at least 1 second after tap for desktop to poll

### NFC permission denied on phone
- Go to Chrome Settings → Site Settings → NFC
- Enable NFC for the site
- Restart Chrome and try again

### MetaMask not popping up
- Make sure Desktop Mode has MetaMask connected
- Check MetaMask is unlocked
- Verify wallet has enough MON for gas

## Alternative: Single-Device Mode

If you want to test on phone only (no desktop):

1. Open on phone
2. Select **📱 Phone Mode** 
3. Import authorized wallet using mnemonic
4. Phone will handle both NFC and payment

But this won't work well because:
- MetaMask app browser doesn't support NFC
- Chrome mobile can't connect to MetaMask extension

**That's why split-device mode is recommended for demos!**

## API Health Check

Test if the bridge is working:

```bash
# Send a test tap
curl -X POST http://localhost:3001/api/tap \\
  -H "Content-Type: application/json" \\
  -d '{"cardId":"0x1234...","timestamp":1234567890}'

# Get latest tap
curl http://localhost:3001/api/tap/latest
```

## Production Deployment

For a real deployment:

1. Deploy the API to a server (Heroku, Railway, etc.)
2. Update `VITE_API_URL` in `web/.env` to your production API URL
3. Enable HTTPS for secure communication
4. Add authentication/rate limiting to the API
5. Use a database instead of in-memory storage

## Demo Flow Summary

✅ Start backend API  
✅ Open desktop → Connect MetaMask → Wait  
✅ Open phone → Start scanning  
✅ Tap card on phone  
✅ Desktop auto-pays!  

This creates a realistic merchant terminal experience where:
- The merchant terminal (desktop) has the wallet
- The NFC reader (phone) is just a card reader
- They communicate seamlessly via the bridge API
