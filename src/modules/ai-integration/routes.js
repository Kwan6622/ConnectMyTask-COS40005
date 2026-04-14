const express = require('express');
const { createValidationMiddleware } = require('../../shared/validation/validateRequest');
const { aiRecommendParamsSchema, aiPredictPriceBodySchema } = require('./validation');
const aiController = require('./controller');

const router = express.Router();

// POST /ai/recommend/:taskId
router.post(
  '/recommend/:taskId',
  createValidationMiddleware({ params: aiRecommendParamsSchema }),
  aiController.recommendForTask
);

// POST /ai/predict-price
router.post(
  '/predict-price',
  createValidationMiddleware({ body: aiPredictPriceBodySchema }),
  aiController.predictPrice
);

module.exports = router;

