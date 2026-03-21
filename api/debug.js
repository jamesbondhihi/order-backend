const pool = require('../db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const dbUrl = new URL(process.env.DATABASE_URL);
    const countResult = await pool.query('SELECT COUNT(*)::int AS count FROM user_sessions');

    return res.status(200).json({
      success: true,
      debug: {
        hostname: dbUrl.hostname,
        database: dbUrl.pathname.replace('/', ''),
        vercelEnv: process.env.VERCEL_ENV || null,
        vercelUrl: process.env.VERCEL_URL || null
      },
      sessionCount: countResult.rows[0]?.count ?? 0
    });
  } catch (err) {
    console.error('DEBUG ERROR:', err);
    return res.status(500).json({
      success: false,
      error: 'Debug failed',
      details: err.message
    });
  }
};
