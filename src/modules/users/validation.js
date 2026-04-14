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

const updateProviderProfileSchema = z.object({
  address: z.string().trim().min(3).max(200).optional(),
  district: z.string().trim().min(2).max(80).optional(),
  city: z.string().trim().min(2).max(80).optional(),
  specialties: z.array(z.string().trim().min(2).max(40)).max(12).optional(),
  safetyComplianceAgreed: z.boolean().optional(),
  shortBio: z.string().trim().max(500).optional(),
});

const createProviderCertificateSchema = z.object({
  title: z.string().trim().min(3).max(160),
  certificateType: z.string().trim().min(2).max(80),
  fileUrl: z.string().url(),
});

const certificateIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/),
});

const verifyProviderCertificateSchema = z.object({
  verificationStatus: z.enum(['VERIFIED', 'REJECTED']),
  rejectionReason: z.string().trim().max(300).optional(),
});

module.exports = {
  createUserSchema,
  getUserParamsSchema,
  updateProfilePhotoSchema,
  updateProviderProfileSchema,
  createProviderCertificateSchema,
  certificateIdParamsSchema,
  verifyProviderCertificateSchema,
};

