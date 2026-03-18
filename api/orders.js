const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'POST') {
      const { customer_name, email, phone, shipping_address, product_name, quantity, price } = req.body;

      if (!customer_name || !email || !product_name || quantity == null || price == null) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const query = `
        INSERT INTO orders (customer_name, email, phone, shipping_address, product_name, quantity, price)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, created_at;
      `;

      const result = await pool.query(query, [customer_name, email, phone || null, shipping_address || null, product_name, quantity, price]);

      res.status(201).json({
        message: 'Order created successfully',
        order_id: result.rows[0].id,
        created_at: result.rows[0].created_at
      });
    } else if (req.method === 'GET') {
      const query = 'SELECT * FROM orders ORDER BY created_at DESC;';
      const result = await pool.query(query);
      res.json(result.rows);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Database error', details: error.message });
  }
};
