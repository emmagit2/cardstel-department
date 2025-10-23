const pool = require("../config/db"); // PostgreSQL pool

// ============ Overall Summary ============
exports.getOverallSummary = async (req, res) => {
  try {
    // Total prints today
    const today = await pool.query(`
      SELECT COALESCE(SUM(completed_qty),0) as cards_today
      FROM card_job
      WHERE DATE(created_at) = CURRENT_DATE
    `);

    // Total prints this week
    const thisWeek = await pool.query(`
      SELECT COALESCE(SUM(completed_qty),0) as cards_week
      FROM card_job
      WHERE DATE_PART('week', created_at) = DATE_PART('week', CURRENT_DATE)
        AND DATE_PART('year', created_at) = DATE_PART('year', CURRENT_DATE)
    `);

    // Total prints this month
    const thisMonth = await pool.query(`
      SELECT COALESCE(SUM(completed_qty),0) as cards_month
      FROM card_job
      WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
    `);

    // Top bank overall
    const topBank = await pool.query(`
      SELECT b.bank_name, SUM(c.completed_qty) as total
      FROM card_job c
      JOIN bank b ON c.bank_id = b.bank_id
      GROUP BY b.bank_name
      ORDER BY total DESC
      LIMIT 1
    `);

    // Top bank this week
    const topWeekBank = await pool.query(`
      SELECT b.bank_name, SUM(c.completed_qty) as total
      FROM card_job c
      JOIN bank b ON c.bank_id = b.bank_id
      WHERE DATE_PART('week', c.created_at) = DATE_PART('week', CURRENT_DATE)
        AND DATE_PART('year', c.created_at) = DATE_PART('year', CURRENT_DATE)
      GROUP BY b.bank_name
      ORDER BY total DESC
      LIMIT 1
    `);

    // Top bank this month
    const topMonthBank = await pool.query(`
      SELECT b.bank_name, SUM(c.completed_qty) as total
      FROM card_job c
      JOIN bank b ON c.bank_id = b.bank_id
      WHERE DATE_TRUNC('month', c.created_at) = DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY b.bank_name
      ORDER BY total DESC
      LIMIT 1
    `);

    res.json({
      today: today.rows[0].cards_today,
      week: thisWeek.rows[0].cards_week,
      month: thisMonth.rows[0].cards_month,
      topBank: topBank.rows[0]?.bank_name || "N/A",
      topWeekBank: topWeekBank.rows[0]?.bank_name || "N/A",
      topMonthBank: topMonthBank.rows[0]?.bank_name || "N/A"
    });
  } catch (err) {
    console.error("Error fetching overall summary:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ============ Bank Print Trend ============
// ============ Bank Calendar Summary ============
// Supports: daily, weekly, monthly, and custom date range aggregation
exports.getBankCalendarSummary = async (req, res) => {
  try {
    const { bankId, filterType, start, end } = req.query;

    if (!filterType) {
      return res.status(400).json({ error: "filterType is required" });
    }

    let query = "";
    let values = [];
    let count = 1;

    // ====== Base Condition ======
    let whereClause = [];
    if (bankId) {
      whereClause.push(`c.bank_id = $${count++}`);
      values.push(bankId);
    }

    // ====== Handle Different Filter Types ======
    if (filterType === "custom") {
      if (!start || !end) {
        return res.status(400).json({ error: "start and end dates are required for custom filter" });
      }
      whereClause.push(`DATE(c.created_at) BETWEEN $${count++} AND $${count++}`);
      values.push(start, end);
    }

    const where = whereClause.length > 0 ? `WHERE ${whereClause.join(" AND ")}` : "";

    // ====== Filter Logic ======
    if (filterType === "day") {
      query = `
        SELECT DATE(c.created_at) AS date, SUM(c.completed_qty) AS total_cards
        FROM card_job c
        ${where}
        GROUP BY DATE(c.created_at)
        ORDER BY DATE(c.created_at) ASC
      `;
    } 
    else if (filterType === "week") {
      query = `
        SELECT DATE_PART('year', c.created_at) AS year,
               DATE_PART('week', c.created_at) AS week,
               SUM(c.completed_qty) AS total_cards
        FROM card_job c
        ${where}
        GROUP BY year, week
        ORDER BY year, week ASC
      `;
    } 
    else if (filterType === "month") {
      query = `
        SELECT TO_CHAR(c.created_at, 'YYYY-MM') AS month,
               SUM(c.completed_qty) AS total_cards
        FROM card_job c
        ${where}
        GROUP BY month
        ORDER BY month ASC
      `;
    } 
    else if (filterType === "custom") {
      // Custom date range — show each day within the range
      query = `
        SELECT DATE(c.created_at) AS date,
               SUM(c.completed_qty) AS total_cards
        FROM card_job c
        ${where}
        GROUP BY DATE(c.created_at)
        ORDER BY DATE(c.created_at) ASC
      `;
    } 
    else {
      return res.status(400).json({ error: "Invalid filterType" });
    }

    const result = await pool.query(query, values);
    res.json(result.rows);

  } catch (err) {
    console.error("Error fetching bank calendar summary:", err);
    res.status(500).json({ error: "Server error" });
  }
};


// ============ Bank Jobs Table ============
exports.getBankJobs = async (req, res) => {
  try {
    const { bankId, search, date } = req.query;
    if (!bankId) return res.status(400).json({ error: "bankId is required" });

    let filters = ["c.bank_id = $1"];
    let values = [bankId];
    let count = 2;

    if (search) {
      filters.push(`(c.job_code ILIKE $${count} OR u.name ILIKE $${count})`);
      values.push(`%${search}%`);
      count++;
    }

    if (date) {
      filters.push(`DATE(c.created_at) = $${count}`);
      values.push(date);
      count++;
    }

    const query = `
      SELECT c.id, c.job_code, c.completed_qty, c.created_at,
             u.name as staff, d.device_name
      FROM card_job c
      LEFT JOIN users u ON c.operator_id = u.id
      LEFT JOIN devices d ON c.device_id = d.device_id
      WHERE ${filters.join(" AND ")}
      ORDER BY c.created_at DESC
    `;

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching bank jobs:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ============ Multi-Bank Report ============
exports.getMultiBankReport = async (req, res) => {
  try {
    const { filterType, date } = req.query;
    if (!filterType || !date) return res.status(400).json({ error: "filterType and date are required" });

    let query, values = [date];

    if (filterType === "day") {
      query = `
        SELECT b.bank_name, SUM(c.completed_qty) as total
        FROM card_job c
        JOIN bank b ON c.bank_id = b.bank_id
        WHERE DATE(c.created_at) = $1::date
        GROUP BY b.bank_name
        ORDER BY b.bank_name
      `;
    } else if (filterType === "week") {
      query = `
        SELECT b.bank_name, TO_CHAR(c.created_at, 'Dy') as day, DATE(c.created_at) as actual_date, SUM(c.completed_qty) as total
        FROM card_job c
        JOIN bank b ON c.bank_id = b.bank_id
        WHERE DATE_PART('week', c.created_at) = DATE_PART('week', $1::date)
          AND DATE_PART('year', c.created_at) = DATE_PART('year', $1::date)
        GROUP BY b.bank_name, day, actual_date
        ORDER BY b.bank_name, actual_date
      `;
    } else if (filterType === "month") {
      query = `
        SELECT b.bank_name, DATE_PART('week', c.created_at) as week, SUM(c.completed_qty) as total
        FROM card_job c
        JOIN bank b ON c.bank_id = b.bank_id
        WHERE DATE_TRUNC('month', c.created_at) = DATE_TRUNC('month', $1::date)
        GROUP BY b.bank_name, week
        ORDER BY b.bank_name, week
      `;
    } else {
      return res.status(400).json({ error: "Invalid filterType" });
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching multi-bank report:", err);
    res.status(500).json({ error: "Server error" });
  }
};
