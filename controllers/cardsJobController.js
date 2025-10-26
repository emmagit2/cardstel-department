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

exports.getBankCalendarSummary = async (req, res) => {
  try {
    const { bankId, filterType, start, end, month, weekStart } = req.query;

    if (!filterType)
      return res.status(400).json({ error: "filterType is required" });

    let query = "";
    let queryValues = [];

    // 🧩 Helper: check if month has data
    async function checkMonthHasData(monthValue) {
      let baseQuery = `
        SELECT COUNT(*) AS total
        FROM card_job c
        WHERE TO_CHAR(c.created_at, 'YYYY-MM') = $1
      `;
      const params = [monthValue];
      if (bankId) {
        baseQuery += ` AND c.bank_id = $2`;
        params.push(Number(bankId));
      }
      const monthRes = await pool.query(baseQuery, params);
      return Number(monthRes.rows[0].total) > 0;
    }

    // 🧩 Helper: check if week has data
    async function checkWeekHasData(weekDate) {
      let baseQuery = `
        SELECT COUNT(*) AS total
        FROM card_job c
        WHERE DATE_TRUNC('week', c.created_at)::date = DATE_TRUNC('week', $1::date)
      `;
      const params = [weekDate];
      if (bankId) {
        baseQuery += ` AND c.bank_id = $2`;
        params.push(Number(bankId));
      }
      const weekRes = await pool.query(baseQuery, params);
      return Number(weekRes.rows[0].total) > 0;
    }

    // ========== MONTH FILTER ==========
    if (filterType === "month") {
      const selectedMonth = month || new Date().toISOString().slice(0, 7);
      const hasData = await checkMonthHasData(selectedMonth);
      if (!hasData) return res.json({ message: "No data for this month" });

      query = `
        SELECT TO_CHAR(c.created_at, 'YYYY-MM') AS month,
               SUM(c.completed_qty) AS total_cards
        FROM card_job c
        WHERE TO_CHAR(c.created_at, 'YYYY-MM') = $1
        ${bankId ? "AND c.bank_id = $2" : ""}
        GROUP BY month
        ORDER BY month ASC
      `;
      queryValues = bankId ? [selectedMonth, Number(bankId)] : [selectedMonth];
    }

    // ========== WEEK FILTER ==========
    else if (filterType === "week") {
      if (!month)
        return res.json({ message: "Please select a month first" });

      const hasMonthData = await checkMonthHasData(month);
      if (!hasMonthData)
        return res.json({ message: "No data for this selected month" });

      // If weekStart is passed (e.g. user selected a week)
      if (weekStart) {
        const hasWeekData = await checkWeekHasData(weekStart);
        if (!hasWeekData) {
          return res.json({
            message: "No data found for this selected week, but other weeks in this month may have data.",
            data: [],
          });
        }
      }

      query = `
        SELECT 
          DATE_TRUNC('week', c.created_at)::date AS week_start,
          (DATE_TRUNC('week', c.created_at)::date + interval '6 days') AS week_end,
          TO_CHAR(c.created_at, 'YYYY-MM') AS month,
          SUM(c.completed_qty) AS total_cards
        FROM card_job c
        WHERE TO_CHAR(c.created_at, 'YYYY-MM') = $1
        ${bankId ? "AND c.bank_id = $2" : ""}
        GROUP BY week_start, month
        ORDER BY week_start ASC
      `;
      queryValues = bankId ? [month, Number(bankId)] : [month];
    }

    // ========== CUSTOM RANGE ==========
    else if (filterType === "custom") {
      if (!start || !end)
        return res.status(400).json({
          error: "start and end dates are required for custom filter",
        });

      const startMonth = start.slice(0, 7);
      const hasMonthData = await checkMonthHasData(startMonth);
      if (!hasMonthData)
        return res.json({ message: "No data for this month" });

      query = `
        SELECT 
          DATE(c.created_at) AS date,
          TO_CHAR(c.created_at, 'YYYY-MM') AS month,
          SUM(c.completed_qty) AS total_cards
        FROM card_job c
        WHERE DATE(c.created_at) BETWEEN $1::date AND $2::date
        ${bankId ? "AND c.bank_id = $3" : ""}
        GROUP BY DATE(c.created_at), month
        ORDER BY DATE(c.created_at) ASC
      `;
      queryValues = bankId
        ? [start, end, Number(bankId)]
        : [start, end];
    }

    // ========== INVALID ==========
    else {
      return res.status(400).json({ error: "Invalid filterType" });
    }

    // ✅ Execute safely
    const result = await pool.query(query, queryValues);

    if (result.rows.length === 0)
      return res.json({ message: "No data found for the selected filter" });

    // 🧮 Total cards
    const total = result.rows.reduce(
      (sum, r) => sum + Number(r.total_cards || 0),
      0
    );

    res.json({
      data: result.rows,
      total_cards: total,
    });

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
      SELECT 
        c.id, 
        c.job_code, 
        c.completed_qty, 
        TO_CHAR(c.created_at, 'FMDay, DD Month YYYY at HH12:MI AM') AS created_at,
        u.name AS staff, 
        d.device_name
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
    const { bankId, filterType, date } = req.query;

    if (!filterType || !date) 
      return res.status(400).json({ error: "filterType and date are required" });
    if (!bankId) return res.status(400).json({ error: "bankId is required" });

    let query = "";
    let values = [];
    
    // ====== Parse date depending on filterType ======
    if (filterType === "week") {
      // "2025-W41" → calculate start and end date of that week
      const [yearStr, weekStr] = date.split("-W");
      const year = parseInt(yearStr);
      const week = parseInt(weekStr);

      // Calculate the first day (Monday) of the ISO week
      const simple = new Date(year, 0, 1 + (week - 1) * 7);
      const dayOfWeek = simple.getDay(); // 0=Sun, 1=Mon
      const ISOweekStart = new Date(simple);
      ISOweekStart.setDate(simple.getDate() - ((dayOfWeek + 6) % 7)); // Monday
      const ISOweekEnd = new Date(ISOweekStart);
      ISOweekEnd.setDate(ISOweekStart.getDate() + 6); // Sunday

      const startDate = ISOweekStart.toISOString().split("T")[0]; // YYYY-MM-DD
      const endDate = ISOweekEnd.toISOString().split("T")[0];

      query = `
        SELECT b.bank_id, b.bank_name,
               TO_CHAR(c.created_at, 'Dy') AS day,
               DATE(c.created_at) AS actual_date,
               SUM(c.completed_qty) AS total
        FROM card_job c
        JOIN bank b ON c.bank_id = b.bank_id
        WHERE DATE(c.created_at) BETWEEN $1 AND $2
        GROUP BY b.bank_id, b.bank_name, day, actual_date
        ORDER BY b.bank_name, actual_date
      `;
      values = [startDate, endDate];

    } else if (filterType === "month") {
      // "YYYY-MM" → first and last day of month
      const [year, month] = date.split("-");
      const startDate = `${year}-${month}-01`;
      const endDate = new Date(year, parseInt(month), 0).toISOString().split("T")[0]; // last day
      query = `
        SELECT b.bank_id, b.bank_name,
               DATE_PART('week', c.created_at) - DATE_PART('week', DATE_TRUNC('month', c.created_at)) + 1 AS week_num,
               SUM(c.completed_qty) AS total
        FROM card_job c
        JOIN bank b ON c.bank_id = b.bank_id
        WHERE DATE_TRUNC('month', c.created_at) = DATE_TRUNC('month', $1::date)
        GROUP BY b.bank_id, b.bank_name, week_num
        ORDER BY b.bank_name, week_num
      `;
      values = [startDate];

    } else {
      return res.status(400).json({ error: "Invalid filterType. Use 'week' or 'month'." });
    }

    const result = await pool.query(query, values);

    // ===== Construct Graph Data =====
    const banksMap = {};
    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const monthWeeks = [1, 2, 3, 4, 5];

    result.rows.forEach(row => {
      if (!banksMap[row.bank_name]) {
        banksMap[row.bank_name] = filterType === "week"
          ? weekDays.map(d => ({ day: d, total: 0 }))
          : monthWeeks.map(w => ({ week: w, total: 0 }));
      }

      if (filterType === "week") {
        const idx = weekDays.findIndex(d => d === row.day);
        if (idx >= 0) banksMap[row.bank_name][idx].total = Number(row.total);
      } else {
        const idx = monthWeeks.indexOf(Number(row.week_num));
        if (idx >= 0) banksMap[row.bank_name][idx].total = Number(row.total);
      }
    });

    const selectedBankName = result.rows.find(r => r.bank_id == bankId)?.bank_name;
    const selectedBankData = banksMap[selectedBankName] || [];
    const otherBanksData = Object.keys(banksMap)
      .filter(name => name !== selectedBankName)
      .map(name => ({ bankName: name, data: banksMap[name] }));

    res.json({ selectedBank: selectedBankData, otherBanks: otherBanksData });

  } catch (err) {
    console.error("Error fetching multi-bank report:", err);
    res.status(500).json({ error: "Server error" });
  }
};

