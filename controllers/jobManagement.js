const pool = require('../config/db');

async function getJobsForTables(req, res) {
  try {
    const { jobCode, bankId, shift, status, startDate, endDate } = req.query;
    const params = [];
    const cardParams = [];

    // ================================================
    // ✅ Determine default date range dynamically
    // ================================================
    const determineDefaultDates = async (table, dateColumn) => {
      const todayCheck = await pool.query(
        `SELECT 1 FROM ${table} WHERE DATE(${dateColumn}) = CURRENT_DATE LIMIT 1`
      );
      if (todayCheck.rowCount > 0) return { startDate: new Date(), endDate: new Date() };

      const last7DaysCheck = await pool.query(
        `SELECT 1 FROM ${table} WHERE DATE(${dateColumn}) >= CURRENT_DATE - INTERVAL '7 days' LIMIT 1`
      );
      if (last7DaysCheck.rowCount > 0) return { startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), endDate: new Date() };

      // default to last 2 weeks
      return { startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), endDate: new Date() };
    };

    let finalStartDate = startDate ? startDate : null;
    let finalEndDate = endDate ? endDate : null;

    if (!startDate && !endDate) {
      const cardDates = await determineDefaultDates('card_job', 'created_at');
      const mailerDates = await determineDefaultDates('jobs', 'created_at');

      finalStartDate = cardDates.startDate < mailerDates.startDate ? cardDates.startDate : mailerDates.startDate;
      finalEndDate = cardDates.endDate > mailerDates.endDate ? cardDates.endDate : mailerDates.endDate;
    }

    // ================================================
    // 📦 Mailer Jobs Query
    // ================================================
    let baseQuery = `
      SELECT j.*, b.bank_name
      FROM jobs j
      LEFT JOIN bank b ON j.bank_id = b.bank_id
      WHERE 1=1
    `;

    if (jobCode) {
      params.push(jobCode);
      baseQuery += ` AND j.job_code = $${params.length}`;
    }

    if (bankId) {
      params.push(bankId);
      baseQuery += ` AND j.bank_id = $${params.length}`;
    }

    if (shift) {
      params.push(shift.toLowerCase());
      baseQuery += ` AND LOWER(j.shift) = $${params.length}`;
    }

    // ✅ Apply dynamic/default dates
    if (finalStartDate && finalEndDate) {
      params.push(finalStartDate, finalEndDate);
      baseQuery += ` AND DATE(j.created_at) BETWEEN $${params.length - 1} AND $${params.length}`;
    }

    baseQuery += ` ORDER BY j.created_at ASC`;
    const jobsResult = await pool.query(baseQuery, params);
    const jobs = jobsResult.rows;

    const jobsMap = {};

    for (let job of jobs) {
      if (!job.job_code || !job.bank_id) continue;
      const key = `${job.job_code}_${job.bank_id}`;

      if (!jobsMap[key]) {
        jobsMap[key] = {
          jobCode: job.job_code,
          bankName: job.bank_name || `Bank ${job.bank_id}`,
          cardPrinting: [],
          mailerPrinting: [],
        };
      }

      jobsMap[key].mailerPrinting.push({
        jobId: job.id,
        jobCode: job.job_code,
        bankName: job.bank_name || `Bank ${job.bank_id}`,
        shift: job.shift,
        totalQty: job.qty || 0,
        completedQty: job.completed_qty || 0,
        remaining: (job.qty || 0) - (job.completed_qty || 0),
        createdAt: job.created_at
      });
    }

    // ================================================
    // 💳 Card Printing Jobs Query
    // ================================================
    let cardQuery = `
      SELECT cj.*, u.name AS operator_name, d.device_name, b.bank_name
      FROM card_job cj
      LEFT JOIN users u ON u.id = cj.operator_id
      LEFT JOIN devices d ON d.device_id = cj.device_id
      LEFT JOIN bank b ON b.bank_id = cj.bank_id
      WHERE 1=1
    `;

    if (jobCode) {
      cardParams.push(jobCode);
      cardQuery += ` AND cj.job_code = $${cardParams.length}`;
    }

    if (bankId) {
      cardParams.push(bankId);
      cardQuery += ` AND cj.bank_id = $${cardParams.length}`;
    }

    if (shift) {
      cardParams.push(shift.toLowerCase());
      cardQuery += ` AND LOWER(cj.shift) = $${cardParams.length}`;
    }

    if (finalStartDate && finalEndDate) {
      cardParams.push(finalStartDate, finalEndDate);
      cardQuery += ` AND DATE(cj.created_at) BETWEEN $${cardParams.length - 1} AND $${cardParams.length}`;
    }

    cardQuery += ` ORDER BY cj.start_time ASC`;
    const cardResult = await pool.query(cardQuery, cardParams);

    for (let card of cardResult.rows) {
      if (!card.job_code || !card.bank_id) continue;
      const key = `${card.job_code}_${card.bank_id}`;

      if (!jobsMap[key]) {
        jobsMap[key] = {
          jobCode: card.job_code,
          bankName: card.bank_name || `Bank ${card.bank_id}`,
          cardPrinting: [],
          mailerPrinting: [],
        };
      }

      const remaining = (card.card_quantity || 0) - (card.completed_qty || 0);
      jobsMap[key].cardPrinting.push({
        id: card.id,
        jobCode: card.job_code,
        bankName: card.bank_name || `Bank ${card.bank_id}`,
        operator: card.operator_name || '-',
        device: card.device_name || '-',
        shift: card.shift,
        totalQty: card.card_quantity || 0,
        completedQty: card.completed_qty || 0,
        remaining,
        createdAt: card.created_at
      });
    }

    // ================================================
    // 📊 Compute Completion Status
    // ================================================
    for (let key in jobsMap) {
      const job = jobsMap[key];
      const totalCardRemaining = job.cardPrinting.reduce((sum, c) => sum + (c.remaining || 0), 0);
      const totalMailerRemaining = job.mailerPrinting.reduce((sum, m) => sum + (m.remaining || 0), 0);
      job.completionStatus =
        totalCardRemaining === 0 && totalMailerRemaining === 0 ? 'Completed' :
        totalCardRemaining === 0 || totalMailerRemaining === 0 ? 'Partially Completed' :
        'Pending';
    }

    let jobsArray = Object.values(jobsMap);

    if (status && status !== 'All') {
      jobsArray = jobsArray.filter(job => job.completionStatus === status);
    }

    if (jobsArray.length === 0) {
      return res.json({ message: "No jobs found" });
    }

    res.json(jobsArray);

  } catch (err) {
    console.error('❌ Error loading jobs:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getJobsForTables };
