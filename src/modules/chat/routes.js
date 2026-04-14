const express = require('express');
const { createValidationMiddleware } = require('../../shared/validation/validateRequest');
const { sendChatSchema } = require('./validation');
const chatController = require('./controller');

const router = express.Router();

// POST /chat
router.post(
  '/',
  createValidationMiddleware({ body: sendChatSchema }),
  chatController.sendChat
);

module.exports = router;

