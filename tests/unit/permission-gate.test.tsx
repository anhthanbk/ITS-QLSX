import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PermissionGate } from '@/features/auth/components/permission-gate';
import * as usePermissionsModule from '@/features/auth/hooks/use-permissions';

describe('PermissionGate Component', () => {
  it('renders children when user has the required permission', () => {
    vi.spyOn(usePermissionsModule, 'usePermissions').mockReturnValue({
      user: {
        id: 'user-1',
        email: 'lead@its-qlsx.vn',
        profile: null,
        roles: [{ id: '1', code: 'production_lead', name: 'Trưởng ca' }],
        permissions: ['production.plan.create'],
      },
      roles: [{ id: '1', code: 'production_lead', name: 'Trưởng ca' }],
      permissions: ['production.plan.create'],
      isAdmin: false,
      isPlantManager: false,
      isProductionLead: true,
      isOperator: false,
      hasPermission: (perm: string) => perm === 'production.plan.create',
      hasAnyPermission: (perms: string[]) => perms.includes('production.plan.create'),
      hasRole: (role: string) => role === 'production_lead',
    });

    render(
      <PermissionGate permission="production.plan.create" fallback={<div>Access Denied</div>}>
        <div>Authorized Planning View</div>
      </PermissionGate>,
    );

    expect(screen.getByText('Authorized Planning View')).toBeInTheDocument();
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
  });

  it('renders fallback when user lacks the required permission', () => {
    vi.spyOn(usePermissionsModule, 'usePermissions').mockReturnValue({
      user: {
        id: 'user-2',
        email: 'operator@its-qlsx.vn',
        profile: null,
        roles: [{ id: '2', code: 'operator', name: 'Công nhân' }],
        permissions: ['production.shift.write'],
      },
      roles: [{ id: '2', code: 'operator', name: 'Công nhân' }],
      permissions: ['production.shift.write'],
      isAdmin: false,
      isPlantManager: false,
      isProductionLead: false,
      isOperator: true,
      hasPermission: () => false,
      hasAnyPermission: () => false,
      hasRole: (role: string) => role === 'operator',
    });

    render(
      <PermissionGate permission="production.plan.create" fallback={<div>Access Denied</div>}>
        <div>Authorized Planning View</div>
      </PermissionGate>,
    );

    expect(screen.queryByText('Authorized Planning View')).not.toBeInTheDocument();
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });
});
