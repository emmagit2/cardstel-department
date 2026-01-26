const express = require('express');
const router = express.Router();

const {
  getMonthlyProduction,
  getBankRankings,
  getMachinePerformance
} = require('../controllers/AnylaticsController');

// Current month production
router.get('/monthly', getMonthlyProduction);

// Bank rankings (week/month/year query params)
router.get('/banks', getBankRankings);

// Machine comparison (machine1 and machine2 query params)
router.get('/compared', getMachinePerformance);

module.exports = router;
