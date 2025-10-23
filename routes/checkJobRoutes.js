const express = require('express');
const router = express.Router();
const { checkJobCode } = require('../controllers/checkJobs');

router.get('/check/:job_code/:bank_id', checkJobCode);

module.exports = router;
