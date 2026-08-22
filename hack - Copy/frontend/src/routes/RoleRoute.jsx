import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (user && allowedRoles.includes(user.role)) {
    return <Outlet />;
  }

  return <Navigate to="/" replace />;
};

export default RoleRoute;
