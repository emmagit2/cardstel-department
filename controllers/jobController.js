const db = require('../config/db');

// Bulk insert job submissions
exports.createJobSubmissions = async (req, res) => {
  const submissions = req.body; // array of job submissions
  if (!Array.isArray(submissions) || submissions.length === 0) {
    return res.status(400).json({ error: "No submissions provided" });
  }

  try {
    const insertedJobs = [];

    for (const submission of submissions) {
      const {
        job_code,
        printer_id,
        quantity,
        range_start,
        range_end,
        toner_status,
        user_id
      } = submission;

      // Extract numbers only from job_code
      const jobCodeNumber = job_code.replace(/\D/g, ""); 

      // Get the next sequence number for this job_code_number
      const seqResult = await db.query(
        `SELECT COUNT(*)::int + 1 AS seq 
         FROM jobs 
         WHERE job_id LIKE $1 || '-%'`,
        [jobCodeNumber]
      );

      const seqNum = seqResult.rows[0].seq;
      const job_id = `${jobCodeNumber}-${seqNum}`;

      const result = await db.query(
        `INSERT INTO jobs 
           (job_id, job_code, user_id, device_id, bank, range_start, range_end, query) 
         VALUES 
           ($1, $2, $3, $4, 'cardpay', $5, $6, $7) 
         RETURNING *`,
        [
          job_id,         // $1 → custom job_id
          job_code,       // $2 → job_code
          user_id,        // $3 → user_id
          printer_id,     // $4 → device_id
          range_start,    // $5
          range_end,      // $6
          toner_status    // $7 → stored in "query"
        ]
      );

      insertedJobs.push(result.rows[0]);
    }

    res.status(201).json({
      message: "Job submissions saved successfully",
      jobs: insertedJobs
    });

  } catch (err) {
    console.error("❌ Error inserting jobs:", err);
    res.status(500).json({ error: "Failed to insert job submissions" });
  }
};
