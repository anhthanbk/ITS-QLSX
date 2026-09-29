import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/layout/page-container';
import { PermissionGate } from './permission-gate';
import {
  Shield,
  KeyRound,
  ExternalLink,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const DashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div id="dashboard-root" className="w-full">
      <PageContainer
        title="Tổng quan hệ thống"
        description="Bảng điều khiển trung tâm và kiểm tra phân quyền truy cập"
      >
        <div className="space-y-6">
          {/* Welcome Card */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Phiên đăng nhập hợp lệ
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Xin chào, {user?.profile?.full_name || user?.email}
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  Tài khoản ID: <span className="font-mono text-xs text-muted-foreground">{user?.id}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {user?.roles.map((role) => (
                  <span
                    key={role.id}
                    className="flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                  >
                    <Shield className="mr-1 h-3.5 w-3.5" />
                    {role.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Authorization & Protected Route Verification Section */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Route Guard Verification */}
            <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="flex items-center text-sm font-bold uppercase tracking-wider text-foreground">
                <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
                Kiểm Tra Tuyến Đường Được Bảo Vệ (Protected Routes)
              </h3>
              <p className="text-xs text-muted-foreground">
                Nhấn các nút bên dưới để kiểm tra bộ lọc phân quyền. Nếu tài khoản không đủ quyền, hệ
                thống sẽ tự động chuyển hướng tới trang cảnh báo 403 Forbidden.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between rounded-lg border border-border bg-accent/30 p-3">
                  <div>
                    <div className="text-xs font-semibold text-foreground">
                      Trang Quản Trị Hệ Thống
                    </div>
                    <div className="text-xs text-muted-foreground">Yêu cầu vai trò: admin</div>
                  </div>
                  <Button
                    id="test-admin-route-button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/admin-only')}
                  >
                    <ExternalLink className="mr-1 h-3.5 w-3.5" /> Truy cập
                  </Button>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border bg-accent/30 p-3">
                  <div>
                    <div className="text-xs font-semibold text-foreground">
                      Khu Vực Lập Kế Hoạch SX
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Yêu cầu quyền: production.plan.create
                    </div>
                  </div>
                  <Button
                    id="test-plan-route-button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/production-plan-gate')}
                  >
                    <ExternalLink className="mr-1 h-3.5 w-3.5" /> Truy cập
                  </Button>
                </div>
              </div>
            </div>

            {/* Declarative Permission Gating */}
            <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
              <h3 className="flex items-center text-sm font-bold uppercase tracking-wider text-foreground">
                <KeyRound className="mr-2 h-4 w-4 text-muted-foreground" />
                Phân Quyền Phần Tử Giao Diện (PermissionGate)
              </h3>
              <p className="text-xs text-muted-foreground">
                Các phần tử dưới đây được render động theo quyền hạn thực tế của tài khoản:
              </p>

              <div className="space-y-3 pt-2">
                <PermissionGate
                  permission="production.plan.approve"
                  fallback={
                    <div className="flex items-center rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
                      <AlertTriangle className="mr-2 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      <span>
                        Nút &quot;Phê duyệt Kế hoạch Tháng&quot; bị ẩn (Yêu cầu quyền:
                        production.plan.approve)
                      </span>
                    </div>
                  }
                >
                  <div className="flex items-center rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                    <CheckCircle2 className="mr-2 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>Bạn có quyền: Phê duyệt Kế hoạch Sản xuất Tháng</span>
                  </div>
                </PermissionGate>

                <PermissionGate
                  permission="production.shift.write"
                  fallback={
                    <div className="flex items-center rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
                      <AlertTriangle className="mr-2 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      <span>Quyền nhập chỉ số ca vận hành: Chưa được cấp</span>
                    </div>
                  }
                >
                  <div className="flex items-center rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                    <Unlock className="mr-2 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>Bạn có quyền: Nhập liệu ca vận hành (Cân, điện, downtime)</span>
                  </div>
                </PermissionGate>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
};
