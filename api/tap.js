// Vercel Serverless Function for NFC Tap Bridge
// Endpoint: /api/tap

let tapStore = null;

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    // Phone sends tap data
    const { cardId, timestamp } = req.body;
    
    tapStore = {
      cardId,
      timestamp: timestamp || Date.now(),
      id: Date.now()
    };
    
    console.log('📱 NFC Tap received:', tapStore);
    
    return res.status(200).json({ success: true, tap: tapStore });
  }

  if (req.method === 'GET') {
    // Desktop polls for latest tap
    if (!tapStore) {
      return res.status(200).json({ tap: null });
    }
    
    const tap = tapStore;
    tapStore = null; // Clear after sending (one-time read)
    
    return res.status(200).json({ tap });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
