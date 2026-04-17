const { prisma } = require('../../database/prisma');

async function getChatUserContext(userId) {
  const [
    user,
    requesterTaskCounts,
    providerTaskCounts,
    savedTasksCount,
    totalNotificationsCount,
    unreadNotificationsCount,
    payerPayments,
    providerPayments,
    recentRequesterTasks,
    recentProviderTasks,
    requesterBudgetAggregates,
    providerBudgetAggregates,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    }),
    prisma.task.groupBy({
      by: ['status'],
      where: {
        createdById: userId,
        isDeleted: false,
      },
      _count: {
        _all: true,
      },
    }),
    prisma.task.groupBy({
      by: ['status'],
      where: {
        assignedProviderId: userId,
        isDeleted: false,
      },
      _count: {
        _all: true,
      },
    }),
    prisma.savedTask.count({
      where: { userId },
    }),
    prisma.notification.count({
      where: { recipientId: userId },
    }),
    prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    }),
    prisma.paymentTransaction.aggregate({
      where: { payerId: userId },
      _count: { _all: true },
      _sum: {
        amount: true,
        totalAmount: true,
        escrowHeldAmount: true,
        platformFeeAmount: true,
      },
    }),
    prisma.paymentTransaction.aggregate({
      where: { providerId: userId },
      _count: { _all: true },
      _sum: {
        amount: true,
        providerPayoutAmount: true,
      },
    }),
    prisma.task.findMany({
      where: {
        createdById: userId,
        isDeleted: false,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        budget: true,
        escrowAmount: true,
        escrowStatus: true,
        paymentStatus: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: 8,
    }),
    prisma.task.findMany({
      where: {
        assignedProviderId: userId,
        isDeleted: false,
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        budget: true,
        escrowAmount: true,
        escrowStatus: true,
        paymentStatus: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: 8,
    }),
    prisma.task.aggregate({
      where: {
        createdById: userId,
        isDeleted: false,
        status: {
          in: ['OPEN', 'BIDDING', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_CONFIRMATION', 'AWAITING_PAYMENT', 'DISPUTED'],
        },
      },
      _sum: {
        budget: true,
        escrowAmount: true,
      },
    }),
    prisma.task.aggregate({
      where: {
        assignedProviderId: userId,
        isDeleted: false,
        status: {
          in: ['ASSIGNED', 'IN_PROGRESS', 'PENDING_CONFIRMATION', 'AWAITING_PAYMENT', 'DISPUTED'],
        },
      },
      _sum: {
        budget: true,
        escrowAmount: true,
      },
    }),
  ]);

  return {
    user,
    requesterTaskCounts,
    providerTaskCounts,
    savedTasksCount,
    totalNotificationsCount,
    unreadNotificationsCount,
    payerPayments,
    providerPayments,
    recentRequesterTasks,
    recentProviderTasks,
    requesterBudgetAggregates,
    providerBudgetAggregates,
  };
}

async function getChatHistoryForUser(userId) {
  const history = await prisma.chatHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    select: {
      role: true,
      content: true,
    },
  });

  return history.map((item) => ({
    role: item.role,
    content: item.content,
  }));
}

async function overwriteChatHistoryForUser(userId, messages = []) {
  await prisma.chatHistory.deleteMany({ where: { userId } });

  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  const createData = messages.map((message) => ({
    userId,
    role: message.role,
    content: message.content,
  }));

  await prisma.chatHistory.createMany({ data: createData });
  return createData;
}

async function clearChatHistoryForUser(userId) {
  await prisma.chatHistory.deleteMany({ where: { userId } });
}

module.exports = {
  getChatUserContext,
  getChatHistoryForUser,
  overwriteChatHistoryForUser,
  clearChatHistoryForUser,
};
