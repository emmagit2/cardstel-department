const pool = require("../config/db");

// ----------------------------------
// GET all embedding operations
// ----------------------------------
exports.getAllOperations = async (req, res) => {
  try {
    const { operator_id, device_id, shift, date } = req.query;

    let query = `
      SELECT
        eo.*,
        u.name AS operator_name,
        d.device_name AS machine_name
      FROM embedding_operations eo
      LEFT JOIN users u ON eo.operator_id = u.id
      LEFT JOIN devices d ON eo.device_id = d.device_id
      WHERE 1=1
    `;

    const params = [];

    if (operator_id) {
      params.push(operator_id);
      query += ` AND eo.operator_id = $${params.length}`;
    }

    if (device_id) {
      params.push(device_id);
      query += ` AND eo.device_id = $${params.length}`;
    }

    if (shift) {
      params.push(shift);
      query += ` AND eo.shift = $${params.length}`;
    }

    if (date) {
      params.push(date);
      query += ` AND DATE(eo.created_date) = $${params.length}`;
    }

    query += ` ORDER BY eo.created_date DESC LIMIT 500`;

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("❌ getAllOperations:", err);
    res.status(500).json({ error: "Failed to fetch embedding operations" });
  }
};

// ----------------------------------
// GET single operation
// ----------------------------------
exports.getOperation = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        eo.*,
        u.name AS operator_name,
        d.device_name AS machine_name
      FROM embedding_operations eo
      LEFT JOIN users u ON eo.operator_id = u.id
      LEFT JOIN devices d ON eo.device_id = d.device_id
      WHERE eo.id = $1
    `;

    const { rows } = await pool.query(query, [id]);

    if (!rows.length) {
      return res.status(404).json({ error: "Operation not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ getOperation:", err);
    res.status(500).json({ error: "Failed to fetch operation" });
  }
};

// ----------------------------------
// CREATE operation
// ----------------------------------
exports.createOperation = async (req, res) => {
      console.log("REQ.BODY:", req.body); // ✅ log everything coming from frontend

  try {
    const {
      operator_id,
      device_id,
      quantity_received = 0,
      good_quantity = 0,
      quantity_embedded = 0,
      quantity_rejected = 0,
      quantity_returned = 0,
      shift = null,
      start_time = null,
      end_time = null,
      remarks = null,
    } = req.body;

    // ✅ Validate required fields
    if (!operator_id || !device_id) {
      return res.status(400).json({
        error: "operator_id and device_id are required"
      });
    }

    const query = `
      INSERT INTO embedding_operations
      (
        operator_id,
        device_id,
        quantity_received,
        good_quantity,
        quantity_embedded,
        quantity_rejected,
        quantity_returned,
        shift,
        start_time,
        end_time,
        remarks
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
    `;

    const { rows } = await pool.query(query, [
      operator_id,
      device_id,
      quantity_received,
      good_quantity,
      quantity_embedded,
      quantity_rejected,
      quantity_returned,
      shift,
      start_time,
      end_time,
      remarks,
    ]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("❌ createOperation:", err);
    res.status(500).json({ error: "Failed to create operation" });
  }
};

// ----------------------------------
// UPDATE operation
// ----------------------------------
exports.updateOperation = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      quantity_received = 0,
      good_quantity = 0,
      quantity_embedded = 0,
      quantity_rejected = 0,
      quantity_returned = 0,
      shift = null,
      start_time = null,
      end_time = null,
      remarks = null,
      has_discrepancy = false,
      is_confirmed = false,
    } = req.body;

    const query = `
      UPDATE embedding_operations SET
        quantity_received = $1,
        good_quantity = $2,
        quantity_embedded = $3,
        quantity_rejected = $4,
        quantity_returned = $5,
        shift = $6,
        start_time = $7,
        end_time = $8,
        remarks = $9,
        has_discrepancy = $10,
        is_confirmed = $11,
        updated_date = NOW()
      WHERE id = $12
      RETURNING *
    `;

    const { rows } = await pool.query(query, [
      quantity_received,
      good_quantity,
      quantity_embedded,
      quantity_rejected,
      quantity_returned,
      shift,
      start_time,
      end_time,
      remarks,
      has_discrepancy,
      is_confirmed,
      id,
    ]);

    if (!rows.length) {
      return res.status(404).json({ error: "Operation not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ updateOperation:", err);
    res.status(500).json({ error: "Failed to update operation" });
  }
};

// ----------------------------------
// MARK AS SEEN
// ----------------------------------
exports.markSeen = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    const query = `
      UPDATE embedding_operations
      SET seen_by = array_append(COALESCE(seen_by, '{}'), $1)
      WHERE id = $2
      RETURNING *
    `;

    const { rows } = await pool.query(query, [user_id, id]);
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ markSeen:", err);
    res.status(500).json({ error: "Failed to mark as seen" });
  }
};

// ----------------------------------
// MARK AS FIXED
// ----------------------------------
exports.markFixed = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    const query = `
      UPDATE embedding_operations
      SET fixed_by = $1, fixed_date = NOW()
      WHERE id = $2
      RETURNING *
    `;

    const { rows } = await pool.query(query, [user_id, id]);
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ markFixed:", err);
    res.status(500).json({ error: "Failed to mark as fixed" });
  }
};

// ----------------------------------
// CONFIRM operation
// ----------------------------------
exports.confirmOperation = async (req, res) => {
  try {
    const { id } = req.params;

    const { rows } = await pool.query(
      `
      UPDATE embedding_operations
      SET is_confirmed = TRUE
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ confirmOperation:", err);
    res.status(500).json({ error: "Failed to confirm operation" });
  }
};

// ----------------------------------
// DELETE operation
// ----------------------------------
exports.deleteOperation = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "DELETE FROM embedding_operations WHERE id = $1",
      [id]
    );

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("❌ deleteOperation:", err);
    res.status(500).json({ error: "Failed to delete operation" });
  }
};
