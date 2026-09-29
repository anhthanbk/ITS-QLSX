import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { Button } from '@/components/ui/button';
import { PermissionGate } from './permission-gate';
import {
  Shield,
  KeyRound,
  User,
  LogOut,
  ExternalLink,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const DashboardOverview: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div id="dashboard-root" className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      {/* Top Header */}
      <header className="shadow-xs sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 font-bold text-white shadow-md shadow-blue-500/20">
              ITS
            </div>
            <div>
              <h1 className="text-base font-semibold leading-none tracking-tight text-slate-900">
                ITS QLSX - Quản Lý Sản Xuất
              </h1>
              <p className="mt-1 text-xs text-slate-500">Hệ Thống Xác Thực & Phân Quyền</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              id="header-profile-button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/profile')}
              className="text-xs"
            >
              <User className="mr-1.5 h-3.5 w-3.5" />
              <span>{user?.profile?.full_name || user?.email}</span>
            </Button>
            <Button
              id="header-logout-button"
              variant="destructive"
              size="sm"
              onClick={handleSignOut}
              className="text-xs"
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Phiên đăng nhập hợp lệ
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Xin chào, {user?.profile?.full_name || user?.email}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Tài khoản ID: <span className="font-mono text-xs text-slate-500">{user?.id}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {user?.roles.map((role) => (
                <span
                  key={role.id}
                  className="flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
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
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="flex items-center text-sm font-bold uppercase tracking-wider text-slate-900">
              <Lock className="mr-2 h-4 w-4 text-slate-600" />
              Kiểm Tra Tuyến Đường Được Bảo Vệ (Protected Routes)
            </h3>
            <p className="text-xs text-slate-600">
              Nhấn các nút bên dưới để kiểm tra bộ lọc phân quyền. Nếu tài khoản không đủ quyền, hệ
              thống sẽ tự động chuyển hướng tới trang cảnh báo 403 Forbidden.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    Trang Quản Trị Hệ Thống
                  </div>
                  <div className="text-xs text-slate-500">Yêu cầu vai trò: admin</div>
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

              <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    Khu Vực Lập Kế Hoạch SX
                  </div>
                  <div className="text-xs text-slate-500">
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
          <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="flex items-center text-sm font-bold uppercase tracking-wider text-slate-900">
              <KeyRound className="mr-2 h-4 w-4 text-slate-600" />
              Phân Quyền Phần Tử Giao Diện (PermissionGate)
            </h3>
            <p className="text-xs text-slate-600">
              Các phần tử dưới đây được render động theo quyền hạn thực tế của tài khoản:
            </p>

            <div className="space-y-3 pt-2">
              <PermissionGate
                permission="production.plan.approve"
                fallback={
                  <div className="flex items-center rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    <AlertTriangle className="mr-2 h-4 w-4 flex-shrink-0 text-amber-600" />
                    <span>
                      Nút &quot;Phê duyệt Kế hoạch Tháng&quot; bị ẩn (Yêu cầu quyền:
                      production.plan.approve)
                    </span>
                  </div>
                }
              >
                <div className="flex items-center rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                  <CheckCircle2 className="mr-2 h-4 w-4 flex-shrink-0 text-emerald-600" />
                  <span>Bạn có quyền: Phê duyệt Kế hoạch Sản xuất Tháng</span>
                </div>
              </PermissionGate>

              <PermissionGate
                permission="production.shift.write"
                fallback={
                  <div className="flex items-center rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    <AlertTriangle className="mr-2 h-4 w-4 flex-shrink-0 text-amber-600" />
                    <span>Quyền nhập chỉ số ca vận hành: Chưa được cấp</span>
                  </div>
                }
              >
                <div className="flex items-center rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                  <Unlock className="mr-2 h-4 w-4 flex-shrink-0 text-emerald-600" />
                  <span>Bạn có quyền: Nhập liệu ca vận hành (Cân, điện, downtime)</span>
                </div>
              </PermissionGate>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
