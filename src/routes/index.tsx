import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './protected-route';
import { LoginPage } from '@/features/auth/pages/login-page';
import { ProfilePage } from '@/features/auth/pages/profile-page';
import { ForbiddenPage } from '@/features/auth/pages/forbidden-page';
import { PendingApprovalPage } from '@/features/auth/pages/pending-approval-page';
import { DashboardOverview } from '@/features/auth/components/dashboard-overview';
import { HRPage } from '@/features/hr';
import { MaintenancePage } from '@/features/maintenance';
import { WarehousePage } from '@/features/warehouse';
import { ProductionPage } from '@/features/production';
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
          {/* 1. Ban Giám Đốc (Executive) */}
          <Route path="/" element={<DashboardOverview />} />
          <Route
            path="/executive/oee"
            element={
              <PageContainer
                title="Giám sát OEE & Sản lượng"
                description="Báo cáo hiệu suất thiết bị tổng thể (OEE) và sản lượng thực tế theo xưởng"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module Giám sát OEE & Sản lượng sẽ được kết nối dữ liệu SCADA/IoT ở giai đoạn tiếp theo.
                  </p>
                </div>
              </PageContainer>
            }
          />
          <Route
            path="/executive/approvals"
            element={
              <PageContainer
                title="Phê duyệt kế hoạch & Đề xuất"
                description="Trung tâm xét duyệt các kế hoạch sản xuất, phiếu mua hàng và đề xuất nhân sự"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module Phê duyệt điều hành sẽ được triển khai cùng luồng Workflow đa cấp.
                  </p>
                </div>
              </PageContainer>
            }
          />
          <Route
            path="/executive/reports"
            element={
              <PageContainer
                title="Báo cáo điều hành & KPI"
                description="Báo cáo tổng hợp tình hình sản xuất, tài chính và chỉ số hiệu quả kinh doanh"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Hệ thống báo cáo BI & KPI đang được thiết lập theo mẫu quản trị nhà máy.
                  </p>
                </div>
              </PageContainer>
            }
          />

          <Route path="/profile" element={<ProfilePage />} />

          {/* 2. Sản Xuất (Production) */}
          <Route
            path="/production"
            element={<Navigate to="/production/annual-plan" replace />}
          />
          <Route
            path="/production/plans"
            element={<Navigate to="/production/annual-plan" replace />}
          />
          <Route path="/production/annual-plan" element={<ProductionPage />} />
          <Route path="/production/shifts" element={<ProductionPage />} />
          <Route path="/production/incidents" element={<ProductionPage />} />
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
            element={<Navigate to="/warehouse/stock" replace />}
          />

          {/* Warehouse feature routes */}
          <Route path="/warehouse/stock" element={<WarehousePage />} />
          <Route path="/warehouse/transactions" element={<WarehousePage />} />
          <Route path="/warehouse/products" element={<WarehousePage />} />
          <Route path="/warehouse/materials" element={<WarehousePage />} />
          <Route path="/warehouse/inventory" element={<WarehousePage />} />
          <Route path="/warehouse/locations" element={<WarehousePage />} />

          {/* 4. Quản Lý Chất Lượng - QC */}
          <Route
            path="/quality"
            element={
              <PageContainer
                title="Quản lý Chất lượng (QC)"
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
            path="/quality/incoming"
            element={
              <PageContainer
                title="Kiểm tra NVL đầu vào (IQC)"
                description="Lấy mẫu, nghiệm thu tiêu chuẩn hóa lý và cấp chứng nhận đầu vào"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module Kiểm tra đầu vào IQC đang được xây dựng.
                  </p>
                </div>
              </PageContainer>
            }
          />
          <Route
            path="/quality/process"
            element={
              <PageContainer
                title="Kiểm tra công đoạn & Thành phẩm (PQC/FQC)"
                description="Giám sát chất lượng dây chuyền sản xuất và nghiệm thu lô thành phẩm"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module Kiểm tra công đoạn và thành phẩm đang được xây dựng.
                  </p>
                </div>
              </PageContainer>
            }
          />
          <Route
            path="/quality/ncr"
            element={
              <PageContainer
                title="Sự cố không phù hợp (NCR)"
                description="Biên bản xử lý hàng hỏng, phế phẩm và phân tích nguyên nhân gốc rễ (CAPA)"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module Quản lý báo cáo NCR đang được xây dựng.
                  </p>
                </div>
              </PageContainer>
            }
          />
          <Route
            path="/quality/standards"
            element={
              <PageContainer
                title="Tiêu chuẩn & Hồ sơ KCS"
                description="Quy chuẩn kỹ thuật sản phẩm, bảng chỉ tiêu và kết quả thử nghiệm lab"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module Tiêu chuẩn & Hồ sơ KCS đang được xây dựng.
                  </p>
                </div>
              </PageContainer>
            }
          />

          {/* 5. Bảo Trì & Cơ Điện */}
          <Route
            path="/maintenance"
            element={<Navigate to="/maintenance/machines" replace />}
          />
          <Route path="/maintenance/machines" element={<MaintenancePage />} />
          <Route path="/maintenance/schedules" element={<MaintenancePage />} />
          <Route path="/maintenance/orders" element={<MaintenancePage />} />
          <Route path="/maintenance/adjustments" element={<MaintenancePage />} />
          <Route path="/maintenance/spares" element={<MaintenancePage />} />

          {/* 6. An Toàn & Môi Trường (HSSE) */}
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
            path="/hsse/safety"
            element={
              <PageContainer
                title="Giám sát an toàn hiện trường"
                description="Kiểm tra trang bị bảo hộ lao động (PPE), rà soát mối nguy và checklist ca"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module An toàn hiện trường đang được xây dựng.
                  </p>
                </div>
              </PageContainer>
            }
          />
          <Route
            path="/hsse/incidents"
            element={
              <PageContainer
                title="Báo cáo sự cố & rủi ro"
                description="Khai báo sự cố an toàn, suýt xảy ra (Near-miss) và theo dõi biện pháp khắc phục"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module Báo cáo sự cố đang được xây dựng.
                  </p>
                </div>
              </PageContainer>
            }
          />
          <Route
            path="/hsse/environment"
            element={
              <PageContainer
                title="Quan trắc môi trường & khí thải"
                description="Ghi nhận chỉ số nước thải, khí thải, bụi và chất thải nguy hại"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module Quan trắc môi trường đang được xây dựng.
                  </p>
                </div>
              </PageContainer>
            }
          />
          <Route
            path="/hsse/permits"
            element={
              <PageContainer
                title="Cấp phép làm việc (PTW)"
                description="Quản lý giấy phép làm việc nóng, không gian hạn chế và làm việc trên cao"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module Giấy phép PTW đang được xây dựng.
                  </p>
                </div>
              </PageContainer>
            }
          />

          {/* 7. Kinh Doanh - Mua Sắm */}
          <Route
            path="/sales"
            element={
              <PageContainer
                title="Kinh Doanh & Mua Sắm"
                description="Quản lý đơn hàng thương mại và chuỗi cung ứng vật tư"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module Kinh doanh & Mua sắm sẽ được phát triển trong giai đoạn tiếp theo.
                  </p>
                </div>
              </PageContainer>
            }
          />
          <Route
            path="/sales/orders"
            element={
              <PageContainer
                title="Đơn hàng & hợp đồng bán buôn"
                description="Theo dõi hợp đồng cung ứng, đơn đặt hàng và tiến độ giao nhận thành phẩm"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module Đơn hàng & Hợp đồng đang được xây dựng.
                  </p>
                </div>
              </PageContainer>
            }
          />
          <Route
            path="/sales/customers"
            element={
              <PageContainer
                title="Khách hàng & đối tác"
                description="Danh bạ khách hàng, hạn mức tín dụng và lịch sử giao dịch thương mại"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module Khách hàng & Đối tác đang được xây dựng.
                  </p>
                </div>
              </PageContainer>
            }
          />
          <Route
            path="/procurement/requests"
            element={
              <PageContainer
                title="Đề xuất mua sắm vật tư (PR)"
                description="Lập phiếu đề xuất mua vật tư thay thế, hóa chất và nguyên liệu xưởng"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module Đề xuất mua sắm PR đang được xây dựng.
                  </p>
                </div>
              </PageContainer>
            }
          />
          <Route
            path="/procurement/orders"
            element={
              <PageContainer
                title="Đơn đặt hàng nhà cung ứng (PO)"
                description="Theo dõi đơn hàng gửi nhà cung cấp, tiến độ hàng về và đối soát chứng từ"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module Đơn đặt hàng PO đang được xây dựng.
                  </p>
                </div>
              </PageContainer>
            }
          />

          {/* 8. Tài Chính - Kế Toán (TCKT) */}
          <Route
            path="/finance"
            element={
              <PageContainer
                title="Tài Chính - Kế Toán (TCKT)"
                description="Tổng hợp chi phí tiêu hao, điện năng, nhân công và tính giá thành"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module TCKT sẽ được phát triển trong giai đoạn tiếp theo.
                  </p>
                </div>
              </PageContainer>
            }
          />
          <Route
            path="/finance/costing"
            element={
              <PageContainer
                title="Giá thành sản xuất theo lô"
                description="Tính giá thành đơn vị thành phẩm: chi phí trực tiếp, gián tiếp và phân bổ điện"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module Tính giá thành sản xuất đang được xây dựng.
                  </p>
                </div>
              </PageContainer>
            }
          />
          <Route
            path="/finance/budget"
            element={
              <PageContainer
                title="Chi phí thực tế & ngân sách"
                description="Báo cáo phương sai ngân sách dự toán so với thực chi nhà máy"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module Chi phí & Ngân sách đang được xây dựng.
                  </p>
                </div>
              </PageContainer>
            }
          />
          <Route
            path="/finance/assets"
            element={
              <PageContainer
                title="Tài sản cố định & khấu hao"
                description="Sổ theo dõi máy móc dây chuyền, giá trị còn lại và mức khấu hao hàng tháng"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module Tài sản cố định đang được xây dựng.
                  </p>
                </div>
              </PageContainer>
            }
          />
          <Route
            path="/finance/reports"
            element={
              <PageContainer
                title="Báo cáo tài chính quản trị"
                description="Báo cáo kết quả hoạt động kinh doanh và phân tích dòng tiền sản xuất"
              >
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">
                    Module Báo cáo tài chính quản trị đang được xây dựng.
                  </p>
                </div>
              </PageContainer>
            }
          />

          {/* 9. Nhân Sự & Tổ Chức (HR) */}
          <Route path="/hr" element={<HRPage />} />

          {/* 10. Quản Trị Hệ Thống (Chỉ dành cho Admin) */}
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
