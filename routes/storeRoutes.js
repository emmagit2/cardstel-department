const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');

router.get('/', storeController.getStoreInventory);
router.get('/:id', storeController.getStoreItem);
router.post('/', storeController.createStoreItem);
router.put('/:id', storeController.updateStoreItem);
router.delete('/:id', storeController.deleteStoreItem);

module.exports = router;
