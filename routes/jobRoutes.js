const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');

// Bulk job submission
router.post('/submissions', jobController.createJobSubmissions);

module.exports = router;
