const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory storage for taps
let latestTap = null;

// POST endpoint - phone sends tap data
app.post('/api/tap', (req, res) => {
  const { cardId, timestamp } = req.body;
  
  latestTap = {
    cardId,
    timestamp: timestamp || Date.now(),
    id: Date.now()
  };
  
  console.log('📱 NFC Tap received:', latestTap);
  
  res.json({ success: true, tap: latestTap });
});

// GET endpoint - desktop polls for latest tap
app.get('/api/tap/latest', (req, res) => {
  if (!latestTap) {
    return res.json({ tap: null });
  }
  
  const tap = latestTap;
  latestTap = null; // Clear after sending (one-time read)
  
  res.json({ tap });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`🚀 Hexa-cred NFC Bridge API running on port ${PORT}`);
  console.log(`📱 Phone endpoint: http://localhost:${PORT}/api/tap`);
  console.log(`💻 Desktop polling: http://localhost:${PORT}/api/tap/latest`);
});
