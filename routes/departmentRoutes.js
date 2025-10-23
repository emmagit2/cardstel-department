const express = require('express');
const router = express.Router();
const pool = require("../config/db"); // PostgreSQL pool

// GET all departments
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM departments ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET the department of a specific user by uid
router.get('/user', async (req, res) => {
  const { uid } = req.query;
  if (!uid) return res.status(400).json({ message: 'User ID (uid) is required' });

  try {
    // Find the user's department_id from users table
    const userResult = await pool.query(
      'SELECT department_id FROM users WHERE firebase_uid = $1',
      [uid]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const departmentId = userResult.rows[0].department_id;

    if (!departmentId) {
      return res.status(404).json({ message: 'User has no department assigned' });
    }

    // Fetch and return the department
    const deptResult = await pool.query(
      'SELECT * FROM departments WHERE id = $1',
      [departmentId]
    );

    if (deptResult.rows.length === 0) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.json(deptResult.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new department
router.post('/', async (req, res) => {
  const { name } = req.body;

  if (!name) return res.status(400).json({ message: 'Department name is required' });

  try {
    // Check for duplicate department name (case-insensitive)
    const existing = await pool.query('SELECT * FROM departments WHERE LOWER(name) = LOWER($1)', [name]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Department name already exists' });
    }

    const result = await pool.query('INSERT INTO departments(name) VALUES($1) RETURNING *', [name]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error creating department' });
  }
});

// DELETE a department
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM departments WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT / UPDATE department
router.put('/:id', async (req, res) => {
  const { name } = req.body;
  const { id } = req.params;

  if (!name) return res.status(400).json({ message: 'Department name is required' });

  try {
    // Ensure name is unique except for this record
    const existing = await pool.query(
      'SELECT * FROM departments WHERE LOWER(name) = LOWER($1) AND id != $2',
      [name, id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Department name already exists' });
    }

    const result = await pool.query(
      'UPDATE departments SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error updating department' });
  }
});

module.exports = router;
