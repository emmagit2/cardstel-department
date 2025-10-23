// routes/bankRoutes.js
const express = require("express");
const router = express.Router();
const bankController = require("../controllers/bankController");

// GET /api/banks  -> list all banks
router.get("/", bankController.getBanks);

// GET /api/banks/:id -> single bank by id
router.get("/:id", bankController.getBankById);

module.exports = router;
