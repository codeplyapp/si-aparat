import React from 'react';
import { Navigate } from 'react-router-dom';
import type { RoleUser } from '@si-aparat/shared';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: RoleUser[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    const hasRole = allowedRoles.includes(user.role) || user.role === 'SUPER_ADMIN';

    if (!hasRole) {
      return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
  } catch {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }
};
