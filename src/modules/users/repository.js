const { prisma } = require('../../database/prisma');

async function createUser(data) {
  return prisma.user.create({ data });
}

async function getUserById(id) {
  return prisma.user.findUnique({ where: { id } });
}

async function updateProfilePhoto(id, profilePhotoUrl) {
  return prisma.user.update({
    where: { id },
    data: { profilePhotoUrl },
  });
}

module.exports = {
  createUser,
  getUserById,
  updateProfilePhoto,
};

