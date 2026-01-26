const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/devicesController');

// ✅ Get all devices
router.get('/', deviceController.getAllDevices);

// ✅ Device usage route (matches frontend call: /api/devices/1/usage?view=weekly)
router.get('/:deviceId/usage', deviceController.getDeviceUsage);

// ✅ Device history route (matches frontend call: /api/devices/1/history)
router.get('/:deviceId/history', deviceController.getDeviceHistory);

router.get('/machines', deviceController.getCardMachines);



module.exports = router;
