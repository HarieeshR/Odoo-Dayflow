import Notification from '../models/Notification.js';
import { paginatedData } from '../utils/apiResponse.js';

export const createNotification = async ({ recipientId, type, title, message, metadata }) => {
  const notification = new Notification({
    recipient: recipientId,
    type,
    title,
    message,
    metadata
  });
  return await notification.save();
};

export const getNotifications = async (userId, { page = 1, limit = 10, isRead }) => {
  const query = { recipient: userId };
  if (isRead !== undefined) {
    query.isRead = isRead === 'true' || isRead === true;
  }

  const skip = (page - 1) * limit;
  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Notification.countDocuments(query);
  const pagination = {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages: Math.ceil(total / limit)
  };
  return paginatedData('notifications', notifications, pagination);
};

export const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true },
    { new: true }
  );
  if (!notification) {
    const error = new Error('Notification not found or unauthorized');
    error.statusCode = 404;
    throw error;
  }
  return notification;
};

export const markAllAsRead = async (userId) => {
  return await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true }
  );
};

export const getUnreadCount = async (userId) => {
  return await Notification.countDocuments({ recipient: userId, isRead: false });
};
