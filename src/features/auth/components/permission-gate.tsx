import React from 'react';
import { usePermissions } from '../hooks/use-permissions';

export interface PermissionGateProps {
  permission?: string;
  permissions?: string[];
  role?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Declarative component to conditionally render UI elements based on user permissions or roles.
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  permissions,
  role,
  fallback = null,
  children,
}) => {
  const { hasPermission, hasAnyPermission, hasRole } = usePermissions();

  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  if (permissions && permissions.length > 0 && !hasAnyPermission(permissions)) {
    return <>{fallback}</>;
  }

  if (role && !hasRole(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
