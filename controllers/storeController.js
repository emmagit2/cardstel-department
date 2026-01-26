const pool = require("../config/db");

// Get all store inventory
exports.getStoreInventory = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT s.*, c.name as category_name, v.name as vendor_name
      FROM store_inventory s
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN vendors v ON s.vendor_id = v.id
      ORDER BY s.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single store item
exports.getStoreItem = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM store_inventory WHERE id=$1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new store inventory item
exports.createStoreItem = async (req, res) => {
  const {
    item_name, quantity_received, quantity_requested,
    category_id, vendor_id, unit_price, storekeeper, remarks
  } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO store_inventory 
      (item_name, quantity_received, quantity_requested, category_id, vendor_id, unit_price, storekeeper, remarks) 
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [item_name, quantity_received, quantity_requested, category_id, vendor_id, unit_price, storekeeper, remarks]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update store item
exports.updateStoreItem = async (req, res) => {
  const { id } = req.params;
  const {
    item_name, quantity_received, quantity_requested,
    category_id, vendor_id, unit_price, storekeeper, remarks, is_confirmed, seen_by
  } = req.body;

  try {
    const result = await db.query(
      `UPDATE store_inventory SET 
      item_name=$1, quantity_received=$2, quantity_requested=$3, category_id=$4, vendor_id=$5,
      unit_price=$6, storekeeper=$7, remarks=$8, is_confirmed=$9, seen_by=$10, updated_at=NOW()
      WHERE id=$11 RETURNING *`,
      [item_name, quantity_received, quantity_requested, category_id, vendor_id, unit_price, storekeeper, remarks, is_confirmed, seen_by, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete store item
exports.deleteStoreItem = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM store_inventory WHERE id=$1', [id]);
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
