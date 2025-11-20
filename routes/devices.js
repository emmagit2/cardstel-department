const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// -----------------------------
// GET all devices
// -----------------------------
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM devices ORDER BY device_id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching devices:", err.message);
    res.status(500).send("Server Error");
  }
});

// -----------------------------
// POST - Add new device
// -----------------------------
router.post("/", async (req, res) => {
  try {
    const { device_name, device_type } = req.body;
    if (!device_name || !device_type)
      return res.status(400).json({ error: "Missing fields" });

    const result = await pool.query(
      `INSERT INTO devices (device_name, device_type, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       RETURNING *`,
      [device_name, device_type]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error adding device:", err.message);
    res.status(500).send("Server Error");
  }
});

// -----------------------------
// PUT - Update a device
// -----------------------------
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { device_name, device_type } = req.body;

    if (!device_name || !device_type)
      return res.status(400).json({ error: "Missing fields" });

    const result = await pool.query(
      `UPDATE devices 
       SET device_name = $1, 
           device_type = $2,
           updated_at = NOW()
       WHERE device_id = $3
       RETURNING *`,
      [device_name, device_type, id]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ error: "Device not found" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating device:", err.message);
    res.status(500).send("Server Error");
  }
});

// -----------------------------
// DELETE - Remove a device
// -----------------------------
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM devices WHERE device_id = $1", [id]);

    if (result.rowCount === 0)
      return res.status(404).json({ error: "Device not found" });

    res.json({ message: "Device deleted successfully", device_id: id });
  } catch (err) {
    console.error("Error deleting device:", err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
