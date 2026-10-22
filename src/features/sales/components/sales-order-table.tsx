import React from 'react';
import {
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileText,
  AlertCircle,
  RefreshCw,
  Truck,
} from 'lucide-react';
import type { SalesOrder, PaginatedResult, SalesOrderStatus } from '../types';
import { StatusBadge } from './sales-status-badge';
import { salesStatusLabels } from '../constants/sales-constants';
import { Button } from '@/components/ui/button';

interface SalesOrderTableProps {
  data?: PaginatedResult<SalesOrder>;
  isLoading: boolean;
  isError: boolean;
  canManage: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onViewDetail: (order: SalesOrder) => void;
  onEdit: (order: SalesOrder) => void;
  onDelete: (order: SalesOrder) => void;
  onDispatch?: (order: SalesOrder) => void;
  onStatusChange: (order: SalesOrder, status: SalesOrderStatus) => void;
  onRetry?: () => void;
}

export const SalesOrderTable: React.FC<SalesOrderTableProps> = ({
  data,
  isLoading,
  isError,
  canManage,
  onPageChange,
  onPageSizeChange,
  onViewDetail,
  onEdit,
  onDelete,
  onDispatch,
  onStatusChange,
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
        <h3 className="text-base font-semibold text-foreground">Không thể tải danh sách đơn hàng</h3>
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
              <th className="px-4 py-3">Mã đơn (SO)</th>
              <th className="px-4 py-3">Khách hàng</th>
              <th className="px-4 py-3">Vận tải & Phương tiện</th>
              <th className="px-4 py-3">Ngày đặt</th>
              <th className="px-4 py-3">Hạn giao hàng</th>
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
                  <td className="px-4 py-4"><div className="h-4 w-36 bg-muted rounded" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-28 bg-muted rounded" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-20 bg-muted rounded" /></td>
                  <td className="px-4 py-4"><div className="h-4 w-20 bg-muted rounded" /></td>
                  <td className="px-4 py-4 text-right"><div className="h-4 w-28 bg-muted rounded ml-auto" /></td>
                  <td className="px-4 py-4"><div className="h-6 w-24 bg-muted rounded-full" /></td>
                  <td className="px-4 py-4"><div className="h-8 w-24 bg-muted rounded mx-auto" /></td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                  <FileText className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-base font-medium text-foreground">Không có đơn hàng nào</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Chưa tìm thấy đơn hàng bán phù hợp với tiêu chí lọc.
                  </p>
                </td>
              </tr>
            ) : (
              items.map((order) => (
                <tr
                  key={order.id}
                  className="transition-colors hover:bg-muted/30 focus-within:bg-muted/30"
                >
                  <td className="px-4 py-3.5 font-medium text-foreground">
                    <button
                      onClick={() => onViewDetail(order)}
                      className="font-semibold text-primary hover:underline text-left"
                      title="Xem chi tiết đơn hàng"
                    >
                      {order.order_code}
                    </button>
                    {order.notes && (
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={order.notes}>
                        {order.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-foreground">
                    <div className="font-medium">{order.customer?.name || 'Khách hàng ẩn'}</div>
                    <div className="text-xs text-muted-foreground">
                      Mã: {order.customer?.code || '-'}
                      {order.customer?.phone && ` • ${order.customer?.phone}`}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground">
                    {order.carrier_name || order.vehicle_plate ? (
                      <div>
                        <div className="font-medium text-foreground truncate max-w-[170px]" title={order.carrier_name || ''}>
                          {order.carrier_name || 'Xe vận chuyển'}
                        </div>
                        {order.vehicle_plate && (
                          <div className="font-mono text-[11px] text-primary font-semibold">
                            BS: {order.vehicle_plate}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/50 italic">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground">
                    {formatDate(order.order_date)}
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground">
                    {formatDate(order.promised_delivery_date)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-foreground">
                    {formatCurrency(order.total_amount)}
                  </td>
                  <td className="px-4 py-3.5">
                    {canManage ? (
                      <select
                        value={order.status}
                        onChange={(e) =>
                          onStatusChange(order, e.target.value as SalesOrderStatus)
                        }
                        className="rounded-lg border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        title="Cập nhật nhanh trạng thái"
                      >
                        {Object.entries(salesStatusLabels).map(([val, label]) => (
                          <option key={val} value={val}>
                            {label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <StatusBadge status={order.status} type="sales" />
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {canManage && order.status !== 'cancelled' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDispatch?.(order)}
                          className="h-8 gap-1.5 px-2 text-xs font-semibold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                          title="Lập phiếu xuất kho giao hàng cho đơn này"
                        >
                          <Truck className="h-3.5 w-3.5" />
                          <span>Xuất kho</span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetail(order)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        title="Xem chi tiết"
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
                            title="Chỉnh sửa đơn hàng"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(order)}
                            className="h-8 w-8 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                            title="Xóa đơn hàng"
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

      {/* Pagination Footer */}
      <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>
            Hiển thị{' '}
            <strong className="text-foreground">
              {totalCount === 0 ? 0 : (page - 1) * pageSize + 1}
            </strong>{' '}
            -{' '}
            <strong className="text-foreground">
              {Math.min(page * pageSize, totalCount)}
            </strong>{' '}
            trên <strong className="text-foreground">{totalCount}</strong> đơn hàng
          </span>
          <div className="flex items-center gap-1.5">
            <span>Mỗi trang:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded border border-input bg-background px-2 py-0.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
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
  );
};
