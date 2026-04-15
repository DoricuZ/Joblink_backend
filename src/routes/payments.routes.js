const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/auth.middleware');
const authorizeRole = require('../middleware/authorizeRole');

// Controllers
const paymentController = require('../controllers/payment.controller');
const webhookController = require('../controllers/webhook.controller');
const payoutController = require('../controllers/payout.controller');

router.post(
  '/initialize',
  authenticate, // must be logged-in 
  authorizeRole(['employer']),    //// Only employers can initialize payment
  paymentController.initializePayment
);

router.get(
  '/:jobId',
  authenticate,
  paymentController.getJobPayment
);


router.post(
  '/webhook',
  webhookController.handleWebhook
);

router.post(
  '/payout/execute/:transactionId',
  authenticate, // must be logged-in 
  authorizeRole(['employer']),   //// Only employers can trigger payout
  payoutController.executePayout
);

module.exports = router;

