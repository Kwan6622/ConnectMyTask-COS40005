const { prisma } = require('../../database/prisma');

async function getTaskById(id) {
  return prisma.task.findUnique({
    where: { id },
    include: {
      createdBy: true,
      assignedProvider: true,
    },
  });
}

async function createAiInsight(data) {
  return prisma.aiInsight.create({ data });
}

module.exports = {
  getTaskById,
  createAiInsight,
};

