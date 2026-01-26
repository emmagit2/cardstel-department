// routes/embeddingRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/embeddingController');

router.get('/', controller.getAllOperations);
router.get('/:id', controller.getOperation);
router.post('/', controller.createOperation);
router.put('/:id', controller.updateOperation);
router.post('/:id/seen', controller.markSeen);
router.post('/:id/fixed', controller.markFixed);
router.post('/:id/confirm', controller.confirmOperation);
router.delete('/:id', controller.deleteOperation);

module.exports = router;
