const bidsRepository = require('./repository');
const notificationRepository = require('../notifications/repository');
const GLOBAL_MAX_BIDS = 100;
const DEFAULT_MAX_BIDS = 30;
const BIDDING_WINDOW_HOURS = 24;

function normalizeRole(role) {
  return String(role || '').toUpperCase();
}

async function createBid(taskId, payload, currentUser) {
  if (normalizeRole(currentUser?.role) !== 'PROVIDER') {
    const err = new Error('Only providers can submit bids');
    err.statusCode = 403;
    throw err;
  }

  const task = await bidsRepository.getTaskById(taskId);
  if (!task) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }

  if (task.createdById === currentUser.id) {
    const err = new Error('You cannot bid on your own task');
    err.statusCode = 400;
    throw err;
  }

  if (!['OPEN', 'BIDDING'].includes(task.status)) {
    const err = new Error('Bids are only allowed for OPEN or BIDDING tasks');
    err.statusCode = 400;
    throw err;
  }

  if (task.status === 'BIDDING' && task.biddingEndsAt) {
    const endsAt = new Date(task.biddingEndsAt).getTime();
    if (!Number.isNaN(endsAt) && Date.now() > endsAt) {
      const err = new Error('Bidding deadline has passed for this task.');
      err.statusCode = 400;
      throw err;
    }
  }

  const currentBidCount = Number(task?._count?.bids || 0);
  const taskMaxBids = Math.min(Number(task?.maxBids || DEFAULT_MAX_BIDS), GLOBAL_MAX_BIDS);
  if (currentBidCount >= taskMaxBids || currentBidCount >= GLOBAL_MAX_BIDS) {
    const err = new Error('This task is no longer accepting bids.');
    err.statusCode = 400;
    throw err;
  }

  const bid = await bidsRepository.createBid({
    taskId,
    providerId: currentUser.id,
    price: payload.amount,
    message: payload.message || null,
    estimatedCompletionTime: payload.estimatedCompletionTime || null,
    status: 'PENDING',
  });

  if (task.status === 'OPEN') {
    const biddingStartedAt = new Date();
    const biddingEndsAt = new Date(biddingStartedAt.getTime() + BIDDING_WINDOW_HOURS * 60 * 60 * 1000);
    await bidsRepository.markTaskAsBidding(taskId, biddingStartedAt, biddingEndsAt);
  }

  await notificationRepository.createNotification({
    recipientId: task.createdById,
    senderId: currentUser.id,
    taskId,
    message: `A provider wants to contact you regarding your task. Provider: ${currentUser.name || currentUser.email}.`,
  });

  return bid;
}

async function listBidsForTask(taskId, _currentUser) {
  const task = await bidsRepository.getTaskById(taskId);
  if (!task) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }
  return bidsRepository.listBidsForTask(taskId);
}

async function listBidsForProvider(providerId, currentUser) {
  if (providerId !== currentUser.id) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }
  if (normalizeRole(currentUser.role) !== 'PROVIDER') {
    const err = new Error('Only providers can view provider bid history');
    err.statusCode = 403;
    throw err;
  }
  return bidsRepository.listBidsForProvider(providerId);
}

module.exports = {
  createBid,
  listBidsForTask,
  listBidsForProvider,
};
