const express = require('express');
const router = express.Router();
const rateController = require('../controller/rateController');

router.post('/', rateController.createRate);

router.get('/:orderId', rateController.getRatesByOrder);

module.exports = router;