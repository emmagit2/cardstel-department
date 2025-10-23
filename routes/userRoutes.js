// routes/users.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // PostgreSQL pool

// 📦 GET all users
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM users ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching users:', err.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
