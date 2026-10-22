import React from 'react';
import { RotateCcw, Plus, CalendarRange } from 'lucide-react';
import type { ShiftStatus, ProductionLine } from '../types';

interface ProductionShiftFilterBarProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  status?: ShiftStatus | 'all';
  onStatusChange?: (value: ShiftStatus | 'all') => void;
  lineId: string | 'all';
  onLineIdChange: (value: string | 'all') => void;
  shiftNumber?: number | 'all';
  onShiftNumberChange?: (value: number | 'all') => void;
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
  search: _search,
  onSearchChange: _onSearchChange,
  status: _status,
  onStatusChange: _onStatusChange,
  lineId,
  onLineIdChange,
  shiftNumber: _shiftNumber,
  onShiftNumberChange: _onShiftNumberChange,
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
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
      {/* Left: Filters (Dây chuyền, Từ ngày, Đến ngày, Đặt lại) */}
      <div className="flex flex-wrap items-center gap-2.5">
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
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title="Đặt lại bộ lọc"
          aria-label="Đặt lại bộ lọc"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Right: Action Buttons (Nhập từ ngày đến ngày, Ghi nhận ca sản xuất) */}
      {canManage && (
        <div className="flex items-center gap-2">
          {onCreateRange && (
            <button
              type="button"
              onClick={onCreateRange}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary shadow-xs hover:bg-primary/20 transition-colors"
              title="Nhập từ ngày đến ngày"
              aria-label="Nhập từ ngày đến ngày"
            >
              <CalendarRange className="h-4 w-4" />
            </button>
          )}
          {onCreate && (
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
              title="Ghi nhận ca sản xuất"
              aria-label="Ghi nhận ca sản xuất"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
