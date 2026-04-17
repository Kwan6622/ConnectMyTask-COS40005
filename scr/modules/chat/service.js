const { env } = require('../../config/env');
const chatRepository = require('./repository');

const CONNECTMYTASK_SYSTEM_PROMPT = `
You are the ConnectMyTask AI Assistant.
You help users understand and use the ConnectMyTask platform, including task posting, bidding, requester/provider workflows, task progress, saved tasks, notifications, and payment flow.
Keep answers concise, friendly, and helpful.

Privacy and access rules:
- You may use ONLY the CURRENT AUTHENTICATED USER CONTEXT provided by the server.
- Never claim to access, estimate, compare, reveal, or discuss private information about any other user.
- If the user asks about another person's account, tasks, money, profile, or activity, refuse briefly and explain you can only help with their own account data.
- If the answer is not present in the provided current-user context, say you do not have that information.
- Do not invent counts, balances, names, or statuses.
- Treat requester and provider data as scoped only to the authenticated user.
`.trim();

const COMPLETED_TASK_STATUSES = ['COMPLETED', 'PAID'];
const PENDING_TASK_STATUSES = ['PENDING', 'OPEN', 'BIDDING', 'ASSIGNED', 'IN_PROGRESS', 'PENDING_CONFIRMATION', 'AWAITING_PAYMENT', 'DISPUTED'];

function toGeminiContents(payload) {
  const safeHistory = Array.isArray(payload.history) ? payload.history : [];

  // Keep only the latest turns to keep latency/cost stable.
  const recentHistory = safeHistory.slice(-12);

  const contents = recentHistory.map((item) => ({
    role: item.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: item.content }],
  }));

  const msg = String(payload.message || '').trim();
  if (!msg) {
    return contents;
  }

  const last = contents[contents.length - 1];
  const lastText = last?.parts?.[0]?.text;
  const lastIsDuplicateUser = last?.role === 'user' && lastText === msg;

  if (!lastIsDuplicateUser) {
    contents.push({
      role: 'user',
      parts: [{ text: msg }],
    });
  }

  return contents;
}

function normalizeRole(role) {
  return String(role || '').trim().toUpperCase();
}

function sumGroupedStatuses(groups, statuses) {
  return (Array.isArray(groups) ? groups : [])
    .filter((item) => statuses.includes(String(item.status || '').toUpperCase()))
    .reduce((total, item) => total + Number(item?._count?._all || 0), 0);
}

function groupsToMap(groups) {
  const map = {};
  for (const item of Array.isArray(groups) ? groups : []) {
    map[String(item.status || '').toUpperCase()] = Number(item?._count?._all || 0);
  }
  return map;
}

function toMoney(value) {
  return Number(value || 0);
}

function formatTaskSnapshot(task) {
  if (!task) return null;
  const description = String(task.description || '').trim();
  return {
    id: task.id,
    title: task.title,
    description: description ? description.slice(0, 1200) : null,
    status: task.status,
    budget: toMoney(task.budget),
    escrowAmount: toMoney(task.escrowAmount ?? task.budget),
    dueDate: task.dueDate,
    updatedAt: task.updatedAt,
  };
}

function summarizeTaskSnapshots(tasks) {
  return (Array.isArray(tasks) ? tasks : [])
    .map(formatTaskSnapshot)
    .filter(Boolean)
    .slice(0, 4);
}

