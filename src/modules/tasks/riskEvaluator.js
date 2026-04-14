// Rule-based budget risk evaluator for capstone demo.
// Keep this deterministic and easy to explain in class.
const CATEGORY_MIN_BUDGET_VND = {
  CLEANING: 250000,
  HOME_REPAIR: 350000,
  DELIVERY: 100000,
  MOVING: 700000,
  IT_SUPPORT: 300000,
  PERSONAL_ASSISTANT: 250000,
  TUTORING: 200000,
  OTHER: 200000,
};

const KEYWORD_BUDGET_MODIFIERS = [
  {
    keywords: ['deep clean', 'deep cleaning', 'full apartment', 'whole house'],
    multiplier: 1.6,
    reason: 'Task scope suggests a more intensive service than a standard cleaning job',
  },
  {
    keywords: ['fragile', 'glass', 'heavy', 'stairs', 'multiple floors'],
    multiplier: 1.25,
    reason: 'Task involves extra handling risk or effort',
  },
  {
    keywords: ['urgent', 'asap', 'today', 'tonight', 'immediately'],
    multiplier: 1.2,
    reason: 'Urgent tasks usually require a higher budget',
  },
  {
    keywords: ['install', 'replacement parts', 'materials included'],
    multiplier: 1.3,
    reason: 'Task may require parts or additional materials',
  },
];

function normalizeCategory(category) {
  return String(category || '').toUpperCase().trim();
}

function normalizeText(value) {
  return String(value || '').toLowerCase().trim();
}

function calculateAdjustedThreshold(task, baseThreshold) {
  const text = `${normalizeText(task?.title)} ${normalizeText(task?.description)}`;
  let adjustedThreshold = baseThreshold;
  const matchedReasons = [];

  for (const rule of KEYWORD_BUDGET_MODIFIERS) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      adjustedThreshold = Math.round(adjustedThreshold * rule.multiplier);
      matchedReasons.push(rule.reason);
    }
  }

  return {
    adjustedThreshold,
    matchedReasons,
  };
}

async function evaluateTaskRisk(task) {
  const budget = Number(task?.budget || 0);

  const { buildBudgetSuggestion } = require('../ai-integration/budgetEngine');
  const { requestFraudDetection } = require('../ai-integration/aiClient');

  const suggestion = buildBudgetSuggestion({
    title: task?.title,
    description: task?.description,
    category: task?.category,
    location: task?.location
  });

  const adjustedThreshold = suggestion.suggestedMin;

  const aiFraud = await requestFraudDetection({
    title: task?.title,
    description: task?.description,
    budget: budget,
    expected_min_budget: adjustedThreshold
  });

  if (aiFraud) {
    return {
      isSuspicious: aiFraud.is_suspicious,
      riskLevel: aiFraud.risk_level,
      suspiciousReason: aiFraud.reason,
      expectedMinBudget: adjustedThreshold,
      baseExpectedMinBudget: adjustedThreshold,
      riskHints: suggestion.factorsUsed || [],
    };
  }

  // Fallback if AI unavailable
  if (budget > 0 && budget >= adjustedThreshold) {
    return {
      isSuspicious: false,
      riskLevel: null,
      suspiciousReason: null,
      expectedMinBudget: adjustedThreshold,
      baseExpectedMinBudget: adjustedThreshold,
      riskHints: suggestion.factorsUsed || [],
    };
  }

  const ratio = budget / adjustedThreshold;
  const riskLevel = ratio < 0.5 ? 'HIGH' : 'MEDIUM';
  const suspiciousReason = `Budget looks unusually low. The system expected at least ${adjustedThreshold} VND based on your task details.`;

  return {
    isSuspicious: true,
    riskLevel,
    suspiciousReason,
    expectedMinBudget: adjustedThreshold,
    baseExpectedMinBudget: adjustedThreshold,
    riskHints: suggestion.factorsUsed || [],
  };
}

module.exports = {
  CATEGORY_MIN_BUDGET_VND,
  KEYWORD_BUDGET_MODIFIERS,
  evaluateTaskRisk,
};
