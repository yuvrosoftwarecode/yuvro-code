import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navigation from './Navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Check if we have a token in localStorage as fallback
  const hasToken = localStorage.getItem('access');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If not authenticated and no token, redirect to login
  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If we have authentication or a token, allow access
  // Role checking will be handled by individual components
  if (allowedRoles.length > 0 && user && user.role && !allowedRoles.includes(user.role)) {
    switch (user.role) {
      case "admin":
      case "instructor":
      case "recruiter":
        return <Navigate to="/instructor/dashboard" replace />;
      default:
        return <Navigate to="/student/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
