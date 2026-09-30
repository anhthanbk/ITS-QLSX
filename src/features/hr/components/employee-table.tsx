import React from 'react';
import {
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Employee, PaginatedResult } from '../types';
import { useAuth } from '@/features/auth/hooks/use-auth';

export interface EmployeeTableProps {
  data?: PaginatedResult<Employee>;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onPageChange: (newPage: number) => void;
  onViewDetail: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  data,
  isLoading,
  isError,
  onRetry,
  onPageChange,
  onViewDetail,
  onEdit,
  onDelete,
}) => {
  const { hasRole, hasPermission } = useAuth();
  const canManage = hasRole('admin') || hasPermission('hr.employee.manage') || hasPermission('master_data.manage');

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-4 animate-pulse">
          <div className="h-10 bg-accent/40 rounded-lg" />
          <div className="h-12 bg-accent/30 rounded-lg" />
          <div className="h-12 bg-accent/30 rounded-lg" />
          <div className="h-12 bg-accent/30 rounded-lg" />
          <div className="h-12 bg-accent/30 rounded-lg" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <h3 className="mt-2 text-sm font-semibold text-foreground">Không thể tải dữ liệu nhân viên</h3>
        <p className="mt-1 text-xs text-muted-foreground">Đã xảy ra sự cố khi kết nối tới cơ sở dữ liệu.</p>
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
          Thử lại
        </Button>
      </div>
    );
  }

  const employees = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;
  const page = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;
  const pageSize = data?.pageSize ?? 10;

  if (employees.length === 0) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Users className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-sm font-bold text-foreground">Chưa có nhân viên nào</h3>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          Không tìm thấy thông tin nhân sự phù hợp với bộ lọc hiện tại hoặc hệ thống chưa có dữ liệu.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs" id="employee-data-table">
          <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
            <tr>
              <th className="py-3.5 pl-4 pr-3 sm:pl-6">Mã NV</th>
              <th className="px-3 py-3.5">Họ và Tên</th>
              <th className="px-3 py-3.5">Phòng ban</th>
              <th className="px-3 py-3.5">Chức danh</th>
              <th className="px-3 py-3.5">Liên hệ</th>
              <th className="px-3 py-3.5">Ngày vào</th>
              <th className="px-3 py-3.5">Trạng thái</th>
              <th className="py-3.5 pl-3 pr-4 sm:pr-6 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {employees.map((emp) => {
              const fullName = `${emp.last_name} ${emp.first_name}`;
              const initial = emp.first_name.charAt(0).toUpperCase() || 'E';

              const statusBadge = {
                active: (
                  <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400">
                    Đang làm việc
                  </span>
                ),
                on_leave: (
                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-400">
                    Nghỉ phép
                  </span>
                ),
                terminated: (
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                    Đã thôi việc
                  </span>
                ),
              }[emp.status];

              return (
                <tr
                  key={emp.id}
                  className="transition-colors hover:bg-muted/30"
                  data-testid={`employee-row-${emp.employee_code}`}
                >
                  {/* Employee Code */}
                  <td className="py-3.5 pl-4 pr-3 font-mono font-bold text-foreground sm:pl-6">
                    {emp.employee_code}
                  </td>

                  {/* Name with initials avatar */}
                  <td className="px-3 py-3.5 font-medium text-foreground">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                        {initial}
                      </div>
                      <span className="truncate">{fullName}</span>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="px-3 py-3.5 text-muted-foreground">
                    <span className="inline-flex items-center rounded-md bg-accent px-2 py-0.5 text-[11px] font-medium text-foreground">
                      {emp.departments?.name || 'Chưa phân bổ'}
                    </span>
                  </td>

                  {/* Position */}
                  <td className="px-3 py-3.5 text-foreground font-medium">
                    {emp.positions?.title || 'Chưa phân bổ'}
                  </td>

                  {/* Contact */}
                  <td className="px-3 py-3.5 text-muted-foreground">
                    <div>{emp.phone || '—'}</div>
                    <div className="text-[10px] text-muted-foreground/80">{emp.email || ''}</div>
                  </td>

                  {/* Hire Date */}
                  <td className="px-3 py-3.5 text-muted-foreground font-mono">
                    {emp.hire_date}
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3.5">{statusBadge}</td>

                  {/* Actions */}
                  <td className="py-3.5 pl-3 pr-4 sm:pr-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewDetail(emp)}
                        title="Xem chi tiết"
                        className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>

                      {canManage && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(emp)}
                            title="Chỉnh sửa"
                            className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(emp)}
                            title="Xóa nhân viên"
                            className="h-7 w-7 rounded-md text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-xs text-muted-foreground">
          Hiển thị{' '}
          <span className="font-semibold text-foreground">
            {totalCount > 0 ? (page - 1) * pageSize + 1 : 0}
          </span>{' '}
          -{' '}
          <span className="font-semibold text-foreground">
            {Math.min(page * pageSize, totalCount)}
          </span>{' '}
          trong tổng số <span className="font-semibold text-foreground">{totalCount}</span> nhân viên
        </p>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="h-7 px-2 text-xs"
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
            Trước
          </Button>

          <span className="px-2 text-xs font-medium text-foreground">
            Trang {page} / {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="h-7 px-2 text-xs"
          >
            Sau
            <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
