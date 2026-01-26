const pool = require('../config/db');

// -----------------------------
// 1. Monthly production (current month)
// -----------------------------
const getMonthlyProduction = async (req, res) => {
  try {
    const month = new Date().toISOString().slice(0, 7); // "YYYY-MM"

    const query = `
      SELECT 
        pt.target_quantity AS target,
        COALESCE(SUM(cj.completed_qty), 0) AS actual
      FROM production_target pt
      LEFT JOIN card_job cj
        ON TO_CHAR(cj.created_at, 'YYYY-MM') = pt.period_value
      WHERE pt.period_type = 'month' AND pt.period_value = $1
      GROUP BY pt.target_quantity
    `;
    const { rows } = await pool.query(query, [month]);
    res.json(rows[0] || { target: 0, actual: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch monthly production' });
  }
};

// -----------------------------
// 2. Bank rankings
// -----------------------------
const getBankRankings = async (req, res) => {
  try {
    const { year, month, week } = req.query;

    let filter = [];
    let values = [];

    if (year && month) {
      filter.push(`TO_CHAR(cj.created_at, 'YYYY-MM') = $${values.length + 1}`);
      values.push(`${year}-${month}`);
    }

    if (week) {
      filter.push(`TO_CHAR(cj.created_at, 'IYYY-IW') = $${values.length + 1}`);
      values.push(week);
    }

    const whereClause = filter.length > 0 ? `WHERE ${filter.join(' AND ')}` : '';

    const query = `
      SELECT 
        b.bank_name AS bank,
        SUM(cj.completed_qty) AS completed
      FROM card_job cj
      JOIN bank b ON b.bank_id = cj.bank_id
      ${whereClause}
      GROUP BY b.bank_name
      ORDER BY completed DESC
    `;
    const { rows } = await pool.query(query, values);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch bank rankings' });
  }
};

// -----------------------------
// 3. Machine comparison (2 machines)
// -----------------------------
const getMachinePerformance = async (req, res) => {
  try {
    const { machineId, range = "month" } = req.query;

    if (!machineId) {
      return res.status(400).json({ message: "machineId is required" });
    }

    /* ---------- DATE FILTER ---------- */
    let dateFilter = "";
    let labelFormat = "";

    switch (range) {
      case "week":
        dateFilter = `cj.created_at >= NOW() - INTERVAL '7 days'`;
        labelFormat = `TO_CHAR(cj.created_at, 'DY')`;
        break;

      case "month":
        dateFilter = `DATE_TRUNC('month', cj.created_at) = DATE_TRUNC('month', NOW())`;
        labelFormat = `TO_CHAR(cj.created_at, 'DD')`;
        break;

      case "last2months":
        dateFilter = `cj.created_at >= NOW() - INTERVAL '2 months'`;
        labelFormat = `TO_CHAR(cj.created_at, 'Mon YYYY')`;
        break;

      case "last3months":
        dateFilter = `cj.created_at >= NOW() - INTERVAL '3 months'`;
        labelFormat = `TO_CHAR(cj.created_at, 'Mon YYYY')`;
        break;

      case "year":
        dateFilter = `DATE_TRUNC('year', cj.created_at) = DATE_TRUNC('year', NOW())`;
        labelFormat = `TO_CHAR(cj.created_at, 'Mon')`;
        break;

      default:
        return res.status(400).json({ message: "Invalid range" });
    }

    /* ---------- QUERY ---------- */
    const query = `
      SELECT
        ${labelFormat} AS label,
        SUM(cj.completed_qty) AS completed
      FROM card_job cj
      WHERE
        cj.device_id = $1
        AND ${dateFilter}
      GROUP BY label
      ORDER BY MIN(cj.created_at)
    `;

    const { rows } = await pool.query(query, [machineId]);

    res.json(rows);
  } catch (err) {
    console.error("Machine analytics error:", err);
    res.status(500).json({ message: "Failed to fetch machine performance" });
  }
};


module.exports = { getMonthlyProduction, getBankRankings, getMachinePerformance };
