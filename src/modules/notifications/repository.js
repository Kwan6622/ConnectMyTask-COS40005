const { prisma } = require('../../database/prisma');

async function findUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      role: true,
    },
  });
}

async function findTaskById(id) {
  return prisma.task.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      createdById: true,
    },
  });
}

async function createNotification(data) {
  return prisma.notification.create({
    data,
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          skills: true,
          profilePhotoUrl: true,
        },
      },
      task: {
        select: { id: true, title: true },
      },
    },
  });
}

async function listNotificationsByRecipient(recipientId) {
  return prisma.notification.findMany({
    where: { recipientId },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          skills: true,
          profilePhotoUrl: true,
        },
      },
      task: {
        select: { id: true, title: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function getNotificationById(id) {
  return prisma.notification.findUnique({
    where: { id },
  });
}

async function markNotificationAsRead(id) {
  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
}

module.exports = {
  findUserById,
  findTaskById,
  createNotification,
  listNotificationsByRecipient,
  getNotificationById,
  markNotificationAsRead,
};
