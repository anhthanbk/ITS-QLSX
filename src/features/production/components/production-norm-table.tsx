import React from 'react';
import { Edit, Trash2, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import type { TechnoEconomicNorm } from '../types';
import { NormResourceTypeBadge } from './production-status-badge';

interface ProductionNormTableProps {
  data: TechnoEconomicNorm[];
  isLoading: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onEdit: (norm: TechnoEconomicNorm) => void;
  onDelete: (norm: TechnoEconomicNorm) => void;
  canManage: boolean;
}

export const ProductionNormTable: React.FC<ProductionNormTableProps> = ({
  data,
  isLoading,
  totalCount,
  page,
  pageSize,
  onPageChange,
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
          <span className="text-xs text-muted-foreground">Đang tải định mức KT - KT...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-6 text-center">
        <p className="text-sm font-medium text-foreground">Không tìm thấy định mức kinh tế kỹ thuật nào</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Thử thay đổi điều kiện lọc hoặc tạo định mức tiêu hao mới.
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
              <th className="px-4 py-3">Mã định mức</th>
              <th className="px-4 py-3">Tài nguyên / Vật tư</th>
              <th className="px-4 py-3">Phân loại</th>
              <th className="px-4 py-3">Dây chuyền</th>
              <th className="px-4 py-3 text-right">Định mức tiêu hao</th>
              <th className="px-4 py-3">Hiệu lực</th>
              <th className="px-4 py-3 text-center">Trạng thái</th>
              <th className="px-4 py-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-foreground">
            {data.map((norm) => (
              <tr key={norm.id} className="transition-colors hover:bg-muted/30">
                <td className="px-4 py-3 font-semibold text-primary">{norm.norm_code}</td>
                <td className="px-4 py-3 font-medium">{norm.resource_name}</td>
                <td className="px-4 py-3">
                  <NormResourceTypeBadge type={norm.resource_type} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {norm.line_name || 'Toàn nhà máy'}
                </td>
                <td className="px-4 py-3 text-right font-bold text-foreground">
                  {norm.norm_rate} {norm.unit_of_measure}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  từ {norm.effective_from}
                  {norm.effective_to ? ` đến ${norm.effective_to}` : ''}
                </td>
                <td className="px-4 py-3 text-center">
                  {norm.is_active ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <Check className="h-3 w-3" /> Áp dụng
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                      <X className="h-3 w-3" /> Ngưng
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    {canManage && (
                      <>
                        <button
                          type="button"
                          onClick={() => onEdit(norm)}
                          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Chỉnh sửa định mức"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(norm)}
                          className="rounded p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                          title="Xóa định mức"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
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
          trong tổng số <span className="font-medium text-foreground">{totalCount}</span> định mức
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
