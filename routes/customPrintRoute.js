const express = require("express");
const router = express.Router();
const { getCustomPrints } = require("../controllers/customControllerfunction");

// GET /api/custom-prints/:deviceId?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get("/:deviceId/custom-prints", getCustomPrints);

module.exports = router;
