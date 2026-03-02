const trackingRepository = require('./repository');

async function recordLocationUpdate(payload) {
  const timestamp =
    typeof payload.timestamp === 'number'
      ? new Date(payload.timestamp)
      : new Date(payload.timestamp);

  if (Number.isNaN(timestamp.getTime())) {
    const err = new Error('Invalid timestamp');
    err.statusCode = 400;
    throw err;
  }

  return trackingRepository.createTrackingLog({
    taskId: payload.taskId,
    providerId: payload.providerId,
    lat: payload.lat,
    lng: payload.lng,
    timestamp,
  });
}

module.exports = {
  recordLocationUpdate,
};

