const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// We will receive the io instance from server.js
let io;
function setSocketIO(socketInstance) {
  io = socketInstance;
}

// ----------------------
// CREATE JOB
// ----------------------
router.post("/add", async (req, res) => {
  try {
    const { job_id, bank_id, quantity, processed, priority } = req.body;

    if (!job_id || !bank_id || !quantity) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const result = await pool.query(
      `INSERT INTO job_code (job_id, bank_id, quantity, processed, priority, created_at)
       VALUES ($1, $2, $3, $4, $5, now()) RETURNING *`,
      [job_id, bank_id, quantity, processed, priority || "low"]
    );

    const newJob = result.rows[0];

    // ---------------- SOCKET.IO NOTIFICATION ----------------
    if (io) {
      const bankResult = await pool.query(
        `SELECT bank_name FROM bank WHERE bank_id = $1`,
        [bank_id]
      );
      const bank_name = bankResult.rows[0]?.bank_name || "";

      io.emit("new-job", {
        id: newJob.id,
        job_id: newJob.job_id,
        priority: newJob.priority.toLowerCase(),
        bank_name,
        created_at: newJob.created_at, // send actual timestamp
      });
      console.log("New job notification sent:", newJob.job_id);
    }

    res.status(201).json({
      message: "Job added successfully",
      job: newJob,
    });
  } catch (err) {
    console.error("Error inserting job:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});



// Export router AND the setSocketIO function
module.exports = { router, setSocketIO };
