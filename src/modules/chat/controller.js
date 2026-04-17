const chatService = require('./service');

async function sendChat(req, res, next) {
  try {
    const result = await chatService.sendChat(req.body, req.user);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

async function getChatHistory(req, res, next) {
  try {
    const history = await chatService.getChatHistory(req.user.id);
    return res.json(history);
  } catch (err) {
    return next(err);
  }
}

async function clearChatHistory(req, res, next) {
  try {
    await chatService.clearChatHistory(req.user.id);
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  sendChat,
  getChatHistory,
  clearChatHistory,
};
