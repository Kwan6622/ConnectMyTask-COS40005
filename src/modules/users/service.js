const userRepository = require('./repository');

function normalizeRole(role) {
  return String(role || '').toUpperCase();
}

function assertAuthenticated(user) {
  if (!user?.id) {
    const err = new Error('Unauthorized');
    err.statusCode = 401;
    throw err;
  }
}

function assertProvider(user) {
  if (normalizeRole(user?.role) !== 'PROVIDER') {
    const err = new Error('Only providers can perform this action');
    err.statusCode = 403;
    throw err;
  }
}

function assertAdmin(user) {
  if (normalizeRole(user?.role) !== 'ADMIN') {
    const err = new Error('Only admins can perform this action');
    err.statusCode = 403;
    throw err;
  }
}

async function createUser(payload) {
  return userRepository.createUser(payload);
}

async function getUserById(id) {
  const user = await userRepository.getUserById(id);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  let providerRatingSummary = null;
  if (normalizeRole(user.role) === 'PROVIDER') {
    providerRatingSummary = await userRepository.getLatestProviderRatingsSummary(user.id);
  }

  return {
    ...user,
    providerRatingSummary,
  };
}

async function updateProviderProfile(currentUser, payload) {
  assertAuthenticated(currentUser);
  assertProvider(currentUser);
  const nextPayload = {
    ...(Object.prototype.hasOwnProperty.call(payload, 'address') ? { address: payload.address || null } : {}),
    ...(Object.prototype.hasOwnProperty.call(payload, 'district') ? { district: payload.district || null } : {}),
    ...(Object.prototype.hasOwnProperty.call(payload, 'city') ? { city: payload.city || null } : {}),
    ...(Object.prototype.hasOwnProperty.call(payload, 'specialties') ? { specialties: payload.specialties || [] } : {}),
    ...(Object.prototype.hasOwnProperty.call(payload, 'safetyComplianceAgreed')
      ? { safetyComplianceAgreed: Boolean(payload.safetyComplianceAgreed) }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(payload, 'shortBio') ? { shortBio: payload.shortBio || null } : {}),
  };

  return userRepository.upsertProviderProfile(currentUser.id, nextPayload);
}

async function addProviderCertificate(currentUser, payload) {
  assertAuthenticated(currentUser);
  assertProvider(currentUser);
  const profile = await userRepository.upsertProviderProfile(currentUser.id, {});
  return userRepository.createProviderCertificate({
    providerId: currentUser.id,
    providerProfileId: profile.id,
    title: payload.title,
    certificateType: payload.certificateType,
    fileUrl: payload.fileUrl,
    verificationStatus: 'PENDING',
  });
}

async function verifyProviderCertificate(certificateId, payload, currentUser) {
  assertAuthenticated(currentUser);
  assertAdmin(currentUser);
  const cert = await userRepository.getProviderCertificateById(certificateId);
  if (!cert) {
    const err = new Error('Certificate not found');
    err.statusCode = 404;
    throw err;
  }
  if (payload.verificationStatus === 'REJECTED' && !payload.rejectionReason) {
    const err = new Error('rejectionReason is required when rejecting a certificate');
    err.statusCode = 400;
    throw err;
  }
  return userRepository.updateProviderCertificateVerification(certificateId, {
    verificationStatus: payload.verificationStatus,
    rejectionReason: payload.verificationStatus === 'REJECTED' ? payload.rejectionReason : null,
    verifiedAt: new Date(),
    verifiedByAdminId: currentUser.id,
  });
}

async function getProviderRatingSummary(userId) {
  const user = await userRepository.getUserById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  if (normalizeRole(user.role) !== 'PROVIDER') {
    const err = new Error('Target user is not a provider');
    err.statusCode = 400;
    throw err;
  }
  return userRepository.getLatestProviderRatingsSummary(userId);
}

async function updateProfilePhoto(userId, profilePhotoUrl) {
  const user = await userRepository.getUserById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return userRepository.updateProfilePhoto(userId, profilePhotoUrl);
}

module.exports = {
  createUser,
  getUserById,
  updateProfilePhoto,
  updateProviderProfile,
  addProviderCertificate,
  verifyProviderCertificate,
  getProviderRatingSummary,
};
