const express = require('express');
const router = express.Router();

// Import controller using CommonJS
const { getMonthlyTarget, setMonthlyTarget } = require('../controllers/targetController');

// GET monthly target
router.get('/month/:month', getMonthlyTarget);

// POST set/update monthly target
router.post('/month', setMonthlyTarget);

module.exports = router;
