import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './protected-route';
import { LoginPage } from '@/features/auth/pages/login-page';
import { ProfilePage } from '@/features/auth/pages/profile-page';
import { ForbiddenPage } from '@/features/auth/pages/forbidden-page';
import { DashboardOverview } from '@/features/auth/components/dashboard-overview';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardOverview />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Role-Gated Admin Route */}
      <Route element={<ProtectedRoute requiredRole="admin" />}>
        <Route
          path="/admin-only"
          element={
            <div className="mx-auto max-w-4xl p-8">
              <h1 className="text-xl font-bold">Trang Quản Trị Hệ Thống (Chỉ dành cho Admin)</h1>
              <p className="mt-2 text-sm text-slate-600">
                Bạn đã xác thực với vai trò Admin thành công.
              </p>
            </div>
          }
        />
      </Route>

      {/* Permission-Gated Production Planning Route */}
      <Route element={<ProtectedRoute requiredPermission="production.plan.create" />}>
        <Route
          path="/production-plan-gate"
          element={
            <div className="mx-auto max-w-4xl p-8">
              <h1 className="text-xl font-bold">
                Khu Vực Lập Kế Hoạch Sản Xuất (Yêu cầu quyền production.plan.create)
              </h1>
              <p className="mt-2 text-sm text-slate-600">Bạn có quyền lập kế hoạch sản xuất.</p>
            </div>
          }
        />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
