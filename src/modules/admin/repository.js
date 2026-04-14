const { prisma } = require('../../database/prisma');

async function getAdminStats() {
  const [totalUsers, activeTasks, suspiciousTasks, disputes, pendingCertificates, paymentAgg] = await Promise.all([
    prisma.user.count(),
    prisma.task.count({
      where: {
        isDeleted: false,
        status: {
          in: ['OPEN', 'BIDDING', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_CONFIRMATION'],
        },
      },
    }),
    prisma.task.count({
      where: {
        isDeleted: false,
        isSuspicious: true,
      },
    }),
    prisma.dispute.count({
      where: {
        status: {
          in: ['OPEN', 'UNDER_REVIEW'],
        },
      },
    }),
    prisma.providerCertificate.count({
      where: {
        verificationStatus: 'PENDING',
      },
    }),
    prisma.paymentTransaction.aggregate({
      _sum: {
        escrowHeldAmount: true,
        providerPayoutAmount: true,
        platformFeeAmount: true,
      },
      where: {
        status: {
          in: ['SUCCESS', 'REFUNDED'],
        },
      },
    }),
  ]);

  const escrowHeldPayments = await prisma.paymentTransaction.count({
    where: {
      lifecycleStatus: 'ESCROW_HELD',
    },
  });

  return {
    totalUsers,
    activeTasks,
    suspiciousTasks,
    disputes,
    pendingCertificates,
    escrowHeldPayments,
    totalEscrowHeldAmount: Number(paymentAgg?._sum?.escrowHeldAmount || 0),
    totalReleasedPayments: Number(paymentAgg?._sum?.providerPayoutAmount || 0),
    totalPlatformRevenue: Number(paymentAgg?._sum?.platformFeeAmount || 0),
  };
}

async function listAdminTasks({ suspiciousOnly = false } = {}) {
  return prisma.task.findMany({
    where: {
      ...(suspiciousOnly ? { isSuspicious: true } : {}),
      isDeleted: false,
    },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
      assignedProvider: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: {
          bids: true,
        },
      },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
}

async function softDeleteTask(taskId, adminId) {
  return prisma.task.update({
    where: { id: taskId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      reviewedByAdminAt: new Date(),
      reviewedByAdminId: adminId,
      status: 'CANCELLED',
    },
  });
}

async function markTaskReviewed(taskId, adminId) {
  return prisma.task.update({
    where: { id: taskId },
    data: {
      reviewedByAdminAt: new Date(),
      reviewedByAdminId: adminId,
    },
  });
}

async function listCertificates() {
  return prisma.providerCertificate.findMany({
    include: {
      provider: {
        select: { id: true, name: true, email: true },
      },
      verifiedByAdmin: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: [{ uploadedAt: 'desc' }, { id: 'desc' }],
  });
}

async function verifyCertificate(certificateId, adminId, status) {
  return prisma.providerCertificate.update({
    where: { id: certificateId },
    data: {
      verificationStatus: status,
      verifiedAt: new Date(),
      verifiedByAdminId: adminId,
      rejectionReason: status === 'REJECTED' ? 'Rejected by admin review.' : null,
    },
  });
}

async function listPayments(filters = {}) {
  const where = {};
  if (filters.lifecycleStatus) {
    where.lifecycleStatus = filters.lifecycleStatus;
  }

  return prisma.paymentTransaction.findMany({
    where,
    include: {
      task: {
        select: {
          id: true,
          title: true,
          status: true,
          createdById: true,
          assignedProviderId: true,
        },
      },
      payer: {
        select: { id: true, name: true, email: true },
      },
      provider: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
}

async function getPaymentById(id) {
  return prisma.paymentTransaction.findUnique({
    where: { id },
    include: {
      task: true,
      payer: { select: { id: true, name: true, email: true } },
      provider: { select: { id: true, name: true, email: true } },
    },
  });
}

async function updatePaymentTransaction(id, data) {
  return prisma.paymentTransaction.update({
    where: { id },
    data,
  });
}

async function updateTaskById(taskId, data) {
  return prisma.task.update({
    where: { id: taskId },
    data,
  });
}

module.exports = {
  getAdminStats,
  listAdminTasks,
  softDeleteTask,
  markTaskReviewed,
  listCertificates,
  verifyCertificate,
  listPayments,
  getPaymentById,
  updatePaymentTransaction,
  updateTaskById,
};
