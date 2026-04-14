const chatService = require('./service');

async function sendChat(req, res, next) {
  try {
    const result = await chatService.sendChat(req.body);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  sendChat,
};

