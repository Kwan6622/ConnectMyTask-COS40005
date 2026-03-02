const { z } = require('zod');

const createBidSchema = z.object({
  taskId: z.number().int().positive(),
  providerId: z.number().int().positive(),
  price: z.number().positive(),
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

