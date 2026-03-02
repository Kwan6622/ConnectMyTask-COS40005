const express = require('express');
const { createValidationMiddleware } = require('../../shared/validation/validateRequest');
const { authenticate } = require('../../shared/middlewares/auth');
const { signupSchema, loginSchema } = require('./validation');
const authController = require('./controller');

const router = express.Router();

router.post(
  '/signup',
  createValidationMiddleware({ body: signupSchema }),
  authController.signup
);

router.post(
  '/login',
  createValidationMiddleware({ body: loginSchema }),
  authController.login
);

router.get('/me', authenticate, authController.me);

router.post('/logout', authController.logout);

router.post('/refresh', authenticate, authController.refresh);

module.exports = router;

