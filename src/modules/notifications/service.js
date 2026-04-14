const notificationRepository = require('./repository');

function normalizeRole(role) {
  return String(role || '').toUpperCase();
}

function buildContactMessage({ providerName, taskTitle }) {
  if (taskTitle) {
    return `A provider wants to contact you regarding your task "${taskTitle}". Provider: ${providerName}.`;
  }
  return `A provider wants to contact you regarding your task. Provider: ${providerName}.`;
}

async function createContactNotification(senderId, payload) {
  const sender = await notificationRepository.findUserById(senderId);
  if (!sender) {
    const err = new Error('Sender user not found');
    err.statusCode = 404;
    throw err;
  }
  if (normalizeRole(sender.role) !== 'PROVIDER') {
    const err = new Error('Only providers can contact clients for tasks');
    err.statusCode = 403;
    throw err;
  }

  const task = await notificationRepository.findTaskById(payload.taskId);
  if (!task) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }

  if (task.createdById === sender.id) {
    const err = new Error('You cannot contact yourself for your own task');
    err.statusCode = 400;
    throw err;
  }

  const recipient = await notificationRepository.findUserById(task.createdById);
  if (!recipient) {
    const err = new Error('Task owner not found');
    err.statusCode = 404;
    throw err;
  }

  const message = buildContactMessage({
    providerName: sender.name,
    taskTitle: task.title,
  });

  const notification = await notificationRepository.createNotification({
    recipientId: task.createdById,
    senderId: sender.id,
    taskId: task.id,
    message,
  });

  return {
    success: true,
    message: 'Contact request sent to client',
    notification,
  };
}

async function listMyNotifications(userId) {
  return notificationRepository.listNotificationsByRecipient(userId);
}

async function markAsRead(userId, notificationId) {
  const notification = await notificationRepository.getNotificationById(notificationId);
  if (!notification) {
    const err = new Error('Notification not found');
    err.statusCode = 404;
    throw err;
  }

  if (notification.recipientId !== userId) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

  return notificationRepository.markNotificationAsRead(notification.id);
}

module.exports = {
  createContactNotification,
  listMyNotifications,
  markAsRead,
};
