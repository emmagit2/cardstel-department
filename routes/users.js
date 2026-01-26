const express = require('express');
const app = express();
const pool = require('./db'); // your PostgreSQL connection

app.use(express.json());

// Fetch Mailer Officers
app.get('/mailer-officers', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, username, email FROM users WHERE position ILIKE '%Mailer Officer%'"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Fetch Machine Operators
app.get('/machine-operators', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, username, email FROM users WHERE position ILIKE '%Machine Operator%'"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});
