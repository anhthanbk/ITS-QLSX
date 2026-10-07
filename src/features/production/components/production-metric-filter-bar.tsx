import React, { useState, useRef, useEffect } from 'react';
import { Filter, RotateCcw, Calendar, Layers, ChevronDown, Check } from 'lucide-react';
import type { ProductionLine } from '../types';

interface ProductionMetricFilterBarProps {
  lineId: string;
  onLineIdChange: (lineId: string) => void;
  // Multi-select support
  selectedMonths?: number[];
  onMonthsChange?: (months: number[]) => void;
  selectedYears?: number[];
  onYearsChange?: (years: number[]) => void;
  // Backwards compatibility props
  month?: number;
  onMonthChange?: (month: number) => void;
  year?: number;
  onYearChange?: (year: number) => void;
  lines: ProductionLine[];
  onReset: () => void;
}

const AVAILABLE_YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export const ProductionMetricFilterBar: React.FC<ProductionMetricFilterBarProps> = ({
  lineId,
  onLineIdChange,
  selectedMonths = [],
  onMonthsChange,
  selectedYears = [],
  onYearsChange,
  month,
  onMonthChange,
  year,
  onYearChange,
  lines,
  onReset,
}) => {
  const selectedLine = lines.find((l) => l.id === lineId);
  const now = new Date();

  // Normalized active months (empty = all)
  const activeMonths =
    selectedMonths.length > 0
      ? selectedMonths
      : month !== undefined && month > 0
        ? [month]
        : [];

  // Normalized active years (empty = all)
  const activeYears =
    selectedYears.length > 0
      ? selectedYears
      : year !== undefined && year > 0
        ? [year]
        : [now.getFullYear()];

  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const monthRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (monthRef.current && !monthRef.current.contains(e.target as Node)) {
        setIsMonthOpen(false);
      }
      if (yearRef.current && !yearRef.current.contains(e.target as Node)) {
        setIsYearOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handlers for month selection
  const handleToggleMonth = (m: number) => {
    if (!onMonthsChange) {
      if (onMonthChange) onMonthChange(m);
      return;
    }
    const isAll = activeMonths.length === 0 || activeMonths.length === 12;
    if (isAll) {
      // If currently all, clicking one month selects only that month
      onMonthsChange([m]);
    } else if (activeMonths.includes(m)) {
      const next = activeMonths.filter((item) => item !== m);
      onMonthsChange(next.length === 0 ? [] : next);
    } else {
      const next = [...activeMonths, m].sort((a, b) => a - b);
      onMonthsChange(next.length === 12 ? [] : next);
    }
  };

  const handleSelectAllMonths = () => {
    if (onMonthsChange) {
      onMonthsChange([]); // empty means all
    }
  };

  // Handlers for year selection
  const handleToggleYear = (y: number) => {
    if (!onYearsChange) {
      if (onYearChange) onYearChange(y);
      return;
    }
    const isAll = activeYears.length === 0 || activeYears.length === AVAILABLE_YEARS.length;
    if (isAll) {
      onYearsChange([y]);
    } else if (activeYears.includes(y)) {
      const next = activeYears.filter((item) => item !== y);
      onYearsChange(next.length === 0 ? [] : next);
    } else {
      const next = [...activeYears, y].sort((a, b) => a - b);
      onYearsChange(next.length === AVAILABLE_YEARS.length ? [] : next);
    }
  };

  const handleSelectAllYears = () => {
    if (onYearsChange) {
      onYearsChange([]); // empty means all
    }
  };

  // Text labels
  const isAllMonthsSelected = activeMonths.length === 0 || activeMonths.length === 12;
  const monthLabel = isAllMonthsSelected
    ? 'Tất cả các tháng'
    : activeMonths.length === 1
      ? `Tháng ${activeMonths[0]}`
      : activeMonths.length <= 3
        ? `Tháng ${[...activeMonths].sort((a, b) => a - b).join(', ')}`
        : `${activeMonths.length} tháng đã chọn`;

  const isAllYearsSelected = activeYears.length === 0 || activeYears.length === AVAILABLE_YEARS.length;
  const yearLabel = isAllYearsSelected
    ? 'Tất cả các năm'
    : activeYears.length === 1
      ? `Năm ${activeYears[0]}`
      : activeYears.length <= 2
        ? `${[...activeYears].sort((a, b) => a - b).join(', ')}`
        : `${activeYears.length} năm đã chọn`;

  const isDefaultFilter =
    lineId === 'all' &&
    activeMonths.length === 1 &&
    activeMonths[0] === now.getMonth() + 1 &&
    activeYears.length === 1 &&
    activeYears[0] === now.getFullYear();

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

        {/* Lọc Tháng (Multi-select) */}
        <div className="relative" ref={monthRef}>
          <button
            type="button"
            onClick={() => {
              setIsMonthOpen(!isMonthOpen);
              setIsYearOpen(false);
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              !isAllMonthsSelected
                ? 'border-primary/50 bg-primary/5 text-primary font-semibold'
                : 'border-input bg-background text-foreground hover:border-primary/50'
            }`}
            title="Chọn tháng hoặc chọn nhiều tháng / tất cả"
          >
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{monthLabel}</span>
            <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
          </button>

          {isMonthOpen && (
            <div className="absolute left-0 top-full z-50 mt-1.5 w-72 rounded-xl border border-border bg-popover p-3 shadow-xl backdrop-blur-md animate-in fade-in-0 zoom-in-95">
              <div className="flex items-center justify-between border-b border-border pb-2 mb-2.5">
                <span className="text-xs font-bold text-foreground">Chọn tháng sản xuất</span>
                <button
                  type="button"
                  onClick={handleSelectAllMonths}
                  className={`rounded px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                    isAllMonthsSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Tất cả các tháng
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {MONTHS.map((m) => {
                  const isSelected = isAllMonthsSelected || activeMonths.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleToggleMonth(m)}
                      className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-all ${
                        isSelected
                          ? 'bg-primary/10 text-primary font-bold border border-primary/30'
                          : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <span>Tháng {m}</span>
                      {isSelected && <Check className="h-3 w-3 text-primary stroke-[3]" />}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2.5 pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Đã chọn: {isAllMonthsSelected ? '12/12 tháng' : `${activeMonths.length}/12 tháng`}</span>
                <button
                  type="button"
                  onClick={() => setIsMonthOpen(false)}
                  className="rounded bg-muted px-2 py-0.5 font-medium text-foreground hover:bg-muted/80"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Lọc Năm (Multi-select) */}
        <div className="relative" ref={yearRef}>
          <button
            type="button"
            onClick={() => {
              setIsYearOpen(!isYearOpen);
              setIsMonthOpen(false);
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              !isAllYearsSelected
                ? 'border-primary/50 bg-primary/5 text-primary font-semibold'
                : 'border-input bg-background text-foreground hover:border-primary/50'
            }`}
            title="Chọn năm hoặc chọn nhiều năm / tất cả"
          >
            <span>{yearLabel}</span>
            <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
          </button>

          {isYearOpen && (
            <div className="absolute left-0 top-full z-50 mt-1.5 w-60 rounded-xl border border-border bg-popover p-3 shadow-xl backdrop-blur-md animate-in fade-in-0 zoom-in-95">
              <div className="flex items-center justify-between border-b border-border pb-2 mb-2.5">
                <span className="text-xs font-bold text-foreground">Chọn năm kế hoạch</span>
                <button
                  type="button"
                  onClick={handleSelectAllYears}
                  className={`rounded px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                    isAllYearsSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Tất cả các năm
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {AVAILABLE_YEARS.map((y) => {
                  const isSelected = isAllYearsSelected || activeYears.includes(y);
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => handleToggleYear(y)}
                      className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-all ${
                        isSelected
                          ? 'bg-primary/10 text-primary font-bold border border-primary/30'
                          : 'bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <span>Năm {y}</span>
                      {isSelected && <Check className="h-3 w-3 text-primary stroke-[3]" />}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2.5 pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Đã chọn: {isAllYearsSelected ? 'Tất cả' : `${activeYears.length} năm`}</span>
                <button
                  type="button"
                  onClick={() => setIsYearOpen(false)}
                  className="rounded bg-muted px-2 py-0.5 font-medium text-foreground hover:bg-muted/80"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </div>

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
          Đang xem: {monthLabel}/{yearLabel} • {selectedLine ? selectedLine.name : 'Toàn nhà máy'}
        </span>
      </div>
    </div>
  );
};
