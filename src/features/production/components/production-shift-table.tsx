import React from 'react';
import { Eye, Edit, Trash2, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ProductionShift } from '../types';
import { ShiftStatusBadge } from './production-status-badge';

interface ProductionShiftTableProps {
  data: ProductionShift[];
  isLoading: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onView: (shift: ProductionShift) => void;
  onEdit: (shift: ProductionShift) => void;
  onDelete: (shift: ProductionShift) => void;
  onVerify?: (shift: ProductionShift) => void;
  canManage: boolean;
  canVerify: boolean;
}

export const ProductionShiftTable: React.FC<ProductionShiftTableProps> = ({
  data,
  isLoading,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  onVerify,
  canManage,
  canVerify,
}) => {
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card">
        <div className="flex flex-col items-center gap-2">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs text-muted-foreground">Đang tải nhật ký ca sản xuất...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-6 text-center">
        <p className="text-sm font-medium text-foreground">Không tìm thấy ca sản xuất nào</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Thử thay đổi điều kiện lọc hoặc tạo nhật ký ca sản xuất mới.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border bg-muted/40 font-medium text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Mã ca</th>
              <th className="px-4 py-3">Ngày & Ca</th>
              <th className="px-4 py-3">Dây chuyền</th>
              <th className="px-4 py-3 text-right">Giờ chạy / Dừng</th>
              <th className="px-4 py-3 text-right">Quặng cấp (Tấn)</th>
              <th className="px-4 py-3 text-right">Thành phẩm (Tấn)</th>
              <th className="px-4 py-3 text-right">Công suất (TPH)</th>
              <th className="px-4 py-3 text-right">Thu hồi (%)</th>
              <th className="px-4 py-3">Trưởng ca</th>
              <th className="px-4 py-3 text-center">Trạng thái</th>
              <th className="px-4 py-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-foreground">
            {data.map((shift) => (
              <tr key={shift.id} className="transition-colors hover:bg-muted/30">
                <td className="px-4 py-3 font-semibold text-primary">{shift.shift_code}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{shift.shift_date}</div>
                  <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    Ca {shift.shift_number}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">{shift.line_name || '---'}</td>
                <td className="px-4 py-3 text-right">
                  <span className="font-semibold text-foreground">
                    {shift.running_hours ?? shift.standard_shift_hours - shift.total_downtime_hours}
                    h
                  </span>
                  <span className="text-[11px] text-rose-500">
                    {' '}
                    ({shift.total_downtime_hours}h dừng)
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {shift.raw_material_input_tons.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                  {shift.product_output_tons.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {shift.actual_capacity_tph ?? '---'}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {shift.actual_recovery_rate_pct ? `${shift.actual_recovery_rate_pct}%` : '---'}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{shift.operator_name || '---'}</td>
                <td className="px-4 py-3 text-center">
                  <ShiftStatusBadge status={shift.status} />
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onView(shift)}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="Xem chi tiết ca"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    {canVerify && shift.status !== 'verified' && onVerify && (
                      <button
                        type="button"
                        onClick={() => onVerify(shift)}
                        className="rounded p-1 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                        title="Nghiệm thu ca"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {canManage && shift.status !== 'verified' && (
                      <button
                        type="button"
                        onClick={() => onEdit(shift)}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="Chỉnh sửa ca"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {canManage && shift.status === 'in_progress' && (
                      <button
                        type="button"
                        onClick={() => onDelete(shift)}
                        className="rounded p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                        title="Xóa ca"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
        <div>
          Hiển thị{' '}
          <span className="font-medium text-foreground">
            {Math.min((page - 1) * pageSize + 1, totalCount)}
          </span>{' '}
          đến{' '}
          <span className="font-medium text-foreground">
            {Math.min(page * pageSize, totalCount)}
          </span>{' '}
          trong tổng số <span className="font-medium text-foreground">{totalCount}</span> ca vận
          hành
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground disabled:opacity-50"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Trước
          </button>
          <span className="px-2 font-medium text-foreground">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground disabled:opacity-50"
          >
            Sau
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
