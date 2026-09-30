import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  X,
  Loader2,
  KeyRound,
  Shield,
  UserCheck,
  UserX,
  Lock,
  Unlink,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  provisionAccountSchema,
  type ProvisionAccountFormValues,
} from '../validation/hr-schemas';
import type { Employee } from '../types';
import {
  useProvisionAccount,
  useUnlinkAccount,
  useToggleUserStatus,
  useChangeUserRole,
  useResetUserPassword,
  useRoles,
} from '../hooks/use-employees';

export interface EmployeeAccountModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeeAccountModal: React.FC<EmployeeAccountModalProps> = ({
  employee,
  isOpen,
  onClose,
}) => {
  const { data: roles } = useRoles();
  const provisionMutation = useProvisionAccount();
  const unlinkMutation = useUnlinkAccount();
  const toggleStatusMutation = useToggleUserStatus();
  const changeRoleMutation = useChangeUserRole();
  const resetPasswordMutation = useResetUserPassword();

  const [activeTab, setActiveTab] = useState<'info' | 'reset-password'>('info');
  const [newPassword, setNewPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const account = employee?.account;
  const currentRoleCode = account?.roles?.[0]?.code || 'operator';

  // Form for initial provisioning
  const {
    register,
    handleSubmit,
    reset: resetProvisionForm,
    formState: { errors: provisionErrors },
  } = useForm<ProvisionAccountFormValues>({
    resolver: zodResolver(provisionAccountSchema),
    values: {
      email: employee?.email || '',
      password: '',
      role_code: 'operator',
    },
  });

  if (!isOpen || !employee) return null;

  const handleProvisionSubmit = async (values: ProvisionAccountFormValues) => {
    try {
      await provisionMutation.mutateAsync({
        employeeId: employee.id,
        email: values.email,
        password: values.password,
        roleCode: values.role_code,
      });
      resetProvisionForm();
      onClose();
    } catch {
      // Error handled by hook onError toast
    }
  };

  const handleUnlink = async () => {
    if (
      !window.confirm(
        `Xác nhận hủy liên kết tài khoản khỏi nhân viên ${employee.last_name} ${employee.first_name}?`,
      )
    ) {
      return;
    }
    try {
      await unlinkMutation.mutateAsync(employee.id);
      onClose();
    } catch {
      // Handled by hook
    }
  };

  const handleToggleStatus = async () => {
    if (!account) return;
    const targetStatus = account.status === 'active' ? 'suspended' : 'active';
    try {
      await toggleStatusMutation.mutateAsync({
        userId: account.id,
        status: targetStatus,
      });
    } catch {
      // Handled by hook
    }
  };

  const handleChangeRole = async (newRole: string) => {
    if (!account || newRole === currentRoleCode) return;
    try {
      await changeRoleMutation.mutateAsync({
        userId: account.id,
        roleCode: newRole,
      });
    } catch {
      // Handled by hook
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || newPassword.length < 6) return;
    try {
      await resetPasswordMutation.mutateAsync({
        userId: account.id,
        newPassword,
      });
      setNewPassword('');
      setActiveTab('info');
    } catch {
      // Handled by hook
    }
  };

  const isBusy =
    provisionMutation.isPending ||
    unlinkMutation.isPending ||
    toggleStatusMutation.isPending ||
    changeRoleMutation.isPending ||
    resetPasswordMutation.isPending;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="employee-account-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in-50 zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 id="employee-account-modal-title" className="text-sm font-bold text-foreground">
                Quản Lý Tài Khoản Đăng Nhập
              </h3>
              <p className="text-xs text-muted-foreground">
                {employee.last_name} {employee.first_name} ({employee.employee_code})
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Đóng"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Case 1: Employee does NOT have an account yet */}
        {!account ? (
          <form onSubmit={handleSubmit(handleProvisionSubmit)} className="mt-4 space-y-4">
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3.5 flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Nhân viên này hiện chưa được cấp tài khoản phần mềm. Vui lòng thiết lập thông tin
                đăng nhập dưới đây.
              </span>
            </div>

            <div className="space-y-1">
              <label htmlFor="prov-email" className="text-xs font-semibold text-foreground">
                Email đăng nhập <span className="text-destructive">*</span>
              </label>
              <input
                id="prov-email"
                type="email"
                placeholder="VD: an.nguyen@its-qlsx.vn"
                {...register('email')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {provisionErrors.email && (
                <p className="text-[11px] text-destructive">{provisionErrors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="prov-role" className="text-xs font-semibold text-foreground">
                  Vai trò hệ thống <span className="text-destructive">*</span>
                </label>
                <select
                  id="prov-role"
                  {...register('role_code')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {roles && roles.length > 0 ? (
                    roles.map((r) => (
                      <option key={r.id} value={r.code}>
                        {r.name} ({r.code})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="operator">Công nhân vận hành (operator)</option>
                      <option value="shift_leader">Trưởng ca sản xuất (shift_leader)</option>
                      <option value="plant_manager">Quản đốc nhà máy (plant_manager)</option>
                      <option value="qc_inspector">Kiểm phẩm KCS (qc_inspector)</option>
                      <option value="warehouse_keeper">Thủ kho vật tư (warehouse_keeper)</option>
                      <option value="admin">Quản trị hệ thống (admin)</option>
                    </>
                  )}
                </select>
                {provisionErrors.role_code && (
                  <p className="text-[11px] text-destructive">{provisionErrors.role_code.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="prov-password" className="text-xs font-semibold text-foreground">
                  Mật khẩu khởi tạo <span className="text-destructive">*</span>
                </label>
                <input
                  id="prov-password"
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                  {...register('password')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {provisionErrors.password && (
                  <p className="text-[11px] text-destructive">{provisionErrors.password.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isBusy}>
                Hủy
              </Button>
              <Button
                id="submit-provision-account-btn"
                type="submit"
                size="sm"
                disabled={isBusy}
                className="flex items-center gap-1.5"
              >
                {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Cấp tài khoản ngay</span>
              </Button>
            </div>
          </form>
        ) : (
          /* Case 2: Employee ALREADY HAS an account */
          <div className="mt-4 space-y-4">
            {/* Account Status Card */}
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground">Email tài khoản:</span>
                  <p className="text-xs font-bold text-foreground">{employee.email}</p>
                </div>
                <div>
                  <span
                    className={
                      account.status === 'active'
                        ? 'inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                    }
                  >
                    {account.status === 'active' ? (
                      <>
                        <UserCheck className="h-3 w-3" />
                        <span>Đang hoạt động</span>
                      </>
                    ) : (
                      <>
                        <UserX className="h-3 w-3" />
                        <span>Đã khóa</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Role selection */}
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  <span>Vai trò hệ thống:</span>
                </span>
                <select
                  value={selectedRole || currentRoleCode}
                  onChange={(e) => {
                    setSelectedRole(e.target.value);
                    handleChangeRole(e.target.value);
                  }}
                  disabled={isBusy}
                  className="rounded-lg border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                >
                  {roles && roles.length > 0 ? (
                    roles.map((r) => (
                      <option key={r.id} value={r.code}>
                        {r.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="operator">Công nhân vận hành</option>
                      <option value="shift_leader">Trưởng ca sản xuất</option>
                      <option value="plant_manager">Quản đốc nhà máy</option>
                      <option value="qc_inspector">Kiểm phẩm KCS</option>
                      <option value="warehouse_keeper">Thủ kho vật tư</option>
                      <option value="admin">Quản trị hệ thống</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Quick Actions Tabs */}
            <div className="flex border-b border-border text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className={`pb-2 px-3 border-b-2 transition-colors ${
                  activeTab === 'info'
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Trạng thái & Quản trị
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('reset-password')}
                className={`pb-2 px-3 border-b-2 transition-colors ${
                  activeTab === 'reset-password'
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Đặt lại mật khẩu
              </button>
            </div>

            {activeTab === 'info' ? (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                  <div>
                    <h5 className="text-xs font-bold text-foreground">
                      {account.status === 'active' ? 'Tạm khóa tài khoản' : 'Kích hoạt tài khoản'}
                    </h5>
                    <p className="text-[11px] text-muted-foreground">
                      {account.status === 'active'
                        ? 'Chặn nhân viên đăng nhập vào hệ thống'
                        : 'Cho phép nhân viên tiếp tục đăng nhập'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={account.status === 'active' ? 'destructive' : 'outline'}
                    onClick={handleToggleStatus}
                    disabled={isBusy}
                  >
                    {account.status === 'active' ? 'Khóa truy cập' : 'Mở khóa'}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                  <div>
                    <h5 className="text-xs font-bold text-foreground">Hủy liên kết tài khoản</h5>
                    <p className="text-[11px] text-muted-foreground">
                      Tách tài khoản khỏi hồ sơ nhân sự này
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleUnlink}
                    disabled={isBusy}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <Unlink className="h-3.5 w-3.5" />
                    <span>Hủy liên kết</span>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label htmlFor="reset-pwd" className="text-xs font-semibold text-foreground">
                    Mật khẩu mới <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="reset-pwd"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('info')}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={newPassword.length < 6 || isBusy}
                    className="flex items-center gap-1.5"
                  >
                    {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <Lock className="h-3.5 w-3.5" />
                    <span>Lưu mật khẩu mới</span>
                  </Button>
                </div>
              </form>
            )}

            <div className="flex items-center justify-end pt-3 border-t border-border">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
