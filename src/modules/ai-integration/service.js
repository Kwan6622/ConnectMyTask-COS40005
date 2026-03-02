const aiRepository = require('./repository');
const { requestRecommendation } = require('./aiClient');

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
};

