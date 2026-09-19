const express = require('express');
const router = express.Router();
const pool = require('../db');

// Register Route
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    // Insert new user
    const newUser = await pool.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, password, name]
    );

    res.json({ success: true, user: newUser.rows[0] });
  } catch (err) {
    console.error('Register Error:', err.message);
    res.status(500).json({ success: false, error: 'Server error during registration' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check user credentials
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND password = $2',
      [email, password]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    res.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('EXACT LOGIN ERROR:', err.message);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;