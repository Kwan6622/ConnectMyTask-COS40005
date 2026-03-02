const { prisma } = require('../../database/prisma');

async function createBid(data) {
  return prisma.bid.create({ data });
}

async function getBidById(id) {
  return prisma.bid.findUnique({
    where: { id },
    include: { task: true, provider: true },
  });
}

async function listBidsForTask(taskId) {
  return prisma.bid.findMany({
    where: { taskId },
    orderBy: { createdAt: 'desc' },
  });
}

async function acceptBid(id) {
  return prisma.$transaction(async (tx) => {
    const bid = await tx.bid.findUnique({ where: { id } });
    if (!bid) {
      const err = new Error('Bid not found');
      err.statusCode = 404;
      throw err;
    }

    // Mark selected bid as ACCEPTED
    const acceptedBid = await tx.bid.update({
      where: { id },
      data: { status: 'ACCEPTED' },
    });

    // Reject all other bids on the same task
    await tx.bid.updateMany({
      where: {
        taskId: bid.taskId,
        id: { not: id },
      },
      data: { status: 'REJECTED' },
    });

    // Assign provider to the task
    await tx.task.update({
      where: { id: bid.taskId },
      data: {
        assignedProviderId: bid.providerId,
        status: 'ASSIGNED',
      },
    });

    return acceptedBid;
  });
}

module.exports = {
  createBid,
  getBidById,
  listBidsForTask,
  acceptBid,
};

