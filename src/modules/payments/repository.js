const { prisma } = require('../../database/prisma');

async function getTaskById(taskId) {
  return prisma.task.findUnique({
    where: { id: taskId },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true, role: true },
      },
      assignedProvider: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });
}

async function createPaymentTransaction(data) {
  return prisma.paymentTransaction.create({
    data,
    include: {
      task: {
        select: {
          id: true,
          title: true,
          status: true,
          escrowStatus: true,
          paymentStatus: true,
          budget: true,
        },
      },
    },
  });
}

async function getPaymentByCheckoutSessionId(checkoutSessionId) {
  return prisma.paymentTransaction.findFirst({
    where: { checkoutSessionId },
  });
}

async function updatePaymentStatus(id, data) {
  return prisma.paymentTransaction.update({
    where: { id },
    data,
  });
}

async function updateTaskState(taskId, data) {
  return prisma.task.update({
    where: { id: taskId },
    data,
  });
}

async function listPaymentsByPayer(payerId) {
  return prisma.paymentTransaction.findMany({
    where: { payerId },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          status: true,
          paymentStatus: true,
          escrowStatus: true,
          budget: true,
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

async function listPaymentsByTask(taskId) {
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

async function findLatestSuccessfulEscrowDeposit(taskId) {
  return prisma.paymentTransaction.findFirst({
    where: {
      taskId,
      type: 'ESCROW_DEPOSIT',
      status: 'SUCCESS',
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
}

async function findSuccessfulEscrowRelease(taskId) {
  return prisma.paymentTransaction.findFirst({
    where: {
      taskId,
      type: 'ESCROW_RELEASE',
      status: 'SUCCESS',
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
}

async function createTaskActivity(data) {
  return prisma.taskActivityLog.create({ data });
}

module.exports = {
  getTaskById,
  createPaymentTransaction,
  getPaymentByCheckoutSessionId,
  updatePaymentStatus,
  updateTaskState,
  listPaymentsByPayer,
  listPaymentsByTask,
  findLatestSuccessfulEscrowDeposit,
  findSuccessfulEscrowRelease,
  createTaskActivity,
};
