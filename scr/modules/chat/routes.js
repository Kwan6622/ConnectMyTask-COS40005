const express = require('express');
const { createValidationMiddleware } = require('../../shared/validation/validateRequest');
const { authenticate } = require('../../shared/middlewares/auth');
const { sendChatSchema } = require('./validation');
const chatController = require('./controller');

const router = express.Router();

// POST /chat
router.post(
  '/',
  authenticate,
  createValidationMiddleware({ body: sendChatSchema }),
  chatController.sendChat
);

// GET /chat/history
router.get('/history', authenticate, chatController.getChatHistory);

// DELETE /chat/history
router.delete('/history', authenticate, chatController.clearChatHistory);

module.exports = router;
