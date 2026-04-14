const { prisma } = require('../../database/prisma');

async function createBid(data) {
  return prisma.bid.create({
    data,
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profilePhotoUrl: true,
          skills: true,
        },
      },
    },
  });
}

async function getTaskById(id) {
  return prisma.task.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          role: true,
          profilePhotoUrl: true,
        },
      },
      _count: {
        select: { bids: true },
      },
    },
  });
}

async function listBidsForTask(taskId) {
  return prisma.bid.findMany({
    where: { taskId },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profilePhotoUrl: true,
          skills: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function listBidsForProvider(providerId) {
  return prisma.bid.findMany({
    where: { providerId },
    include: {
      task: {
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function updateTaskStatus(taskId, status) {
  return prisma.task.update({
    where: { id: taskId },
    data: { status },
  });
}

async function markTaskAsBidding(taskId, biddingStartedAt, biddingEndsAt) {
  return prisma.task.update({
    where: { id: taskId },
    data: {
      status: 'BIDDING',
      biddingStartedAt,
      biddingEndsAt,
    },
  });
}

module.exports = {
  createBid,
  getTaskById,
  listBidsForTask,
  listBidsForProvider,
  updateTaskStatus,
  markTaskAsBidding,
};
