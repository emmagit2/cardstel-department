const db = require('../config/db');

//
// 📋 1️⃣ Get all staff (Mailer Officers + Machine Operators)
//
exports.getStaffList = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, name, email, role, position, profile_picture
      FROM users
      WHERE position IN ('Mailer Officer', 'Machine Operator')
      ORDER BY name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching staff list:', err);
    res.status(500).json({ error: 'Failed to fetch staff list' });
  }
};

//
// 💼 2️⃣ Jobs endpoint — for Mailer Officers
//
exports.getMailerOfficerJobs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { view, startDate, endDate } = req.query;

    let query = `
      SELECT j.job_id, j.job_code, j.created_at, j.range_start, j.range_end,
             b.name AS bank_name, d.name AS device_name
      FROM jobs j
      LEFT JOIN bank b ON j.bank_id = b.bank_id
      LEFT JOIN devices d ON j.device_id = d.device_id
      WHERE j.user_id = $1
    `;
    const params = [userId];

    // View filters (monthly / weekly)
    if (view === 'monthly') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      params.push(firstDay, lastDay);
      query += ` AND j.created_at BETWEEN $2 AND $3`;
    } else if (view === 'weekly') {
      const now = new Date();
      const day = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      params.push(monday, sunday);
      query += ` AND j.created_at BETWEEN $2 AND $3`;
    }

    // Custom range filter
    if (startDate) {
      params.push(startDate);
      query += ` AND j.created_at >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      query += ` AND j.created_at <= $${params.length}`;
    }

    query += ` ORDER BY j.created_at DESC`;

    const result = await db.query(query, params);

    // 🗓️ If no jobs found, generate "No job found" days between start & end
    if (result.rows.length === 0 && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const noJobDays = [];

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
        const dateStr = d.toISOString().split('T')[0];
        noJobDays.push({ day: `${dayName} ${dateStr}`, message: 'No job found' });
      }

      return res.json({ jobs: [], noJobDays });
    }

    res.json({ jobs: result.rows });
  } catch (err) {
    console.error('❌ Error fetching mailer officer jobs:', err);
    res.status(500).json({ error: 'Failed to fetch mailer officer jobs' });
  }
};

//
// 🧰 3️⃣ Card Jobs endpoint — for Machine Operators
//
exports.getMachineOperatorCardJobs = async (req, res) => {
  try {
    const { userId } = req.params;
    const { view, startDate, endDate } = req.query;

    let query = `
      SELECT c.id AS card_job_id, c.job_code, c.created_at, c.card_quantity,
             c.completed_qty, c.rejected_qty, c.card_type,
             b.bank_name, d.device_name
      FROM card_job c
      LEFT JOIN bank b ON c.bank_id = b.bank_id
      LEFT JOIN devices d ON c.device_id = d.device_id
      WHERE c.operator_id = $1
    `;
    const params = [userId];

    // View filters (monthly / weekly)
    if (view === 'monthly') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      params.push(firstDay, lastDay);
      query += ` AND c.created_at BETWEEN $2 AND $3`;
    } else if (view === 'weekly') {
      const now = new Date();
      const day = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      params.push(monday, sunday);
      query += ` AND c.created_at BETWEEN $2 AND $3`;
    }

    // Custom range filter
    if (startDate) {
      params.push(startDate);
      query += ` AND c.created_at >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      query += ` AND c.created_at <= $${params.length}`;
    }

    query += ` ORDER BY c.created_at DESC`;

    const result = await db.query(query, params);

    // 🗓️ No jobs — show per-day "No job found"
    if (result.rows.length === 0 && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const noJobDays = [];

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
        const dateStr = d.toISOString().split('T')[0];
        noJobDays.push({ day: `${dayName} ${dateStr}`, message: 'No job found' });
      }

      return res.json({ jobs: [], noJobDays });
    }

    res.json({ jobs: result.rows });
  } catch (err) {
    console.error('❌ Error fetching machine operator card jobs:', err);
    res.status(500).json({ error: 'Failed to fetch machine operator card jobs' });
  }
};
//

exports.getStaffByPosition = async (req, res) => {
  try {
    const { position } = req.query;

    if (!position) {
      return res.status(400).json({ error: 'Position is required' });
    }

    const result = await db.query(
      `
      SELECT id, name
      FROM users
      WHERE position = $1
      ORDER BY name ASC
      `,
      [position]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching staff by position:', err);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
};

