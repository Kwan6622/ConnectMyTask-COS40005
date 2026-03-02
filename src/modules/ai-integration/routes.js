const express = require('express');
const { createValidationMiddleware } = require('../../shared/validation/validateRequest');
const { aiRecommendParamsSchema } = require('./validation');
const aiController = require('./controller');

const router = express.Router();

// POST /ai/recommend/:taskId
router.post(
  '/recommend/:taskId',
  createValidationMiddleware({ params: aiRecommendParamsSchema }),
  aiController.recommendForTask
);

module.exports = router;

