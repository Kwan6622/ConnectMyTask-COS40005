const taskRepository = require('./repository');
const notificationRepository = require('../notifications/repository');
const paymentService = require('../payments/service');
const { evaluateTaskRisk } = require('./riskEvaluator');
const { generateSuggestedSubtasks } = require('./subtaskTemplates');
const { isSameDistrict, isNearbyDistrict } = require('./districtAdjacency');

const GLOBAL_MAX_BIDS = 100;
const DEFAULT_MAX_BIDS = 30;
const BIDDING_WINDOW_HOURS = 24;
let autoAssignRunning = false;
let lastAutoAssignRunAt = 0;
const TASK_PRIORITY_ORDER = {
  OPEN: 1,
  BIDDING: 2,
  ASSIGNED: 3,
  IN_PROGRESS: 4,
  PENDING_CONFIRMATION: 5,
  DISPUTED: 6,
  COMPLETED: 7,
  AWAITING_PAYMENT: 8,
  PAID: 9,
  CANCELLED: 10,
  PENDING: 11,
};

const SPECIALTY_CATEGORY_KEYWORDS = {
  ELECTRICIAN: ['HOME_REPAIR', 'IT_SUPPORT'],
  CLEANING: ['CLEANING'],
  DELIVERY: ['DELIVERY'],
  'HOME REPAIR': ['HOME_REPAIR'],
  MOVING: ['MOVING'],
  'TECH SUPPORT': ['IT_SUPPORT'],
  IT_SUPPORT: ['IT_SUPPORT'],
};

function normalizeRole(role) {
  return String(role || '').toUpperCase();
}

function isRequesterRole(role) {
  const normalized = normalizeRole(role);
  return normalized === 'REQUESTER' || normalized === 'CLIENT';
}

function isAdminRole(role) {
  return normalizeRole(role) === 'ADMIN';
}

function validateImageUrls(imageUrls) {
  if (!imageUrls) return;
  if (!Array.isArray(imageUrls)) {
    const err = new Error('imageUrls must be an array');
    err.statusCode = 400;
    throw err;
  }
  if (imageUrls.length > 3) {
    const err = new Error('Max 3 images per task');
    err.statusCode = 400;
    throw err;
  }
  for (const url of imageUrls) {
    try {
      const parsed = new URL(url);
      if (!parsed.protocol.startsWith('http')) {
        throw new Error('Invalid URL');
      }
    } catch (_error) {
      const err = new Error('Invalid image URL');
      err.statusCode = 400;
      throw err;
    }
  }
}

function parseDueDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    const err = new Error('Invalid due date');
    err.statusCode = 400;
    throw err;
  }
  if (parsed.getTime() < Date.now()) {
    const err = new Error('Due date cannot be in the past');
    err.statusCode = 400;
    throw err;
  }
  return parsed;
}

function isTaskActiveForOverdue(status) {
  return ['OPEN', 'BIDDING', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_CONFIRMATION', 'DISPUTED'].includes(status);
}

function computeProgressPercent(task, updates, subtasks) {
  if (Array.isArray(subtasks) && subtasks.length > 0) {
    const doneCount = subtasks.filter((item) => item.status === 'DONE').length;
    return Math.round((doneCount / subtasks.length) * 100);
  }

  const latest = updates[0];
  if (latest) return latest.progressPercent;
  if (['COMPLETED', 'AWAITING_PAYMENT', 'PAID'].includes(task.status)) {
    return 100;
  }
  if (task.status === 'PENDING_CONFIRMATION') {
    return 100;
  }
  if (task.status === 'IN_PROGRESS') {
    return 50;
  }
  return 0;
}

function parseMaxBids(rawValue) {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return DEFAULT_MAX_BIDS;
  }
  const value = Number(rawValue);
  if (!Number.isInteger(value) || value < 1 || value > GLOBAL_MAX_BIDS) {
    const err = new Error(`maxBids must be an integer between 1 and ${GLOBAL_MAX_BIDS}`);
    err.statusCode = 400;
    throw err;
  }
  return value;
}

function parseTaskTimestamp(value, fallback = 0) {
  if (!value) return fallback;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? fallback : parsed;
}

function computeTaskPriority(task) {
  if (task?.isOverdue) {
    // Overdue tasks should stay near the bottom even if status is otherwise active.
    return 6.5;
  }
  return TASK_PRIORITY_ORDER[String(task?.status || '').toUpperCase()] || 50;
}

function compareTasksForBrowse(a, b) {
  const priorityDiff = computeTaskPriority(a) - computeTaskPriority(b);
  if (priorityDiff !== 0) {
    return priorityDiff;
  }

  const statusA = String(a?.status || '').toUpperCase();
  const statusB = String(b?.status || '').toUpperCase();
  const isOpportunityA = statusA === 'OPEN' || statusA === 'BIDDING';
  const isOpportunityB = statusB === 'OPEN' || statusB === 'BIDDING';

  if (isOpportunityA && isOpportunityB) {
    // Secondary sort for opportunities: due date sooner first, then newest.
    const dueA = parseTaskTimestamp(a?.dueDate || a?.deadline, Number.POSITIVE_INFINITY);
    const dueB = parseTaskTimestamp(b?.dueDate || b?.deadline, Number.POSITIVE_INFINITY);
    if (dueA !== dueB) {
      return dueA - dueB;
    }
  }

  const createdA = parseTaskTimestamp(a?.createdAt, 0);
  const createdB = parseTaskTimestamp(b?.createdAt, 0);
  if (createdA !== createdB) {
    return createdB - createdA;
  }

  return Number(b?.id || 0) - Number(a?.id || 0);
}

