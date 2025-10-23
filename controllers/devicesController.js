const db = require('../config/db'); // Database connection

// ============================================================
// 🧩 HELPER FUNCTIONS
// ============================================================
function getWeekNumber(d) {
  const date = new Date(d);
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date - start + ((start.getDay() + 6) % 7) * 86400000;
  return Math.ceil(diff / 604800000); // ms in a week
}

function getDayName(date) {
  return new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
}
function buildGraphData(jobs, deviceType, viewType, selectedDate) {
  const data = {};

  if (!jobs || jobs.length === 0) return data;

  if (viewType === "week") {
    // Group by day of the week (Mon-Sun)
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    days.forEach(d => (data[d] = 0));

    jobs.forEach(j => {
      const jobDate = new Date(j.created_at);
      const day = getDayName(jobDate); // Mon-Sun
      const qty = j.completed_qty || (deviceType === "printer" ? (j.range_end - j.range_start + 1) : 0);
      if (data[day] !== undefined) data[day] += qty;
    });
  } else if (viewType === "month") {
    // Group by week number inside the month
    jobs.forEach(j => {
      const jobDate = new Date(j.created_at);
      const firstDayOfMonth = new Date(jobDate.getFullYear(), jobDate.getMonth(), 1);
      const weekOfMonth = Math.ceil((jobDate.getDate() + firstDayOfMonth.getDay()) / 7);
      const key = `Week ${weekOfMonth}`;

      if (!data[key]) data[key] = 0;

      const qty = j.completed_qty || (deviceType === "printer" ? (j.range_end - j.range_start + 1) : 0);
      data[key] += qty;
    });
  }

  return data;
}

function renderChart(graphData, deviceType, viewType) {
  if (!graphData || Object.keys(graphData).length === 0) {
    chartCanvas.style.display = "none";
    return;
  }

  chartCanvas.style.display = "block";
  const labels = Object.keys(graphData);
  const dataValues = labels.map(label => graphData[label]);

  if (deviceChart) deviceChart.destroy();
  deviceChart = new Chart(chartCanvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: `${deviceType.toUpperCase()} Usage`,
        data: dataValues,
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        borderColor: "#0d6efd"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        title: { display: true, text: `${deviceType.toUpperCase()} Usage Trend (${viewType})` }
      },
      scales: { y: { beginAtZero: true } }
    }
  });

  chartTitle.textContent = `${deviceType.toUpperCase()} Usage Trend (${viewType})`;
}



// ============================================================
// 🧱 GET ALL DEVICES
// ============================================================
// 🧱 GET ALL DEVICES
// ============================================================
exports.getAllDevices = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT device_id, device_name, device_type
      FROM devices
      ORDER BY device_id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching all devices:", err);
    res.status(500).json({ error: "Failed to fetch devices" });
  }
};


