const express = require('express');
const { createValidationMiddleware } = require('../../shared/validation/validateRequest');
const { trackingUpdateSchema } = require('./validation');
const trackingController = require('./controller');

const router = express.Router();

// POST /tracking/update
router.post(
  '/update',
  createValidationMiddleware({ body: trackingUpdateSchema }),
  trackingController.trackingUpdate
);

module.exports = router;

