import React from 'react';
import {
  X,
  Building2,
  Briefcase,
  Phone,
  Mail,
  Calendar,
  UserCheck,
  Edit,
  Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Employee } from '../types';
import { useAuth } from '@/features/auth/hooks/use-auth';

export interface EmployeeDetailModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (employee: Employee) => void;
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  employee,
  isOpen,
  onClose,
  onEdit,
}) => {
  const { hasRole, hasPermission } = useAuth();
  const canManage = hasRole('admin') || hasPermission('hr.employee.manage') || hasPermission('master_data.manage');

  if (!isOpen || !employee) return null;

  const fullName = `${employee.last_name} ${employee.first_name}`;
  const initial = employee.first_name.charAt(0).toUpperCase() || 'E';

  const statusBadge = {
    active: (
      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400">
        Đang làm việc
      </span>
    ),
    on_leave: (
      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-400">
        Nghỉ phép
      </span>
    ),
    terminated: (
      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        Đã thôi việc
      </span>
    ),
  }[employee.status];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="employee-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in-50 zoom-in-95">
        {/* Banner with user avatar */}
        <div className="flex h-20 items-end bg-gradient-to-r from-primary/80 to-primary px-6">
          <div className="flex translate-y-1/2 items-center justify-between w-full">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-card bg-primary/10 text-xl font-bold text-primary shadow-md">
              {initial}
            </div>
            <Button
              variant="secondary"
              size="icon"
              onClick={onClose}
              aria-label="Đóng"
              className="h-8 w-8 rounded-full bg-card/90 shadow text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-10 space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <h2 id="employee-detail-title" className="text-lg font-bold text-foreground">
                {fullName}
              </h2>
              {statusBadge}
            </div>
            <p className="font-mono text-xs text-muted-foreground mt-0.5">
              Mã NV: <span className="font-semibold text-foreground">{employee.employee_code}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-border bg-muted/20 p-4">
            {/* Department */}
            <div className="flex items-start gap-2.5">
              <Building2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] text-muted-foreground font-medium">Phòng ban</span>
                <p className="text-xs font-semibold text-foreground">
                  {employee.departments?.name || 'Chưa gán'}
                </p>
              </div>
            </div>

            {/* Position */}
            <div className="flex items-start gap-2.5">
              <Briefcase className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] text-muted-foreground font-medium">Chức danh</span>
                <p className="text-xs font-semibold text-foreground">
                  {employee.positions?.title || 'Chưa gán'}
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-2.5">
              <Phone className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] text-muted-foreground font-medium">Số điện thoại</span>
                <p className="text-xs font-semibold text-foreground">{employee.phone || 'Chưa có'}</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-2.5">
              <Mail className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] text-muted-foreground font-medium">Email</span>
                <p className="text-xs font-semibold text-foreground truncate max-w-[170px]">
                  {employee.email || 'Chưa có'}
                </p>
              </div>
            </div>

            {/* Hire Date */}
            <div className="flex items-start gap-2.5">
              <Calendar className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] text-muted-foreground font-medium">Ngày vào làm</span>
                <p className="text-xs font-semibold text-foreground font-mono">{employee.hire_date}</p>
              </div>
            </div>

            {/* Direct Manager */}
            <div className="flex items-start gap-2.5">
              <UserCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] text-muted-foreground font-medium">Quản lý trực tiếp</span>
                <p className="text-xs font-semibold text-foreground">
                  {employee.direct_manager
                    ? `${employee.direct_manager.last_name} ${employee.direct_manager.first_name}`
                    : 'Không có'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
            <Hash className="h-3.5 w-3.5" />
            <span>ID: {employee.id}</span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={onClose}>
              Đóng
            </Button>
            {canManage && (
              <Button
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(employee);
                }}
                className="flex items-center gap-1.5"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Chỉnh sửa hồ sơ</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
