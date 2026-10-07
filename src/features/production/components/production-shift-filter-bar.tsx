import React from 'react';
import { Search, RotateCcw, Plus, CalendarRange } from 'lucide-react';
import type { ShiftStatus, ProductionLine } from '../types';

interface ProductionShiftFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status?: ShiftStatus | 'all';
  onStatusChange?: (value: ShiftStatus | 'all') => void;
  lineId: string | 'all';
  onLineIdChange: (value: string | 'all') => void;
  shiftNumber: number | 'all';
  onShiftNumberChange: (value: number | 'all') => void;
  fromDate: string;
  onFromDateChange: (value: string) => void;
  toDate: string;
  onToDateChange: (value: string) => void;
  lines: ProductionLine[];
  onReset: () => void;
  onCreate?: () => void;
  onCreateRange?: () => void;
  canManage: boolean;
}

export const ProductionShiftFilterBar: React.FC<ProductionShiftFilterBarProps> = ({
  search,
  onSearchChange,
  status: _status,
  onStatusChange: _onStatusChange,
  lineId,
  onLineIdChange,
  shiftNumber,
  onShiftNumberChange,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
  lines,
  onReset,
  onCreate,
  onCreateRange,
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
            placeholder="Tìm theo mã ca sản xuất..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Action Buttons */}
        {canManage && (
          <div className="flex flex-wrap items-center gap-2">
            {onCreateRange && (
              <button
                type="button"
                onClick={onCreateRange}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3.5 py-2 text-sm font-semibold text-primary shadow-xs hover:bg-primary/20 transition-colors"
                title="Ghi nhận sản lượng và tiêu hao tổng hợp theo khoảng ngày tùy chọn"
              >
                <CalendarRange className="h-4 w-4" />
                Nhập từ ngày đến ngày
              </button>
            )}
            {onCreate && (
              <button
                type="button"
                onClick={onCreate}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Ghi nhận ca sản xuất
              </button>
            )}
          </div>
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

        {/* Shift Number select */}
        <select
          value={shiftNumber}
          onChange={(e) =>
            onShiftNumberChange(e.target.value === 'all' ? 'all' : Number(e.target.value))
          }
          aria-label="Ca sản xuất"
          className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">Tất cả các ca</option>
          <option value={1}>Ca 1 (06:00 - 14:00)</option>
          <option value={2}>Ca 2 (14:00 - 22:00)</option>
          <option value={3}>Ca 3 (22:00 - 06:00)</option>
        </select>

        {/* From Date */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Từ:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => onFromDateChange(e.target.value)}
            aria-label="Từ ngày"
            className="rounded-lg border border-input bg-background px-2.5 py-1 text-xs text-foreground"
          />
        </div>

        {/* To Date */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Đến:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => onToDateChange(e.target.value)}
            aria-label="Đến ngày"
            className="rounded-lg border border-input bg-background px-2.5 py-1 text-xs text-foreground"
          />
        </div>

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
