const db = require('../config/db');

// ================================================
// 🔍 Check if Job Code exists for the same bank
// ================================================
// controllers/checkJobs.js
exports.checkJobCode = async (req, res) => {
  try {
    const { job_code, bank_id } = req.query; // Use query for flexibility

    // Fetch the latest job for this job_code and bank_id
    const result = await db.query(
      `SELECT 
          j.id,
          j.job_code,
          j.operator_id,
          j.bank_id,
          j.start_time,
          j.shift,
          j.card_quantity,
          j.completed_qty,
          j.rejected_qty,
          j.error_count,
          j.created_at,
          u.name AS operator_name
       FROM card_job j
       LEFT JOIN users u ON j.operator_id = u.id
       WHERE j.job_code = $1 AND j.bank_id = $2
       ORDER BY j.id DESC
       LIMIT 1`,
      [job_code, bank_id]
    );

    // Check if a job was found
    if (result.rows.length > 0) {
      const job = result.rows[0];

      // Calculate remaining cards
      const remaining_qty = job.card_quantity - (job.completed_qty || 0);

      // Determine if job is fully completed
      const is_completed = (job.completed_qty || 0) >= job.card_quantity;

      // Send response
      res.json({
        exists: true,
        data: {
          job_id: job.id,
          job_code: job.job_code,
          operator_id: job.operator_id,
          operator_name: job.operator_name,
          bank_id: job.bank_id,
          start_time: job.start_time,
          shift: job.shift,
          card_quantity: job.card_quantity,
          completed_qty: job.completed_qty || 0,
          rejected_qty: job.rejected_qty || 0,
          error_count: job.error_count || 0,
          remaining_qty,
          is_completed,
          created_at: job.created_at,
        },
      });
    } else {
      // No job found
      res.json({ exists: false });
    }
  } catch (err) {
    console.error("❌ Error checking job code:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
