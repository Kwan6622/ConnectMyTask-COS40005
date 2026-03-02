const reviewsRepository = require('./repository');

async function createReview(payload) {
  return reviewsRepository.createReview(payload);
}

async function getReviewsForProvider(providerId) {
  return reviewsRepository.getReviewsForProvider(providerId);
}

module.exports = {
  createReview,
  getReviewsForProvider,
};

