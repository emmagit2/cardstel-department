// controllers/bankCardController.js
const pool = require('../config/db'); // your database connection

// --- Add Bank Card ---
const addBankCard = async (req, res) => {
  try {
    console.log('Received POST /api/bank-cards body:', req.body);

    const { bank_id, card_brand, qty_in_vault_good, submitted_by } = req.body;

    // Collect missing fields
    const missingFields = [];
    if (!bank_id) missingFields.push('bank_id');
    if (!card_brand) missingFields.push('card_brand');
    if (!qty_in_vault_good) missingFields.push('qty_in_vault_good');
    if (!submitted_by) missingFields.push('submitted_by');

    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields);
      return res.status(400).json({
        success: false,
        error: `Missing required field(s): ${missingFields.join(', ')}`
      });
    }

    // Log query values
    console.log('Executing query with values:', [bank_id, card_brand, qty_in_vault_good, submitted_by]);

    const result = await pool.query(
      `INSERT INTO bank_cards
        (bank_id, card_brand, qty_in_vault_good, qty_in_vault_damaged, personalized, ongoing_personalization, duplicate, created_at, updated_at, submitted_by)
       VALUES ($1, $2, $3, 0, 0, 0, 0, now(), now(), $4)
       RETURNING *`,
      [bank_id, card_brand, qty_in_vault_good, submitted_by]
    );

    console.log('Bank card inserted:', result.rows[0]);
    return res.json({ success: true, data: result.rows[0] });

  } catch (err) {
    console.error('Error adding bank card:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

// --- Report Card Issue ---
const reportCardIssue = async (req, res) => {
  try {
    console.log('Received POST /api/card-issues body:', req.body);

    const { bank_id, card_brand, job_code, damaged_qty, duplicate_qty, remark, submitted_by } = req.body;

    // Collect missing fields
    const missingFields = [];
    if (!bank_id) missingFields.push('bank_id');
    if (!card_brand) missingFields.push('card_brand');
    if (!job_code) missingFields.push('job_code');
    if (!submitted_by) missingFields.push('submitted_by');

    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields);
      return res.status(400).json({
        success: false,
        error: `Missing required field(s): ${missingFields.join(', ')}`
      });
    }

    // Log query values
    console.log('Executing query with values:', [bank_id, job_code, damaged_qty || 0, duplicate_qty || 0, submitted_by]);

    const result = await pool.query(
      `INSERT INTO card_issues
        (bank_card_id, job_code, damaged_qty, duplicate_qty, remark, submitted_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, now())
       RETURNING *`,
      [bank_id, job_code, damaged_qty || 0, duplicate_qty || 0, submitted_by]
    );

    console.log('Card issue reported:', result.rows[0]);
    return res.json({ success: true, data: result.rows[0] });

  } catch (err) {
    console.error('Error reporting card issue:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};


// --- Release Cards ---
// --- Release Cards ---
const releaseCards = async (req, res) => {
  try {
    const { bank_id, card_brand, jobs, submitted_by } = req.body;

    // Validate input
    if (!bank_id || !card_brand || !jobs || !Array.isArray(jobs) || jobs.length === 0 || !submitted_by) {
      return res.status(400).json({ success: false, error: 'Missing required fields or invalid jobs array' });
    }

    const insertedReleases = [];

    for (let job of jobs) {
      const { job_code, quantity } = job;

      if (!job_code || !quantity || quantity <= 0) {
        return res.status(400).json({ success: false, error: `Invalid job_code or quantity for job ${job_code}` });
      }

      // 1️⃣ Check if job_code exists in job_code table
      const jobCheck = await pool.query(
        'SELECT id FROM job_code WHERE job_id = $1 AND bank_id = $2',
        [job_code, bank_id]
      );

      if (jobCheck.rows.length === 0) {
        return res.status(400).json({ success: false, error: `Job code ${job_code} does not exist for this bank` });
      }

      const job_code_id = jobCheck.rows[0].id;

      // 2️⃣ Check if a card_issue exists for this job code and bank_card
      const cardIssueCheck = await pool.query(
        'SELECT id FROM card_issues WHERE job_code_id = $1 AND bank_card_id = (SELECT id FROM bank_cards WHERE bank_id = $2 AND card_brand = $3)',
        [job_code_id, bank_id, card_brand]
      );

      // Use the found card_issue_id or null if not found
      const card_issue_id = cardIssueCheck.rows.length > 0 ? cardIssueCheck.rows[0].id : null;

      // 3️⃣ Get the bank_card id
      const bankCardResult = await pool.query(
        'SELECT id FROM bank_cards WHERE bank_id = $1 AND card_brand = $2',
        [bank_id, card_brand]
      );

      if (bankCardResult.rows.length === 0) {
        return res.status(400).json({ success: false, error: `Bank card ${card_brand} not found for this bank` });
      }

      const bank_card_id = bankCardResult.rows[0].id;

      // 4️⃣ Insert into released_cards table (allow card_issue_id to be null)
      const releaseResult = await pool.query(
        `INSERT INTO released_cards (card_issue_id, job_code_id, bank_card_id, quantity, released_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [card_issue_id, job_code_id, bank_card_id, quantity, submitted_by]
      );

      insertedReleases.push(releaseResult.rows[0]);
    }

    return res.json({ success: true, data: insertedReleases });

  } catch (err) {
    console.error('Error releasing cards:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};


// Get unreconciled released job codes for a bank
const getTodayJobCodes = async (req, res) => {
  const { bank_id, card_brand } = req.query;

  if (!bank_id) {
    return res.status(400).json({ error: "bank_id is required" });
  }

  try {
    const query = `
      SELECT 
        rc.id AS release_id,
        jc.job_id AS job_code,
        rc.quantity
      FROM released_cards rc
      JOIN job_code jc ON jc.id = rc.job_code_id
      JOIN bank_cards bc ON rc.bank_card_id = bc.id
      WHERE bc.bank_id = $1
        ${card_brand ? "AND bc.card_brand = $2" : ""}
        AND NOT EXISTS (
          SELECT 1
          FROM card_issues ci
          WHERE ci.job_code_id = rc.job_code_id
            AND ci.bank_card_id = rc.bank_card_id
        )
      ORDER BY rc.released_at DESC;
    `;

    const params = card_brand ? [bank_id, card_brand] : [bank_id];
    const result = await pool.query(query, params);

    return res.status(200).json(result.rows); // Only unreconciled jobs
  } catch (err) {
    console.error("Error fetching unreconciled released job codes:", err);
    return res.status(500).json({ error: "Server error fetching job codes" });
  }
};


const processReleasedJobs = async (req, res) => {
  try {
    const { bank_id, card_brand, jobs, submitted_by } = req.body;

    // Validate inputs
    if (!bank_id || !card_brand || !Array.isArray(jobs) || jobs.length === 0 || !submitted_by) {
      return res.status(400).json({ success: false, error: 'Missing required fields or invalid jobs array' });
    }

    // Get bank_card record
    const bankCardResult = await pool.query(
      'SELECT * FROM bank_cards WHERE bank_id = $1 AND card_brand = $2',
      [bank_id, card_brand]
    );

    if (bankCardResult.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Bank card not found' });
    }

    const bankCard = bankCardResult.rows[0];
    const processedJobs = [];

    // Filter jobs to include only valid ones
    const currentJobs = jobs
      .map(job => {
        if (job.job_code) {
          return {
            job_code: job.job_code,
            ongoing: parseInt(job.ongoing) || 0,
            personalized: parseInt(job.personalized) || 0,
            damaged: parseInt(job.damaged) || 0,
            duplicate: parseInt(job.duplicate) || 0
          };
        }
        return null;
      })
      .filter(Boolean);

    if (currentJobs.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid jobs to process' });
    }

    for (let job of currentJobs) {
      const { job_code, ongoing, personalized, damaged, duplicate } = job;

      // Get released card for this job
      const releaseResult = await pool.query(
        `SELECT rc.*, jc.job_id
         FROM released_cards rc
         JOIN job_code jc ON jc.id = rc.job_code_id
         WHERE rc.bank_card_id = $1 AND jc.job_id = $2`,
        [bankCard.id, job_code]
      );

      if (releaseResult.rows.length === 0) {
        // Skip jobs that were removed or never released
        continue;
      }

      const releasedJob = releaseResult.rows[0];

      // Update bank_cards quantities safely
      await pool.query(
        `UPDATE bank_cards
         SET
           ongoing_personalization = GREATEST(ongoing_personalization - $1, 0),
           personalized = GREATEST(personalized - $2, 0),
           qty_in_vault_damaged = GREATEST(qty_in_vault_damaged - $3, 0),
           qty_in_vault_good = GREATEST(qty_in_vault_good - $4, 0),
           duplicate = GREATEST(duplicate - $5, 0),
           submitted_by = $6,
           updated_at = now()
         WHERE id = $7`,
        [ongoing, personalized, damaged, duplicate, duplicate, submitted_by, bankCard.id]
      );

      // Mark released_cards as processed
      await pool.query(
        `UPDATE released_cards
         SET processed = true, processed_at = now()
         WHERE id = $1`,
        [releasedJob.id]
      );

      // Insert into card_issues if damaged or duplicate exists
      if (damaged > 0 || duplicate > 0) {
        await pool.query(
          `INSERT INTO card_issues
           (bank_card_id, job_code_id, assigned_to, card_status, created_at, updated_at)
           VALUES ($1,
                   (SELECT id FROM job_code WHERE job_id = $2 AND bank_id = $3),
                   $4,
                   $5,
                   now(),
                   now())`,
          [bankCard.id, job_code, bank_id, submitted_by, damaged > 0 ? 'Damaged' : 'Duplicate']
        );
      }

      processedJobs.push({ job_code, ongoing, personalized, damaged, duplicate });
    }

    return res.json({
      success: true,
      message: 'Jobs processed successfully',
      data: processedJobs
    });

  } catch (err) {
    console.error('Error processing released jobs:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};






module.exports = {
  addBankCard,
  reportCardIssue,
    releaseCards,
    getTodayJobCodes,
processReleasedJobs
};
