const { z } = require('zod');

const chatHistoryItemSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(2000),
});

const sendChatSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  history: z.array(chatHistoryItemSchema).max(12).optional(),
});

module.exports = {
  sendChatSchema,
};

