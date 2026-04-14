const { env } = require('../../config/env');

const CONNECTMYTASK_SYSTEM_PROMPT =
  'You are the ConnectMyTask AI Assistant. You help users understand and use the ConnectMyTask platform, including task posting, bidding, requester/provider workflows, task progress, saved tasks, notifications, and payment flow. Keep answers concise, friendly, and helpful. If a question is outside the platform domain, politely say that you can only help with ConnectMyTask-related support.';

function toGeminiContents(payload) {
  const safeHistory = Array.isArray(payload.history) ? payload.history : [];

  // Keep only the latest turns to keep latency/cost stable.
  const recentHistory = safeHistory.slice(-10);

  return [
    ...recentHistory.map((item) => ({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: item.content }],
    })),
    {
      role: 'user',
      parts: [{ text: payload.message }],
    },
  ];
}

async function requestAssistantReply(contents) {
  if (!env.GEMINI_API_KEY) {
    const err = new Error('Gemini is not configured. Missing GEMINI_API_KEY');
    err.statusCode = 500;
    throw err;
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.GEMINI_MODEL)}:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: CONNECTMYTASK_SYSTEM_PROMPT }],
        },
        contents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 300,
        },
      }),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Keep provider details in server log, but return a stable friendly message to clients.
    // eslint-disable-next-line no-console
    console.warn('[chat] Gemini request failed:', data?.error?.message || response.statusText);
    const err = new Error('AI assistant is temporarily unavailable. Please try again shortly.');
    err.statusCode = 502;
    throw err;
  }

  const parts = Array.isArray(data?.candidates?.[0]?.content?.parts)
    ? data.candidates[0].content.parts
    : [];
  const reply = parts
    .map((part) => String(part?.text || '').trim())
    .filter(Boolean)
    .join('\n')
    .trim();

  if (!reply) {
    const err = new Error('Gemini returned an empty response');
    err.statusCode = 502;
    throw err;
  }

  return reply;
}

async function sendChat(payload) {
  const contents = toGeminiContents(payload);
  const reply = await requestAssistantReply(contents);

  return {
    reply,
  };
}

module.exports = {
  sendChat,
};
