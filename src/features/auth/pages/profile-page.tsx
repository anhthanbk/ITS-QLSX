import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Mail, Shield, KeyRound, LogOut, CheckCircle, ArrowLeft } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  const initials = user.profile?.full_name
    ? user.profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Back Link */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại bảng điều khiển
          </Button>
        </div>

        {/* Profile Card */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex h-28 items-end bg-gradient-to-r from-blue-600 to-indigo-600 px-6">
            <div className="flex translate-y-1/2 items-center space-x-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-white text-2xl font-bold text-blue-700 shadow-md">
                {initials}
              </div>
            </div>
          </div>

          <div className="space-y-6 px-6 pb-6 pt-14">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  {user.profile?.full_name || 'Người dùng hệ thống'}
                </h1>
                <p className="mt-1 flex items-center text-sm text-slate-500">
                  <Mail className="mr-1.5 h-4 w-4 text-slate-400" />
                  {user.email}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  id="profile-logout-button"
                  variant="destructive"
                  size="sm"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-1.5 h-4 w-4" />
                  Đăng xuất
                </Button>
              </div>
            </div>

            {/* Roles Section */}
            <div className="border-t border-slate-100 pt-4">
              <h2 className="mb-3 flex items-center text-xs font-semibold uppercase tracking-wider text-slate-700">
                <Shield className="mr-1.5 h-4 w-4 text-blue-600" />
                Vai trò được gán (Roles)
              </h2>
              <div className="flex flex-wrap gap-2">
                {user.roles.length > 0 ? (
                  user.roles.map((role) => (
                    <span
                      key={role.id}
                      className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                    >
                      <CheckCircle className="mr-1 h-3.5 w-3.5 text-blue-600" />
                      {role.name} ({role.code})
                    </span>
                  ))
                ) : (
                  <span className="text-xs italic text-slate-500">Chưa được gán vai trò</span>
                )}
              </div>
            </div>

            {/* Permissions Section */}
            <div className="border-t border-slate-100 pt-4">
              <h2 className="mb-3 flex items-center text-xs font-semibold uppercase tracking-wider text-slate-700">
                <KeyRound className="mr-1.5 h-4 w-4 text-emerald-600" />
                Quyền hạn hoạt động ({user.permissions.length} quyền)
              </h2>
              <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto p-1">
                {user.permissions.length > 0 ? (
                  user.permissions.map((perm) => (
                    <span
                      key={perm}
                      className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-700"
                    >
                      {perm}
                    </span>
                  ))
                ) : (
                  <span className="text-xs italic text-slate-500">Không có quyền trực tiếp</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
