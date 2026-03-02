const { z } = require('zod');

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  budget: z.number().positive(),
  location: z.string().min(1),
  createdById: z.number().int().positive(),
  imageUrls: z.array(z.string().url()).max(3, 'Max 3 images per task').optional(),
});

const listTasksQuerySchema = z.object({
  status: z.string().optional(),
  category: z.string().optional(),
});

const taskIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/),
});

const updateTaskStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'OPEN',
    'ASSIGNED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
  ]),
});

module.exports = {
  createTaskSchema,
  listTasksQuerySchema,
  taskIdParamsSchema,
  updateTaskStatusSchema,
};

