import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './protected-route';
import { LoginPage } from '@/features/auth/pages/login-page';
import { ProfilePage } from '@/features/auth/pages/profile-page';
import { ForbiddenPage } from '@/features/auth/pages/forbidden-page';
import { PendingApprovalPage } from '@/features/auth/pages/pending-approval-page';
import { DashboardOverview } from '@/features/auth/components/dashboard-overview';
import { AppsheetPortalPage, DepartmentOperationsPage } from '@/features/portal';
import { HRPage } from '@/features/hr';
import { MaintenancePage } from '@/features/maintenance';
import { WarehousePage } from '@/features/warehouse';
import { ProductionPage } from '@/features/production';
import { SalesPage } from '@/features/sales';
import { AppShell } from '@/components/layout/app-shell';
import { PageContainer } from '@/components/layout/page-container';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />
      <Route path="/pending-approval" element={<PendingApprovalPage />} />

      {/* Protected Routes inside AppShell */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          {/* Cổng chức năng dạng AppSheet (Portal Hub) */}
          <Route path="/" element={<AppsheetPortalPage />} />

          {/* 1. Ban Giám Đốc (Executive) */}
          <Route path="/executive/overview" element={<DashboardOverview />} />
          <Route path="/executive" element={<Navigate to="/executive/overview" replace />} />
          <Route path="/executive/oee" element={<Navigate to="/production/incidents" replace />} />
          <Route path="/executive/approvals" element={<Navigate to="/executive/overview" replace />} />
          <Route path="/executive/reports" element={<Navigate to="/executive/overview" replace />} />

          <Route path="/profile" element={<ProfilePage />} />

          {/* 2. Sản Xuất (Production) */}
          <Route
            path="/production"
            element={<DepartmentOperationsPage departmentId="production" />}
          />
          <Route
            path="/production/dashboard"
            element={<Navigate to="/production/annual-plan" replace />}
          />
          <Route
            path="/production/overview"
            element={<Navigate to="/production/annual-plan" replace />}
          />
          <Route
            path="/production/plans"
            element={<Navigate to="/production/annual-plan" replace />}
          />
          <Route path="/production/annual-plan" element={<ProductionPage />} />
          <Route path="/production/shifts" element={<ProductionPage />} />
          <Route path="/production/incidents" element={<ProductionPage />} />
          <Route path="/production/patrols" element={<ProductionPage />} />
          <Route
            path="/production/norms"
            element={<Navigate to="/production/annual-plan" replace />}
          />
          <Route
            path="/production/batches"
            element={<Navigate to="/production/annual-plan" replace />}
          />

          {/* 3. Kho - Vật Tư (Warehouse) */}
          <Route
            path="/warehouse"
            element={<DepartmentOperationsPage departmentId="warehouse" />}
          />
          <Route path="/warehouse/material-dashboard" element={<WarehousePage />} />
          <Route path="/warehouse/stock" element={<WarehousePage />} />
          <Route path="/warehouse/transactions" element={<WarehousePage />} />
          <Route path="/warehouse/products" element={<WarehousePage />} />
          <Route path="/warehouse/materials" element={<WarehousePage />} />
          <Route path="/warehouse/inventory" element={<WarehousePage />} />
          <Route path="/warehouse/locations" element={<WarehousePage />} />

          {/* Redirects cho module QC cũ về Portal */}
          <Route path="/quality/*" element={<Navigate to="/" replace />} />

          {/* 4. Bảo Trì & Cơ Điện */}
          <Route
            path="/maintenance"
            element={<DepartmentOperationsPage departmentId="maintenance" />}
          />
          <Route path="/maintenance/machines" element={<MaintenancePage />} />
          <Route path="/maintenance/schedules" element={<MaintenancePage />} />
          <Route path="/maintenance/orders" element={<MaintenancePage />} />
          <Route path="/maintenance/adjustments" element={<MaintenancePage />} />
          <Route path="/maintenance/spares" element={<MaintenancePage />} />

          {/* Redirects cho module HSSE cũ về Portal */}
          <Route path="/hsse/*" element={<Navigate to="/" replace />} />

          {/* 5. Kinh Doanh - Mua Sắm */}
          <Route
            path="/sales"
            element={<DepartmentOperationsPage departmentId="sales" />}
          />
          <Route path="/sales/dashboard" element={<SalesPage />} />
          <Route path="/sales/orders" element={<SalesPage />} />
          <Route path="/sales/customers" element={<SalesPage />} />
          <Route path="/sales/suppliers" element={<SalesPage />} />
          <Route
            path="/procurement"
            element={<Navigate to="/sales/orders" replace />}
          />
          <Route path="/procurement/orders" element={<SalesPage />} />
          <Route path="/procurement/requests" element={<SalesPage />} />
          <Route path="/procurement/suppliers" element={<SalesPage />} />

          {/* Redirects cho module TCKT cũ về Portal */}
          <Route path="/finance/*" element={<Navigate to="/" replace />} />

          {/* 6. Nhân Sự & Tổ Chức (HR) */}
          <Route
            path="/hr"
            element={<DepartmentOperationsPage departmentId="hr" />}
          />
          <Route path="/hr/employees" element={<HRPage />} />
          <Route path="/hr/approvals" element={<HRPage />} />
          <Route path="/hr/departments" element={<HRPage />} />
          <Route path="/hr/positions" element={<HRPage />} />

          {/* 7. Quản Trị Hệ Thống (Chỉ dành cho Admin) */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route
              path="/system"
              element={<DepartmentOperationsPage departmentId="system" />}
            />
            <Route path="/system/users" element={<Navigate to="/admin-only" replace />} />
            <Route path="/system/logs" element={<Navigate to="/admin/audit" replace />} />
            <Route
              path="/admin-only"
              element={
                <PageContainer
                  title="Quản Trị Hệ Thống"
                  description="Dành riêng cho quản trị viên (Admin)"
                >
                  <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="text-base font-bold text-foreground">
                      Trang Quản Trị Hệ Thống (Chỉ dành cho Admin)
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Bạn đã xác thực với vai trò Admin thành công.
                    </p>
                  </div>
                </PageContainer>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <PageContainer
                  title="Nhật ký thao tác"
                  description="Ghi nhận và tra cứu toàn bộ hoạt động của người dùng"
                >
                  <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <p className="text-sm text-muted-foreground">
                      Hệ thống đang lưu trữ nhật ký thao tác trực tiếp vào bảng audit_logs trong Supabase.
                    </p>
                  </div>
                </PageContainer>
              }
            />
          </Route>

          {/* Permission-Gated Production Planning Route (Giữ lại cho tương thích test) */}
          <Route element={<ProtectedRoute requiredPermission="production.plan.create" />}>
            <Route
              path="/production-plan-gate"
              element={
                <PageContainer
                  title="Kế Hoạch Sản Xuất"
                  description="Khu vực yêu cầu quyền production.plan.create"
                >
                  <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="text-base font-bold text-foreground">
                      Khu Vực Lập Kế Hoạch Sản Xuất (Yêu cầu quyền production.plan.create)
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Bạn có quyền lập kế hoạch sản xuất.
                    </p>
                  </div>
                </PageContainer>
              }
            />
          </Route>
        </Route>
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
