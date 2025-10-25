const express = require('express');
const router = express.Router();
const { getJobsForTables } = require('../controllers/jobManagement');

// GET all job batches (Mailer + Card)
router.get('/job-management', getJobsForTables);

module.exports = router;
