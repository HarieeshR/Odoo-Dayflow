import { getGenAI } from '../config/gemini.js';
import User from '../models/User.js';
import { buildEmployeeContext, buildAdminContext, buildSystemPrompt } from '../ai/contextBuilder.js';

export const chat = async (userId, role, message) => {
  const genAI = getGenAI();
  if (!genAI) {
    return { 
      message: "AI assistant is not configured. Please set the GEMINI_API_KEY.",
      context: role 
    };
  }

  const user = await User.findById(userId).populate('employee');
  
  if (role === 'employee') {
    const lowercaseMessage = message.toLowerCase();
    const sensitivePatterns = ['other employee', "someone else's", 'colleague', 'manager', 'salary of', 'attendance of'];
    if (sensitivePatterns.some(pattern => lowercaseMessage.includes(pattern))) {
      return {
        message: "I can only provide information about your own HR data. I'm not authorized to share other employees' information.",
        context: role
      };
    }
  }

  let context = {};
  if (role === 'employee' && user.employee) {
    context = await buildEmployeeContext(user.employee._id);
  } else if (role === 'admin') {
    context = await buildAdminContext();
  } else {
    return {
      message: "I cannot retrieve context for your role.",
      context: role
    };
  }

  const systemPrompt = buildSystemPrompt(role);
  const fullPrompt = `${systemPrompt}\nHere is the current HR data context:\n${JSON.stringify(context, null, 2)}\n\nUser question: ${message}`;

  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash'];
  let lastError;

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.3,
        },
      });

      let response = result.response.text();
      const objectIdRegex = /[0-9a-fA-F]{24}/g;
      response = response.replace(objectIdRegex, '[ID_REDACTED]');
      return { message: response, context: role };
    } catch (error) {
      lastError = error;
      console.error(`Gemini API Error (${modelName}):`, error.message);
    }
  }

  console.error('Gemini API Error:', lastError);
  return {
    message: 'I encountered an error processing your request. Please try again later.',
    context: role
  };
};
