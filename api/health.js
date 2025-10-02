/**
 * Health Check Endpoint for Vercel
 * GET /api/health or /health
 */

export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    res.status(200).json({
      status: 'ok',
      message: 'Pusher webhook server is running on Vercel',
      timestamp: Date.now(),
      environment: 'production'
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}