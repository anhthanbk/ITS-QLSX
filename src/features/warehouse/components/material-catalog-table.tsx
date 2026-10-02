import React from 'react';
import {
  Search,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MaterialCatalogItem } from '@/features/warehouse/types';

interface MaterialCatalogTableProps {
  data?: {
    data: MaterialCatalogItem[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  search: string;
  onSearchChange: (val: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  onResetFilters: () => void;
  onPageChange: (newPage: number) => void;
  canManage?: boolean;
  onOpenCreate?: () => void;
  onEdit?: (item: MaterialCatalogItem) => void;
  onDelete?: (item: MaterialCatalogItem) => void;
}

export const MaterialCategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  switch (category) {
    case 'raw_material':
      return (
        <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400 border border-blue-500/20">
          Nguyên vật liệu
        </span>
      );
    case 'chemical':
      return (
        <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20">
          Hóa chất xử lý
        </span>
      );
    case 'spare_part':
      return (
        <span className="inline-flex items-center rounded-md bg-purple-500/10 px-2 py-0.5 text-[11px] font-medium text-purple-600 dark:text-purple-400 border border-purple-500/20">
          Phụ tùng cơ điện
        </span>
      );
    case 'packaging':
      return (
        <span className="inline-flex items-center rounded-md bg-cyan-500/10 px-2 py-0.5 text-[11px] font-medium text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
          Bao bì & Đóng gói
        </span>
      );
    case 'consumable':
      return (
        <span className="inline-flex items-center rounded-md bg-teal-500/10 px-2 py-0.5 text-[11px] font-medium text-teal-600 dark:text-teal-400 border border-teal-500/20">
          Tiêu hao / BHLĐ
        </span>
      );
    case 'fuel_energy':
      return (
        <span className="inline-flex items-center rounded-md bg-orange-500/10 px-2 py-0.5 text-[11px] font-medium text-orange-600 dark:text-orange-400 border border-orange-500/20">
          Nhiên liệu & Năng lượng
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-md bg-slate-500/10 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 border border-slate-500/20">
          Vật tư khác
        </span>
      );
  }
};

export const MaterialCatalogTable: React.FC<MaterialCatalogTableProps> = ({
  data,
  isLoading,
  isError,
  onRetry,
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onResetFilters,
  onPageChange,
  canManage = false,
  onOpenCreate,
  onEdit,
  onDelete,
}) => {
  const hasFilter = search !== '' || selectedCategory !== 'all';
  const materials = data?.data ?? [];
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
              placeholder="Tìm theo mã, tên quy cách vật tư..."
              className="w-full rounded-lg border border-input bg-background py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Tất cả nhóm vật tư</option>
              <option value="raw_material">Nguyên vật liệu (raw_material)</option>
              <option value="chemical">Hóa chất công nghiệp (chemical)</option>
              <option value="spare_part">Phụ tùng cơ điện (spare_part)</option>
              <option value="packaging">Bao bì & Đóng gói (packaging)</option>
              <option value="consumable">Tiêu hao / BHLĐ (consumable)</option>
              <option value="fuel_energy">Nhiên liệu & Năng lượng (fuel_energy)</option>
              <option value="other">Vật tư phụ trợ (other)</option>
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

        {/* Create button */}
        {canManage && onOpenCreate && (
          <Button size="sm" onClick={onOpenCreate} className="gap-1.5 text-xs shadow-xs self-start sm:self-auto">
            <Plus className="h-3.5 w-3.5" />
            Thêm vật tư mới
          </Button>
        )}
      </div>

      {/* Table Content */}
      {isLoading ? (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-4 animate-pulse">
            <div className="h-10 bg-accent/40 rounded-lg" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-accent/20 rounded-lg" />
            ))}
          </div>
        </div>
      ) : isError ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <h3 className="mt-2 text-sm font-semibold text-foreground">Không thể tải danh mục vật tư</h3>
          <p className="mt-1 text-xs text-muted-foreground">Đã xảy ra lỗi khi kết nối truy vấn danh mục vật tư.</p>
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-4 gap-1.5">
            Thử lại
          </Button>
        </div>
      ) : materials.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-foreground">Không tìm thấy vật tư nào</h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Chưa có vật tư phù hợp với điều kiện tìm kiếm hiện tại.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                    <th className="py-3 px-4">Mã vật tư</th>
                    <th className="py-3 px-4">Tên vật tư / Quy cách</th>
                    <th className="py-3 px-4">Nhóm phân loại</th>
                    <th className="py-3 px-4">ĐVT</th>
                    <th className="py-3 px-4 text-right">Tổng tồn hiện tại</th>
                    <th className="py-3 px-4 text-right">Tồn tối thiểu</th>
                    <th className="py-3 px-4 text-right">Điểm đặt hàng</th>
                    <th className="py-3 px-4 text-right">Đơn giá định mức</th>
                    <th className="py-3 px-4 text-center">Tình trạng tồn</th>
                    {canManage && <th className="py-3 px-4 text-right">Thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {materials.map((m) => {
                    const isBelowMin = m.total_stock < m.min_stock_level;
                    const isCritical = m.total_stock <= m.min_stock_level * 0.5;

                    return (
                      <tr key={m.id} className="hover:bg-accent/30 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap text-foreground">
                          <span className="rounded bg-accent/60 px-2 py-0.5 border border-border/80">
                            {m.code}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-foreground">{m.name}</td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <MaterialCategoryBadge category={m.category} />
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-muted-foreground">{m.unit_of_measure}</td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span
                            className={`font-mono text-xs font-bold ${
                              isCritical
                                ? 'text-destructive'
                                : isBelowMin
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-foreground'
                            }`}
                          >
                            {(m.total_stock ?? 0).toLocaleString('vi-VN')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-muted-foreground whitespace-nowrap">
                          {(m.min_stock_level ?? 0).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-muted-foreground whitespace-nowrap">
                          {(m.reorder_point ?? 0).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-muted-foreground whitespace-nowrap">
                          {(m.standard_cost ?? 0) > 0 ? `${(m.standard_cost ?? 0).toLocaleString('vi-VN')} đ` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {isCritical ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive border border-destructive/20">
                              <AlertTriangle className="h-3 w-3" />
                              Cần mua gấp
                            </span>
                          ) : isBelowMin ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              <AlertTriangle className="h-3 w-3" />
                              Dưới định mức
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3" />
                              An toàn
                            </span>
                          )}
                        </td>
                        {canManage && (
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              {onEdit && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEdit(m)}
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                  title="Chỉnh sửa vật tư"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {onDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onDelete(m)}
                                  className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                  title="Xóa vật tư"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-1">
            <span className="text-xs text-muted-foreground">
              Hiển thị <span className="font-semibold text-foreground">{startIdx}</span> -{' '}
              <span className="font-semibold text-foreground">{endIdx}</span> trong tổng số{' '}
              <span className="font-semibold text-foreground">{totalCount}</span> mặt hàng vật tư
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
      )}
    </div>
  );
};
