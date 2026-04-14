const { z } = require('zod');

const aiRecommendParamsSchema = z.object({
  taskId: z.string().regex(/^\d+$/),
});

const aiPredictPriceBodySchema = z.object({
  title: z.string().optional().default(''),
  category: z.string().min(1),
  location: z.string().optional().default(''),
  description: z.string().optional().default(''),
  budget: z.number().optional(),
  complexity: z.string().optional(),
  urgency: z.string().optional(),
});

module.exports = {
  aiRecommendParamsSchema,
  aiPredictPriceBodySchema,
};

