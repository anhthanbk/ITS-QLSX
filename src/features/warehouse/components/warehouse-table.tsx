import React from 'react';
import { Eye, Edit, Trash2, ChevronLeft, ChevronRight, AlertCircle, Warehouse as WarehouseIcon, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Warehouse } from '@/features/warehouse/types';
import { WarehouseStatusBadge, WarehouseTypeBadge } from './warehouse-badges';

export interface WarehouseTableProps {
  data?: {
    data: Warehouse[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onPageChange: (newPage: number) => void;
  onViewDetail: (warehouse: Warehouse) => void;
  onEdit: (warehouse: Warehouse) => void;
  onDelete: (warehouse: Warehouse) => void;
  canManage: boolean;
  onOpenCreate?: () => void;
}

export const WarehouseTable: React.FC<WarehouseTableProps> = ({
  data,
  isLoading,
  isError,
  onRetry,
  onPageChange,
  onViewDetail,
  onEdit,
  onDelete,
  canManage,
  onOpenCreate,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-4 animate-pulse">
          <div className="h-10 bg-accent/40 rounded-lg" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-accent/20 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <h3 className="mt-2 text-sm font-semibold text-foreground">Không thể tải danh sách kho</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Đã xảy ra lỗi khi kết nối với cơ sở dữ liệu kho.
        </p>
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4 gap-1.5">
          Thử lại
        </Button>
      </div>
    );
  }

  const warehouses = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;
  const page = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;
  const pageSize = data?.pageSize ?? 10;

  if (warehouses.length === 0) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <WarehouseIcon className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-sm font-bold text-foreground">Chưa có kho nào</h3>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          Không tìm thấy kho phù hợp với điều kiện tìm kiếm hoặc hệ thống chưa khởi tạo kho.
        </p>
        {canManage && onOpenCreate && (
          <Button
            size="sm"
            onClick={onOpenCreate}
            className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Thêm kho mới
          </Button>
        )}
      </div>
    );
  }

  const startIdx = (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                <th className="py-3 px-4">Mã kho</th>
                <th className="py-3 px-4">Tên kho</th>
                <th className="py-3 px-4">Phân loại kho</th>
                <th className="py-3 px-4">Vị trí mặt bằng</th>
                <th className="py-3 px-4">Thủ kho / Phụ trách</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {warehouses.map((w) => (
                <tr key={w.id} className="transition-colors hover:bg-accent/30 group">
                  <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onViewDetail(w)}
                      className="rounded bg-accent/60 px-2 py-0.5 text-xs text-foreground border border-border/80 hover:border-primary/50 hover:bg-primary/10 transition-colors"
                      title="Xem chi tiết kho"
                    >
                      {w.code}
                    </button>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => onViewDetail(w)}
                      className="text-left font-semibold text-foreground group-hover:text-primary transition-colors block"
                    >
                      {w.name}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <WarehouseTypeBadge type={w.warehouse_type} />
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground max-w-[200px] truncate">
                    {w.location || '—'}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-muted-foreground">
                    {w.manager_name ? (
                      <span className="inline-flex items-center gap-1.5 text-foreground font-medium">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {w.manager_name}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <WarehouseStatusBadge status={w.status} />
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewDetail(w)}
                        title="Xem chi tiết"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {canManage && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(w)}
                            title="Chỉnh sửa"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(w)}
                            title="Xóa kho"
                            className="h-7 w-7 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-1">
        <span className="text-xs text-muted-foreground">
          Hiển thị <span className="font-semibold text-foreground">{startIdx}</span> -{' '}
          <span className="font-semibold text-foreground">{endIdx}</span> trong tổng số{' '}
          <span className="font-semibold text-foreground">{totalCount}</span> kho
        </span>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="h-8 gap-1 px-2.5 text-xs"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Trước
          </Button>
          <span className="text-xs font-medium text-foreground px-2">
            Trang {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="h-8 gap-1 px-2.5 text-xs"
          >
            Sau
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
