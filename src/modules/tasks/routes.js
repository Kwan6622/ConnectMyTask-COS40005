const express = require('express');
const { createValidationMiddleware } = require('../../shared/validation/validateRequest');
const { authenticate, optionalAuthenticate, requireRoles } = require('../../shared/middlewares/auth');
const { createRateLimitMiddleware } = require('../../shared/middlewares/rateLimitMemory');
const {
  createTaskSchema,
  listTasksQuerySchema,
  taskIdParamsSchema,
  saveTaskParamsSchema,
  updateTaskStatusSchema,
  createTaskProgressUpdateSchema,
  updateTaskSubtaskStatusSchema,
  assignProviderSchema,
  createDisputeSchema,
  cancelTaskSchema,
  disputeIdParamsSchema,
  adminReviewDisputeSchema,
  updateTaskSchema,
  taskSubtaskParamsSchema,
} = require('./validation');
const taskController = require('./controller');

const router = express.Router();
const progressRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 1000,
  max: 8,
  keyPrefix: 'task-progress',
});
const disputeRateLimit = createRateLimitMiddleware({
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyPrefix: 'task-dispute',
});
const completionRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 1000,
  max: 6,
  keyPrefix: 'task-completion',
});

// POST /tasks
router.post(
  '/',
  authenticate,
  requireRoles('REQUESTER', 'CLIENT'),
  createValidationMiddleware({ body: createTaskSchema }),
  taskController.createTask
);

// GET /tasks
router.get(
  '/',
  optionalAuthenticate,
  createValidationMiddleware({ query: listTasksQuerySchema }),
  taskController.listTasks
);

// GET /tasks/saved/me
router.get(
  '/saved/me',
  authenticate,
  taskController.listSavedTasks
);

// GET /tasks/requester/me
router.get(
  '/requester/me',
  authenticate,
  requireRoles('REQUESTER', 'CLIENT'),
  taskController.listRequesterTasks
);

// GET /tasks/provider/assigned/me
router.get(
  '/provider/assigned/me',
  authenticate,
  requireRoles('PROVIDER'),
  taskController.listProviderAssignedTasks
);

// GET /tasks/suggested/me
router.get(
  '/suggested/me',
  authenticate,
  requireRoles('PROVIDER'),
  taskController.listSuggestedTasksForProvider
);

// GET /tasks/disputes/all (admin)
router.get(
  '/disputes/all',
  authenticate,
  requireRoles('ADMIN'),
  taskController.listAllDisputesForAdmin
);

// GET /tasks/:id/progress
router.get(
  '/:id/progress',
  authenticate,
  createValidationMiddleware({ params: taskIdParamsSchema }),
  taskController.getTaskProgress
);

// POST /tasks/:id/progress
router.post(
  '/:id/progress',
  authenticate,
  progressRateLimit,
  createValidationMiddleware({
    params: taskIdParamsSchema,
    body: createTaskProgressUpdateSchema,
  }),
  taskController.createTaskProgressUpdate
);

// PATCH /tasks/:id/subtasks/:subtaskId
router.patch(
  '/:id/subtasks/:subtaskId',
  authenticate,
  createValidationMiddleware({
    params: taskSubtaskParamsSchema,
    body: updateTaskSubtaskStatusSchema,
  }),
  taskController.updateTaskSubtaskStatus
);

// POST /tasks/:id/confirm-completion
router.post(
  '/:id/confirm-completion',
  authenticate,
  completionRateLimit,
  createValidationMiddleware({ params: taskIdParamsSchema }),
  taskController.confirmTaskCompletion
);

// GET /tasks/:id/activity
router.get(
  '/:id/activity',
  authenticate,
  createValidationMiddleware({ params: taskIdParamsSchema }),
  taskController.getTaskActivity
);

// GET /tasks/:id/disputes
router.get(
  '/:id/disputes',
  authenticate,
  createValidationMiddleware({ params: taskIdParamsSchema }),
  taskController.listTaskDisputes
);

// POST /tasks/:id/disputes
router.post(
  '/:id/disputes',
  authenticate,
  disputeRateLimit,
  createValidationMiddleware({
    params: taskIdParamsSchema,
    body: createDisputeSchema,
  }),
  taskController.openTaskDispute
);

// PATCH /tasks/:id/disputes/:disputeId/review
router.patch(
  '/:id/disputes/:disputeId/review',
  authenticate,
  requireRoles('ADMIN'),
  createValidationMiddleware({
    params: disputeIdParamsSchema,
    body: adminReviewDisputeSchema,
  }),
  taskController.reviewDisputeByAdmin
);

// POST /tasks/:id/cancel
router.post(
  '/:id/cancel',
  authenticate,
  completionRateLimit,
  createValidationMiddleware({
    params: taskIdParamsSchema,
    body: cancelTaskSchema,
  }),
  taskController.cancelTask
);

// GET /tasks/:id
router.get(
  '/:id',
  optionalAuthenticate,
  createValidationMiddleware({ params: taskIdParamsSchema }),
  taskController.getTaskById
);

// PATCH /tasks/:id/status
router.patch(
  '/:id/status',
  authenticate,
  createValidationMiddleware({
    params: taskIdParamsSchema,
    body: updateTaskStatusSchema,
  }),
  taskController.updateTaskStatus
);

// PATCH /tasks/:id
router.patch(
  '/:id',
  authenticate,
  createValidationMiddleware({ params: taskIdParamsSchema, body: updateTaskSchema }),
  taskController.updateTask
);

// PATCH /tasks/:id/assign-provider
router.patch(
  '/:id/assign-provider',
  authenticate,
  requireRoles('REQUESTER', 'CLIENT'),
  createValidationMiddleware({ params: taskIdParamsSchema, body: assignProviderSchema }),
  taskController.assignProvider
);

// POST /tasks/:id/save
router.post(
  '/:id/save',
  authenticate,
  createValidationMiddleware({ params: saveTaskParamsSchema }),
  taskController.saveTask
);

// DELETE /tasks/:id/save
router.delete(
  '/:id/save',
  authenticate,
  createValidationMiddleware({ params: saveTaskParamsSchema }),
  taskController.unsaveTask
);

// POST /tasks/:id/verify-onsite
router.post(
  '/:id/verify-onsite',
  authenticate,
  requireRoles('PROVIDER'),
  createValidationMiddleware({ params: taskIdParamsSchema }),
  taskController.verifyOnSite
);

module.exports = router;

