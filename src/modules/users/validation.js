const { z } = require('zod');

const createUserSchema = z.object({
  name: z.string().min(1),
  role: z.enum(['REQUESTER', 'PROVIDER']),
  skills: z.string().optional(),
});

const getUserParamsSchema = z.object({
  id: z.string().regex(/^\d+$/),
});

const updateProfilePhotoSchema = z.object({
  profilePhotoUrl: z.string().url(),
});

module.exports = {
  createUserSchema,
  getUserParamsSchema,
  updateProfilePhotoSchema,
};

