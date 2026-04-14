const express = require('express');
const { createValidationMiddleware } = require('../../shared/validation/validateRequest');
const {
  createUserSchema,
  getUserParamsSchema,
  updateProfilePhotoSchema,
  updateProviderProfileSchema,
  createProviderCertificateSchema,
  certificateIdParamsSchema,
  verifyProviderCertificateSchema,
} = require('./validation');
const { authenticate, requireRoles } = require('../../shared/middlewares/auth');
const userController = require('./controller');

const router = express.Router();

router.post(
  '/',
  createValidationMiddleware({ body: createUserSchema }),
  userController.createUser
);

router.get(
  '/:id',
  createValidationMiddleware({ params: getUserParamsSchema }),
  userController.getUserById
);

router.patch(
  '/me',
  authenticate,
  createValidationMiddleware({ body: updateProfilePhotoSchema }),
  userController.updateProfilePhoto
);

router.patch(
  '/me/provider-profile',
  authenticate,
  requireRoles('PROVIDER'),
  createValidationMiddleware({ body: updateProviderProfileSchema }),
  userController.updateProviderProfile
);

router.post(
  '/me/provider-certificates',
  authenticate,
  requireRoles('PROVIDER'),
  createValidationMiddleware({ body: createProviderCertificateSchema }),
  userController.addProviderCertificate
);

router.patch(
  '/provider-certificates/:id/verification',
  authenticate,
  requireRoles('ADMIN'),
  createValidationMiddleware({ params: certificateIdParamsSchema, body: verifyProviderCertificateSchema }),
  userController.verifyProviderCertificate
);

router.get(
  '/providers/:id/rating-summary',
  createValidationMiddleware({ params: getUserParamsSchema }),
  userController.getProviderRatingSummary
);

module.exports = router;

