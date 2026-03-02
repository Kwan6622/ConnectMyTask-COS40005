const { prisma } = require('../../database/prisma');

async function createTask(data) {
  return prisma.task.create({ data });
}

async function listTasks(filters) {
  const where = {};
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.category) {
    where.category = filters.category;
  }
  return prisma.task.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

async function getTaskById(id) {
  return prisma.task.findUnique({
    where: { id },
    include: {
      bids: true,
      reviews: true,
      trackingLogs: { orderBy: { timestamp: 'desc' }, take: 1 },
    },
  });
}

async function updateTaskStatus(id, status) {
  return prisma.task.update({
    where: { id },
    data: { status },
  });
}

async function updateTask(id, data) {
  return prisma.task.update({
    where: { id },
    data,
  });
}

module.exports = {
  createTask,
  listTasks,
  getTaskById,
  updateTaskStatus,
  updateTask,
};

