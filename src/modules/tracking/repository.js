const { prisma } = require('../../database/prisma');

async function createTrackingLog(data) {
  return prisma.trackingLog.create({ data });
}

module.exports = {
  createTrackingLog,
};

