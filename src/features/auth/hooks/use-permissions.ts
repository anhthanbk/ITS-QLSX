import { useAuth } from './use-auth';

/**
 * Hook providing granular permission and role checking helpers for the active user.
 */
export function usePermissions() {
  const { user, hasPermission, hasAnyPermission, hasRole } = useAuth();

  return {
    user,
    roles: user?.roles ?? [],
    permissions: user?.permissions ?? [],
    isAdmin: hasRole('admin'),
    isPlantManager: hasRole('plant_manager'),
    isProductionLead: hasRole('production_lead'),
    isOperator: hasRole('operator'),
    hasPermission,
    hasAnyPermission,
    hasRole,
  };
}
