import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './protected-route';
import { LoginPage } from '@/features/auth/pages/login-page';
import { ProfilePage } from '@/features/auth/pages/profile-page';
import { ForbiddenPage } from '@/features/auth/pages/forbidden-page';
import { DashboardOverview } from '@/features/auth/components/dashboard-overview';
import { HRPage } from '@/features/hr';
import { AppShell } from '@/components/layout/app-shell';
import { PageContainer } from '@/components/layout/page-container';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />

      {/* Protected Routes inside AppShell */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardOverview />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/hr" element={<HRPage />} />

          {/* Role-Gated Admin Route */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
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
                      Module Nhật ký thao tác (Audit Logs) sẽ được hoàn thiện trong các giai đoạn tiếp theo.
                    </p>
                  </div>
                </PageContainer>
              }
            />
          </Route>

          {/* Permission-Gated Production Planning Route */}
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

          {/* Business Module Shell Placeholders (Do not build business modules yet) */}
          <Route
            path="/production/plans"
            element={
              <PageContainer
                title="Kế hoạch sản xuất"
                description="Lập kế hoạch công suất, thời gian, chất lượng và sản lượng theo dây chuyền"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module Kế hoạch sản xuất sẽ được triển khai chi tiết ở Phase 5.
                  </p>
                </div>
              </PageContainer>
            }
          />
          <Route
            path="/production/shifts"
            element={
              <PageContainer
                title="Theo dõi ca sản xuất"
                description="Ghi nhận số đo điện, cân nguyên liệu và nhật ký vận hành ca"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module Theo dõi ca sản xuất sẽ được triển khai chi tiết ở Phase 5.
                  </p>
                </div>
              </PageContainer>
            }
          />
          <Route
            path="/production/norms"
            element={
              <PageContainer
                title="Định mức Kinh tế - Kỹ thuật"
                description="Định mức tiêu hao nguyên vật liệu, điện năng và tỷ lệ phụ phẩm"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module Định mức sẽ được triển khai chi tiết ở Phase 5.
                  </p>
                </div>
              </PageContainer>
            }
          />
          <Route
            path="/production/batches"
            element={
              <PageContainer
                title="Lô thành phẩm"
                description="Quản lý thông tin lô hàng và mã QR truy xuất nguồn gốc"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module Lô thành phẩm sẽ được triển khai chi tiết ở Phase 5.
                  </p>
                </div>
              </PageContainer>
            }
          />
          <Route
            path="/warehouse/stock"
            element={
              <PageContainer
                title="Tồn kho & vật tư"
                description="Tra cứu tồn kho nguyên vật liệu, phụ tùng và thành phẩm"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module Kho & Vật tư sẽ được phát triển trong giai đoạn tiếp theo.
                  </p>
                </div>
              </PageContainer>
            }
          />
          <Route
            path="/warehouse/transactions"
            element={
              <PageContainer
                title="Nhập / Xuất kho"
                description="Lập phiếu nhập kho, xuất kho và điều chuyển kho nội bộ"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module Giao dịch kho sẽ được phát triển trong giai đoạn tiếp theo.
                  </p>
                </div>
              </PageContainer>
            }
          />
          <Route
            path="/maintenance/machines"
            element={
              <PageContainer
                title="Danh sách thiết bị máy móc"
                description="Quản lý hồ sơ thiết bị, thông số kỹ thuật và trạng thái vận hành"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module Thiết bị máy móc sẽ được phát triển trong giai đoạn tiếp theo.
                  </p>
                </div>
              </PageContainer>
            }
          />
          <Route
            path="/maintenance/schedules"
            element={
              <PageContainer
                title="Lịch bảo dưỡng"
                description="Kế hoạch bảo trì phòng ngừa và kiểm định định kỳ"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module Lịch bảo dưỡng sẽ được phát triển trong giai đoạn tiếp theo.
                  </p>
                </div>
              </PageContainer>
            }
          />
          <Route
            path="/mining/plans"
            element={
              <PageContainer
                title="Kế hoạch khai thác mỏ"
                description="Kế hoạch bốc xúc đất đá và khai thác quặng thô"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module Khai thác mỏ sẽ được phát triển trong giai đoạn tiếp theo.
                  </p>
                </div>
              </PageContainer>
            }
          />
          <Route
            path="/mining/logs"
            element={
              <PageContainer
                title="Nhật ký vận chuyển quặng"
                description="Theo dõi chuyến xe và sản lượng quặng về nhà máy"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module Nhật ký vận chuyển sẽ được phát triển trong giai đoạn tiếp theo.
                  </p>
                </div>
              </PageContainer>
            }
          />
          <Route
            path="/quality"
            element={
              <PageContainer
                title="Quản lý Chất lượng"
                description="Kiểm tra KCS nguyên liệu đầu vào và thành phẩm"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module Quản lý Chất lượng sẽ được phát triển trong giai đoạn tiếp theo.
                  </p>
                </div>
              </PageContainer>
            }
          />
          <Route
            path="/hsse"
            element={
              <PageContainer
                title="An toàn & Môi trường (HSSE)"
                description="Giám sát an toàn lao động, môi trường và sự cố"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module HSSE sẽ được phát triển trong giai đoạn tiếp theo.
                  </p>
                </div>
              </PageContainer>
            }
          />
          <Route
            path="/finance"
            element={
              <PageContainer
                title="Giá thành sản xuất"
                description="Tổng hợp chi phí tiêu hao, điện năng, nhân công và tính giá thành"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module Giá thành sản xuất sẽ được phát triển trong giai đoạn tiếp theo.
                  </p>
                </div>
              </PageContainer>
            }
          />
          <Route
            path="/sales"
            element={
              <PageContainer
                title="Bán hàng & Đơn hàng"
                description="Quản lý đơn hàng, xuất bán và khách hàng"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module Bán hàng sẽ được phát triển trong giai đoạn tiếp theo.
                  </p>
                </div>
              </PageContainer>
            }
          />
        </Route>
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
