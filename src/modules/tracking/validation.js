const { z } = require('zod');

const trackingUpdateSchema = z.object({
  taskId: z.number().int().positive(),
  providerId: z.number().int().positive(),
  lat: z.number(),
  lng: z.number(),
  timestamp: z.union([z.string().datetime(), z.number()]),
});

module.exports = {
  trackingUpdateSchema,
};

