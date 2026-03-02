const trackingService = require('./service');
const { getIO } = require('../../shared/socket');

async function trackingUpdate(req, res, next) {
  try {
    const log = await trackingService.recordLocationUpdate(req.body);

    // Broadcast real-time update via Socket.io
    try {
      const io = getIO();
      io.emit('location:update', {
        taskId: log.taskId,
        providerId: log.providerId,
        lat: log.lat,
        lng: log.lng,
        timestamp: log.timestamp,
      });
    } catch (socketErr) {
      // eslint-disable-next-line no-console
      console.error('Failed to emit Socket.io location:update', socketErr);
    }

    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  trackingUpdate,
};

