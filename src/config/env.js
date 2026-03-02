const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), 'database/.env') });
dotenv.config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 4000,
  DATABASE_URL:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/connectmytask',
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://ai-service',
  JWT_SECRET: process.env.JWT_SECRET || 'supersecretjwtkey',
};

module.exports = { env };

