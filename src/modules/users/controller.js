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

module.exports = {
  createUser,
  getUserById,
  updateProfilePhoto,
};

