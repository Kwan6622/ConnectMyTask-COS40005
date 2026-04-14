const express = require('express');
const { createValidationMiddleware } = require('../../shared/validation/validateRequest');
const { authenticate, requireRoles } = require('../../shared/middlewares/auth');
const {
  createBidSchema,
  taskIdParamsSchema,
} = require('./validation');
const bidsController = require('./controller');

const router = express.Router();

// POST /tasks/:id/bids
router.post(
  '/tasks/:id/bids',
  authenticate,
  requireRoles('PROVIDER'),
  createValidationMiddleware({ params: taskIdParamsSchema, body: createBidSchema }),
  bidsController.createBid
);

// GET /tasks/:id/bids
router.get(
  '/tasks/:id/bids',
  authenticate,
  createValidationMiddleware({ params: taskIdParamsSchema }),
  bidsController.listBidsForTask
);

// GET /bids/provider/me
router.get(
  '/bids/provider/me',
  authenticate,
  requireRoles('PROVIDER'),
  bidsController.listMyProviderBids
);

module.exports = router;

