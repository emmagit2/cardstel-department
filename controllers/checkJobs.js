const db = require('../config/db');

// ================================================
// 🔍 Check if Job Code exists for the same bank
// ================================================
exports.checkJobCode = async (req, res) => {
  try {
    const { job_code, bank_id } = req.params;

    const result = await db.query(
      `SELECT job_code, operator_id, bank_id, start_time
       FROM card_job
       WHERE job_code = $1 AND bank_id = $2
       ORDER BY id DESC LIMIT 1`,
      [job_code, bank_id]
    );

    if (result.rows.length > 0) {
      res.json({ exists: true, data: result.rows[0] });
    } else {
      res.json({ exists: false });
    }
  } catch (err) {
    console.error('❌ Error checking job code:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
