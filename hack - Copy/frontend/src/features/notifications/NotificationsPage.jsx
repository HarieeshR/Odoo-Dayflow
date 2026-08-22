import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import * as notificationService from '../../services/notificationService';
import { listItems, listTotalPages } from '../../utils/response';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import Pagination from '../../components/ui/Pagination';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationService.getNotifications({ page, limit: 10 });
      if (res.success) {
        setNotifications(listItems(res.data));
        setTotalPages(listTotalPages(res.data));
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const res = await notificationService.markAsRead(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id || n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await notificationService.markAllAsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'leave_request':
      case 'leave_approved':
      case 'leave_rejected':
        return '🏖️';
      case 'salary_updated':
        return '💰';
      case 'document_uploaded':
        return '📄';
      default:
        return '🔔';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
        <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
          Mark All as Read
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        {loading ? (
          <div className="py-8 flex justify-center"><LoadingSpinner /></div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchNotifications} />
        ) : notifications.length === 0 ? (
          <EmptyState message="No notifications yet" />
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const id = notification._id || notification.id;
              return (
                <div 
                  key={id}
                  onClick={() => !notification.isRead && handleMarkAsRead(id)}
                  className={`flex p-4 rounded-lg border cursor-pointer transition-colors ${
                    !notification.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-shrink-0 text-2xl mr-4">
                    {getIconForType(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className={`text-sm ${!notification.isRead ? 'font-bold text-blue-900' : 'font-medium text-gray-900'}`}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {notification.createdAt ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }) : ''}
                      </span>
                    </div>
                    <p className={`mt-1 text-sm ${!notification.isRead ? 'text-blue-800' : 'text-gray-600'}`}>
                      {notification.message}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="flex-shrink-0 ml-4 flex items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="mt-6">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
