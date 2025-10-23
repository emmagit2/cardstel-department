const express = require('express');
const router = express.Router();
const personTeamController = require('../controllers/persoteamController');

// 📋 All staff
router.get('/staff', personTeamController.getStaffList);

// 💼 Jobs (Mailer Officer)
router.get('/staff/:userId/jobs', personTeamController.getMailerOfficerJobs);

// 🧰 Card Jobs (Machine Operator)
router.get('/staff/:userId/cardjobs', personTeamController.getMachineOperatorCardJobs);

module.exports = router;
