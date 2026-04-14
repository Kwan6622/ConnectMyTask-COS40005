const express = require('express');
const { authenticate } = require('../../shared/middlewares/auth');
const { createValidationMiddleware } = require('../../shared/validation/validateRequest');
const {
  createContactNotificationSchema,
  notificationIdParamsSchema,
} = require('./validation');
const notificationController = require('./controller');

const router = express.Router();

// POST /notifications/contact
router.post(
  '/contact',
  authenticate,
  createValidationMiddleware({ body: createContactNotificationSchema }),
  notificationController.createContactNotification
);

// GET /notifications/me
router.get('/me', authenticate, notificationController.getMyNotifications);

// PATCH /notifications/:id/read
router.patch(
  '/:id/read',
  authenticate,
  createValidationMiddleware({ params: notificationIdParamsSchema }),
  notificationController.markNotificationRead
);

module.exports = router;
