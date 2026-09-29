import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/routes/protected-route';
import * as useAuthModule from '@/features/auth/hooks/use-auth';
import type { AuthContextValue } from '@/features/auth/types';

describe('ProtectedRoute Guard Tests', () => {
  const baseMockAuth: AuthContextValue = {
    user: null,
    supabaseUser: null,
    session: null,
    isLoading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    refreshUser: vi.fn(),
    hasPermission: vi.fn(),
    hasAnyPermission: vi.fn(),
    hasRole: vi.fn(),
  };

  it('renders loading state when auth state is being resolved', () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      ...baseMockAuth,
      isLoading: true,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Secret Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/Đang tải phiên xác thực/i)).toBeInTheDocument();
    expect(screen.queryByText('Secret Dashboard')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated access to /login', () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      ...baseMockAuth,
      user: null,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<div>Login Page Target</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Secret Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Login Page Target')).toBeInTheDocument();
    expect(screen.queryByText('Secret Dashboard')).not.toBeInTheDocument();
  });

  it('allows authorized access for authenticated users with required permissions', () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      ...baseMockAuth,
      isLoading: false,
      user: {
        id: 'user-auth-1',
        email: 'manager@its-qlsx.vn',
        profile: null,
        roles: [{ id: '1', code: 'plant_manager', name: 'Quản đốc' }],
        permissions: ['production.plan.create'],
      },
      hasPermission: (perm: string) => perm === 'production.plan.create',
      hasRole: (role: string) => role === 'plant_manager',
    });

    render(
      <MemoryRouter initialEntries={['/production/plan']}>
        <Routes>
          <Route path="/forbidden" element={<div>Forbidden Target</div>} />
          <Route element={<ProtectedRoute requiredPermission="production.plan.create" />}>
            <Route path="/production/plan" element={<div>Production Plan Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Production Plan Content')).toBeInTheDocument();
    expect(screen.queryByText('Forbidden Target')).not.toBeInTheDocument();
  });

  it('redirects unauthorized access to /forbidden when user lacks permission', () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      ...baseMockAuth,
      isLoading: false,
      user: {
        id: 'user-auth-2',
        email: 'operator@its-qlsx.vn',
        profile: null,
        roles: [{ id: '2', code: 'operator', name: 'Công nhân' }],
        permissions: ['production.shift.write'],
      },
      hasPermission: () => false,
      hasRole: () => false,
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/forbidden" element={<div>403 Forbidden Target</div>} />
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/admin" element={<div>Super Admin Only</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('403 Forbidden Target')).toBeInTheDocument();
    expect(screen.queryByText('Super Admin Only')).not.toBeInTheDocument();
  });
});
