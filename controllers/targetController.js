// Import PostgreSQL pool using CommonJS
const pool = require('../config/db');

// ===========================
// GET MONTHLY TARGET
// ===========================
const getMonthlyTarget = async (req, res) => {
  try {
    const { month } = req.params; // Example: "2026-01"

    const { rows } = await pool.query(
      `SELECT * 
       FROM production_target
       WHERE period_type = 'month' AND period_value = $1
       LIMIT 1`,
      [month]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Monthly target not set' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch monthly target' });
  }
};

// ===========================
// SET OR UPDATE MONTHLY TARGET
// ===========================
const setMonthlyTarget = async (req, res) => {
  try {
    const { month, target_quantity } = req.body; // Example: { month: "2026-01", target_quantity: 60000 }

    // Check if target already exists
    const { rows } = await pool.query(
      `SELECT * FROM production_target WHERE period_type = 'month' AND period_value = $1`,
      [month]
    );

    if (rows.length > 0) {
      // Update existing target
      const result = await pool.query(
        `UPDATE production_target
         SET target_quantity = $1, created_at = NOW()
         WHERE period_type = 'month' AND period_value = $2
         RETURNING *`,
        [target_quantity, month]
      );
      return res.json({ message: 'Monthly target updated', target: result.rows[0] });
    }

    // Insert new target
    const result = await pool.query(
      `INSERT INTO production_target (period_type, period_value, target_quantity)
       VALUES ('month', $1, $2)
       RETURNING *`,
      [month, target_quantity]
    );

    res.json({ message: 'Monthly target set', target: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to set monthly target' });
  }
};

// Export as CommonJS
module.exports = { getMonthlyTarget, setMonthlyTarget };
