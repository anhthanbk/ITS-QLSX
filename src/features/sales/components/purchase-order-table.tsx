import React from 'react';
import {
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Truck,
  AlertCircle,
  RefreshCw,
  PackageCheck,
} from 'lucide-react';
import type { PurchaseOrder, PaginatedResult, PurchaseOrderStatus } from '../types';
import { StatusBadge } from './sales-status-badge';
import { purchaseStatusLabels } from '../constants/sales-constants';
import { Button } from '@/components/ui/button';

interface PurchaseOrderTableProps {
  data?: PaginatedResult<PurchaseOrder>;
  isLoading: boolean;
  isError: boolean;
  canManage: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onViewDetail: (order: PurchaseOrder) => void;
  onEdit: (order: PurchaseOrder) => void;
  onDelete: (order: PurchaseOrder) => void;
  onStatusChange: (order: PurchaseOrder, status: PurchaseOrderStatus) => void;
  onReceiveGoods?: (order: PurchaseOrder) => void;
  onRetry?: () => void;
}

export const PurchaseOrderTable: React.FC<PurchaseOrderTableProps> = ({
  data,
  isLoading,
  isError,
  canManage,
  onPageChange,
  onPageSizeChange,
  onViewDetail,
  onEdit,
  onDelete,
  onStatusChange,
  onReceiveGoods,
  onRetry,
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mb-3" />
        <h3 className="text-base font-semibold text-foreground">Không thể tải danh sách đơn mua hàng</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Đã xảy ra lỗi khi truy vấn dữ liệu từ máy chủ. Vui lòng thử lại.
        </p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-4 gap-2">
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </Button>
        )}
      </div>
    );
  }

  const items = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const page = data?.page || 1;
  const pageSize = data?.pageSize || 10;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Mã đơn (PO)</th>
              <th className="px-4 py-3">Nhà cung cấp</th>
              <th className="px-4 py-3">Ngày đặt</th>
              <th className="px-4 py-3">Dự kiến giao</th>
              <th className="px-4 py-3 text-right">Tổng tiền</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-4"><div className="h-4 w-24 bg-muted rounded" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-44 bg-muted rounded" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-20 bg-muted rounded" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-20 bg-muted rounded" /></td>
                  <td className="px-4 py-4 text-right"><div className="h-4 w-24 bg-muted rounded ml-auto" /></td>
                  <td className="px-4 py-4"><div className="h-6 w-24 bg-muted rounded-full" /></td>
                  <td className="px-4 py-4"><div className="h-8 w-20 bg-muted rounded mx-auto" /></td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  <Truck className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-base font-medium text-foreground">Không có đơn đặt mua hàng nào</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Chưa có đơn đặt hàng PO phù hợp với bộ lọc hiện tại.
                  </p>
                </td>
              </tr>
            ) : (
              items.map((order) => (
                <tr
                  key={order.id}
                  className="transition-colors hover:bg-muted/30 focus-within:bg-muted/30"
                >
                  <td className="px-4 py-3.5 font-semibold text-primary">
                    <button
                      type="button"
                      onClick={() => onViewDetail(order)}
                      className="hover:underline focus:outline-none"
                    >
                      {order.po_code}
                    </button>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-foreground">{order.supplier?.name || '-'}</div>
                    <div className="text-xs text-muted-foreground">{order.supplier?.code}</div>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground">
                    {formatDate(order.order_date)}
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground">
                    {formatDate(order.expected_delivery_date)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-foreground">
                    {formatCurrency(order.total_amount)}
                  </td>
                  <td className="px-4 py-3.5">
                    {canManage ? (
                      <select
                        value={order.status}
                        onChange={(e) =>
                          onStatusChange(order, e.target.value as PurchaseOrderStatus)
                        }
                        className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        {Object.entries(purchaseStatusLabels).map(([val, label]) => (
                          <option key={val} value={val}>
                            {label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <StatusBadge status={order.status} type="purchase" />
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {onReceiveGoods &&
                        ['confirmed', 'sent', 'partially_received'].includes(order.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onReceiveGoods(order)}
                            className="h-8 gap-1 px-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800"
                            title="Nghiệm thu & Nhập kho hàng về"
                          >
                            <PackageCheck className="h-3.5 w-3.5" />
                            <span>Nhập kho</span>
                          </Button>
                        )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetail(order)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        title="Xem chi tiết đơn mua"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {canManage && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(order)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            title="Chỉnh sửa đơn mua"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(order)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            title="Xóa đơn mua"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground sm:flex-row">
        <div>
          Hiển thị <span className="font-semibold text-foreground">{items.length}</span> trên tổng số{' '}
          <span className="font-semibold text-foreground">{totalCount}</span> đơn hàng PO
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span>Số dòng:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded border border-input bg-background px-2 py-1 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || isLoading}
              className="h-8 w-8 p-0"
              title="Trang trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 font-medium text-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages || isLoading}
              className="h-8 w-8 p-0"
              title="Trang sau"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
