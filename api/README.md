# Hexa-cred API

NFC Bridge API for split-device payment processing.

## Two Deployment Modes

### 1. **Production (Vercel - Serverless)**
Files used:
- `tap.js` - Serverless function for NFC tap bridge
- `health.js` - Health check endpoint

These are automatically deployed as Vercel serverless functions at:
- `https://hexa-cred.vercel.app/api/tap`
- `https://hexa-cred.vercel.app/api/health`

**No server needed!** Vercel runs these as edge functions.

### 2. **Local Development (Express Server)**
File used:
- `server.js` - Express server for local testing

Start local server:
```bash
npm install
npm start
```

Runs at `http://localhost:3001`

## API Endpoints

### POST /api/tap
**Purpose:** Phone sends NFC tap data

**Request:**
```json
{
  "cardId": "0x1234...",
  "timestamp": 1234567890
}
```

**Response:**
```json
{
  "success": true,
  "tap": {
    "cardId": "0x1234...",
    "timestamp": 1234567890,
    "id": 1234567890
  }
}
```

### GET /api/tap
**Purpose:** Desktop polls for latest tap

**Response (when tap available):**
```json
{
  "tap": {
    "cardId": "0x1234...",
    "timestamp": 1234567890,
    "id": 1234567890
  }
}
```

**Response (no tap):**
```json
{
  "tap": null
}
```

**Note:** Tap is cleared after being read (one-time use).

### GET /api/health
**Purpose:** Health check

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1234567890,
  "message": "Hexa-cred NFC Bridge API is running"
}
```

## Storage

### Production (Vercel):
- In-memory storage (per-function instance)
- Taps are ephemeral (cleared after read)
- Suitable for real-time bridge usage
- No database needed for MVP

### Future Enhancement:
For persistent storage, consider:
- Vercel KV (Redis)
- Upstash Redis
- MongoDB Atlas
- PostgreSQL

## CORS

CORS is enabled for all origins (`*`) to allow:
- Desktop on any domain
- Phone on any network
- Local development

## Local Development

```bash
# Terminal 1 - Start API
cd api
npm install
npm start

# Terminal 2 - Start Frontend
cd web
npm install
npm run dev
```

Access frontend at `http://localhost:5173/merchant`

For phone testing with local API:
1. Use ngrok: `ngrok http 3001`
2. Update `web/.env.local`: `VITE_API_URL=https://xxx.ngrok.io`
3. Or use local network IP: `VITE_API_URL=http://192.168.1.X:3001`

## Production Deployment

### Automatic:
Push to GitHub → Vercel auto-deploys

### Files deployed:
- `api/tap.js` → `/api/tap` endpoint
- `api/health.js` → `/api/health` endpoint
- `server.js` is NOT deployed (local only)

### Verification:
```bash
# Check health
curl https://hexa-cred.vercel.app/api/health

# Test tap endpoint
curl https://hexa-cred.vercel.app/api/tap
# Should return: {"tap":null}
```

## Architecture

```
┌──────────────┐
│   Phone      │
│  (Chrome)    │
└──────┬───────┘
       │ POST /api/tap
       │ {cardId: "0x..."}
       ▼
┌──────────────────┐
│  Vercel          │
│  Serverless Fn   │
│  (tap.js)        │
│  Stores in       │
│  memory          │
└──────┬───────────┘
       │ GET /api/tap (every 1s)
       │ {tap: {...}}
       ▼
┌──────────────┐
│   Desktop    │
│  (MetaMask)  │
└──────────────┘
```

## Error Handling

- **API unavailable:** Desktop keeps polling, shows error after timeout
- **No tap data:** Returns `{tap: null}`, desktop keeps waiting
- **Invalid data:** Returns 400 error, phone shows error message
- **Method not allowed:** Returns 405 error

## Performance

- **Latency:** < 100ms per request
- **Polling rate:** 1 second (balanced for UX + efficiency)
- **Timeout:** 10 seconds (Vercel function limit)
- **Memory:** 128 MB per function

## Security

- HTTPS required in production (enforced by Vercel)
- No authentication needed (ephemeral data)
- No PII stored (only blockchain addresses)
- CORS enabled for demo purposes

For production hardening:
- Add rate limiting
- Implement authentication tokens
- Validate card ID format
- Add request signing

## Testing

### Local:
```bash
# Terminal 1
npm start

# Terminal 2
curl -X POST http://localhost:3001/api/tap \
  -H "Content-Type: application/json" \
  -d '{"cardId":"0x1234","timestamp":1234567890}'

curl http://localhost:3001/api/tap/latest
```

### Production:
```bash
curl -X POST https://hexa-cred.vercel.app/api/tap \
  -H "Content-Type: application/json" \
  -d '{"cardId":"0x1234","timestamp":1234567890}'

curl https://hexa-cred.vercel.app/api/tap
```
