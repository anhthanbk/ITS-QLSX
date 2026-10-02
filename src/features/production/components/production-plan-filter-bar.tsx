import React from 'react';
import { Search, RotateCcw, Plus } from 'lucide-react';
import type { PlanStatus, ProductionLine } from '../types';

interface ProductionPlanFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: PlanStatus | 'all';
  onStatusChange: (value: PlanStatus | 'all') => void;
  lineId: string | 'all';
  onLineIdChange: (value: string | 'all') => void;
  year: number | 'all';
  onYearChange: (value: number | 'all') => void;
  month: number | 'all';
  onMonthChange: (value: number | 'all') => void;
  lines: ProductionLine[];
  onReset: () => void;
  onCreate?: () => void;
  canManage: boolean;
}

export const ProductionPlanFilterBar: React.FC<ProductionPlanFilterBarProps> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  lineId,
  onLineIdChange,
  year,
  onYearChange,
  month,
  onMonthChange,
  lines,
  onReset,
  onCreate,
  canManage,
}) => {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo mã kế hoạch..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Action Button */}
        {canManage && onCreate && (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            Lập kế hoạch tháng
          </button>
        )}
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        {/* Line select */}
        <select
          value={lineId}
          onChange={(e) => onLineIdChange(e.target.value)}
          aria-label="Dây chuyền sản xuất"
          className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">Tất cả dây chuyền</option>
          {lines.map((l) => (
            <option key={l.id} value={l.id}>
              {l.code} - {l.name}
            </option>
          ))}
        </select>

        {/* Year select */}
        <select
          value={year}
          onChange={(e) => onYearChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          aria-label="Năm kế hoạch"
          className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">Tất cả các năm</option>
          <option value={2026}>Năm 2026</option>
          <option value={2025}>Năm 2025</option>
        </select>

        {/* Month select */}
        <select
          value={month}
          onChange={(e) => onMonthChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          aria-label="Tháng kế hoạch"
          className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">Tất cả các tháng</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              Tháng {m}
            </option>
          ))}
        </select>

        {/* Status select */}
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as PlanStatus | 'all')}
          aria-label="Trạng thái kế hoạch"
          className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="draft">Dự thảo</option>
          <option value="approved">Đã phê duyệt</option>
          <option value="in_progress">Đang thực hiện</option>
          <option value="completed">Đã hoàn thành</option>
          <option value="cancelled">Đã hủy</option>
        </select>

        {/* Reset button */}
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          title="Đặt lại bộ lọc"
        >
          <RotateCcw className="h-3 w-3" />
          Đặt lại
        </button>
      </div>
    </div>
  );
};
