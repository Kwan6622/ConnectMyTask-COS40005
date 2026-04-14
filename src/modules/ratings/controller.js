const ratingsService = require('./service');

async function createRating(req, res, next) {
  try {
    const rating = await ratingsService.createRating(req.body, req.user);
    res.status(201).json(rating);
  } catch (error) {
    next(error);
  }
}

async function getUserRatings(req, res, next) {
  try {
    const result = await ratingsService.getUserRatings(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getMyTaskRatingStatus(req, res, next) {
  try {
    const result = await ratingsService.getMyTaskRatingStatus(req.params.id, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getProviderRatingSummary(req, res, next) {
  try {
    const result = await ratingsService.getProviderRatingSummary(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createRating,
  getUserRatings,
  getMyTaskRatingStatus,
  getProviderRatingSummary,
};
