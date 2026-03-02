const express = require('express');
const { createValidationMiddleware } = require('../../shared/validation/validateRequest');
const { createUserSchema, getUserParamsSchema, updateProfilePhotoSchema } = require('./validation');
const { authenticate } = require('../../shared/middlewares/auth');
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

module.exports = router;

