const express = require('express');
const router = express.Router();
const targetController = require('../controllers/targetController');

// Set or update monthly target
router.post('/target', targetController.setMonthlyTarget);

// Get target and progress for a user
router.get('/target/:user_id/:month_year', targetController.getMonthlyTarget);

// Update progress for a user
router.post('/target/:user_id/:month_year/progress', targetController.updateProgress);

module.exports = router;
