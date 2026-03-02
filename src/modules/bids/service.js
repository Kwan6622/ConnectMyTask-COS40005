const bidsRepository = require('./repository');

async function createBid(payload) {
  return bidsRepository.createBid(payload);
}

async function listBidsForTask(taskId) {
  return bidsRepository.listBidsForTask(taskId);
}

async function acceptBid(id) {
  return bidsRepository.acceptBid(id);
}

module.exports = {
  createBid,
  listBidsForTask,
  acceptBid,
};

