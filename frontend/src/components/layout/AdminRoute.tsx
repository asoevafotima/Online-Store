import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const AdminRoute: React.FC = () => {
  const { isAuthenticated, role } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role !== 'admin' && role !== 'superadmin') {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
