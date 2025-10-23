const db = require('../config/db'); // ✅ This must export a connected pg.Pool instance

// ================================================
// 📨 Submit Machine Job (from Electron frontend)
// ================================================
exports.submitMachineJob = async (req, res) => {
  try {
    const {
      job_code,
      operator_id,
      bank_id,
      card_quantity,
      card_type,
      device_id,
      start_time,
      shift,
      received_time,
      completed_qty,
      rejected_qty,
      error_count,
      nd_report
    } = req.body;

    // 🧾 Basic validation
    if (!job_code || !bank_id || !card_quantity || !card_type) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing required fields' });
    }

    // ✅ Insert into PostgreSQL
    const result = await db.query(
      `
      INSERT INTO card_job (
        job_code, operator_id, bank_id, card_quantity, card_type,
        device_id, start_time, shift, received_time,
        completed_qty, rejected_qty, error_count, nd_report
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13
      )
      RETURNING id
      `,
      [
        job_code,
        operator_id || null,
        bank_id,
        card_quantity,
        card_type,
        device_id || null,
        start_time || null,
        shift || 'morning',
        received_time || null,
        completed_qty || 0,
        rejected_qty || 0,
        error_count || 0,
        nd_report || null
      ]
    );

    console.log(`✅ Job "${job_code}" saved to central DB`);
    res.json({ success: true, job_id: result.rows[0].id });
  } catch (err) {
    console.error('❌ Error inserting job:', err);
    res
      .status(500)
      .json({ success: false, message: err.message || 'Server error' });
  }
};
