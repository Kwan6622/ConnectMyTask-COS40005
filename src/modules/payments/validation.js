const { z } = require('zod');

const createPaymentSchema = z.object({
  taskId: z.number().int().positive(),
  method: z.enum(['STRIPE']).default('STRIPE'),
  flow: z.enum(['ESCROW_DEPOSIT', 'DIRECT_PAYMENT']).optional(),
});

const confirmPaymentSchema = z.object({
  sessionId: z.string().min(1),
});

const taskIdParamsSchema = z.object({
  taskId: z.string().regex(/^\d+$/),
});

module.exports = {
  createPaymentSchema,
  confirmPaymentSchema,
  taskIdParamsSchema,
};
