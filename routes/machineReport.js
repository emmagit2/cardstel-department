const express = require("express");
const router = express.Router();
const pool = require('../config/db'); // your database connection (pg.Pool)

// Get all machines with their latest status
router.get("/", async (req, res) => {
  try {
    const query = `
      SELECT d.device_id, d.device_name, d.device_type,
             ms.status, ms.breakdown_start, ms.machine_ref, ms.remarks
      FROM devices d
      LEFT JOIN LATERAL (
          SELECT *
          FROM machine_status
          WHERE device_id = d.device_id
          ORDER BY created_at DESC
          LIMIT 1
      ) ms ON true
      ORDER BY d.device_name;
    `;
    
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching machines:", err);
    res.status(500).json({ error: "Failed to fetch machines" });
  }
});

module.exports = router;