function buildCurrentUserContext(rawContext) {
  const user = rawContext?.user;
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const role = normalizeRole(user.role);
  const requesterStatusCounts = groupsToMap(rawContext.requesterTaskCounts);
  const providerStatusCounts = groupsToMap(rawContext.providerTaskCounts);
  const requesterPostedTotal = Object.values(requesterStatusCounts).reduce((sum, count) => sum + count, 0);
  const providerAssignedTotal = Object.values(providerStatusCounts).reduce((sum, count) => sum + count, 0);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
    },
    roleCapabilities: {
      isRequester: role === 'REQUESTER' || role === 'CLIENT',
      isProvider: role === 'PROVIDER',
      isAdmin: role === 'ADMIN',
    },
    requesterStats: {
      tasksPostedTotal: requesterPostedTotal,
      completedTasks: sumGroupedStatuses(rawContext.requesterTaskCounts, COMPLETED_TASK_STATUSES),
      pendingTasks: sumGroupedStatuses(rawContext.requesterTaskCounts, PENDING_TASK_STATUSES),
      cancelledTasks: Number(requesterStatusCounts.CANCELLED || 0),
      byStatus: requesterStatusCounts,
    },
    providerStats: {
      assignedTasksTotal: providerAssignedTotal,
      completedTasks: sumGroupedStatuses(rawContext.providerTaskCounts, COMPLETED_TASK_STATUSES),
      pendingTasks: sumGroupedStatuses(rawContext.providerTaskCounts, PENDING_TASK_STATUSES),
      cancelledTasks: Number(providerStatusCounts.CANCELLED || 0),
      byStatus: providerStatusCounts,
    },
    accountStats: {
      savedTasks: Number(rawContext.savedTasksCount || 0),
      notificationsTotal: Number(rawContext.totalNotificationsCount || 0),
      unreadNotifications: Number(rawContext.unreadNotificationsCount || 0),
    },
    taskDatesAndBudgets: {
      recentRequesterTasks: summarizeTaskSnapshots(rawContext.recentRequesterTasks),
      recentProviderTasks: summarizeTaskSnapshots(rawContext.recentProviderTasks),
      requesterBudgetOutstanding: {
        totalBudget: toMoney(rawContext?.requesterBudgetAggregates?._sum?.budget),
        escrowAmount: toMoney(rawContext?.requesterBudgetAggregates?._sum?.escrowAmount),
      },
      providerWorkInProgressValue: {
        totalBudget: toMoney(rawContext?.providerBudgetAggregates?._sum?.budget),
        escrowAmount: toMoney(rawContext?.providerBudgetAggregates?._sum?.escrowAmount),
      },
    },
    paymentStats: {
      asPayer: {
        transactions: Number(rawContext?.payerPayments?._count?._all || 0),
        totalAmount: toMoney(rawContext?.payerPayments?._sum?.totalAmount ?? rawContext?.payerPayments?._sum?.amount),
        escrowHeldAmount: toMoney(rawContext?.payerPayments?._sum?.escrowHeldAmount),
        platformFeeAmount: toMoney(rawContext?.payerPayments?._sum?.platformFeeAmount),
      },
      asProvider: {
        transactions: Number(rawContext?.providerPayments?._count?._all || 0),
        grossAmount: toMoney(rawContext?.providerPayments?._sum?.amount),
        payoutAmount: toMoney(rawContext?.providerPayments?._sum?.providerPayoutAmount),
      },
    },
  };
}

function buildScopedSystemPrompt(currentUserContext) {
  return `${CONNECTMYTASK_SYSTEM_PROMPT}

CURRENT AUTHENTICATED USER CONTEXT:
\`\`\`json
${JSON.stringify(currentUserContext, null, 2)}
\`\`\`

Important interpretation note:
- This app context may include task budgets, escrow amounts, payment totals, and task dates for the authenticated user.
- Unless the context explicitly contains a true account balance, do not describe any value as a wallet balance.
- If the user asks about "budget left", answer using their own outstanding task budgets / escrow-related amounts from the context and explain what that number represents.

Answer using only this authenticated user's context and general ConnectMyTask product knowledge.`;
}

function asksAboutAnotherUser(message) {
  const text = String(message || '').toLowerCase();
  const patterns = [
    /\banother user\b/,
    /\bother user\b/,
    /\bother people\b/,
    /\bsomeone else\b/,
    /\buser(?:name)?\s+[a-z0-9_.-]+\b/,
    /\bprovider\s+[a-z0-9_.-]+\b/,
    /\brequester\s+[a-z0-9_.-]+\b/,
    /\btheir account\b/,
    /\bhis account\b/,
    /\bher account\b/,
  ];

  return patterns.some((pattern) => pattern.test(text));
}