function assertRequesterRole(user) {
  if (!isRequesterRole(user?.role)) {
    const err = new Error('Only requesters can perform this action');
    err.statusCode = 403;
    throw err;
  }
}

function assertProviderRole(user) {
  if (normalizeRole(user?.role) !== 'PROVIDER') {
    const err = new Error('Only providers can perform this action');
    err.statusCode = 403;
    throw err;
  }
}

function scoreSpecialtyMatch(taskCategory, specialties) {
  const normalizedTaskCategory = String(taskCategory || '').toUpperCase();
  const normalizedSpecialties = (Array.isArray(specialties) ? specialties : [])
    .map((item) => String(item || '').trim().toUpperCase())
    .filter(Boolean);

  for (const specialty of normalizedSpecialties) {
    const mappedCategories = SPECIALTY_CATEGORY_KEYWORDS[specialty] || SPECIALTY_CATEGORY_KEYWORDS[specialty.replace(/_/g, ' ')] || [];
    if (mappedCategories.includes(normalizedTaskCategory)) {
      return 100;
    }
    if (specialty.includes(normalizedTaskCategory)) {
      return 80;
    }
  }
  return 0;
}

function scoreDistrictMatch(providerDistrict, taskLocation) {
  if (!providerDistrict || !taskLocation) return 0;
  if (isSameDistrict(providerDistrict, taskLocation)) {
    return 50;
  }
  if (isNearbyDistrict(providerDistrict, taskLocation)) {
    return 25;
  }
  return 0;
}

function scoreStatusPriority(task) {
  const status = String(task?.status || '').toUpperCase();
  if (status === 'OPEN') return 20;
  if (status === 'BIDDING') return 16;
  if (status === 'ASSIGNED') return 6;
  if (status === 'IN_PROGRESS') return 3;
  return 0;
}

function assertAdminRole(user) {
  if (!isAdminRole(user?.role)) {
    const err = new Error('Only admins can perform this action');
    err.statusCode = 403;
    throw err;
  }
}

function canAccessTaskProgress(task, currentUser) {
  return (
    task.createdById === currentUser.id ||
    (task.assignedProviderId != null && task.assignedProviderId === currentUser.id) ||
    isAdminRole(currentUser.role)
  );
}

async function logActivity(taskId, actorId, action, message, metadata) {
  await taskRepository.createTaskActivity({
    taskId,
    actorId: actorId || null,
    action,
    message,
    metadata: metadata || null,
  });
}

async function notifyTaskParties(task, notificationData) {
  const recipients = new Set();
  if (task.createdById) recipients.add(task.createdById);
  if (task.assignedProviderId) recipients.add(task.assignedProviderId);

  const senderId = notificationData.senderId || null;
  for (const recipientId of recipients) {
    if (senderId && recipientId === senderId) {
      continue;
    }
    await notificationRepository.createNotification({
      recipientId,
      senderId,
      taskId: task.id,
      message: notificationData.message,
    });
  }
}

async function ensureOverdueState(task) {
  if (!task?.id || !task?.dueDate) {
    return task;
  }

  const now = new Date();
  const shouldBeOverdue = now.getTime() > new Date(task.dueDate).getTime() && isTaskActiveForOverdue(task.status);

  if (shouldBeOverdue && !task.isOverdue) {
    const updated = await taskRepository.updateTask(task.id, {
      isOverdue: true,
      overdueNotifiedAt: task.overdueNotifiedAt || now,
    });

    // Notify once when crossing overdue threshold.
    if (!task.overdueNotifiedAt) {
      await notifyTaskParties(updated, {
        message: `Task "${task.title}" is overdue. Please update progress or open a dispute if needed.`,
      });
      await logActivity(
        task.id,
        null,
        'OVERDUE_TRIGGERED',
        `Task became overdue at ${now.toISOString()}.`,
        {
          dueDate: task.dueDate,
        }
      );
    }

    return {
      ...task,
      isOverdue: true,
      overdueNotifiedAt: now,
    };
  }

  return task;
}

async function hydrateTaskWithOverdue(task) {
  if (!task) return task;
  return ensureOverdueState(task);
}

async function hydrateTaskListWithOverdue(tasks) {
  const enriched = [];
  for (const task of tasks) {
    // Keep this sequential to avoid notification races when multiple readers hit at the same time.
    // Capstone scope: task lists are small.
    // eslint-disable-next-line no-await-in-loop
    const nextTask = await ensureOverdueState(task);
    enriched.push(nextTask);
  }
  return enriched;
}

function buildProviderTrustMap(ratingStats) {
  const trustMap = new Map();
  for (const stat of ratingStats) {
    trustMap.set(stat.toUserId, {
      averageRating: Number(stat?._avg?.rating || 0),
      reviewCount: Number(stat?._count?.rating || 0),
    });
  }
  return trustMap;
}

