const express = require('express');
const { createValidationMiddleware } = require('../../shared/validation/validateRequest');
const {
  createBidSchema,
  bidIdParamsSchema,
  taskIdParamsSchema,
} = require('./validation');
const bidsController = require('./controller');

const router = express.Router();

// POST /bids
router.post(
  '/bids',
  createValidationMiddleware({ body: createBidSchema }),
  bidsController.createBid
);

// GET /tasks/:id/bids
router.get(
  '/tasks/:id/bids',
  createValidationMiddleware({ params: taskIdParamsSchema }),
  bidsController.listBidsForTask
);

// POST /bids/:id/accept
router.post(
  '/bids/:id/accept',
  createValidationMiddleware({ params: bidIdParamsSchema }),
  bidsController.acceptBid
);

module.exports = router;

