import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { HiOutlineMenuAlt2, HiOutlineBell, HiOutlineSearch, HiCheck } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import * as notificationService from '../services/notificationService';
import { displayName, listItems } from '../utils/response';

const Topbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  
  const notifRef = useRef();
  const userRef = useRef();

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const countRes = await notificationService.getUnreadCount();
        if (countRes.success) setUnreadCount(countRes.data.count);
      } catch (e) {
        // silently fail
      }
    };
    
    // In a real app, you might want to poll this or use websockets
    if (user) fetchUnread();
  }, [user]);

  const loadNotifications = async () => {
    setShowNotifications(!showNotifications);
    setShowUserMenu(false);
    
    if (!showNotifications) {
      try {
        const res = await notificationService.getNotifications();
        if (res.success) {
          setNotifications(listItems(res.data).slice(0, 5));
        }
      } catch (e) {
        // silently fail
      }
    }
  };

  const markAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      // ignore
    }
  };

  const markAllAsRead = async (e) => {
    e.stopPropagation();
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      // ignore
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    const parts = path.split('/').filter(Boolean);
    if (parts.length > 1) {
      if (parts[1] === 'employees' && parts.length === 2) return 'Employees';
      if (parts[1] === 'employees' && parts[2] === 'create') return 'Add Employee';
      if (parts[1] === 'employees') return 'Employee Details';
      
      const title = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
      return title.replace('-', ' ');
    }
    return 'Dashboard';
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10 sticky top-0">
      <div className="flex items-center">
        <button
          type="button"
          className="text-gray-500 hover:text-gray-700 focus:outline-none lg:hidden mr-4"
          onClick={toggleSidebar}
        >
          <span className="sr-only">Open sidebar</span>
          <HiOutlineMenuAlt2 className="h-6 w-6" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900 hidden sm:block">{getPageTitle()}</h2>
      </div>

      <div className="flex flex-1 justify-center px-2 lg:ml-6 lg:justify-end max-w-md">
        <div className="w-full max-w-lg lg:max-w-xs relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <HiOutlineSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            className="block w-full rounded-md border-0 bg-gray-50 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
            placeholder="Search..."
            type="search"
          />
        </div>
      </div>

      <div className="flex items-center ml-4 sm:ml-6">
        
        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button 
            className="relative p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100 transition-colors"
            onClick={loadNotifications}
          >
            <span className="sr-only">View notifications</span>
            <HiOutlineBell className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 z-20 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-primary-600 hover:text-primary-800">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div key={notif._id} className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 ${!notif.isRead ? 'bg-primary-50/30' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1 pr-2">
                          <p className={`text-sm ${!notif.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                            {notif.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {format(new Date(notif.createdAt), 'MMM d, h:mm a')}
                          </p>
                        </div>
                        {!notif.isRead && (
                          <button 
                            onClick={(e) => markAsRead(notif._id, e)}
                            className="text-primary-600 hover:bg-primary-50 p-1 rounded"
                            title="Mark as read"
                          >
                            <HiCheck className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-gray-500">
                    No notifications
                  </div>
                )}
              </div>
              <div className="px-4 py-2 border-t border-gray-100 text-center">
                <Link 
                  to={user?.role === 'admin' ? '/admin/notifications' : '/employee/notifications'} 
                  className="text-sm font-medium text-primary-600 hover:text-primary-800"
                  onClick={() => setShowNotifications(false)}
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative ml-3" ref={userRef}>
          <button 
            className="flex items-center max-w-xs rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
          >
            <span className="sr-only">Open user menu</span>
            <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold overflow-hidden">
              {user?.employee?.profilePhotoUrl ? (
                <img src={user.employee.profilePhotoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                displayName(user).charAt(0).toUpperCase()
              )}
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900 truncate">{displayName(user)}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <Link 
                to={user?.role === 'admin' ? '/admin/profile' : '/employee/profile'} 
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setShowUserMenu(false)}
              >
                My Profile
              </Link>
              <button
                onClick={logout}
                className="block w-full text-left px-4 py-2 text-sm text-danger-600 hover:bg-gray-100"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
