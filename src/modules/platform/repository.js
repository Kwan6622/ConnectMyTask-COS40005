const { prisma } = require('../../database/prisma');

async function countActiveProvidersSince(sinceDate) {
  return prisma.user.count({
    where: {
      role: { in: ['PROVIDER'] },
      OR: [
        { bids: { some: { createdAt: { gte: sinceDate } } } },
        { tasksAssigned: { some: { updatedAt: { gte: sinceDate }, isDeleted: false } } },
        { progressUpdates: { some: { createdAt: { gte: sinceDate } } } },
      ],
    },
  });
}

async function countAllProviders() {
  return prisma.user.count({ where: { role: { in: ['PROVIDER'] } } });
}

async function getFirstBidTimesSince(sinceDate) {
  return prisma.bid.groupBy({
    by: ['taskId'],
    where: {
      task: {
        isDeleted: false,
        createdAt: { gte: sinceDate },
      },
    },
    _min: {
      createdAt: true,
    },
  });
}

async function getTaskCreatedAtByIds(taskIds) {
  if (!taskIds.length) return [];
  return prisma.task.findMany({
    where: {
      id: { in: taskIds },
      isDeleted: false,
    },
    select: {
      id: true,
      createdAt: true,
    },
  });
}

async function countSuccessRateWindow(sinceDate) {
  const statusReachedAssigned = [
    'ASSIGNED',
    'IN_PROGRESS',
    'PENDING_CONFIRMATION',
    'COMPLETED',
    'AWAITING_PAYMENT',
    'PAID',
    'DISPUTED',
    'CANCELLED',
  ];

  const completedStatuses = ['COMPLETED', 'AWAITING_PAYMENT', 'PAID'];

  const [denominator, numerator] = await Promise.all([
    prisma.task.count({
      where: {
        isDeleted: false,
        createdAt: { gte: sinceDate },
        status: { in: statusReachedAssigned },
      },
    }),
    prisma.task.count({
      where: {
        isDeleted: false,
        createdAt: { gte: sinceDate },
        status: { in: completedStatuses },
      },
    }),
  ]);

  return { denominator, numerator };
}

module.exports = {
  countActiveProvidersSince,
  countAllProviders,
  getFirstBidTimesSince,
  getTaskCreatedAtByIds,
  countSuccessRateWindow,
};
