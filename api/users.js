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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!isAdminRequest(req)) {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }

  try {
    if (req.method === 'GET') {
      const result = await pool.query(
        'SELECT id, username, role, created_at FROM users ORDER BY id ASC'
      );

      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const { username, password, role } = req.body || {};

      if (!username || !password || !role) {
        return res.status(400).json({
          success: false,
          error: 'username, password and role are required'
        });
      }

      if (!['admin', 'staff'].includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid role'
        });
      }

      const result = await pool.query(
        `INSERT INTO users (username, password, role)
         VALUES ($1, $2, $3)
         RETURNING id, username, role, created_at`,
        [username.trim(), password, role]
      );

      return res.status(201).json({
        success: true,
        user: result.rows[0]
      });
    }

    if (req.method === 'PUT') {
      const { id, username, password, role } = req.body || {};

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'User id is required'
        });
      }

      const existing = await pool.query(
        'SELECT * FROM users WHERE id = $1 LIMIT 1',
        [id]
      );

      if (existing.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      const current = existing.rows[0];

      const newUsername =
        typeof username === 'string' && username.trim() !== ''
          ? username.trim()
          : current.username;

      const newPassword =
        typeof password === 'string' && password !== ''
          ? password
          : current.password;

      const newRole =
        typeof role === 'string' && role.trim() !== ''
          ? role.trim()
          : current.role;

      if (!['admin', 'staff'].includes(newRole)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid role'
        });
      }

      const result = await pool.query(
        `UPDATE users
         SET username = $1, password = $2, role = $3
         WHERE id = $4
         RETURNING id, username, role, created_at`,
        [newUsername, newPassword, newRole, id]
      );

      return res.status(200).json({
        success: true,
        user: result.rows[0]
      });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {};

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'User id is required'
        });
      }

      const existing = await pool.query(
        'SELECT id FROM users WHERE id = $1 LIMIT 1',
        [id]
      );

      if (existing.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      await pool.query('DELETE FROM users WHERE id = $1', [id]);

      return res.status(200).json({
        success: true
      });
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  } catch (error) {
    console.error('USERS API ERROR:', error);

    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        error: 'Username already exists'
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
};
