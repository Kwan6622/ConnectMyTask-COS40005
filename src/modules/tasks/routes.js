const express = require('express');
const { createValidationMiddleware } = require('../../shared/validation/validateRequest');
const {
  createTaskSchema,
  listTasksQuerySchema,
  taskIdParamsSchema,
  updateTaskStatusSchema,
} = require('./validation');
const taskController = require('./controller');

const router = express.Router();

// POST /tasks
router.post(
  '/',
  createValidationMiddleware({ body: createTaskSchema }),
  taskController.createTask
);

// GET /tasks
router.get(
  '/',
  createValidationMiddleware({ query: listTasksQuerySchema }),
  taskController.listTasks
);

// GET /tasks/:id
router.get(
  '/:id',
  createValidationMiddleware({ params: taskIdParamsSchema }),
  taskController.getTaskById
);

// PATCH /tasks/:id/status
router.patch(
  '/:id/status',
  createValidationMiddleware({
    params: taskIdParamsSchema,
    body: updateTaskStatusSchema,
  }),
  taskController.updateTaskStatus
);

// PATCH /tasks/:id
router.patch(
  '/:id',
  createValidationMiddleware({ params: taskIdParamsSchema }),
  taskController.updateTask
);

module.exports = router;

