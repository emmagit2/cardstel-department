// routes/transactions.js
const express = require('express');
const pool = require("../config/db");

const router = express.Router();

// Helper function to calculate new balance
async function calculateBalance(product_id, transaction_type, packageQty, packagePerUnit = 1) {
    const lastTx = await pool.query(
        'SELECT balance FROM transactions WHERE product_id = $1 ORDER BY transaction_date DESC, id DESC LIMIT 1',
        [product_id]
    );

    const previousBalance = lastTx.rows[0]?.balance || 0;

    // Calculate real quantity
    const quantity = packageQty * packagePerUnit;

    let newBalance = previousBalance;

    if (transaction_type === 'Injection' || transaction_type === 'Return') {
        newBalance += quantity;  // add to stock
    } else if (transaction_type === 'Release' || transaction_type === 'Damaged') {
        newBalance -= quantity;  // remove from stock
    }

    return newBalance;
}


// CREATE transaction
router.post('/', async (req, res) => {
    try {
        const {
            product_id,
            product_name,
            transaction_type,
            package,
            package_per_unit,
            vendor_id,
            waybill_number,
            staff_id,
            department_id,
            transaction_date
        } = req.body;

const balance = await calculateBalance(product_id, transaction_type, package, package_per_unit || 1);

        const result = await pool.query(
            `INSERT INTO transactions
            (product_id, product_name, transaction_type, package, package_per_unit, vendor_id, waybill_number, staff_id, department_id, transaction_date, balance)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            RETURNING *`,
            [
                product_id,
                product_name,
                transaction_type,
                package,
                package_per_unit || 0,
                vendor_id || null,
                waybill_number || '',
                staff_id,
                department_id,
                transaction_date || new Date().toISOString(),
                balance
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create transaction' });
    }
});

// GET all transactions for ONE product
router.get('/product/:productId', async (req, res) => {
    try {
        const { productId } = req.params;

       const result = await pool.query(
  `SELECT t.*, u.name AS staff_name, d.name AS department_name
   FROM transactions t
   LEFT JOIN users u ON t.staff_id = u.id
   LEFT JOIN departments d ON t.department_id = d.id
   WHERE t.product_id = $1
   ORDER BY t.transaction_date ASC, t.id ASC
  `,
  [productId]  // <-- pass the productId here
);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching transactions for product:', err);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// UPDATE transaction
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            transaction_type,
            package,
            package_per_unit,
            vendor_id,
            waybill_number,
            staff_id,
            department_id,
            transaction_date
        } = req.body;

        // Get the old transaction
        const oldTxRes = await pool.query('SELECT * FROM transactions WHERE id=$1', [id]);
        const oldTx = oldTxRes.rows[0];
        if (!oldTx) return res.status(404).json({ error: 'Transaction not found' });

        const oldQuantity = oldTx.package * (oldTx.package_per_unit || 1);
        let oldBalanceChange = 0;
        if (oldTx.transaction_type === 'Injection' || oldTx.transaction_type === 'Return') oldBalanceChange = oldQuantity;
        else if (oldTx.transaction_type === 'Release' || oldTx.transaction_type === 'Damaged') oldBalanceChange = -oldQuantity;

        const newQuantity = package * (package_per_unit || 1);
        let newBalanceChange = 0;
        if (transaction_type === 'Injection' || transaction_type === 'Return') newBalanceChange = newQuantity;
        else if (transaction_type === 'Release' || transaction_type === 'Damaged') newBalanceChange = -newQuantity;

        // Difference to apply to product balance
        const diff = newBalanceChange - oldBalanceChange;

        // Update product balance
        await pool.query(
            'UPDATE products SET current_balance = current_balance + $1 WHERE id = $2',
            [diff, oldTx.product_id]
        );

        // Update transaction
        const result = await pool.query(
            `UPDATE transactions
             SET transaction_type=$1,
                 package=$2,
                 package_per_unit=$3,
                 vendor_id=$4,
                 waybill_number=$5,
                 staff_id=$6,
                 department_id=$7,
                 transaction_date=$8,
                 updated_at=NOW()
             WHERE id=$9
             RETURNING *`,
            [transaction_type, package, package_per_unit || 0, vendor_id, waybill_number, staff_id, department_id, transaction_date, id]
        );

        res.json(result.rows[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update transaction' });
    }
});


// DELETE transaction
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query('DELETE FROM transactions WHERE id = $1', [id]);

        res.json({ message: 'Transaction deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
});

module.exports = router;
