// routes/bankCardRoutes.js
const express = require('express');
const router = express.Router();
const { addBankCard, reportCardIssue,releaseCards,  getTodayJobCodes,processReleasedJobs} = require('../controllers/qcBankController');

// Route to add a new bank card
// POST /api/bank-cards
router.post('/bank-cards', addBankCard);

// Route to report a card issue
// POST /api/card-issues
router.post('/card-issues', processReleasedJobs);

router.post('/release-cards', releaseCards);
router.get('/today', getTodayJobCodes);


module.exports = router;
