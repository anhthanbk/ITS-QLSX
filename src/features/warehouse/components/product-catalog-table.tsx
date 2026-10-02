import React from 'react';
import {
  Search,
  Filter,
  RotateCcw,
  Plus,
  Package,
  Pencil,
  Trash2,
  AlertCircle,
  Clock,
  Coins,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductTypeBadge, ProductStatusBadge } from './warehouse-badges';
import type {
  ProductCatalogItem,
  PaginatedResult,
} from '@/features/warehouse/types';

export interface ProductCatalogTableProps {
  data?: PaginatedResult<ProductCatalogItem>;
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
  search: string;
  onSearchChange: (search: string) => void;
  selectedProductType: string;
  onProductTypeChange: (type: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  onResetFilters: () => void;
  onPageChange: (page: number) => void;
  canManage?: boolean;
  onOpenCreate?: () => void;
  onEdit?: (item: ProductCatalogItem) => void;
  onDelete?: (item: ProductCatalogItem) => void;
}

export const ProductCatalogTable: React.FC<ProductCatalogTableProps> = ({
  data,
  isLoading,
  isError,
  onRetry,
  search,
  onSearchChange,
  selectedProductType,
  onProductTypeChange,
  selectedStatus,
  onStatusChange,
  onResetFilters,
  onPageChange,
  canManage = false,
  onOpenCreate,
  onEdit,
  onDelete,
}) => {
  const hasFilter =
    search !== '' || selectedProductType !== 'all' || selectedStatus !== 'all';
  const products = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;
  const page = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;
  const pageSize = data?.pageSize ?? 10;

  const startIdx = (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, totalCount);

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm theo SKU, tên sản phẩm..."
              className="w-full rounded-lg border border-input bg-background py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Product Type Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={selectedProductType}
              onChange={(e) => onProductTypeChange(e.target.value)}
              className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Tất cả loại sản phẩm</option>
              <option value="finished_good">Thành phẩm hoàn chỉnh</option>
              <option value="semi_finished">Bán thành phẩm</option>
              <option value="by_product">Phụ phẩm thu hồi</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang kinh doanh</option>
              <option value="discontinued">Ngừng kinh doanh</option>
            </select>
          </div>

          {hasFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              Đặt lại
            </Button>
          )}
        </div>

        {canManage && (
          <Button
            size="sm"
            onClick={onOpenCreate}
            className="gap-1.5 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Khai báo sản phẩm mới
          </Button>
        )}
      </div>

      {/* Table Container */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50 font-semibold text-muted-foreground">
                <th className="py-3 px-4">Mã SKU</th>
                <th className="py-3 px-4">Tên sản phẩm & Quy cách</th>
                <th className="py-3 px-3">Phân loại</th>
                <th className="py-3 px-3 text-center">ĐVT</th>
                <th className="py-3 px-3 text-right">Tồn kho hiện tại</th>
                <th className="py-3 px-3 text-right">Giá bán niêm yết</th>
                <th className="py-3 px-3 text-right">Định mức SX</th>
                <th className="py-3 px-3 text-center">Trạng thái</th>
                {canManage && <th className="py-3 px-4 text-center">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading && (
                <>
                  {[...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-3 px-4"><div className="h-4 w-20 rounded bg-muted"></div></td>
                      <td className="py-3 px-4"><div className="h-4 w-48 rounded bg-muted"></div></td>
                      <td className="py-3 px-3"><div className="h-4 w-24 rounded bg-muted"></div></td>
                      <td className="py-3 px-3 text-center"><div className="mx-auto h-4 w-10 rounded bg-muted"></div></td>
                      <td className="py-3 px-3 text-right"><div className="ml-auto h-4 w-16 rounded bg-muted"></div></td>
                      <td className="py-3 px-3 text-right"><div className="ml-auto h-4 w-24 rounded bg-muted"></div></td>
                      <td className="py-3 px-3 text-right"><div className="ml-auto h-4 w-20 rounded bg-muted"></div></td>
                      <td className="py-3 px-3 text-center"><div className="mx-auto h-4 w-16 rounded bg-muted"></div></td>
                      {canManage && (
                        <td className="py-3 px-4 text-center"><div className="mx-auto h-4 w-12 rounded bg-muted"></div></td>
                      )}
                    </tr>
                  ))}
                </>
              )}

              {isError && !isLoading && (
                <tr>
                  <td colSpan={canManage ? 9 : 8} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-destructive">
                      <AlertCircle className="h-6 w-6" />
                      <p className="font-medium">Không thể tải danh mục sản phẩm</p>
                      {onRetry && (
                        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2 text-xs">
                          Thử lại
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading && !isError && products.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 9 : 8} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package className="h-8 w-8 text-muted-foreground/40" />
                      <p className="font-medium">Chưa có sản phẩm / thành phẩm nào phù hợp</p>
                      <p className="text-[11px] text-muted-foreground/80">
                        {hasFilter ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.' : 'Bấm "Khai báo sản phẩm mới" để bắt đầu.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                products.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      {item.sku}
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">
                      {item.name}
                    </td>
                    <td className="py-3 px-3">
                      <ProductTypeBadge type={item.product_type} />
                    </td>
                    <td className="py-3 px-3 text-center text-muted-foreground font-medium">
                      {item.unit_of_measure}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold ${
                          (item.total_stock ?? 0) > 0
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {(item.total_stock ?? 0).toLocaleString('vi-VN')} {item.unit_of_measure}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-foreground">
                      {item.base_sales_price > 0 ? (
                        <span>{item.base_sales_price.toLocaleString('vi-VN')} ₫</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right text-muted-foreground space-y-0.5">
                      {item.standard_cycle_time_mins > 0 && (
                        <div className="flex items-center justify-end gap-1 text-[11px]">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span>{item.standard_cycle_time_mins}p</span>
                        </div>
                      )}
                      {item.standard_labor_cost > 0 && (
                        <div className="flex items-center justify-end gap-1 text-[11px]">
                          <Coins className="h-3 w-3 text-muted-foreground" />
                          <span>{item.standard_labor_cost.toLocaleString('vi-VN')} ₫</span>
                        </div>
                      )}
                      {item.standard_cycle_time_mins === 0 && item.standard_labor_cost === 0 && (
                        <span>—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <ProductStatusBadge status={item.status} />
                    </td>
                    {canManage && (
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEdit?.(item)}
                            title="Chỉnh sửa sản phẩm"
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete?.(item)}
                            title="Xóa sản phẩm"
                            className="rounded-md p-1.5 text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {!isLoading && !isError && totalCount > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row text-xs text-muted-foreground">
            <div>
              Hiển thị <span className="font-semibold text-foreground">{startIdx}</span> -{' '}
              <span className="font-semibold text-foreground">{endIdx}</span> trên tổng số{' '}
              <span className="font-semibold text-foreground">{totalCount}</span> sản phẩm
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="h-8 px-2.5 text-xs"
              >
                Trước
              </Button>
              <span className="text-xs font-medium">
                Trang {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="h-8 px-2.5 text-xs"
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
