import React from 'react';
import { Eye, Edit, Trash2, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ProductionMonthlyPlan } from '../types';
import { PlanStatusBadge } from './production-status-badge';

interface ProductionPlanTableProps {
  data: ProductionMonthlyPlan[];
  isLoading: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onView: (plan: ProductionMonthlyPlan) => void;
  onEdit: (plan: ProductionMonthlyPlan) => void;
  onDelete: (plan: ProductionMonthlyPlan) => void;
  onApprove?: (plan: ProductionMonthlyPlan) => void;
  canManage: boolean;
  canApprove: boolean;
}

export const ProductionPlanTable: React.FC<ProductionPlanTableProps> = ({
  data,
  isLoading,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  onApprove,
  canManage,
  canApprove,
}) => {
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card">
        <div className="flex flex-col items-center gap-2">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs text-muted-foreground">Đang tải kế hoạch sản xuất...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-6 text-center">
        <p className="text-sm font-medium text-foreground">Không tìm thấy kế hoạch sản xuất nào</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Thử thay đổi bộ lọc tìm kiếm hoặc tạo kế hoạch sản xuất mới cho dây chuyền.
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
              <th className="px-4 py-3">Mã kế hoạch</th>
              <th className="px-4 py-3">Dây chuyền</th>
              <th className="px-4 py-3">Kỳ kế hoạch</th>
              <th className="px-4 py-3 text-right">Công suất (TPH)</th>
              <th className="px-4 py-3 text-right">Giờ vận hành</th>
              <th className="px-4 py-3 text-right">Quặng cấp (Tấn)</th>
              <th className="px-4 py-3 text-right">Thành phẩm (Tấn)</th>
              <th className="px-4 py-3 text-right">Thu hồi (%)</th>
              <th className="px-4 py-3 text-center">Trạng thái</th>
              <th className="px-4 py-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-foreground">
            {data.map((plan) => (
              <tr key={plan.id} className="transition-colors hover:bg-muted/30">
                <td className="px-4 py-3 font-semibold text-primary">{plan.plan_code}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{plan.line_name || '---'}</div>
                  <span className="text-[11px] text-muted-foreground">{plan.line_code}</span>
                </td>
                <td className="px-4 py-3 font-medium">
                  Tháng {plan.month}/{plan.year}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {plan.planned_capacity_tph.toFixed(1)}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {plan.planned_operating_hours ?? plan.total_calendar_hours}h /{' '}
                  {plan.total_calendar_hours}h
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {plan.planned_input_material_tons.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                  {plan.planned_output_product_tons.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {plan.planned_recovery_rate_pct.toFixed(1)}%
                </td>
                <td className="px-4 py-3 text-center">
                  <PlanStatusBadge status={plan.status} />
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onView(plan)}
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="Xem chi tiết"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    {canApprove && plan.status === 'draft' && onApprove && (
                      <button
                        type="button"
                        onClick={() => onApprove(plan)}
                        className="rounded p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50"
                        title="Phê duyệt kế hoạch"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {canManage && plan.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => onEdit(plan)}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="Chỉnh sửa kế hoạch"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {canManage && plan.status === 'draft' && (
                      <button
                        type="button"
                        onClick={() => onDelete(plan)}
                        className="rounded p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                        title="Xóa kế hoạch"
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
          trong tổng số <span className="font-medium text-foreground">{totalCount}</span> kế hoạch
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
