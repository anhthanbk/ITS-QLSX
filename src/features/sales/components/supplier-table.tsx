import React from 'react';
import {
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Truck,
  AlertCircle,
  RefreshCw,
  Search,
} from 'lucide-react';
import type { Supplier, PaginatedResult, SupplierFilterParams, SupplierStatus } from '../types';
import { StatusBadge } from './sales-status-badge';
import { Button } from '@/components/ui/button';

interface SupplierTableProps {
  data?: PaginatedResult<Supplier>;
  isLoading: boolean;
  isError: boolean;
  canManage: boolean;
  filters: SupplierFilterParams;
  onFilterChange: (filters: Partial<SupplierFilterParams>) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
  onRetry?: () => void;
}

export const SupplierTable: React.FC<SupplierTableProps> = ({
  data,
  isLoading,
  isError,
  canManage,
  filters,
  onFilterChange,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onRetry,
}) => {
  const items = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const page = data?.page || 1;
  const pageSize = data?.pageSize || 10;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo tên nhà cung cấp, mã NCC, MST, SĐT..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <select
          value={filters.status || 'all'}
          onChange={(e) =>
            onFilterChange({
              status: e.target.value as SupplierStatus | 'all',
              page: 1,
            })
          }
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Ngừng giao dịch</option>
        </select>
      </div>

      {isError ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-3" />
          <h3 className="text-base font-semibold text-foreground">Không thể tải danh sách nhà cung cấp</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Đã xảy ra sự cố khi kết nối cơ sở dữ liệu.
          </p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="mt-4 gap-2">
              <RefreshCw className="h-4 w-4" />
              Thử lại
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Mã NCC</th>
                  <th className="px-4 py-3">Tên Nhà Cung Cấp</th>
                  <th className="px-4 py-3">Mã số thuế</th>
                  <th className="px-4 py-3">Liên hệ</th>
                  <th className="px-4 py-3">Địa chỉ</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-4"><div className="h-4 w-16 bg-muted rounded" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-48 bg-muted rounded" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-24 bg-muted rounded" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-28 bg-muted rounded" /></td>
                      <td className="px-4 py-4"><div className="h-4 w-40 bg-muted rounded" /></td>
                      <td className="px-4 py-4"><div className="h-6 w-20 bg-muted rounded-full" /></td>
                      <td className="px-4 py-4"><div className="h-8 w-16 bg-muted rounded mx-auto" /></td>
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                      <Truck className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                      <p className="text-base font-medium text-foreground">Không có nhà cung cấp nào</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Chưa có nhà cung cấp phù hợp bộ lọc hoặc hệ thống chưa có dữ liệu.
                      </p>
                    </td>
                  </tr>
                ) : (
                  items.map((supplier) => (
                    <tr
                      key={supplier.id}
                      className="transition-colors hover:bg-muted/30 focus-within:bg-muted/30"
                    >
                      <td className="px-4 py-3.5 font-semibold text-primary">
                        {supplier.code}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-foreground">
                        {supplier.name}
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {supplier.tax_id || '-'}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {supplier.phone && <div>ĐT: {supplier.phone}</div>}
                        {supplier.email && <div>Email: {supplier.email}</div>}
                        {!supplier.phone && !supplier.email && '-'}
                      </td>
                      <td
                        className="px-4 py-3.5 text-xs text-muted-foreground max-w-[240px] truncate"
                        title={supplier.address || ''}
                      >
                        {supplier.address || '-'}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={supplier.status} type="partner" />
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {canManage && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(supplier)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                title="Chỉnh sửa thông tin NCC"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDelete(supplier)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                title="Xóa nhà cung cấp"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {!canManage && (
                            <span className="text-xs text-muted-foreground">Chỉ xem</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground sm:flex-row">
            <div>
              Hiển thị <span className="font-semibold text-foreground">{items.length}</span> trên tổng số{' '}
              <span className="font-semibold text-foreground">{totalCount}</span> nhà cung cấp
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
      )}
    </div>
  );
};