function pickBestBidWithTrust(bids, providerTrustMap) {
  if (!Array.isArray(bids) || bids.length === 0) return null;
  const sortedByPrice = [...bids].sort((a, b) => a.price - b.price);
  const lowestPrice = sortedByPrice[0].price;
  const closeBand = sortedByPrice.filter((bid) => bid.price <= lowestPrice + 50000);

  const ranked = closeBand.sort((a, b) => {
    const trustA = providerTrustMap.get(a.providerId) || { averageRating: Number(a?.provider?.rating || 0), reviewCount: 0 };
    const trustB = providerTrustMap.get(b.providerId) || { averageRating: Number(b?.provider?.rating || 0), reviewCount: 0 };

    if (a.price !== b.price) return a.price - b.price;
    if (trustB.averageRating !== trustA.averageRating) return trustB.averageRating - trustA.averageRating;
    if (trustB.reviewCount !== trustA.reviewCount) return trustB.reviewCount - trustA.reviewCount;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return ranked[0] || sortedByPrice[0];
}

async function autoAssignExpiredBiddingTasks() {
  const nowTs = Date.now();
  if (autoAssignRunning) return;
  if (nowTs - lastAutoAssignRunAt < 30000) return;

  autoAssignRunning = true;
  lastAutoAssignRunAt = nowTs;

  try {
  const expiredTasks = await taskRepository.listExpiredBiddingTasks(new Date());
  if (!expiredTasks.length) return;

  const allProviderIds = Array.from(
    new Set(expiredTasks.flatMap((task) => task.bids.map((bid) => bid.providerId)))
  );
  const ratingStats = await taskRepository.getProviderRatingStats(allProviderIds);
  const trustMap = buildProviderTrustMap(ratingStats);

  for (const task of expiredTasks) {
    const bestBid = pickBestBidWithTrust(task.bids, trustMap);
    if (!bestBid) continue;

    // eslint-disable-next-line no-await-in-loop
    const acceptedBid = await taskRepository.autoAssignProviderFromBid(task.id, bestBid.id);
    if (!acceptedBid) continue;

    // eslint-disable-next-line no-await-in-loop
    await notificationRepository.createNotification({
      recipientId: acceptedBid.providerId,
      senderId: null,
      taskId: task.id,
      message: `Your bid was auto-selected after bidding deadline for task "${task.title}".`,
    });
    // eslint-disable-next-line no-await-in-loop
    await notificationRepository.createNotification({
      recipientId: task.createdById,
      senderId: acceptedBid.providerId,
      taskId: task.id,
      message: `Task "${task.title}" was auto-assigned after 24h bidding window. Please deposit escrow to start work.`,
    });
    // eslint-disable-next-line no-await-in-loop
    await logActivity(task.id, null, 'AUTO_ASSIGNED_AFTER_BIDDING_WINDOW', 'System auto-assigned provider after 24h bidding window.', {
      bidId: acceptedBid.id,
      providerId: acceptedBid.providerId,
      selectedBidPrice: acceptedBid.price,
      ranking: 'lowest-bid first, then higher rating/review-count as tie-break in close bids',
    });
  }
  } finally {
    autoAssignRunning = false;
  }
}

function triggerAutoAssignExpiredBiddingTasks() {
  autoAssignExpiredBiddingTasks().catch(() => {
    // Background best-effort routine: never block user-facing requests.
  });
}

async function getTaskById(id) {
  triggerAutoAssignExpiredBiddingTasks();
  const task = await taskRepository.getTaskById(id);
  if (!task) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }
  const hydratedTask = await hydrateTaskWithOverdue(task);
  const bidCount = hydratedTask?._count?.bids || 0;
  const taskMaxBids = Math.min(Number(hydratedTask?.maxBids || DEFAULT_MAX_BIDS), GLOBAL_MAX_BIDS);
  const biddingEndsAt = hydratedTask?.biddingEndsAt ? new Date(hydratedTask.biddingEndsAt) : null;
  const biddingOpenByTime = !biddingEndsAt || Date.now() <= biddingEndsAt.getTime();
  return {
    ...hydratedTask,
    bidCount,
    maxBids: taskMaxBids,
    isBiddingClosed:
      !biddingOpenByTime ||
      hydratedTask.status === 'ASSIGNED' ||
      bidCount >= taskMaxBids ||
      bidCount >= GLOBAL_MAX_BIDS,
    biddingWindowHours: BIDDING_WINDOW_HOURS,
  };
}

async function createTask(payload, currentUser) {
  assertRequesterRole(currentUser);
  validateImageUrls(payload.imageUrls);

  const dueDate = parseDueDate(payload.dueDate || payload.deadline);

  const risk = await evaluateTaskRisk({
    category: payload.category,
    budget: payload.budget,
    title: payload.title,
    description: payload.description,
  });

  const createPayload = {
    title: payload.title,
    description: payload.description,
    category: payload.category,
    budget: payload.budget,
    maxBids: parseMaxBids(payload.maxBids),
    location: payload.location,
    imageUrls: payload.imageUrls || [],
    dueDate,
    createdById: currentUser.id,
    status: 'OPEN',
    isSuspicious: risk.isSuspicious,
    suspiciousReason: risk.suspiciousReason,
    riskLevel: risk.riskLevel,
  };

  const task = await taskRepository.createTask(createPayload);
  const suggestedSubtasks = await generateSuggestedSubtasks(payload.category, payload.title, payload.description);
  await taskRepository.createSubtasksForTask(task.id, suggestedSubtasks);

  await logActivity(task.id, currentUser.id, 'TASK_CREATED', 'Requester posted a new task.', {
    title: task.title,
    budget: task.budget,
    dueDate,
    riskLevel: risk.riskLevel,
    isSuspicious: risk.isSuspicious,
    maxBids: createPayload.maxBids,
    generatedSubtasks: suggestedSubtasks.length,
  });

  return getTaskById(task.id);
}

async function listTasks(filters) {
  triggerAutoAssignExpiredBiddingTasks();
  const tasks = await taskRepository.listTasks(filters);
  const hydratedTasks = await hydrateTaskListWithOverdue(tasks);
  const browseEligibleTasks = hydratedTasks.filter((task) => {
    const status = String(task?.status || '').toUpperCase();
    const isAssigned = status === 'ASSIGNED';
    const isOverdueUnassigned = Boolean(task?.isOverdue) && !task?.assignedProviderId;
    return !isAssigned && !isOverdueUnassigned;
  });
  return [...browseEligibleTasks].sort(compareTasksForBrowse);
}

async function updateTaskStatus(id, status, currentUser) {
  const task = await getTaskById(id);
  const role = normalizeRole(currentUser?.role);

  if (task.status === 'DISPUTED' && role !== 'ADMIN') {
    const err = new Error('Task is frozen due to dispute and cannot change status now');
    err.statusCode = 409;
    throw err;
  }

  if (role === 'PROVIDER') {
    if (task.assignedProviderId !== currentUser.id) {
      const err = new Error('You can only update tasks assigned to you');
      err.statusCode = 403;
      throw err;
    }

    if (task.escrowStatus !== 'HELD' && status !== 'ASSIGNED') {
      const err = new Error('Requester must deposit escrow before provider can change progress status');
      err.statusCode = 400;
      throw err;
    }

    const allowedProviderStatuses = ['ASSIGNED', 'IN_PROGRESS', 'PENDING_CONFIRMATION'];
    if (!allowedProviderStatuses.includes(status)) {
      const err = new Error('Providers can only set ASSIGNED, IN_PROGRESS, or PENDING_CONFIRMATION');
      err.statusCode = 400;
      throw err;
    }

    const updatedTask = await taskRepository.updateTaskStatus(id, status);
    await logActivity(id, currentUser.id, 'STATUS_CHANGED', `Provider changed status to ${status}.`, {
      from: task.status,
      to: status,
    });
    return updatedTask;
  }

  if (isRequesterRole(role)) {
    if (task.createdById !== currentUser.id) {
      const err = new Error('You can only update your own tasks');
      err.statusCode = 403;
      throw err;
    }

    const allowedRequesterStatuses = ['OPEN', 'CANCELLED', 'COMPLETED', 'AWAITING_PAYMENT', 'PAID'];
    if (!allowedRequesterStatuses.includes(status)) {
      const err = new Error('Requesters can only set OPEN, CANCELLED, COMPLETED, AWAITING_PAYMENT, or PAID');
      err.statusCode = 400;
      throw err;
    }

    if (status === 'COMPLETED' && task.status !== 'PENDING_CONFIRMATION') {
      const err = new Error('Task must be pending confirmation before completing');
      err.statusCode = 400;
      throw err;
    }

    if (status === 'AWAITING_PAYMENT' && task.status !== 'COMPLETED') {
      const err = new Error('Task must be COMPLETED before awaiting payment');
      err.statusCode = 400;
      throw err;
    }

    const updatedTask = await taskRepository.updateTaskStatus(id, status);
    await logActivity(id, currentUser.id, 'STATUS_CHANGED', `Requester changed status to ${status}.`, {
      from: task.status,
      to: status,
    });
    return updatedTask;
  }

  if (role === 'ADMIN') {
    const updatedTask = await taskRepository.updateTaskStatus(id, status);
    await logActivity(id, currentUser.id, 'STATUS_CHANGED', `Admin changed status to ${status}.`, {
      from: task.status,
      to: status,
    });
    return updatedTask;
  }

  const err = new Error('Forbidden');
  err.statusCode = 403;
  throw err;
}

async function updateTask(id, payload, currentUser) {
  const task = await getTaskById(id);
  assertRequesterRole(currentUser);
  if (task.createdById !== currentUser.id) {
    const err = new Error('You can only edit your own tasks');
    err.statusCode = 403;
    throw err;
  }

  validateImageUrls(payload.imageUrls);

  const updatePayload = { ...payload };
  if (Object.prototype.hasOwnProperty.call(payload, 'dueDate') || Object.prototype.hasOwnProperty.call(payload, 'deadline')) {
    updatePayload.dueDate = parseDueDate(payload.dueDate || payload.deadline);
  }
  if (Object.prototype.hasOwnProperty.call(updatePayload, 'deadline')) {
    delete updatePayload.deadline;
  }
  if (Object.prototype.hasOwnProperty.call(updatePayload, 'maxBids')) {
    updatePayload.maxBids = parseMaxBids(updatePayload.maxBids);
  }

  const nextCategory = Object.prototype.hasOwnProperty.call(updatePayload, 'category')
    ? updatePayload.category
    : task.category;
  const nextBudget = Object.prototype.hasOwnProperty.call(updatePayload, 'budget')
    ? updatePayload.budget
    : task.budget;

  const risk = await evaluateTaskRisk({
    category: nextCategory,
    budget: nextBudget,
    title: Object.prototype.hasOwnProperty.call(updatePayload, 'title') ? updatePayload.title : task.title,
    description: Object.prototype.hasOwnProperty.call(updatePayload, 'description')
      ? updatePayload.description
      : task.description,
  });
  updatePayload.isSuspicious = risk.isSuspicious;
  updatePayload.suspiciousReason = risk.suspiciousReason;
  updatePayload.riskLevel = risk.riskLevel;

  const updatedTask = await taskRepository.updateTask(id, updatePayload);
  await logActivity(id, currentUser.id, 'TASK_UPDATED', 'Requester updated task details.', {
    fields: Object.keys(updatePayload),
    riskLevel: risk.riskLevel,
    isSuspicious: risk.isSuspicious,
  });
  return updatedTask;
}

async function saveTask(userId, taskId) {
  await getTaskById(taskId);
  return taskRepository.saveTaskForUser(userId, taskId);
}

async function unsaveTask(userId, taskId) {
  await getTaskById(taskId);
  const deletedCount = await taskRepository.unsaveTaskForUser(userId, taskId);
  return { deleted: deletedCount > 0 };
}

async function listSavedTasks(userId) {
  return taskRepository.listSavedTasksForUser(userId);
}

async function assignProvider(taskId, bidId, currentUser) {
  const task = await getTaskById(taskId);
  assertRequesterRole(currentUser);

  if (task.createdById !== currentUser.id) {
    const err = new Error('You can only assign providers for your own tasks');
    err.statusCode = 403;
    throw err;
  }

  if (task.status === 'DISPUTED') {
    const err = new Error('Cannot assign provider while dispute is active');
    err.statusCode = 409;
    throw err;
  }

  if (!['OPEN', 'BIDDING'].includes(task.status)) {
    const err = new Error('Provider can only be assigned while task is OPEN or BIDDING');
    err.statusCode = 400;
    throw err;
  }

  const acceptedBid = await taskRepository.assignProviderFromBid(taskId, bidId);

  await notificationRepository.createNotification({
    recipientId: acceptedBid.providerId,
    senderId: currentUser.id,
    taskId,
    message: `Your bid was accepted for task "${task.title}". Waiting for requester escrow deposit.`,
  });

  await notificationRepository.createNotification({
    recipientId: currentUser.id,
    senderId: acceptedBid.providerId,
    taskId,
    message: `Provider assigned for "${task.title}". Please deposit escrow to start work.`,
  });

  await logActivity(taskId, currentUser.id, 'PROVIDER_ASSIGNED', 'Requester selected a provider from bids.', {
    bidId,
    providerId: acceptedBid.providerId,
    escrowStatus: 'PENDING_DEPOSIT',
  });

  return acceptedBid;
}

async function listRequesterTasks(userId, currentUser) {
  triggerAutoAssignExpiredBiddingTasks();
  if (userId !== currentUser.id) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }
  const tasks = await taskRepository.listTasksByRequester(userId);
  return hydrateTaskListWithOverdue(tasks);
}

