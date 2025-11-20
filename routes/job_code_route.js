const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// ----------------------
// CREATE JOB
// ----------------------
router.post("/add", async (req, res) => {
  try {
    const { job_id, bank_id, quantity, processed } = req.body;

    if (!job_id || !bank_id || !quantity) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const result = await pool.query(
      `INSERT INTO job_code (job_id, bank_id, quantity, processed)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [job_id, bank_id, quantity, processed]
    );

    res.status(201).json({
      message: "Job added successfully",
      job: result.rows[0],
    });
  } catch (err) {
    console.error("Error inserting job:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------
// READ ALL JOBS
// ----------------------
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT j.*, b.bank_name
      FROM job_code j
      JOIN bank b ON j.bank_id = b.bank_id
      ORDER BY j.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching jobs:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------
// SEARCH JOBS (by job_code and date range)
// ----------------------
router.get("/search", async (req, res) => {
  try {
    const { job_code, start_date, end_date } = req.query;

    let query = `
      SELECT j.*, b.bank_name
      FROM job_code j
      JOIN bank b ON j.bank_id = b.bank_id
      WHERE 1=1
    `;
    const params = [];
    let count = 1;

    if (job_code) {
      query += ` AND LOWER(j.job_id) LIKE $${count}`;
      params.push(`%${job_code.toLowerCase()}%`);
      count++;
    }

    if (start_date) {
      query += ` AND j.created_at >= $${count}`;
      params.push(start_date);
      count++;
    }

    if (end_date) {
      query += ` AND j.created_at <= $${count}`;
      params.push(end_date);
      count++;
    }

    query += ` ORDER BY j.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Error searching jobs:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------
// READ SINGLE JOB
// ----------------------
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT j.*, b.bank_name
      FROM job_code j
      JOIN bank b ON j.bank_id = b.bank_id
      WHERE j.id = $1
    `, [id]);

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Job not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching job:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------
// UPDATE JOB
// ----------------------
router.put("/edit/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { job_id, bank_id, quantity, processed } = req.body;

    const result = await pool.query(
      `UPDATE job_code
       SET job_id = $1, bank_id = $2, quantity = $3, processed = $4
       WHERE id = $5 RETURNING *`,
      [job_id, bank_id, quantity, processed, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Job not found" });

    res.json({
      message: "Job updated successfully",
      job: result.rows[0],
    });
  } catch (err) {
    console.error("Error updating job:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------
// DELETE JOB
// ----------------------
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM job_code WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Job not found" });

    res.json({ message: "Job deleted successfully" });
  } catch (err) {
    console.error("Error deleting job:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
