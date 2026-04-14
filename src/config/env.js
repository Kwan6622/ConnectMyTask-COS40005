const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

function loadEnvIfExists(relativePath) {
  const envPath = path.resolve(process.cwd(), relativePath);
  if (!fs.existsSync(envPath)) return false;
  dotenv.config({ path: envPath });
  return true;
}

// Priority:
// 1) .env at project root (what most users edit)
// 2) database/.env as backward-compatible fallback
// 3) non-dotfile fallbacks for edge cases
let loadedAny = false;
loadedAny = loadEnvIfExists('.env') || loadedAny;
loadedAny = loadEnvIfExists('database/.env') || loadedAny;
loadedAny = loadEnvIfExists('env') || loadedAny;
loadedAny = loadEnvIfExists('database/env') || loadedAny;

if (!loadedAny && process.env.NODE_ENV !== 'test') {
  // Common issue: zip uploads often omit dotfiles like .env/.env.example
  // so the server falls back to localhost postgres and auth fails.
  // eslint-disable-next-line no-console
  console.warn('[env] No env file found. Copy .env.example -> .env and set DATABASE_URL.');
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

const stripeSecretKey = firstNonEmpty(
  process.env.STRIPE_SECRET_KEY,
  process.env.STRIPE_TEST_SECRET_KEY,
  process.env.STRIPE_TEST_API_KEY,
  process.env.STRIPE_API_KEY,
  process.env.VITE_STRIPE_SECRET_KEY
);

const openAiApiKey = firstNonEmpty(
  process.env.OPENAI_API_KEY,
  process.env.OPENAI_APIKEY
);

const geminiApiKey = firstNonEmpty(
  process.env.GEMINI_API_KEY,
  process.env.GOOGLE_API_KEY
);

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 4000,
  DATABASE_URL:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/connectmytask',
  // Default to local FastAPI AI service for non-docker development.
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000',
  JWT_SECRET: process.env.JWT_SECRET || 'supersecretjwtkey',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  OPENAI_API_KEY: openAiApiKey,
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  GEMINI_API_KEY: geminiApiKey,
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  STRIPE_SECRET_KEY: stripeSecretKey,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  STRIPE_CURRENCY: process.env.STRIPE_CURRENCY || 'vnd',
};

module.exports = { env };

