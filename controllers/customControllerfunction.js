const db = require("../config/db");

/**
 * Helper: format a date as "Tuesday, 23 Oct"
 */
function formatDay(dateStr) {
  const date = new Date(dateStr);
  const options = { weekday: "long", day: "numeric", month: "short" };
  return date.toLocaleDateString("en-US", options); // e.g., "Tuesday, 23 Oct"
}

/**
 * Controller to fetch custom prints grouped by day with totals
 */
exports.getCustomPrints = async (req, res) => {
  const { deviceId } = req.params;
  const { start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: "start and end query parameters are required" });
  }

  try {
    // 1️⃣ Get device type
    const deviceRes = await db.query(
      "SELECT device_type FROM devices WHERE device_id = $1",
      [deviceId]
    );

    if (!deviceRes.rows.length) {
      return res.status(404).json({ error: "Device not found" });
    }

    const deviceType = deviceRes.rows[0].device_type;

    // 2️⃣ Build SQL depending on device type
    let query = "";
    if (deviceType === "Printer") {
      query = `
        SELECT job_code, range_start, range_end, completed_qty, created_at
        FROM jobs
        WHERE device_id = $1
          AND created_at::date BETWEEN $2::date AND $3::date
        ORDER BY created_at ASC
      `;
    } else if (deviceType === "Card Machine") {
      query = `
        SELECT job_code, card_type, completed_qty, rejected_qty, created_at
        FROM card_job
        WHERE device_id = $1
          AND created_at::date BETWEEN $2::date AND $3::date
        ORDER BY created_at ASC
      `;
    } else {
      return res.status(400).json({ error: "Unsupported device type" });
    }

    // 3️⃣ Execute query
    const result = await db.query(query, [deviceId, start, end]);

    // 4️⃣ Group by day & calculate totals
    const groupedByDay = {};
    let totalPrints = 0;

    result.rows.forEach((record) => {
      const day = formatDay(record.created_at);

      // Calculate print count for this job
      let jobPrints = 0;
      if (deviceType === "Printer") {
        jobPrints = record.completed_qty || (record.range_end - record.range_start + 1) || 0;
      } else if (deviceType === "Card Machine") {
        jobPrints = record.completed_qty || 0;
      }

      totalPrints += jobPrints;

      if (!groupedByDay[day]) groupedByDay[day] = { jobs: [], dayTotal: 0 };
      groupedByDay[day].jobs.push({ ...record, prints: jobPrints });
      groupedByDay[day].dayTotal += jobPrints;
    });

    res.json({
      deviceType,
      totalPrints,
      recordsByDay: groupedByDay,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
