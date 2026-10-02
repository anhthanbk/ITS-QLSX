import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft, Home, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/use-auth';

export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();

  const requiredPermission = (location.state as { requiredPermission?: string })
    ?.requiredPermission;
  const requiredRole = (location.state as { requiredRole?: string })?.requiredRole;

  return (
    <div
      id="forbidden-container"
      className="flex min-h-screen items-center justify-center bg-slate-50 p-4"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
          <ShieldAlert className="h-8 w-8" />
        </div>

        <span className="mb-2 inline-block rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
          Lỗi 403 &bull; Quyền truy cập bị từ chối
        </span>

        <h1 className="mt-2 text-xl font-bold text-slate-900">
          Bạn không có quyền truy cập khu vực này
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Tài khoản hiện tại của bạn không có đủ thẩm quyền hoặc vai trò cần thiết để thực hiện thao
          tác này.
        </p>

        {(requiredPermission || requiredRole) && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-left text-xs">
            {requiredPermission && (
              <div>
                <span className="font-semibold text-slate-700">Quyền hạn yêu cầu:</span>{' '}
                <span className="rounded border border-red-100 bg-red-50 px-1.5 py-0.5 font-mono text-red-600">
                  {requiredPermission}
                </span>
              </div>
            )}
            {requiredRole && (
              <div className="mt-1">
                <span className="font-semibold text-slate-700">Vai trò yêu cầu:</span>{' '}
                <span className="rounded border border-red-100 bg-red-50 px-1.5 py-0.5 font-mono text-red-600">
                  {requiredRole}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            id="forbidden-back-button"
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Quay lại
          </Button>

          <Button
            id="forbidden-home-button"
            variant="default"
            size="sm"
            onClick={() => navigate('/')}
            className="w-full sm:w-auto"
          >
            <Home className="mr-1.5 h-4 w-4" />
            Bảng điều khiển
          </Button>
        </div>

        {user && (
          <div className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-400">
            Đang đăng nhập với: <span className="font-medium text-slate-600">{user.email}</span>
            <button
              onClick={async () => {
                await signOut();
                navigate('/login');
              }}
              className="ml-2 inline-flex items-center text-primary hover:underline"
            >
              <LogOut className="mr-0.5 h-3 w-3" /> Đổi tài khoản
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
