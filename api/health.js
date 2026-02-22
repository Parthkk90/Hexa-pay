// Health check endpoint for API
// Endpoint: /api/health

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      timestamp: Date.now(),
      message: 'Hexa-cred NFC Bridge API is running',
      endpoints: {
        tap: '/api/tap (POST to send, GET to poll)'
      }
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
