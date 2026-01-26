const pool = require("../config/db");

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new category
exports.createCategory = async (req, res) => {
  const { name } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO categories(name) VALUES($1) RETURNING *',
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