async function listAssignedTasks(userId, currentUser) {
  triggerAutoAssignExpiredBiddingTasks();
  if (userId !== currentUser.id) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }
  assertProviderRole(currentUser);
  const tasks = await taskRepository.listAssignedTasksForProvider(userId);
  return hydrateTaskListWithOverdue(tasks);
}

async function listSuggestedTasksForProvider(currentUser) {
  triggerAutoAssignExpiredBiddingTasks();
  assertProviderRole(currentUser);
  const profile = await taskRepository.getProviderProfileByUserId(currentUser.id);
  const specialties = profile?.specialties || (currentUser?.skills ? [currentUser.skills] : []);
  const providerDistrict = profile?.district || null;

  const tasks = await taskRepository.listTasks({});
  const hydratedTasks = await hydrateTaskListWithOverdue(tasks);
  const candidateTasks = hydratedTasks.filter((task) => {
    if (task.createdById === currentUser.id) return false;
    if (task.assignedProviderId && task.assignedProviderId !== currentUser.id) return false;
    const status = String(task.status || '').toUpperCase();
    return ['OPEN', 'BIDDING', 'ASSIGNED', 'IN_PROGRESS'].includes(status);
  });

  return candidateTasks
    .map((task) => {
      const specialtyScore = scoreSpecialtyMatch(task.category, specialties);
      const districtScore = scoreDistrictMatch(providerDistrict, task.location);
      const statusScore = scoreStatusPriority(task);
      const total = specialtyScore + districtScore + statusScore;
      return {
        ...task,
        suggestionScore: total,
      };
    })
    .sort((a, b) => {
      if (b.suggestionScore !== a.suggestionScore) {
        return b.suggestionScore - a.suggestionScore;
      }
      return compareTasksForBrowse(a, b);
    });
}

