import AuditLog from '../models/AuditLog.js';
import { paginatedData } from '../utils/apiResponse.js';

export const createAuditLog = async ({ actorId, action, entityType, entityId, oldValue, newValue, ipAddress }) => {
  const log = new AuditLog({
    actor: actorId,
    action,
    entityType,
    entityId,
    oldValue,
    newValue,
    ipAddress
  });
  return await log.save();
};

export const getAuditLogs = async ({ page = 1, limit = 10, action, entityType, actorId, startDate, endDate }) => {
  const query = {};

  if (action) query.action = action;
  if (entityType) query.entityType = entityType;
  if (actorId) query.actor = actorId;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;
  const logs = await AuditLog.find(query)
    .populate('actor', 'email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await AuditLog.countDocuments(query);
  const pagination = {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages: Math.ceil(total / limit)
  };
  return paginatedData('logs', logs, pagination);
};
