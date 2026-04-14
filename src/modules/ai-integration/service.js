const aiRepository = require('./repository');
const { requestRecommendation } = require('./aiClient');
const { buildBudgetSuggestion } = require('./budgetEngine');

async function recommendForTask(taskId) {
  const task = await aiRepository.getTaskById(taskId);
  if (!task) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }

  const payload = {
    category: task.category,
    description: task.description,
    location: task.location,
    budget: task.budget,
  };

  const aiResponse = await requestRecommendation(payload);

  const {
    suggestedPrice,
    recommendedProviders,
    confidenceScore,
  } = aiResponse;

  if (
    typeof suggestedPrice !== 'number' ||
    typeof confidenceScore !== 'number'
  ) {
    const err = new Error('AI service returned invalid response');
    err.statusCode = 502;
    throw err;
  }

  await aiRepository.createAiInsight({
    taskId: task.id,
    suggestedPrice,
    recommendedProviders: recommendedProviders || [],
    confidenceScore,
  });

  return {
    taskId: task.id,
    suggestedPrice,
    recommendedProviders: recommendedProviders || [],
    confidenceScore,
  };
}

module.exports = {
  recommendForTask,
  predictPriceFromPayload: async function predictPriceFromPayload(payload) {
    const title = String(payload.title || '').trim();
    const description = String(payload.description || '').trim();
    const category = String(payload.category || '').trim();
    const location = String(payload.location || '').trim();
    const combinedDescription = [title, description].filter(Boolean).join('. ');

    let aiResponse = null;
    try {
      aiResponse = await requestRecommendation({
        category,
        title,
        description: description || combinedDescription,
        location,
        budget: payload.budget,
      });
    } catch (_error) {
      // Keep deterministic fallback active even when external model is unavailable.
      aiResponse = null;
    }

    // Prefer Python AI service output directly when it already returns VND ranges.
    // This prevents legacy JS fallback blending from re-scaling values incorrectly.
    const aiMeta = aiResponse?.meta || null;
    const aiCurrency = String(aiMeta?.currency || '').toUpperCase();
    const aiSuggested = Number(aiResponse?.suggestedPrice);
    const aiMin = Number(aiMeta?.priceBandMin);
    const aiMax = Number(aiMeta?.priceBandMax);
    const hasVndSuggestion =
      aiCurrency === 'VND' &&
      Number.isFinite(aiSuggested) &&
      Number.isFinite(aiMin) &&
      Number.isFinite(aiMax) &&
      aiSuggested > 0 &&
      aiMin > 0 &&
      aiMax > 0;

    if (hasVndSuggestion) {
      const explanation =
        String(aiMeta?.explanation || '').trim() ||
        'Suggested from title and description analysis.';
      const factorsUsed = Array.isArray(aiMeta?.factorsUsed)
        ? aiMeta.factorsUsed
        : [];
      return {
        aiSuggestedPrice: aiSuggested,
        suggestedMin: aiMin,
        suggestedMax: aiMax,
        suggestedBudget: aiSuggested,
        currency: 'VND',
        explanation,
        factorsUsed,
        confidenceScore:
          typeof aiResponse?.confidenceScore === 'number'
            ? aiResponse.confidenceScore
            : 0.8,
        recommendedProviders: Array.isArray(aiResponse?.recommendedProviders)
          ? aiResponse.recommendedProviders
          : [],
        rationale: explanation,
        source: 'python-ai-engine',
      };
    }

    const ruleSuggestion = buildBudgetSuggestion(
      { title, description, category, location },
      aiResponse
    );

    return {
      aiSuggestedPrice: ruleSuggestion.suggestedBudget,
      suggestedMin: ruleSuggestion.suggestedMin,
      suggestedMax: ruleSuggestion.suggestedMax,
      suggestedBudget: ruleSuggestion.suggestedBudget,
      currency: ruleSuggestion.currency,
      explanation: ruleSuggestion.explanation,
      factorsUsed: ruleSuggestion.factorsUsed,
      confidenceScore:
        typeof aiResponse?.confidenceScore === 'number'
          ? aiResponse.confidenceScore
          : 0.75,
      recommendedProviders: Array.isArray(aiResponse?.recommendedProviders)
        ? aiResponse.recommendedProviders
        : [],
      rationale: ruleSuggestion.explanation,
      source: aiResponse ? 'hybrid-ai-rule-engine' : 'rule-engine-fallback',
    };
  },
};