async function getTaskProgress(taskId, currentUser) {
  const task = await getTaskById(taskId);
  if (!canAccessTaskProgress(task, currentUser)) {
    const err = new Error('Only assigned provider and task requester can view task progress');
    err.statusCode = 403;
    throw err;
  }

  const updates = await taskRepository.listProgressUpdatesForTask(taskId);
  const subtasks = await taskRepository.listSubtasksForTask(taskId);
  const latestUpdate = updates[0] || null;
  const disputes = await taskRepository.listDisputesForTask(taskId);
  const activities = await taskRepository.listTaskActivity(taskId, 120);
  const payments = await taskRepository.listPaymentTransactionsForTask(taskId);

  return {
    task,
    updates,
    subtasks,
    disputes,
    activities,
    payments,
    paymentSummary: {
      escrowStatus: task.escrowStatus,
      paymentStatus: task.paymentStatus,
      escrowAmount: task.escrowAmount || task.budget,
      escrowHeldAt: task.escrowHeldAt,
      escrowReleasedAt: task.escrowReleasedAt,
    },
    summary: {
      progressPercent: computeProgressPercent(task, updates, subtasks),
      completedSubtasks: subtasks.filter((item) => item.status === 'DONE').length,
      totalSubtasks: subtasks.length,
      latestNote: latestUpdate?.note || null,
      estimatedCompletionDate: latestUpdate?.estimatedCompletionDate || null,
      milestoneStatus: latestUpdate?.milestoneStatus || null,
      attachmentsCount: updates.reduce((count, item) => count + (item.attachments?.length || 0), 0),
      hasOpenDispute: disputes.some((item) => ['OPEN', 'UNDER_REVIEW'].includes(item.status)),
      isOverdue: Boolean(task.isOverdue),
    },
  };
}

