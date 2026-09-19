const express = require('express');
const cors = require('cors');
require('dotenv').config();


// Import the Supabase database connection from your db.js file
const pool = require('./db');

const app = express();
app.use(express.json());
app.use(cors());

// Import and use existing routes
const authRoutes = require('./routes/authRoutes');
const scanRoutes = require('./routes/scanRoutes');

app.use('/api/scans', scanRoutes);
app.use('/api/auth', authRoutes);

// ==========================================
// Admin Panel Backend Routes (PostgreSQL)
// ==========================================

// 1. Get All Registered Users
app.get('/api/admin/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, role, created_at FROM users ORDER BY created_at DESC;');
    res.json({ success: true, users: result.rows });
  } catch (err) {
    console.error("Users API Error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Get All Global Scan History
app.get('/api/admin/all-scans', async (req, res) => {
  try {
    const query = `
      SELECT scan_history.*, users.email as user_email 
      FROM scan_history 
     LEFT JOIN users ON scan_history.user_id::text = users.id::text
      ORDER BY scan_history.created_at DESC;
    `;
    const result = await pool.query(query);
    res.json({ success: true, scans: result.rows });
  } catch (err) {
    console.error("API Error Details:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Phishing Detection Backend running on port ${PORT}`);
});