const { z } = require('zod');

const createRatingSchema = z.object({
  taskId: z.number().int().positive(),
  toUserId: z.number().int().positive().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
});

const userIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/),
});

const taskIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/),
});

module.exports = {
  createRatingSchema,
  userIdParamsSchema,
  taskIdParamsSchema,
};
