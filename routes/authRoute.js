// routes/authRoute.js
const express = require('express');
const router = express.Router();
const { loginUser } = require('../controllers/auth'); // ✅ correct path & function name

router.post('/validate', loginUser); // ✅ use the correct function

module.exports = router;
