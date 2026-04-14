const { prisma } = require('../../database/prisma');

const userLiteSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  profilePhotoUrl: true,
};

async function findTaskForRating(taskId) {
  return prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      title: true,
      status: true,
      createdById: true,
      assignedProviderId: true,
    },
  });
}

async function findExistingRating(taskId, fromUserId, toUserId) {
  return prisma.rating.findUnique({
    where: {
      taskId_fromUserId_toUserId: {
        taskId,
        fromUserId,
        toUserId,
      },
    },
  });
}

async function createRating(data) {
  return prisma.rating.create({
    data,
    include: {
      fromUser: { select: userLiteSelect },
      toUser: { select: userLiteSelect },
      task: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  });
}

async function listRatingsForUser(userId) {
  return prisma.rating.findMany({
    where: { toUserId: userId },
    include: {
      fromUser: { select: userLiteSelect },
      task: {
        select: {
          id: true,
          title: true,
          status: true,
          category: true,
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
}

async function getRatingStatsForUser(userId) {
  return prisma.rating.aggregate({
    where: { toUserId: userId },
    _avg: {
      rating: true,
    },
    _count: {
      rating: true,
    },
  });
}

async function listLatestCommentRatingsForUser(userId, limit = 5) {
  return prisma.rating.findMany({
    where: {
      toUserId: userId,
      comment: {
        not: null,
      },
    },
    include: {
      fromUser: { select: userLiteSelect },
      task: {
        select: {
          id: true,
          title: true,
          status: true,
          category: true,
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit,
  });
}

async function updateUserRating(userId, value) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      rating: value,
    },
  });
}

module.exports = {
  findTaskForRating,
  findExistingRating,
  createRating,
  listRatingsForUser,
  getRatingStatsForUser,
  listLatestCommentRatingsForUser,
  updateUserRating,
};