// ============================================================
// 🧱 GET DEVICE USAGE DATA
// ============================================================
exports.getDeviceUsage = async (req, res) => {
  const { deviceId } = req.params;
  const { view, startDate, endDate } = req.query;

  try {
    const deviceResult = await db.query(
      `SELECT device_type FROM devices WHERE device_id = $1`,
      [deviceId]
    );

    if (!deviceResult.rows.length)
      return res.status(404).json({ error: "Device not found" });

    const deviceType = deviceResult.rows[0].device_type.toLowerCase();
    let query = "";
    let params = [deviceId];
    let dateField = "install_date";
    let filter = "";

    if (view === "today") filter += ` AND DATE(${dateField}) = CURRENT_DATE`;
    else if (view === "weekly") filter += ` AND DATE(${dateField}) >= CURRENT_DATE - INTERVAL '7 days'`;
    else if (view === "monthly") filter += ` AND DATE_TRUNC('month', ${dateField}) = DATE_TRUNC('month', CURRENT_DATE)`;
    else {
      if (startDate) {
        params.push(startDate);
        filter += ` AND ${dateField} >= $${params.length}`;
      }
      if (endDate) {
        params.push(endDate);
        filter += ` AND ${dateField} <= $${params.length}`;
      }
    }

    if (deviceType === "card machine") {
      query = `
        SELECT 
          e.encoder_id AS id, e.encoder_code AS code, e.device_id,
          e.job_id, c.job_code, e.total_cards AS total,
          e.install_date, e.replace_date
        FROM encoder_usage e
        LEFT JOIN card_job c ON e.job_id = c.id
        WHERE e.device_id = $1 ${filter}
        ORDER BY e.install_date DESC
      `;
    } else if (deviceType === "printer") {
      query = `
        SELECT 
          t.toner_id AS id, t.toner_code AS code, t.device_id,
          t.job_id, j.job_code, t.total_prints AS total,
          t.install_date, t.replace_date
        FROM toner_usage t
        LEFT JOIN jobs j ON t.job_id = j.id
        WHERE t.device_id = $1 ${filter}
        ORDER BY t.install_date DESC
      `;
    } else {
      return res.status(400).json({ error: "Unsupported device type" });
    }

    const result = await db.query(query, params);

    const usage = result.rows.map(r => ({
      ...r,
      week: getWeekNumber(r.install_date),
      day: getDayName(r.install_date),
    }));

    const graphData = buildGraphData(usage, "total");

    res.json({ deviceType, usage, graphData });
  } catch (err) {
    console.error("❌ Usage data fetch error:", err);
    res.status(500).json({ error: "Failed to fetch device usage data" });
  }
};

// ============================================================
// 🧱 GET DEVICE HISTORY (Jobs / Card Jobs)
// ============================================================
exports.getDeviceHistory = async (req, res) => {
  const { deviceId } = req.params;
  const { view, startDate, endDate } = req.query;

  try {
    // Fetch device type
    const deviceResult = await db.query(
      `SELECT device_type FROM devices WHERE device_id = $1`,
      [deviceId]
    );

    if (!deviceResult.rows.length)
      return res.status(404).json({ error: "Device not found" });

    const deviceType = deviceResult.rows[0].device_type.toLowerCase();
    const params = [deviceId];
    const dateField = "created_at";
    let filter = "";

    // Date filters
    if (view === "today") filter += ` AND DATE(${dateField}) = CURRENT_DATE`;
    else if (view === "weekly") filter += ` AND DATE(${dateField}) >= CURRENT_DATE - INTERVAL '7 days'`;
    else if (view === "monthly") filter += ` AND DATE_TRUNC('month', ${dateField}) = DATE_TRUNC('month', CURRENT_DATE)`;
    else {
      if (startDate) {
        params.push(startDate);
        filter += ` AND ${dateField} >= $${params.length}`;
      }
      if (endDate) {
        params.push(endDate);
        filter += ` AND ${dateField} <= $${params.length}`;
      }
    }

    let query = "";

    if (deviceType === "card machine" || deviceType === "encoder") {
      query = `
        SELECT 
          id, job_code, card_type, card_quantity, 
          completed_qty, rejected_qty, created_at
        FROM card_job
        WHERE device_id = $1 ${filter}
        ORDER BY created_at DESC
      `;
    } else if (deviceType === "printer") {
      // ✅ Fixed: Removed 'qty', added range_start, range_end, remaining
      query = `
        SELECT 
          id, job_code, range_start, range_end,
          completed_qty, created_at
        FROM jobs
        WHERE device_id = $1 ${filter}
        ORDER BY created_at DESC
      `;
    } else {
      return res.status(400).json({ error: "Unsupported device type" });
    }

    const result = await db.query(query, params);

    // Add week/day for charting
    const jobs = result.rows.map(r => ({
      ...r,
      week: getWeekNumber(r.created_at),
      day: getDayName(r.created_at),
    }));

    // Build graph data using completed_qty
    const graphData = buildGraphData(jobs, "completed_qty");

    res.json({ deviceType, jobs, graphData });
  } catch (err) {
    console.error("❌ Job data fetch error:", err);
    res.status(500).json({ error: "Failed to fetch job data" });
  }
};

