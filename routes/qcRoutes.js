const express = require('express');
const router = express.Router();
const qc = require('../controllers/qcController');

// =====================================================
// QC Routes
// =====================================================

// Create QC entry
router.post('/qc_entries', qc.addQcEntry);

// Get entries (filters by bank and date range)
router.get('/qc_entries', qc.getQcEntries);

// Get daily totals
router.get('/qc_totals', qc.getTotals);

// Get weekly report
router.get('/qc_week_report', qc.getWeekReport);

// Save edit log
router.post('/logs', qc.saveEditLog);


// ✅ Add this GET route to fetch all QC edit logs
router.get('/logs', qc.getQLogs);

// Filter banks + entries (for dynamic table loading in JS)
router.post('/filter_banks', qc.filterBanks); // <-- NEW

module.exports = router;
