const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createPayOSPaymentLink, payosWebhook } = require('../controller/payosController');

router.post('/create-payment', protect, createPayOSPaymentLink);
router.post('/webhook', express.json(), payosWebhook);

module.exports = router;
