# Order Management Backend

A Node.js + Express backend for handling product orders with PostgreSQL database.

## Setup Instructions

### 1. Install PostgreSQL (if not already installed)
- **macOS**: `brew install postgresql` or download from https://www.postgresql.org/
- **Windows/Linux**: Download from https://www.postgresql.org/

### 2. Start PostgreSQL
```bash
# macOS (if installed via brew)
brew services start postgresql

# Or manually start the server
```

### 3. Create Database User
```bash
psql -U postgres
CREATE USER postgres WITH PASSWORD 'postgres';
ALTER USER postgres SUPERUSER;
\q
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Initialize Database
```bash
npm run init-db
```

### 6. Run the Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Create Order (POST)
```
POST /api/orders
Content-Type: application/json

{
  "customer_name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "shipping_address": "123 Main St, City, Country 12345",
  "product_name": "Your Product Name",
  "quantity": 2,
  "price": 29.99
}
```

**Response:**
```json
{
  "message": "Order created successfully",
  "order_id": 1,
  "created_at": "2025-03-18T10:30:00Z"
}
```

### Get All Orders (GET)
```
GET /api/orders
```

Returns all orders sorted by newest first.

### Get Single Order (GET)
```
GET /api/orders/:id
```

Returns a specific order by ID.

### Health Check (GET)
```
GET /health
```

Simple endpoint to verify server is running.

## Frontend Integration

In your HTML form, submit to:

```javascript
const formData = {
  customer_name: document.getElementById('name').value,
  email: document.getElementById('email').value,
  phone: document.getElementById('phone').value,
  shipping_address: document.getElementById('address').value,
  product_name: "Your Product Name",
  quantity: document.getElementById('quantity').value,
  price: 29.99
};

fetch('http://localhost:5000/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(formData)
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));
```

## Environment Variables (.env)

Modify as needed:
- `DB_HOST`: localhost
- `DB_USER`: postgres
- `DB_PASSWORD`: postgres
- `DB_NAME`: orders_db
- `DB_PORT`: 5432
- `PORT`: 5000

## Database Schema

```
orders table:
- id (auto-increment, primary key)
- customer_name (text)
- email (text)
- phone (text)
- shipping_address (text)
- product_name (text)
- quantity (integer)
- price (decimal)
- created_at (timestamp)
```

## Deploy to Vercel

### Step 1: Setup Database (Neon - Free PostgreSQL)
1. Go to https://neon.tech/
2. Sign up with GitHub
3. Create a new project
4. Copy your **Connection String** (looks like: `postgresql://user:password@host/dbname`)

### Step 2: Deploy to Vercel
1. Push this code to GitHub
2. Go to https://vercel.com/
3. Click **"Add New"** → **"Project"**
4. Select your `order-backend` repository
5. Under **Environment Variables**, add:
   - `DB_HOST` - extract from connection string
   - `DB_USER` - extract from connection string
   - `DB_PASSWORD` - extract from connection string
   - `DB_NAME` - extract from connection string
   - `DB_PORT` - `5432`
6. Click **"Deploy"**

### Step 3: Initialize Database
Run this SQL in your Neon dashboard:

```sql
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  shipping_address TEXT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Step 4: Update Frontend URL
In `order-form.html`, change:
```javascript
const BACKEND_URL = 'https://your-project.vercel.app';
```

Your new API endpoints will be:
- **POST** `https://your-project.vercel.app/api/orders`
- **GET** `https://your-project.vercel.app/api/orders`
- **GET** `https://your-project.vercel.app/api/orders/[id]`
