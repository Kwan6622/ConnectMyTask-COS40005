const userService = require('./service');

async function createUser(req, res, next) {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

async function getUserById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const user = await userService.getUserById(id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function updateProfilePhoto(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Missing token' });
    }
    const { profilePhotoUrl } = req.body;
    const user = await userService.updateProfilePhoto(userId, profilePhotoUrl);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

async function updateProviderProfile(req, res, next) {
  try {
    const profile = await userService.updateProviderProfile(req.user, req.body);
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

async function addProviderCertificate(req, res, next) {
  try {
    const certificate = await userService.addProviderCertificate(req.user, req.body);
    res.status(201).json(certificate);
  } catch (err) {
    next(err);
  }
}

async function verifyProviderCertificate(req, res, next) {
  try {
    const certificateId = parseInt(req.params.id, 10);
    const certificate = await userService.verifyProviderCertificate(certificateId, req.body, req.user);
    res.json(certificate);
  } catch (err) {
    next(err);
  }
}

async function getProviderRatingSummary(req, res, next) {
  try {
    const userId = parseInt(req.params.id, 10);
    const summary = await userService.getProviderRatingSummary(userId);
    res.json(summary);
  } catch (err) {
    next(err);
  }
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

