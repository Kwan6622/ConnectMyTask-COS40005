const express = require('express');
const { createValidationMiddleware } = require('../../shared/validation/validateRequest');
const {
  createReviewSchema,
  providerIdParamsSchema,
} = require('./validation');
const reviewsController = require('./controller');

const router = express.Router();

// POST /reviews
router.post(
  '/reviews',
  createValidationMiddleware({ body: createReviewSchema }),
  reviewsController.createReview
);

// GET /providers/:id/reviews
router.get(
  '/providers/:id/reviews',
  createValidationMiddleware({ params: providerIdParamsSchema }),
  reviewsController.getReviewsForProvider
);

module.exports = router;

