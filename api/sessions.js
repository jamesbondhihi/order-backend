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

  if (!isAdminRequest(req)) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const activeResult = await pool.query(
      `SELECT id, user_id, username, role, login_at
       FROM login_sessions
       WHERE session_status = 'active'
       ORDER BY login_at DESC`
    );

    const historyResult = await pool.query(
      `SELECT
         id,
         user_id,
         username,
         role,
         login_at,
         logout_at,
         session_status,
         EXTRACT(EPOCH FROM (COALESCE(logout_at, NOW()) - login_at))::BIGINT AS duration_seconds
       FROM login_sessions
       ORDER BY login_at DESC
       LIMIT 100`
    );

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
