const express = require('express');
const { authenticate } = require('../../shared/middlewares/auth');
const { createValidationMiddleware } = require('../../shared/validation/validateRequest');
const ratingsController = require('./controller');
const { createRatingSchema, userIdParamsSchema, taskIdParamsSchema } = require('./validation');

const router = express.Router();

router.post('/ratings', authenticate, createValidationMiddleware({ body: createRatingSchema }), ratingsController.createRating);

router.get('/users/:id/ratings', createValidationMiddleware({ params: userIdParamsSchema }), ratingsController.getUserRatings);

router.get('/providers/:id/ratings', createValidationMiddleware({ params: userIdParamsSchema }), ratingsController.getProviderRatingSummary);
router.get('/providers/:id/rating-summary', createValidationMiddleware({ params: userIdParamsSchema }), ratingsController.getProviderRatingSummary);

router.get('/tasks/:id/ratings/me', authenticate, createValidationMiddleware({ params: taskIdParamsSchema }), ratingsController.getMyTaskRatingStatus);

module.exports = router;
