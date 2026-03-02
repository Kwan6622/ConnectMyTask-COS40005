const { prisma } = require('../../database/prisma');

async function createReview(data) {
  return prisma.review.create({ data });
}

async function getReviewsForProvider(providerId) {
  return prisma.review.findMany({
    where: {
      task: {
        assignedProviderId: providerId,
      },
    },
    include: {
      task: true,
      reviewer: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

module.exports = {
  createReview,
  getReviewsForProvider,
};

