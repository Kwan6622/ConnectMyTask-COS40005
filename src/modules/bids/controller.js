const bidsService = require('./service');

async function createBid(req, res, next) {
  try {
    const taskId = parseInt(req.params.id, 10);
    const bid = await bidsService.createBid(taskId, req.body, req.user);
    res.status(201).json(bid);
  } catch (err) {
    next(err);
  }
}

async function listBidsForTask(req, res, next) {
  try {
    const taskId = parseInt(req.params.id, 10);
    const bids = await bidsService.listBidsForTask(taskId, req.user);
    res.json(bids);
  } catch (err) {
    next(err);
  }
}

async function listMyProviderBids(req, res, next) {
  try {
    const providerId = req.user?.id;
    if (!providerId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Missing token' });
    }
    const bids = await bidsService.listBidsForProvider(providerId, req.user);
    return res.json(bids);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createBid,
  listBidsForTask,
  listMyProviderBids,
};