async function updateTaskSubtaskStatus(taskId, subtaskId, payload, currentUser) {
  assertProviderRole(currentUser);
  const task = await getTaskById(taskId);
  if (task.assignedProviderId !== currentUser.id) {
    const err = new Error('Only assigned provider can update subtask progress');
    err.statusCode = 403;
    throw err;
  }
  if (!['ASSIGNED', 'IN_PROGRESS', 'PENDING_CONFIRMATION'].includes(task.status)) {
    const err = new Error('Subtask updates are only allowed for active assigned tasks');
    err.statusCode = 400;
    throw err;
  }

  if (!task.isOnSite) {
    const err = new Error('You must verify your location on site via the mobile app before updating subtasks');
    err.statusCode = 403;
    throw err;
  }

  const verifiedAt = task.onSiteVerifiedAt ? new Date(task.onSiteVerifiedAt).getTime() : 0;
  const hoursSinceVerify = (Date.now() - verifiedAt) / (1000 * 60 * 60);
  if (hoursSinceVerify < 0 || hoursSinceVerify > 8) {
    const err = new Error('Progress can only be updated within 8 hours after location verification');
    err.statusCode = 403;
    throw err;
  }

  const existingSubtask = await taskRepository.getSubtaskById(taskId, subtaskId);
  if (!existingSubtask) {
    const err = new Error('Subtask not found');
    err.statusCode = 404;
    throw err;
  }

  const result = await taskRepository.updateSubtaskStatus(taskId, subtaskId, payload.status);
  if (!result.count) {
    const err = new Error('Failed to update subtask status');
    err.statusCode = 400;
    throw err;
  }

  const subtasks = await taskRepository.listSubtasksForTask(taskId);
  const doneCount = subtasks.filter((item) => item.status === 'DONE').length;
  const nextProgressPercent = subtasks.length > 0 ? Math.round((doneCount / subtasks.length) * 100) : 0;

  await logActivity(taskId, currentUser.id, 'SUBTASK_STATUS_UPDATED', `Provider updated subtask "${existingSubtask.title}" to ${payload.status}.`, {
    subtaskId,
    status: payload.status,
    progressPercent: nextProgressPercent,
  });

  return {
    task: await getTaskById(taskId),
    subtasks,
    summary: {
      progressPercent: nextProgressPercent,
      completedSubtasks: doneCount,
      totalSubtasks: subtasks.length,
    },
  };
}

async function createTaskProgressUpdate(taskId, payload, currentUser) {
  assertProviderRole(currentUser);
  const task = await getTaskById(taskId);

  if (task.assignedProviderId !== currentUser.id) {
    const err = new Error('Only assigned provider can update this task progress');
    err.statusCode = 403;
    throw err;
  }

  if (task.status === 'DISPUTED') {
    const err = new Error('Task is in dispute. Progress updates are frozen until resolved');
    err.statusCode = 409;
    throw err;
  }

  if (task.escrowStatus !== 'HELD') {
    const err = new Error('Requester must deposit escrow before progress updates can be posted');
    err.statusCode = 400;
    throw err;
  }

  if (!['ASSIGNED', 'IN_PROGRESS', 'PENDING_CONFIRMATION'].includes(task.status)) {
    const err = new Error('Task progress can only be updated for active assigned tasks');
    err.statusCode = 400;
    throw err;
  }

  if (!task.isOnSite) {
    const err = new Error('You must verify your location on site via the mobile app before updating progress');
    err.statusCode = 403;
    throw err;
  }

  const verifiedAt = task.onSiteVerifiedAt ? new Date(task.onSiteVerifiedAt).getTime() : 0;
  const hoursSinceVerify = (Date.now() - verifiedAt) / (1000 * 60 * 60);
  if (hoursSinceVerify < 0 || hoursSinceVerify > 8) {
    const err = new Error('Progress can only be updated within 8 hours after location verification');
    err.statusCode = 403;
    throw err;
  }

  const markAsCompleted = Boolean(payload.markAsCompleted);
  if (markAsCompleted && payload.progressPercent !== 100) {
    const err = new Error('Progress must be 100% before marking task as completed');
    err.statusCode = 400;
    throw err;
  }

  const progressUpdate = await taskRepository.createTaskProgressUpdate({
    taskId,
    providerId: currentUser.id,
    progressPercent: payload.progressPercent,
    note: payload.note,
    attachments: payload.attachments || [],
    milestoneStatus: payload.milestoneStatus || null,
    estimatedCompletionDate: payload.estimatedCompletionDate
      ? new Date(payload.estimatedCompletionDate)
      : null,
  });

  let nextStatus = task.status;
  if (markAsCompleted) {
    nextStatus = 'PENDING_CONFIRMATION';
  } else if (['ASSIGNED', 'PENDING_CONFIRMATION'].includes(task.status)) {
    nextStatus = 'IN_PROGRESS';
  }

  if (nextStatus !== task.status) {
    await taskRepository.updateTaskStatus(taskId, nextStatus);
  }

  await logActivity(
    taskId,
    currentUser.id,
    markAsCompleted ? 'PROGRESS_MARKED_COMPLETED' : 'PROGRESS_UPDATED',
    markAsCompleted
      ? 'Provider marked task as completed and requested confirmation.'
      : `Provider posted progress update: ${payload.progressPercent}%`,
    {
      progressPercent: payload.progressPercent,
      milestoneStatus: payload.milestoneStatus || null,
      estimatedCompletionDate: payload.estimatedCompletionDate || null,
      markAsCompleted,
    }
  );

  if (markAsCompleted) {
    await notificationRepository.createNotification({
      recipientId: task.createdById,
      senderId: currentUser.id,
      taskId,
      message: `Provider ${currentUser.name || currentUser.email} marked "${task.title}" as completed and is waiting for your confirmation.`,
    });
  } else {
    await notificationRepository.createNotification({
      recipientId: task.createdById,
      senderId: currentUser.id,
      taskId,
      message: `Provider ${currentUser.name || currentUser.email} posted a new progress update for "${task.title}".`,
    });
  }

  const updatedTask = await getTaskById(taskId);
  return {
    task: updatedTask,
    progressUpdate,
  };
}

