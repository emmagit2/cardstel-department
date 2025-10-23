const express = require('express');
const router = express.Router();
const { submitMachineJob } = require('../controllers/machineJobs');

router.post('/submit', submitMachineJob);

module.exports = router;
