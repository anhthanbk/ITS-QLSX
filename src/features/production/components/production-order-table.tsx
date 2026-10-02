import React from 'react';
import { Eye, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ProductionOrder } from '../types';
import { OrderStatusBadge, OrderPriorityBadge } from './production-status-badge';

interface ProductionOrderTableProps {
  data: ProductionOrder[];
  isLoading: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onView: (order: ProductionOrder) => void;
  onEdit: (order: ProductionOrder) => void;
  onDelete: (order: ProductionOrder) => void;
  canManage: boolean;
}

export const ProductionOrderTable: React.FC<ProductionOrderTableProps> = ({
  data,
  isLoading,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  canManage,
}) => {
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card">
        <div className="flex flex-col items-center gap-2">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs text-muted-foreground">Đang tải lệnh sản xuất...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-6 text-center">
        <p className="text-sm font-medium text-foreground">Không tìm thấy lệnh sản xuất nào</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Thử thay đổi bộ lọc tìm kiếm hoặc phát hành lệnh sản xuất mới.
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
              <th className="px-4 py-3">Mã lệnh (LSX)</th>
              <th className="px-4 py-3">Sản phẩm cần sản xuất</th>
              <th className="px-4 py-3">Dây chuyền</th>
              <th className="px-4 py-3 text-right">Mục tiêu (Tấn)</th>
              <th className="px-4 py-3 text-right">Đã hoàn thành</th>
              <th className="px-4 py-3 text-center">Tiến độ</th>
              <th className="px-4 py-3">Kế hoạch</th>
              <th className="px-4 py-3 text-center">Độ ưu tiên</th>
              <th className="px-4 py-3 text-center">Trạng thái</th>
              <th className="px-4 py-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-foreground">
            {data.map((order) => {
              const progressPct =
                order.target_quantity > 0
                  ? Math.min(100, Math.round((order.completed_quantity / order.target_quantity) * 100))
                  : 0;

              return (
                <tr key={order.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3 font-semibold text-primary">{order.order_number}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{order.product_name || '---'}</div>
                    <span className="text-[11px] text-muted-foreground">{order.product_sku}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{order.line_name || '---'}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {order.target_quantity.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                    {order.completed_quantity.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-medium">{progressPct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-muted-foreground">
                    {new Date(order.planned_start_date).toLocaleDateString()} -{' '}
                    {new Date(order.planned_end_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <OrderPriorityBadge priority={order.priority} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onView(order)}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="Xem chi tiết & lô sản xuất"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      {canManage && (
                        <>
                          <button
                            type="button"
                            onClick={() => onEdit(order)}
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                            title="Chỉnh sửa lệnh"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          {(order.status === 'draft' || order.status === 'scheduled') && (
                            <button
                              type="button"
                              onClick={() => onDelete(order)}
                              className="rounded p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                              title="Xóa lệnh"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
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
          trong tổng số <span className="font-medium text-foreground">{totalCount}</span> lệnh sản
          xuất
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
