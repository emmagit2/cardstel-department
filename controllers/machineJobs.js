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
      nd_report,
      nd_status, // ✅ machine status from frontend
    } = req.body;

    // 🧾 Basic validation
    if (!job_code || !bank_id || !card_quantity || !card_type) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // ✅ 1. Get total completed quantity so far
    const totalRes = await db.query(
      `
      SELECT COALESCE(SUM(completed_qty), 0) AS total_completed
      FROM card_job
      WHERE job_code = $1 AND bank_id = $2
      `,
      [job_code, bank_id]
    );

    const previousTotal = Number(totalRes.rows[0].total_completed);

    // ✅ 2. Calculate new total
    const newTotal = previousTotal + Number(completed_qty || 0);

    // ✅ 3. Determine job_status (AUTO)
    let job_status;
    if (newTotal >= card_quantity) job_status = "Completed";
    else if (newTotal >= card_quantity * 0.8) job_status = "Almost Done";
    else if (newTotal > 0) job_status = "Ongoing";
    else job_status = "Pending";

    // ✅ 4. Insert job row (BOTH statuses)
    const result = await db.query(
      `
      INSERT INTO card_job (
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
        nd_report,
        nd_status,
        job_status
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13,
        $14, $15
      )
      RETURNING id, job_status
      `,
      [
        job_code,
        operator_id || null,
        bank_id,
        card_quantity,
        card_type,
        device_id || null,
        start_time || null,
        shift || "morning",
        received_time || null,
        completed_qty || 0,
        rejected_qty || 0,
        error_count || 0,
        nd_report || null,
        nd_status || "Operational", // ✅ machine state
        job_status,                 // ✅ production state
      ]
    );

    console.log(
      `✅ Job "${job_code}" saved | nd_status="${nd_status}" | job_status="${job_status}"`
    );

    res.json({
      success: true,
      job_id: result.rows[0].id,
      job_status,
    });
  } catch (err) {
    console.error("❌ Error inserting job:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
};

