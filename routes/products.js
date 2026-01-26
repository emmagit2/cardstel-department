const express = require('express');
const router = express.Router();
const db = require('../config/db'); // PostgreSQL pool

// ======================
// HELPER FUNCTIONS
// ======================

/**
 * Get or create a category by name
 * @param {string} category_name 
 * @returns {number|null} category ID
 */
async function getCategoryId(category_name) {
  if (!category_name?.trim()) return null;

  const existing = await db.query(
    'SELECT id FROM categories WHERE name = $1',
    [category_name.trim()]
  );

  if (existing.rows.length > 0) return existing.rows[0].id;

  const inserted = await db.query(
    'INSERT INTO categories (name) VALUES ($1) RETURNING id',
    [category_name.trim()]
  );

  return inserted.rows[0].id;
}

/**
 * Get or create a vendor by name
 * @param {string} vendor_name 
 * @returns {number|null} vendor ID
 */
async function getVendorId(vendor_name) {
  if (!vendor_name?.trim()) return null;

  const existing = await db.query(
    'SELECT id FROM vendors WHERE name = $1',
    [vendor_name.trim()]
  );

  if (existing.rows.length > 0) return existing.rows[0].id;

  const inserted = await db.query(
    'INSERT INTO vendors (name) VALUES ($1) RETURNING id',
    [vendor_name.trim()]
  );

  return inserted.rows[0].id;
}

// ======================
// ROUTES
// ======================

// GET all products
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, c.name AS category_name, v.name AS vendor_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN vendors v ON p.vendor_id = v.id
      ORDER BY p.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET single product by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(`
      SELECT p.*, c.name AS category_name, v.name AS vendor_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN vendors v ON p.vendor_id = v.id
      WHERE p.id = $1
    `, [id]);

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// CREATE a new product
router.post('/', async (req, res) => {
  const {
    name,
    category_name,
    vendor_name,
    vendor_email,
    vendor_phone,
    waybill_number,
    package,
    package_per_unit,
    unit_price,
    injection_date,
    delivery_date
  } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: 'Product name is required' });
  }

  try {
    // Handle vendor
    let vendor_id = null;
    if (vendor_name?.trim()) {
      const existingVendor = await db.query('SELECT id FROM vendors WHERE name = $1', [vendor_name.trim()]);

      if (existingVendor.rows.length > 0) {
        vendor_id = existingVendor.rows[0].id;
        await db.query(
          'UPDATE vendors SET email = $1, phone_number = $2 WHERE id = $3',
          [vendor_email || null, vendor_phone || null, vendor_id]
        );
      } else {
        const insertedVendor = await db.query(
          'INSERT INTO vendors (name, email, phone_number) VALUES ($1, $2, $3) RETURNING id',
          [vendor_name.trim(), vendor_email || null, vendor_phone || null]
        );
        vendor_id = insertedVendor.rows[0].id;
      }
    }

    const category_id = await getCategoryId(category_name);

    // Calculate initial current_balance automatically
    const initialBalance = (package || 0) * (package_per_unit || 1);

    const result = await db.query(
      `INSERT INTO products
        (name, category_id, vendor_id, waybill_number, package, package_per_unit, unit_price, current_balance, created_at, updated_at, injection_date, delivery_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), $9, $10)
       RETURNING *`,
      [
        name.trim(),
        category_id,
        vendor_id,
        waybill_number || null,
        package || 0,
        package_per_unit || 0,
        unit_price || 0,
        initialBalance,
        injection_date || new Date(),
        delivery_date || null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// UPDATE an existing product
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    name,
    category_name,
    vendor_name,
    waybill_number,
    package,
    package_per_unit,
    unit_price
  } = req.body;

  try {
    const category_id = await getCategoryId(category_name);
    const vendor_id = await getVendorId(vendor_name);

    // Get old product to calculate balance difference
    const oldProductRes = await db.query(
      'SELECT package, package_per_unit, current_balance FROM products WHERE id=$1',
      [id]
    );
    const oldProduct = oldProductRes.rows[0];
    if (!oldProduct) return res.status(404).json({ error: 'Product not found' });

    const oldQty = (oldProduct.package || 0) * (oldProduct.package_per_unit || 1);
    const newQty = (package || 0) * (package_per_unit || 1);
    const balanceDiff = newQty - oldQty;

    const result = await db.query(
      `UPDATE products SET 
        name = $1,
        category_id = $2,
        vendor_id = $3,
        waybill_number = $4,
        package = $5,
        package_per_unit = $6,
        unit_price = $7,
        current_balance = current_balance + $8,
        updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [
        name?.trim() || null,
        category_id,
        vendor_id,
        waybill_number || null,
        package || 0,
        package_per_unit || 0,
        unit_price || 0,
        balanceDiff,
        id
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE a product
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
