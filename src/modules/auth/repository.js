const { prisma } = require('../../database/prisma');

async function findUserByEmail(email) {
  return prisma.user.findFirst({ where: { email } });
}

async function createUser(data) {
  return prisma.user.create({ data });
}

async function findUserById(id) {
  return prisma.user.findUnique({ where: { id } });
}

async function updateUserLoginState(id, data) {
  return prisma.user.update({ where: { id }, data });
}

module.exports = {
  findUserByEmail,
  createUser,
  findUserById,
  updateUserLoginState,
};


