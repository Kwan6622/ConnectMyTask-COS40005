const { prisma } = require('../../database/prisma');

const requesterSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  profilePhotoUrl: true,
  rating: true,
};

const providerSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  profilePhotoUrl: true,
  skills: true,
  providerProfile: {
    select: {
      district: true,
      city: true,
      specialties: true,
      safetyComplianceAgreed: true,
      certificates: {
        select: {
          id: true,
          title: true,
          fileUrl: true,
          certificateType: true,
          verificationStatus: true,
        },
        orderBy: [{ uploadedAt: 'desc' }, { id: 'desc' }],
      },
    },
  },
};

const activityActorSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  profilePhotoUrl: true,
};

async function createTask(data) {
  return prisma.task.create({ data });
}

async function listTasks(filters) {
  const where = { isDeleted: false };
  if (filters.status) {
    where.status = filters.status;
  } else {
    where.status = {
      notIn: ['COMPLETED', 'PAID', 'CANCELLED'],
    };
  }
  if (filters.category) {
    where.category = filters.category;
  }

  return prisma.task.findMany({
    where,
    include: {
      createdBy: { select: requesterSelect },
      assignedProvider: { select: providerSelect },
      _count: {
        select: {
          bids: true,
          disputes: true,
        },
      },
      progressUpdates: {
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 1,
        select: {
          id: true,
          progressPercent: true,
          milestoneStatus: true,
          estimatedCompletionDate: true,
          createdAt: true,
        },
      },
      subtasks: {
        orderBy: [{ order: 'asc' }, { id: 'asc' }],
      },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
}

async function getProviderProfileByUserId(userId) {
  return prisma.providerProfile.findUnique({
    where: { userId },
    select: {
      userId: true,
      district: true,
      city: true,
      specialties: true,
      safetyComplianceAgreed: true,
    },
  });
}

async function getTaskById(id) {
  return prisma.task.findFirst({
    where: { id, isDeleted: false },
    include: {
      createdBy: { select: requesterSelect },
      assignedProvider: { select: providerSelect },
      bids: {
        include: {
          provider: { select: providerSelect },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      },
      reviews: true,
      trackingLogs: { orderBy: { timestamp: 'desc' }, take: 1 },
      _count: {
        select: {
          bids: true,
          disputes: true,
        },
      },
      progressUpdates: {
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 1,
        select: {
          id: true,
          progressPercent: true,
          milestoneStatus: true,
          estimatedCompletionDate: true,
          createdAt: true,
        },
      },
      subtasks: {
        orderBy: [{ order: 'asc' }, { id: 'asc' }],
      },
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

async function saveTaskForUser(userId, taskId) {
  return prisma.savedTask.upsert({
    where: {
      userId_taskId: { userId, taskId },
    },
    update: {},
    create: {
      userId,
      taskId,
    },
    include: {
      task: {
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              profilePhotoUrl: true,
            },
          },
        },
      },
    },
  });
}

async function unsaveTaskForUser(userId, taskId) {
  const result = await prisma.savedTask.deleteMany({
    where: {
      userId,
      taskId,
    },
  });

  return result.count;
}

async function listSavedTasksForUser(userId) {
  return prisma.savedTask.findMany({
    where: { userId },
    include: {
      task: {
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              profilePhotoUrl: true,
            },
          },
          assignedProvider: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function listTasksByRequester(userId) {
  return prisma.task.findMany({
    where: { createdById: userId, isDeleted: false },
    include: {
      assignedProvider: { select: providerSelect },
      _count: {
        select: {
          bids: true,
          disputes: true,
        },
      },
      progressUpdates: {
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 1,
        select: {
          id: true,
          progressPercent: true,
          milestoneStatus: true,
          estimatedCompletionDate: true,
          createdAt: true,
        },
      },
      subtasks: {
        orderBy: [{ order: 'asc' }, { id: 'asc' }],
      },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
}

async function listAssignedTasksForProvider(providerId) {
  return prisma.task.findMany({
    where: { assignedProviderId: providerId, isDeleted: false },
    include: {
      createdBy: { select: requesterSelect },
      _count: {
        select: {
          bids: true,
          disputes: true,
        },
      },
      progressUpdates: {
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 1,
        select: {
          id: true,
          progressPercent: true,
          milestoneStatus: true,
          estimatedCompletionDate: true,
          createdAt: true,
        },
      },
      subtasks: {
        orderBy: [{ order: 'asc' }, { id: 'asc' }],
      },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
}

async function listProgressUpdatesForTask(taskId) {
  return prisma.taskProgressUpdate.findMany({
    where: { taskId },
    include: {
      provider: { select: providerSelect },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
}

async function createTaskProgressUpdate(data) {
  return prisma.taskProgressUpdate.create({
    data,
    include: {
      provider: { select: providerSelect },
    },
  });
}

async function countProgressUpdatesForTask(taskId) {
  return prisma.taskProgressUpdate.count({
    where: { taskId },
  });
}

async function createSubtasksForTask(taskId, subtasks) {
  if (!Array.isArray(subtasks) || subtasks.length === 0) return;
  await prisma.taskSubtask.createMany({
    data: subtasks.map((item) => ({
      taskId,
      title: item.title,
      order: item.order,
      progressPercent: item.progressPercent,
      status: item.status || 'PENDING',
    })),
  });
}

async function listSubtasksForTask(taskId) {
  return prisma.taskSubtask.findMany({
    where: { taskId },
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
  });
}

async function updateSubtaskStatus(taskId, subtaskId, status) {
  return prisma.taskSubtask.updateMany({
    where: {
      id: subtaskId,
      taskId,
    },
    data: { status },
  });
}

async function getSubtaskById(taskId, subtaskId) {
  return prisma.taskSubtask.findFirst({
    where: {
      id: subtaskId,
      taskId,
    },
  });
}

async function assignProviderFromBid(taskId, bidId) {
  return prisma.$transaction(async (tx) => {
    const task = await tx.task.findUnique({ where: { id: taskId } });
    if (!task) {
      const err = new Error('Task not found');
      err.statusCode = 404;
      throw err;
    }

    const bid = await tx.bid.findUnique({ where: { id: bidId } });
    if (!bid || bid.taskId !== taskId) {
      const err = new Error('Bid not found for this task');
      err.statusCode = 404;
      throw err;
    }

    const acceptedBid = await tx.bid.update({
      where: { id: bidId },
      data: { status: 'ACCEPTED' },
    });

    await tx.bid.updateMany({
      where: {
        taskId,
        id: { not: bidId },
      },
      data: { status: 'REJECTED' },
    });

    await tx.task.update({
      where: { id: taskId },
      data: {
        assignedProviderId: acceptedBid.providerId,
        status: 'ASSIGNED',
        biddingEndsAt: new Date(),
        escrowStatus: 'PENDING_DEPOSIT',
        paymentStatus: 'ESCROW_PENDING',
        escrowAmount: acceptedBid.price != null ? acceptedBid.price : task.budget,
        escrowHeldAt: null,
        escrowReleasedAt: null,
      },
    });

    return acceptedBid;
  });
}

async function listExpiredBiddingTasks(now) {
  return prisma.task.findMany({
    where: {
      isDeleted: false,
      status: 'BIDDING',
      assignedProviderId: null,
      biddingEndsAt: {
        not: null,
        lte: now,
      },
    },
    include: {
      bids: {
        where: { status: 'PENDING' },
        include: {
          provider: {
            select: {
              id: true,
              rating: true,
            },
          },
        },
        orderBy: [{ price: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      },
    },
  });
}

async function getProviderRatingStats(providerIds) {
  if (!providerIds.length) return [];
  return prisma.rating.groupBy({
    by: ['toUserId'],
    where: {
      toUserId: { in: providerIds },
    },
    _avg: {
      rating: true,
    },
    _count: {
      rating: true,
    },
  });
}

async function autoAssignProviderFromBid(taskId, bidId) {
  return prisma.$transaction(async (tx) => {
    const task = await tx.task.findUnique({ where: { id: taskId } });
    if (!task) return null;
    if (task.assignedProviderId || task.status !== 'BIDDING') return null;

    const bid = await tx.bid.findUnique({ where: { id: bidId } });
    if (!bid || bid.taskId !== taskId) return null;

    const acceptedBid = await tx.bid.update({
      where: { id: bidId },
      data: { status: 'ACCEPTED' },
    });

    await tx.bid.updateMany({
      where: {
        taskId,
        id: { not: bidId },
        status: 'PENDING',
      },
      data: { status: 'REJECTED' },
    });

    await tx.task.update({
      where: { id: taskId },
      data: {
        assignedProviderId: acceptedBid.providerId,
        status: 'ASSIGNED',
        biddingEndsAt: new Date(),
        escrowStatus: 'PENDING_DEPOSIT',
        paymentStatus: 'ESCROW_PENDING',
        escrowAmount: acceptedBid.price != null ? acceptedBid.price : task.budget,
        escrowHeldAt: null,
        escrowReleasedAt: null,
      },
    });

    return acceptedBid;
  });
}

async function listPaymentTransactionsForTask(taskId) {
  return prisma.paymentTransaction.findMany({
    where: { taskId },
    include: {
      payer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      provider: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
}

async function getLatestSuccessfulEscrowDeposit(taskId) {
  return prisma.paymentTransaction.findFirst({
    where: {
      taskId,
      type: 'ESCROW_DEPOSIT',
      status: 'SUCCESS',
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
}

async function createDispute(data) {
  return prisma.dispute.create({
    data,
    include: {
      openedBy: { select: activityActorSelect },
      resolvedBy: { select: activityActorSelect },
    },
  });
}

async function listDisputesForTask(taskId) {
  return prisma.dispute.findMany({
    where: { taskId },
    include: {
      openedBy: { select: activityActorSelect },
      resolvedBy: { select: activityActorSelect },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
}

async function listAllDisputes() {
  return prisma.dispute.findMany({
    include: {
      task: {
        select: {
          id: true,
          title: true,
          status: true,
          escrowStatus: true,
          paymentStatus: true,
        },
      },
      openedBy: { select: activityActorSelect },
      resolvedBy: { select: activityActorSelect },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
}

async function findDisputeById(disputeId) {
  return prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      task: true,
      openedBy: { select: activityActorSelect },
      resolvedBy: { select: activityActorSelect },
    },
  });
}

async function updateDispute(disputeId, data) {
  return prisma.dispute.update({
    where: { id: disputeId },
    data,
    include: {
      task: {
        select: {
          id: true,
          title: true,
          status: true,
          escrowStatus: true,
          paymentStatus: true,
        },
      },
      openedBy: { select: activityActorSelect },
      resolvedBy: { select: activityActorSelect },
    },
  });
}

async function createTaskActivity(data) {
  return prisma.taskActivityLog.create({
    data,
    include: {
      actor: { select: activityActorSelect },
    },
  });
}

async function listTaskActivity(taskId, limit = 100) {
  return prisma.taskActivityLog.findMany({
    where: { taskId },
    include: {
      actor: { select: activityActorSelect },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit,
  });
}

module.exports = {
  createTask,
  listTasks,
  getProviderProfileByUserId,
  getTaskById,
  updateTaskStatus,
  updateTask,
  saveTaskForUser,
  unsaveTaskForUser,
  listSavedTasksForUser,
  listTasksByRequester,
  listAssignedTasksForProvider,
  listProgressUpdatesForTask,
  createTaskProgressUpdate,
  countProgressUpdatesForTask,
  createSubtasksForTask,
  listSubtasksForTask,
  updateSubtaskStatus,
  getSubtaskById,
  assignProviderFromBid,
  listExpiredBiddingTasks,
  getProviderRatingStats,
  autoAssignProviderFromBid,
  listPaymentTransactionsForTask,
  getLatestSuccessfulEscrowDeposit,
  createDispute,
  listDisputesForTask,
  listAllDisputes,
  findDisputeById,
  updateDispute,
  createTaskActivity,
  listTaskActivity,
};
