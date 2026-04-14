const notificationService = require('./service');

async function createContactNotification(req, res, next) {
  try {
    const senderId = req.user?.id;
    if (!senderId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Missing token' });
    }

    const notification = await notificationService.createContactNotification(senderId, req.body);
    return res.status(201).json(notification);
  } catch (err) {
    return next(err);
  }
}

async function getMyNotifications(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Missing token' });
    }

    const notifications = await notificationService.listMyNotifications(userId);
    return res.json(notifications);
  } catch (err) {
    return next(err);
  }
}

async function markNotificationRead(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Missing token' });
    }

    const notificationId = parseInt(req.params.id, 10);
    const notification = await notificationService.markAsRead(userId, notificationId);
    return res.json(notification);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createContactNotification,
  getMyNotifications,
  markNotificationRead,
};
