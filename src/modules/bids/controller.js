const bidsService = require('./service');

async function createBid(req, res, next) {
  try {
    const bid = await bidsService.createBid(req.body);
    res.status(201).json(bid);
  } catch (err) {
    next(err);
  }
}

async function listBidsForTask(req, res, next) {
  try {
    const taskId = parseInt(req.params.id, 10);
    const bids = await bidsService.listBidsForTask(taskId);
    res.json(bids);
  } catch (err) {
    next(err);
  }
}

async function acceptBid(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const bid = await bidsService.acceptBid(id);
    res.json(bid);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createBid,
  listBidsForTask,
  acceptBid,
};

