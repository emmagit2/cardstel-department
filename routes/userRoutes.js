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

// 📬 GET Mailer Officers
router.get('/mailer-officers', async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, name, username, email FROM users WHERE position ILIKE '%Mailer Officer%' ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching Mailer Officers:', err.message);
    res.status(500).json({ error: 'Failed to fetch Mailer Officers' });
  }
});

// ⚙️ GET Machine Operators
router.get('/machine-operators', async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, name, username, email FROM users WHERE position ILIKE '%Machine Operator%' ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching Machine Operators:', err.message);
    res.status(500).json({ error: 'Failed to fetch Machine Operators' });
  }
});

// ✅ GET QC Officers
router.get('/qc-officers', async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, name, username, email FROM users WHERE position ILIKE '%QC Officer%' ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching QC Officers:', err.message);
    res.status(500).json({ error: 'Failed to fetch QC Officers' });
  }
});

module.exports = router;
