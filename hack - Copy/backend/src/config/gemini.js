import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './index.js';

let genAI = null;

export const getGenAI = () => {
  if (!genAI && config.geminiApiKey && config.geminiApiKey !== 'your-gemini-api-key') {
    genAI = new GoogleGenerativeAI(config.geminiApiKey);
  }
  return genAI;
};
