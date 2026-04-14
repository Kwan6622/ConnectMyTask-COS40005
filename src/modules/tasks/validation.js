const { z } = require('zod');

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  budget: z.number().positive(),
  maxBids: z.number().int().min(1).max(100).optional(),
  location: z.string().min(1),
  dueDate: z.string().optional(),
  deadline: z.string().optional(),
  aiSuggestedPrice: z.number().positive().optional(),
  imageUrls: z.array(z.string().url()).max(3, 'Max 3 images per task').optional(),
});

const listTasksQuerySchema = z.object({
  status: z.string().optional(),
  category: z.string().optional(),
});

const taskIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/),
});

const taskSubtaskParamsSchema = z.object({
  id: z.string().regex(/^\d+$/),
  subtaskId: z.string().regex(/^\d+$/),
});

const saveTaskParamsSchema = taskIdParamsSchema;

const updateTaskStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'OPEN',
    'BIDDING',
    'ASSIGNED',
    'IN_PROGRESS',
    'PENDING_CONFIRMATION',
    'COMPLETED',
    'AWAITING_PAYMENT',
    'PAID',
    'DISPUTED',
    'CANCELLED',
  ]),
});

const createTaskProgressUpdateSchema = z.object({
  progressPercent: z.number().int().min(0).max(100),
  note: z.string().min(1).max(2000),
  attachments: z.array(z.string().url()).max(10).optional(),
  milestoneStatus: z.string().max(120).optional(),
  estimatedCompletionDate: z
    .string()
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: 'Invalid estimated completion date',
    })
    .optional(),
  markAsCompleted: z.boolean().optional(),
});

const updateTaskSubtaskStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'DONE']),
});

const assignProviderSchema = z.object({
  bidId: z.number().int().positive(),
});

const createDisputeSchema = z.object({
  reason: z.enum([
    'PROVIDER_NOT_DELIVERING',
    'REQUESTER_NOT_CONFIRMING',
    'QUALITY_ISSUE',
    'PAYMENT_ISSUE',
    'OTHER',
  ]),
  description: z.string().min(1).max(2000),
  evidenceUrls: z.array(z.string().url()).max(10).optional(),
});

const cancelTaskSchema = z.object({
  reason: z.string().min(3).max(500),
});

const disputeIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/),
  disputeId: z.string().regex(/^\d+$/),
});

const adminReviewDisputeSchema = z.object({
  status: z.enum(['UNDER_REVIEW', 'RESOLVED', 'REJECTED', 'CLOSED']),
  resolution: z.string().max(2000).optional(),
  action: z.enum(['NONE', 'REFUND_ESCROW', 'RELEASE_ESCROW', 'FORCE_CANCEL']).optional(),
});

const updateTaskSchema = z
  .object({
    // Keep this focused on image integration while allowing other task fields.
    imageUrls: z.array(z.string().url()).max(3, 'Max 3 images per task').optional(),
    dueDate: z.string().optional(),
    maxBids: z.number().int().min(1).max(100).optional(),
  })
  .passthrough();

module.exports = {
  createTaskSchema,
  listTasksQuerySchema,
  taskIdParamsSchema,
  saveTaskParamsSchema,
  updateTaskStatusSchema,
  createTaskProgressUpdateSchema,
  updateTaskSubtaskStatusSchema,
  assignProviderSchema,
  createDisputeSchema,
  cancelTaskSchema,
  disputeIdParamsSchema,
  adminReviewDisputeSchema,
  updateTaskSchema,
  taskSubtaskParamsSchema,
};

