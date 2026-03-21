const pool = require('../db');

function getRequestUser(req) {
  const headerUser = req.headers['x-user'];
  if (!headerUser) return null;

  try {
    return JSON.parse(headerUser);
  } catch {
    return null;
  }
}

function isAdminRequest(req) {
  const requestUser = getRequestUser(req);
  return requestUser && requestUser.role === 'admin';
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {

    // 🔥 DEBUG MODE (kein Admin nötig)
    if (req.query?.debug === '1') {
      const dbUrl = new URL(process.env.DATABASE_URL);

      const countResult = await pool.query(
        `SELECT COUNT(*)::int AS count FROM user_sessions`
      );

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
    }

    // 🔒 ADMIN CHECK
    if (!isAdminRequest(req)) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    // 🟢 ACTIVE USERS (LIVE)
    const activeResult = await pool.query(`
      SELECT
        id,
        user_id,
        username,
        role,
        login_at,
        last_seen_at,
        'online' AS session_status,
        EXTRACT(EPOCH FROM (NOW() - login_at))::BIGINT AS duration_seconds
      FROM user_sessions
      WHERE logout_at IS NULL
        AND last_seen_at >= NOW() - INTERVAL '60 seconds'
      ORDER BY login_at DESC
    `);

    // 📜 HISTORY
    const historyResult = await pool.query(`
      SELECT
        id,
        user_id,
        username,
        role,
        login_at,
        logout_at,
        CASE
          WHEN logout_at IS NULL AND last_seen_at >= NOW() - INTERVAL '60 seconds' THEN 'online'
          WHEN logout_at IS NULL AND last_seen_at < NOW() - INTERVAL '60 seconds' THEN 'expired'
          ELSE 'offline'
        END AS session_status,
        EXTRACT(EPOCH FROM (
          COALESCE(logout_at, last_seen_at) - login_at
        ))::BIGINT AS duration_seconds
      FROM user_sessions
      ORDER BY login_at DESC
      LIMIT 100
    `);

    return res.status(200).json({
      success: true,
      active: activeResult.rows,
      history: historyResult.rows
    });

  } catch (error) {
    console.error('SESSIONS ERROR:', error);

    return res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
};
