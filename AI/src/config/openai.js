require('dotenv').config();
const OpenAI = require('openai');

if (!process.env.OPENAI_API_KEY) {
  // eslint-disable-next-line no-console
  console.warn('[ai-layer] OPENAI_API_KEY is not set — /ai/copilot/dispatch will fail until it is.');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

module.exports = { openai, MODEL };
