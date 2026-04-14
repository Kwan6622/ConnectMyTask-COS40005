const express = require('express');
const { authenticate, requireRoles } = require('../../shared/middlewares/auth');
const { createValidationMiddleware } = require('../../shared/validation/validateRequest');
const { createPaymentSchema, confirmPaymentSchema, taskIdParamsSchema } = require('./validation');
const paymentController = require('./controller');

const router = express.Router();

// POST /payments/create
router.post(
  '/create',
  authenticate,
  requireRoles('REQUESTER', 'CLIENT'),
  createValidationMiddleware({ body: createPaymentSchema }),
  paymentController.createPayment
);

// POST /payments/confirm-session
router.post(
  '/confirm-session',
  authenticate,
  requireRoles('REQUESTER', 'CLIENT'),
  createValidationMiddleware({ body: confirmPaymentSchema }),
  paymentController.confirmPayment
);

// GET /payments/me
router.get(
  '/me',
  authenticate,
  paymentController.listMyPayments
);

// GET /payments/task/:taskId
router.get(
  '/task/:taskId',
  authenticate,
  createValidationMiddleware({ params: taskIdParamsSchema }),
  paymentController.getTaskPaymentHistory
);

// POST /payments/webhook
// Stripe requires raw body parsing in app.js for this route.
router.post('/webhook', paymentController.webhook);

module.exports = router;
