const { z } = require('zod');

const createContactNotificationSchema = z.object({
  taskId: z.number().int().positive(),
});

const notificationIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/),
});

module.exports = {
  createContactNotificationSchema,
  notificationIdParamsSchema,
};
