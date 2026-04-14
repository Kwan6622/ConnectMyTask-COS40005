const platformService = require('./service');

async function getPlatformStats(req, res, next) {
  try {
    const stats = await platformService.getPlatformStats();
    return res.json(stats);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getPlatformStats,
};
