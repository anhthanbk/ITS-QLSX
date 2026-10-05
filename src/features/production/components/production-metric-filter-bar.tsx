import React from 'react';
import { Filter, RotateCcw, Calendar, Layers } from 'lucide-react';
import type { ProductionLine } from '../types';

interface ProductionMetricFilterBarProps {
  lineId: string;
  onLineIdChange: (lineId: string) => void;
  month: number;
  onMonthChange: (month: number) => void;
  year: number;
  onYearChange: (year: number) => void;
  lines: ProductionLine[];
  onReset: () => void;
}

const AVAILABLE_YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export const ProductionMetricFilterBar: React.FC<ProductionMetricFilterBarProps> = ({
  lineId,
  onLineIdChange,
  month,
  onMonthChange,
  year,
  onYearChange,
  lines,
  onReset,
}) => {
  const selectedLine = lines.find((l) => l.id === lineId);
  const isDefaultFilter =
    lineId === 'all' &&
    month === new Date().getMonth() + 1 &&
    year === new Date().getFullYear();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/70 px-4 py-2.5 shadow-sm backdrop-blur-sm">
      {/* Left side: Title & selectors */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mr-1">
          <Filter className="h-3.5 w-3.5 text-primary" />
          <span>Lọc chỉ tiêu thẻ card:</span>
        </div>

        {/* Lọc Dây chuyền */}
        <div className="flex items-center gap-1">
          <Layers className="h-3.5 w-3.5 text-muted-foreground hidden sm:inline-block" />
          <select
            value={lineId}
            onChange={(e) => onLineIdChange(e.target.value)}
            aria-label="Lọc theo dây chuyền sản xuất"
            className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Tất cả dây chuyền</option>
            {lines.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.code})
              </option>
            ))}
          </select>
        </div>

        {/* Lọc Tháng */}
        <div className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground hidden sm:inline-block" />
          <select
            value={month}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            aria-label="Lọc theo tháng"
            className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                Tháng {m}
              </option>
            ))}
          </select>
        </div>

        {/* Lọc Năm */}
        <select
          value={year}
          onChange={(e) => onYearChange(Number(e.target.value))}
          aria-label="Lọc theo năm"
          className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {AVAILABLE_YEARS.map((y) => (
            <option key={y} value={y}>
              Năm {y}
            </option>
          ))}
        </select>

        {/* Reset button */}
        {!isDefaultFilter && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Đặt lại về tháng và năm hiện tại"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Đặt lại</span>
          </button>
        )}
      </div>

      {/* Right side: Active Context Tag */}
      <div className="flex items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Đang xem: Tháng {month}/{year} • {selectedLine ? selectedLine.name : 'Toàn nhà máy'}
        </span>
      </div>
    </div>
  );
};