async function confirmTaskCompletion(taskId, currentUser) {
  assertRequesterRole(currentUser);
  const task = await getTaskById(taskId);

  if (task.createdById !== currentUser.id) {
    const err = new Error('You can only confirm completion for your own tasks');
    err.statusCode = 403;
    throw err;
  }

  if (task.status !== 'PENDING_CONFIRMATION') {
    const err = new Error('Task must be pending confirmation before requester confirmation');
    err.statusCode = 400;
    throw err;
  }

  if (task.escrowStatus !== 'HELD') {
    const err = new Error('Escrow must be held before completion confirmation and payment release');
    err.statusCode = 400;
    throw err;
  }

  if (task.status === 'PAID') {
    const err = new Error('Task has already been settled');
    err.statusCode = 409;
    throw err;
  }

  await taskRepository.updateTask(taskId, {
    status: 'COMPLETED',
  });

  await logActivity(taskId, currentUser.id, 'COMPLETION_CONFIRMED', 'Requester confirmed provider completion.', {
    previousStatus: task.status,
  });

  // Auto release escrow after requester confirmation.
  const releaseResult = await paymentService.releaseEscrowForTask(taskId, currentUser, {
    reason: 'Auto release after requester confirmation',
  });

  return {
    success: true,
    message: 'Completion confirmed and escrow released to provider',
    task: releaseResult.task,
    releaseTransaction: releaseResult.transaction,
  };
}

async function verifyOnSite(taskId, currentUser) {
  assertProviderRole(currentUser);
  const task = await getTaskById(taskId);
  if (task.assignedProviderId !== currentUser.id) {
    const err = new Error('Only the assigned provider can confirm arrival on site');
    err.statusCode = 403;
    throw err;
  }
  if (!['ASSIGNED', 'IN_PROGRESS', 'PENDING_CONFIRMATION'].includes(task.status)) {
    const err = new Error('Task check-in is only allowed for active assigned tasks');
    err.statusCode = 400;
    throw err;
  }
  
  const updatedTask = await taskRepository.updateTask(taskId, {
    isOnSite: true,
    onSiteVerifiedAt: new Date(),
  });

  await logActivity(taskId, currentUser.id, 'ON_SITE_VERIFIED', 'Provider arrived on site and verified location.', {
    verifiedAt: new Date(),
  });

  return updatedTask;
}

async function getTaskActivity(taskId, currentUser) {
  const task = await getTaskById(taskId);
  if (!canAccessTaskProgress(task, currentUser)) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

  return taskRepository.listTaskActivity(taskId, 120);
}

async function openTaskDispute(taskId, payload, currentUser) {
  const task = await getTaskById(taskId);
  const role = normalizeRole(currentUser.role);
  const isParticipant = task.createdById === currentUser.id || task.assignedProviderId === currentUser.id;

  if (!isParticipant && role !== 'ADMIN') {
    const err = new Error('Only task requester or assigned provider can open disputes');
    err.statusCode = 403;
    throw err;
  }

  if (!['ASSIGNED', 'IN_PROGRESS', 'PENDING_CONFIRMATION', 'COMPLETED', 'AWAITING_PAYMENT', 'DISPUTED'].includes(task.status)) {
    const err = new Error('Disputes are only available for active assigned tasks');
    err.statusCode = 400;
    throw err;
  }

  const existingDisputes = await taskRepository.listDisputesForTask(taskId);
  const hasOpenDispute = existingDisputes.some((item) => ['OPEN', 'UNDER_REVIEW'].includes(item.status));
  if (hasOpenDispute) {
    const err = new Error('This task already has an active dispute');
    err.statusCode = 409;
    throw err;
  }

  const dispute = await taskRepository.createDispute({
    taskId,
    openedById: currentUser.id,
    reason: payload.reason,
    description: payload.description,
    evidenceUrls: payload.evidenceUrls || [],
    status: 'OPEN',
  });

  const nextTaskData = {
    status: 'DISPUTED',
  };

  if (!['NONE', 'REFUNDED', 'RELEASED'].includes(task.escrowStatus)) {
    nextTaskData.escrowStatus = 'FROZEN';
  }

  if (!['RELEASED', 'REFUNDED'].includes(task.paymentStatus)) {
    nextTaskData.paymentStatus = 'FROZEN';
  }

  const updatedTask = await taskRepository.updateTask(taskId, nextTaskData);

  await logActivity(taskId, currentUser.id, 'DISPUTE_OPENED', `Dispute opened: ${payload.reason}.`, {
    disputeId: dispute.id,
    reason: payload.reason,
  });

  await notifyTaskParties(updatedTask, {
    senderId: currentUser.id,
    message: `A dispute was opened for task "${task.title}". Task and payment flow are temporarily frozen.`,
  });

  return {
    dispute,
    task: updatedTask,
  };
}

