const express = require("express");
const router = express.Router();
const controller = require("../controllers/cardsJobController"); // ensure correct path

// ============ Routes ============

// 🔹 Overall Summary (Today, Week, Month, Top Banks)
router.get("/summary", controller.getOverallSummary);


// 🔹 Bank Jobs Table (Jobs by bank)
router.get("/bank-jobs", controller.getBankJobs);

// 🔹 Multi-Bank Report (Compare all banks)
router.get("/multi-bank", controller.getMultiBankReport);

// 🔹 Bank Calendar Summary (Day, Week, Month, or Custom Range)
router.get("/bank-calendar-summary", controller.getBankCalendarSummary);

module.exports = router;
