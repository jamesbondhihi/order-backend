const pool = require('../db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const result = await pool.query(`
        SELECT
          id,
          name,
          address,
          email,
          phone,
          note,
          status,
          priority,
          saved,
          reviewed,
          reviewed_by AS "reviewedBy",
          reviewed_at AS "reviewedAt",
          created_at AS "createdAt"
        FROM customers
        ORDER BY created_at DESC, id DESC
      `);

      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const {
        name = '',
        address = '',
        email = '',
        phone = '',
        note = '',
        status = '',
        priority = '',
        saved = true
      } = req.body || {};

      const result = await pool.query(
        `
          INSERT INTO customers (name, address, email, phone, note, status, priority, saved)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING
            id,
            name,
            address,
            email,
            phone,
            note,
            status,
            priority,
            saved,
            reviewed,
            reviewed_by AS "reviewedBy",
            reviewed_at AS "reviewedAt",
            created_at AS "createdAt"
        `,
        [
          name.trim(),
          address.trim(),
          email.trim(),
          phone.trim(),
          note.trim(),
          status.trim(),
          priority.trim(),
          !!saved
        ]
      );

      return res.status(201).json({
        success: true,
        customer: result.rows[0]
      });
    }

    if (req.method === 'PUT') {
      const {
        id,
        name,
        address,
        email,
        phone,
        note,
        status,
        priority,
        saved,
        reviewed,
        reviewedBy
      } = req.body || {};

      if (!id) {
        return res.status(400).json({ success: false, error: 'Missing customer id' });
      }

      const existing = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);

      if (existing.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Customer not found' });
      }

      const current = existing.rows[0];

      const nextReviewed = typeof reviewed === 'boolean' ? reviewed : current.reviewed;
      const nextReviewedBy = typeof reviewedBy === 'string' ? reviewedBy : current.reviewed_by;
      const nextReviewedAt =
        typeof reviewed === 'boolean' && reviewed === true && !current.reviewed
          ? new Date().toISOString()
          : current.reviewed_at;

      const result = await pool.query(
        `
          UPDATE customers
          SET
            name = $1,
            address = $2,
            email = $3,
            phone = $4,
            note = $5,
            status = $6,
            priority = $7,
            saved = $8,
            reviewed = $9,
            reviewed_by = $10,
            reviewed_at = $11
          WHERE id = $12
          RETURNING
            id,
            name,
            address,
            email,
            phone,
            note,
            status,
            priority,
            saved,
            reviewed,
            reviewed_by AS "reviewedBy",
            reviewed_at AS "reviewedAt",
            created_at AS "createdAt"
        `,
        [
          typeof name === 'string' ? name.trim() : current.name,
          typeof address === 'string' ? address.trim() : current.address,
          typeof email === 'string' ? email.trim() : current.email,
          typeof phone === 'string' ? phone.trim() : current.phone,
          typeof note === 'string' ? note.trim() : current.note,
          typeof status === 'string' ? status.trim() : current.status,
          typeof priority === 'string' ? priority.trim() : current.priority,
          typeof saved === 'boolean' ? saved : current.saved,
          nextReviewed,
          nextReviewedBy || '',
          nextReviewedAt,
          id
        ]
      );

      return res.status(200).json({
        success: true,
        customer: result.rows[0]
      });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || {};

      if (!id) {
        return res.status(400).json({ success: false, error: 'Missing customer id' });
      }

      await pool.query('DELETE FROM customers WHERE id = $1', [id]);

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('CUSTOMERS API ERROR:', error);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};
