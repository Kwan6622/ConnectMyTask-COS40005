const axios = require('axios');
const { env } = require('../../config/env');

async function requestRecommendation(taskPayload) {
  const url = `${env.AI_SERVICE_URL.replace(/\/$/, '')}/recommend`;

  try {
    const response = await axios.post(url, taskPayload, {
      timeout: 5000,
    });
    return response.data;
  } catch (err) {
    const e = new Error('AI service unavailable');
    e.statusCode = 502;
    throw e;
  }
}

async function requestFraudDetection(fraudPayload) {
  const url = `${env.AI_SERVICE_URL.replace(/\/$/, '')}/detect-fraud`;

  try {
    const response = await axios.post(url, fraudPayload, {
      timeout: 3000,
    });
    return response.data;
  } catch (err) {
    return null; // Fallback to safe
  }
}

module.exports = {
  requestRecommendation,
  requestFraudDetection,
};

