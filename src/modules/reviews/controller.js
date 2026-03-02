const reviewsService = require('./service');

async function createReview(req, res, next) {
  try {
    const review = await reviewsService.createReview(req.body);
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
}

async function getReviewsForProvider(req, res, next) {
  try {
    const providerId = parseInt(req.params.id, 10);
    const reviews = await reviewsService.getReviewsForProvider(providerId);
    res.json(reviews);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createReview,
  getReviewsForProvider,
};

