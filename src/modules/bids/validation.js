const { z } = require('zod');

const createBidSchema = z.object({
  amount: z.number().positive(),
  message: z.string().max(1200).optional(),
  estimatedCompletionTime: z.string().max(100).optional(),
});

const bidIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/),
});

const taskIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/),
});

module.exports = {
  createBidSchema,
  bidIdParamsSchema,
  taskIdParamsSchema,
};

