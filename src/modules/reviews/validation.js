const { z } = require('zod');

const createReviewSchema = z.object({
  taskId: z.number().int().positive(),
  reviewerId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

const providerIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/),
});

module.exports = {
  createReviewSchema,
  providerIdParamsSchema,
};

