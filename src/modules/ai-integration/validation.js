const { z } = require('zod');

const aiRecommendParamsSchema = z.object({
  taskId: z.string().regex(/^\d+$/),
});

module.exports = {
  aiRecommendParamsSchema,
};