async function requestAssistantReply(systemPrompt, contents) {
  if (!env.GEMINI_API_KEY) {
    const err = new Error('Gemini is not configured. Missing GEMINI_API_KEY');
    err.statusCode = 500;
    throw err;
  }

  const fallbackModels = String(env.GEMINI_FALLBACK_MODELS || 'gemini-2.0-flash')
    .split(',')
    .map((item) => item.trim())
    .filter((model) => model && !model.startsWith('gemini-1.5'));
  const modelsToTry = [env.GEMINI_MODEL, ...fallbackModels.filter((model) => model !== env.GEMINI_MODEL)];
  const maxAttemptsPerModel = 2;
  let lastProviderMessage = '';
  let lastStatus = 0;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= maxAttemptsPerModel; attempt += 1) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: systemPrompt }],
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
      if (response.ok) {
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

      const providerMessage = String(data?.error?.message || response.statusText || '').trim();
      const lower = providerMessage.toLowerCase();
      const isDemandError =
        response.status === 429 ||
        response.status === 503 ||
        lower.includes('quota') ||
        lower.includes('rate limit') ||
        lower.includes('resource exhausted') ||
        lower.includes('high demand');

      lastProviderMessage = providerMessage;
      lastStatus = response.status;
      // eslint-disable-next-line no-console
      console.warn(
        `[chat] Gemini request failed (model=${model}, attempt=${attempt}, status=${response.status}):`,
        providerMessage
      );

      if (isDemandError && attempt < maxAttemptsPerModel) {
        await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
        continue;
      }

      if (!isDemandError) {
        break;
      }
    }
  }

  let message = 'AI assistant is temporarily unavailable. Please try again shortly.';
  const lower = String(lastProviderMessage || '').toLowerCase();
  if (
    lastStatus === 429 ||
    lastStatus === 503 ||
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('resource exhausted') ||
    lower.includes('high demand')
  ) {
    message = 'The AI service is temporarily busy due to Gemini usage limits or high demand. Please try again in a moment.';
  } else if (lower.includes('api key') || lower.includes('permission') || lower.includes('access not configured')) {
    message = 'The AI assistant is not configured correctly right now. Please check the Gemini API key and model access.';
  } else if (lower.includes('token') || lower.includes('too large') || lower.includes('payload')) {
    message = 'The AI request was too large to process. I reduced the chat context, but please try a shorter question or clear old chat messages.';
  } else if (lastProviderMessage) {
    message = `AI assistant error: ${lastProviderMessage}`;
  }

  const err = new Error(message);
  err.statusCode = 502;
  throw err;
}

async function sendChat(payload, currentUser) {
  if (asksAboutAnotherUser(payload.message)) {
    return {
      reply:
        'I can only help with the account and activity of the currently signed-in user. I cannot access or share private information about other users.',
    };
  }

  const rawContext = await chatRepository.getChatUserContext(currentUser.id);
  const currentUserContext = buildCurrentUserContext(rawContext);
  const systemPrompt = buildScopedSystemPrompt(currentUserContext);
  const contents = toGeminiContents(payload);
  const reply = await requestAssistantReply(systemPrompt, contents);

  const safeHistory = Array.isArray(payload.history) ? payload.history : [];
  // Client history already includes the current user turn (and any local form assistant).
  const persistedHistory = [...safeHistory, { role: 'assistant', content: reply }];

  await chatRepository.overwriteChatHistoryForUser(currentUser.id, persistedHistory);

  return {
    reply,
  };
}

async function getChatHistory(userId) {
  return chatRepository.getChatHistoryForUser(userId);
}

async function clearChatHistory(userId) {
  await chatRepository.clearChatHistoryForUser(userId);
}

module.exports = {
  sendChat,
  getChatHistory,
  clearChatHistory,
};
