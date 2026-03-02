const userRepository = require('./repository');

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
  return user;
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
};

