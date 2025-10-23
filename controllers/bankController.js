// controllers/bankController.js
const pool = require("../config/db");

/**
 * GET /api/banks
 * Returns all banks (id + name)
 */
exports.getBanks = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT bank_id, bank_name
      FROM bank
      ORDER BY bank_name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching banks:", err);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * GET /api/banks/:id
 * Returns details for a single bank
 */
exports.getBankById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT bank_id, bank_name, created_at -- adjust fields as required
       FROM bank
       WHERE bank_id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Bank not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error fetching bank by id:", err);
    res.status(500).json({ error: "Server error" });
  }
};
