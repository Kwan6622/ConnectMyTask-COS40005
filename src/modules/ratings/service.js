const ratingsRepository = require('./repository');

const COMPLETED_STATUSES = new Set(['COMPLETED']);

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function toRole(role) {
  return String(role || '').toUpperCase();
}

function assertAuthenticated(currentUser) {
  if (!currentUser?.id) {
    const err = new Error('Unauthorized');
    err.statusCode = 401;
    throw err;
  }
}

function resolveRatingDirection(task, currentUser) {
  const userId = Number(currentUser.id);

  if (Number(task.createdById) === userId) {
    if (!task.assignedProviderId) {
      const err = new Error('This task has no assigned provider to review');
      err.statusCode = 400;
      throw err;
    }
    return {
      fromUserId: userId,
      toUserId: Number(task.assignedProviderId),
      direction: 'REQUESTER_TO_PROVIDER',
    };
  }

  const err = new Error('Only the task requester can rate the assigned provider');
  err.statusCode = 403;
  throw err;
}

async function recalculateUserRating(userId) {
  const stats = await ratingsRepository.getRatingStatsForUser(userId);
  const averageRating = Number(stats?._avg?.rating || 0);
  const totalReviews = Number(stats?._count?.rating || 0);

  const roundedAverage = totalReviews > 0 ? Number(averageRating.toFixed(2)) : 0;
  await ratingsRepository.updateUserRating(userId, roundedAverage);

  return {
    averageRating: roundedAverage,
    totalReviews,
  };
}

async function createRating(payload, currentUser) {
  assertAuthenticated(currentUser);

  const taskId = toNumber(payload.taskId);
  if (!Number.isInteger(taskId) || taskId <= 0) {
    const err = new Error('Invalid task id');
    err.statusCode = 400;
    throw err;
  }

  const task = await ratingsRepository.findTaskForRating(taskId);
  if (!task) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }

  if (!COMPLETED_STATUSES.has(String(task.status || '').toUpperCase())) {
    const err = new Error('Ratings are only allowed after task completion');
    err.statusCode = 400;
    throw err;
  }

  const direction = resolveRatingDirection(task, currentUser);

  if (payload.toUserId != null) {
    const requestedToUserId = toNumber(payload.toUserId);
    if (!Number.isInteger(requestedToUserId) || requestedToUserId !== direction.toUserId) {
      const err = new Error('Invalid review target for this task');
      err.statusCode = 400;
      throw err;
    }
  }

  const duplicate = await ratingsRepository.findExistingRating(taskId, direction.fromUserId, direction.toUserId);
  if (duplicate) {
    const err = new Error('You have already submitted a review for this user on this task');
    err.statusCode = 409;
    throw err;
  }

  const ratingRecord = await ratingsRepository.createRating({
    taskId,
    fromUserId: direction.fromUserId,
    toUserId: direction.toUserId,
    rating: payload.rating,
    comment: payload.comment || null,
  });

  const summary = await recalculateUserRating(direction.toUserId);

  return {
    ...ratingRecord,
    summary,
    direction: direction.direction,
  };
}

async function getUserRatings(userIdRaw) {
  const userId = toNumber(userIdRaw);
  if (!Number.isInteger(userId) || userId <= 0) {
    const err = new Error('Invalid user id');
    err.statusCode = 400;
    throw err;
  }

  const ratings = await ratingsRepository.listRatingsForUser(userId);
  const summary = await recalculateUserRating(userId);

  return {
    userId,
    averageRating: summary.averageRating,
    totalReviews: summary.totalReviews,
    ratings,
  };
}

async function getMyTaskRatingStatus(taskIdRaw, currentUser) {
  assertAuthenticated(currentUser);
  const taskId = toNumber(taskIdRaw);
  if (!Number.isInteger(taskId) || taskId <= 0) {
    const err = new Error('Invalid task id');
    err.statusCode = 400;
    throw err;
  }

  const task = await ratingsRepository.findTaskForRating(taskId);
  if (!task) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }

  if (!COMPLETED_STATUSES.has(String(task.status || '').toUpperCase())) {
    return {
      canRate: false,
      hasRated: false,
      reason: 'Task is not completed yet',
    };
  }

  const direction = resolveRatingDirection(task, currentUser);
  const existing = await ratingsRepository.findExistingRating(task.id, direction.fromUserId, direction.toUserId);

  return {
    canRate: true,
    hasRated: Boolean(existing),
    toUserId: direction.toUserId,
    direction: direction.direction,
    rating: existing || null,
    isRequester: toRole(currentUser.role) === 'REQUESTER' || toRole(currentUser.role) === 'CLIENT',
  };
}

async function getProviderRatingSummary(providerIdRaw) {
  const providerId = toNumber(providerIdRaw);
  if (!Number.isInteger(providerId) || providerId <= 0) {
    const err = new Error('Invalid provider id');
    err.statusCode = 400;
    throw err;
  }

  const summary = await recalculateUserRating(providerId);
  const latestComments = await ratingsRepository.listLatestCommentRatingsForUser(providerId, 5);
  const latestCommentsCount = latestComments.length;

  return {
    providerId,
    averageRating: summary.averageRating,
    totalReviews: summary.totalReviews,
    latestCommentsCount,
    latestComments,
  };
}

module.exports = {
  createRating,
  getUserRatings,
  getMyTaskRatingStatus,
  getProviderRatingSummary,
};
