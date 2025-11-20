const pool = require('../config/db');
const { startOfWeek, endOfWeek, formatISO } = require('date-fns');


/* ============================================================
   1. ADD QC ENTRY
   ============================================================ */
exports.addQcEntry = async (req, res) => {
  try {
    const { bank_id, shift, entry_date, quantity, overtime, overtime_qty } = req.body;

    const result = await pool.query(
      `INSERT INTO qc_entries (bank_id, shift, entry_date, quantity, overtime, overtime_qty)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [bank_id, shift, entry_date, quantity, overtime, overtime_qty || 0]
    );

    res.status(201).json({ success: true, entry: result.rows[0] });

  } catch (err) {
    console.error('❌ Add QC Error:', err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};



/* ============================================================
   2. GET QC ENTRIES (FILTER BY BANK + DATE RANGE)
   ============================================================ */
exports.getQcEntries = async (req, res) => {
  try {
    const { bank_id, start_date, end_date } = req.query;

    // Determine current week if dates not provided
    let start = start_date;
    let end = end_date;
    if (!start || !end) {
      const now = new Date();
      start = formatISO(startOfWeek(now, { weekStartsOn: 1 }), { representation: 'date' });
      end = formatISO(endOfWeek(now, { weekStartsOn: 1 }), { representation: 'date' });
    }

    let query = `
      SELECT q.id, q.bank_id, b.bank_name, q.shift, q.entry_date,
             q.quantity, q.overtime, q.overtime_qty,
             (q.quantity + COALESCE(q.overtime_qty,0)) AS total_shift
      FROM qc_entries q
      JOIN bank b ON q.bank_id = b.bank_id
      WHERE q.entry_date BETWEEN $1 AND $2
    `;

    const params = [start, end];

    if (bank_id) {
      params.push(bank_id);
      query += ` AND q.bank_id = $${params.length}`;
    }

    query += ` ORDER BY q.entry_date ASC, q.shift ASC`;

    const result = await pool.query(query, params);

    res.json({ success: true, entries: result.rows, week_start: start, week_end: end });

  } catch (err) {
    console.error('❌ Get QC Entries Error:', err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};


/* ============================================================
   3. GET DAILY TOTALS
   ============================================================ */
exports.getTotals = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT entry_date,
        SUM(CASE WHEN LOWER(shift)='day' THEN quantity ELSE 0 END) AS day_total,
        SUM(CASE WHEN LOWER(shift)='night' THEN quantity ELSE 0 END) AS night_total,
        SUM(overtime_qty) AS overtime_total
      FROM qc_entries
      GROUP BY entry_date
      ORDER BY entry_date ASC
    `);

    res.json({ success: true, totals: result.rows });

  } catch (err) {
    console.error('❌ Get Totals Error:', err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};


/* ============================================================
   4. GET WEEK RANGE REPORT (MON → SUN)
   ============================================================ */
exports.getWeekReport = async (req, res) => {
  try {
    const now = new Date();
    const start = formatISO(startOfWeek(now, { weekStartsOn: 1 }), { representation: 'date' });
    const end = formatISO(endOfWeek(now, { weekStartsOn: 1 }), { representation: 'date' });

    const result = await pool.query(
      `
      SELECT q.bank_id, b.bank_name, q.shift, q.entry_date,
             q.quantity, q.overtime_qty,
             (q.quantity + COALESCE(q.overtime_qty, 0)) AS total_shift
      FROM qc_entries q
      JOIN bank b ON q.bank_id = b.bank_id
      WHERE q.entry_date BETWEEN $1 AND $2
      ORDER BY b.bank_name ASC, q.entry_date ASC, q.shift ASC
      `,
      [start, end]
    );

    res.json({ success: true, report: result.rows, week_start: start, week_end: end });

  } catch (err) {
    console.error("❌ Week Report Error:", err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};


// GET all banks + QC entries for a week
exports.filterBanks = async (req,res)=>{
  try{
    const { start_date, end_date } = req.body;
    
    const banksResult = await pool.query(`SELECT bank_id, bank_name FROM bank ORDER BY bank_name ASC`);
    const banks = banksResult.rows;

    const entriesResult = await pool.query(`
      SELECT * FROM qc_entries
      WHERE entry_date BETWEEN $1 AND $2
    `,[start_date,end_date]);
    const entries = entriesResult.rows;

    // Map entries by bank_id
    const entriesMap = {};
    banks.forEach(b => entriesMap[b.bank_id] = []);
    entries.forEach(e=>{
      if(!entriesMap[e.bank_id]) entriesMap[e.bank_id]=[];
      entriesMap[e.bank_id].push(e);
    });

    res.json({ success:true, banks, entries:entriesMap });
  }catch(err){
    console.error(err);
    res.status(500).json({ success:false, error:'Server Error' });
  }
}



/* ============================================================
   5. LOG EDIT CHANGES (FROM THE CONFIRM MODAL)
   ============================================================ */
exports.saveEditLog = async (req, res) => {
  const client = await pool.connect();
  try {
    const { bank_id, user_id, changed_field, old_value, new_value, reason } = req.body;

    await client.query('BEGIN');

    const logResult = await client.query(
      `INSERT INTO qc_change_logs (bank_id, user_id, changed_field, old_value, new_value, reason)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [bank_id, user_id, changed_field, old_value, new_value, reason]
    );

    await client.query('COMMIT');

    res.status(201).json({ success: true, log: logResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ Edit Log Error:", err);
    res.status(500).json({ success: false, error: "Server Error" });
  } finally {
    client.release();
  }
};





/* ============================================================
   GET QC CHANGE LOGS (CURRENT WEEK ONLY)
============================================================ */
exports.getQLogs = async (req,res)=>{
  try{
    const { start_date, end_date } = req.query;
    const now = new Date();
    const start = start_date || formatISO(startOfWeek(now,{weekStartsOn:1}),{representation:'date'});
    const end = end_date || formatISO(endOfWeek(now,{weekStartsOn:1}),{representation:'date'});

    const result = await pool.query(
      `SELECT * FROM qc_change_logs
       WHERE change_date BETWEEN $1 AND $2
       ORDER BY change_date ASC`,
      [start,end]
    );

    res.json({ success:true, logs: result.rows, week_start:start, week_end:end });

  }catch(err){
    console.error('❌ Get QC Logs Error:',err);
    res.status(500).json({success:false, error:'Server Error'});
  }
};


