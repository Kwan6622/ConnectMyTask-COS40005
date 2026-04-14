const aiService = require('./service');

async function recommendForTask(req, res, next) {
  try {
    const taskId = parseInt(req.params.taskId, 10);
    const result = await aiService.recommendForTask(taskId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function predictPrice(req, res, next) {
  try {
    const result = await aiService.predictPriceFromPayload(req.body || {});
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  recommendForTask,
  predictPrice,
};