async function listTaskDisputes(taskId, currentUser) {
  const task = await getTaskById(taskId);
  if (!canAccessTaskProgress(task, currentUser)) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

  return taskRepository.listDisputesForTask(taskId);
}

async function reviewDisputeByAdmin(taskId, disputeId, payload, currentUser) {
  assertAdminRole(currentUser);

  const dispute = await taskRepository.findDisputeById(disputeId);
  if (!dispute || dispute.taskId !== taskId) {
    const err = new Error('Dispute not found for this task');
    err.statusCode = 404;
    throw err;
  }

  const updatedDispute = await taskRepository.updateDispute(disputeId, {
    status: payload.status,
    resolution: payload.resolution || null,
    adminNote: payload.resolution || null,
    resolvedById: currentUser.id,
  });

  let task = await getTaskById(taskId);

  if (payload.action === 'REFUND_ESCROW') {
    const refundResult = await paymentService.refundEscrowForTask(taskId, currentUser, {
      reason: payload.resolution || 'Admin dispute resolution refund',
    });
    task = refundResult.task;
  } else if (payload.action === 'RELEASE_ESCROW') {
    const releaseResult = await paymentService.releaseEscrowForTask(taskId, currentUser, {
      reason: payload.resolution || 'Admin dispute resolution release',
    });
    task = releaseResult.task;
  } else if (payload.action === 'FORCE_CANCEL') {
    task = await taskRepository.updateTask(taskId, {
      status: 'CANCELLED',
      canceledAt: new Date(),
      cancellationReason: payload.resolution || 'Cancelled by admin decision',
    });
  } else if (task.status === 'DISPUTED' && ['REJECTED', 'CLOSED'].includes(payload.status)) {
    const progressCount = await taskRepository.countProgressUpdatesForTask(taskId);
    task = await taskRepository.updateTask(taskId, {
      status: progressCount > 0 ? 'IN_PROGRESS' : 'ASSIGNED',
      escrowStatus: task.escrowStatus === 'FROZEN' ? 'HELD' : task.escrowStatus,
      paymentStatus: task.paymentStatus === 'FROZEN' ? 'ESCROW_HELD' : task.paymentStatus,
    });
  }

  await logActivity(taskId, currentUser.id, 'DISPUTE_REVIEWED', `Admin reviewed dispute #${disputeId}.`, {
    status: payload.status,
    action: payload.action || 'NONE',
  });

  await notifyTaskParties(task, {
    senderId: currentUser.id,
    message: `Admin reviewed dispute for task "${task.title}". Result: ${payload.status}.`,
  });

  return {
    success: true,
    dispute: updatedDispute,
    task,
  };
}

async function cancelTask(taskId, reason, currentUser) {
  assertRequesterRole(currentUser);
  const task = await getTaskById(taskId);

  if (task.createdById !== currentUser.id) {
    const err = new Error('You can only cancel your own task');
    err.statusCode = 403;
    throw err;
  }

  if (task.status === 'DISPUTED') {
    const err = new Error('Task is under dispute. Please wait for admin review');
    err.statusCode = 409;
    throw err;
  }

  const progressCount = await taskRepository.countProgressUpdatesForTask(taskId);
  const canCancelDirectly = ['OPEN', 'BIDDING'].includes(task.status)
    || (task.status === 'ASSIGNED' && progressCount === 0);

  if (!canCancelDirectly) {
    const err = new Error('Work has started. Open a dispute instead of direct cancellation');
    err.statusCode = 400;
    throw err;
  }

  let updatedTask;
  if (['HELD', 'FROZEN'].includes(task.escrowStatus)) {
    const refundResult = await paymentService.refundEscrowForTask(taskId, currentUser, {
      reason: reason || 'Requester cancelled task',
    });
    updatedTask = refundResult.task;
  } else {
    updatedTask = await taskRepository.updateTask(taskId, {
      status: 'CANCELLED',
      canceledAt: new Date(),
      cancellationReason: reason,
      paymentStatus: task.paymentStatus === 'ESCROW_PENDING' ? 'REFUNDED' : task.paymentStatus,
      escrowStatus: task.escrowStatus === 'PENDING_DEPOSIT' ? 'REFUNDED' : task.escrowStatus,
    });
  }

  await logActivity(taskId, currentUser.id, 'TASK_CANCELLED', 'Requester cancelled task.', {
    reason,
  });

  if (task.assignedProviderId) {
    await notificationRepository.createNotification({
      recipientId: task.assignedProviderId,
      senderId: currentUser.id,
      taskId,
      message: `Requester cancelled task "${task.title}".`,
    });
  }

  return {
    success: true,
    task: updatedTask,
  };
}

async function listAllDisputesForAdmin(currentUser) {
  assertAdminRole(currentUser);
  return taskRepository.listAllDisputes();
}

module.exports = {
  createTask,
  listTasks,
  getTaskById,
  updateTaskStatus,
  updateTask,
  saveTask,
  unsaveTask,
  listSavedTasks,
  assignProvider,
  listRequesterTasks,
  listAssignedTasks,
  listSuggestedTasksForProvider,
  getTaskProgress,
  updateTaskSubtaskStatus,
  createTaskProgressUpdate,
  confirmTaskCompletion,
  getTaskActivity,
  openTaskDispute,
  listTaskDisputes,
  reviewDisputeByAdmin,
  cancelTask,
  listAllDisputesForAdmin,
  verifyOnSite,
};
