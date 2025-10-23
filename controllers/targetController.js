const db = require('../config/db'); // your database connection

// Set or update a user's monthly target
exports.setMonthlyTarget = async (req, res) => {
    const { user_id, month_year, target_amount } = req.body;

    try {
        const existing = await pool.query(
            'SELECT * FROM user_monthly_targets WHERE user_id=$1 AND month_year=$2',
            [user_id, month_year]
        );

        if (existing.rows.length) {
            await pool.query(
                'UPDATE user_monthly_targets SET target_amount=$1 WHERE user_id=$2 AND month_year=$3',
                [target_amount, user_id, month_year]
            );
        } else {
            await pool.query(
                'INSERT INTO user_monthly_targets (user_id, month_year, target_amount) VALUES ($1,$2,$3)',
                [user_id, month_year, target_amount]
            );
        }

        res.json({ message: 'Monthly target set successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Get a user's target and progress
exports.getMonthlyTarget = async (req, res) => {
    const { user_id, month_year } = req.params;

    try {
        const result = await pool.query(
            'SELECT * FROM user_monthly_targets WHERE user_id=$1 AND month_year=$2',
            [user_id, month_year]
        );

        if (!result.rows.length) return res.status(404).json({ error: 'Target not found' });

        const target = result.rows[0];
        const progressPercent = ((target.current_amount / target.target_amount) * 100).toFixed(0);

        res.json({
            user_id: target.user_id,
            month_year: target.month_year,
            target_amount: target.target_amount,
            current_amount: target.current_amount,
            progress_percent: progressPercent
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update progress for a user's target
exports.updateProgress = async (req, res) => {
    const { user_id, month_year } = req.params;
    const { amount } = req.body;

    try {
        const result = await pool.query(
            'UPDATE user_monthly_targets SET current_amount = current_amount + $1 WHERE user_id=$2 AND month_year=$3 RETURNING *',
            [amount, user_id, month_year]
        );

        if (!result.rows.length) return res.status(404).json({ error: 'Target not found' });

        res.json({ message: 'Progress updated.', target: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
