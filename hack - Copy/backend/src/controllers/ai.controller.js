import { asyncHandler } from '../utils/asyncHandler.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import * as aiService from '../services/ai.service.js';

export const chat = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return errorResponse(res, 'Message is required', 'VALIDATION_ERROR', 400);
  }
  const result = await aiService.chat(req.user._id, req.user.role, message.trim());
  return successResponse(res, 'AI response generated', result);
});
