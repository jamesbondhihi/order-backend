const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.post('/api/orders', async (req, res) => {
  try {
    const { customer_name, email, phone, shipping_address, product_name, quantity, price } = req.body;

    if (!customer_name || !email || !phone || !shipping_address || !product_name || !quantity || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `
      INSERT INTO orders (customer_name, email, phone, shipping_address, product_name, quantity, price)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, created_at;
    `;

    const result = await pool.query(query, [customer_name, email, phone, shipping_address, product_name, quantity, price]);

    res.status(201).json({
      message: 'Order created successfully',
      order_id: result.rows[0].id,
      created_at: result.rows[0].created_at
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get all orders (for you to see what needs shipping)
app.get('/api/orders', async (req, res) => {
  try {
    const query = 'SELECT * FROM orders ORDER BY created_at DESC;';
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get single order by ID
app.get('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = 'SELECT * FROM orders WHERE id = $1;';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
