const pool = require('../db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { sessionId } = req.body || {};

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required'
      });
    }

    await pool.query(
      `UPDATE login_sessions
       SET logout_at = NOW(),
           session_status = 'ended'
       WHERE id = $1 AND session_status = 'active'`,
      [sessionId]
    );

    return res.status(200).json({
      success: true
    });
  } catch (error) {
    console.error('LOGOUT ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
};
