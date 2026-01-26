const express = require('express');
const router = express.Router();
const { checkJobCode } = require('../controllers/checkJobs');

router.get("/checkjob", checkJobCode);


module.exports = router;
