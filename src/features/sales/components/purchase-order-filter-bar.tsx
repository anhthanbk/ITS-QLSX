import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import type { PurchaseOrderFilterParams, PurchaseOrderStatus, Supplier } from '../types';
import { purchaseStatusLabels } from '../constants/sales-constants';
import { Button } from '@/components/ui/button';

interface PurchaseOrderFilterBarProps {
  filters: PurchaseOrderFilterParams;
  suppliers?: Supplier[];
  onFilterChange: (filters: Partial<PurchaseOrderFilterParams>) => void;
  onReset: () => void;
}

export const PurchaseOrderFilterBar: React.FC<PurchaseOrderFilterBarProps> = ({
  filters,
  suppliers = [],
  onFilterChange,
  onReset,
}) => {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[240px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Tìm mã đơn mua hàng (PO-...), ghi chú..."
          value={filters.search || ''}
          onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
          className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Status Dropdown */}
        <select
          value={filters.status || 'all'}
          onChange={(e) =>
            onFilterChange({
              status: e.target.value as PurchaseOrderStatus | 'all',
              page: 1,
            })
          }
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">Tất cả trạng thái</option>
          {Object.entries(purchaseStatusLabels).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>

        {/* Supplier Select */}
        <select
          value={filters.supplierId || 'all'}
          onChange={(e) =>
            onFilterChange({
              supplierId: e.target.value,
              page: 1,
            })
          }
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring max-w-[200px]"
        >
          <option value="all">Tất cả nhà cung cấp</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} - {s.name}
            </option>
          ))}
        </select>

        {/* From Date */}
        <input
          type="date"
          value={filters.fromDate || ''}
          onChange={(e) => onFilterChange({ fromDate: e.target.value, page: 1 })}
          title="Từ ngày"
          className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />

        {/* To Date */}
        <input
          type="date"
          value={filters.toDate || ''}
          onChange={(e) => onFilterChange({ toDate: e.target.value, page: 1 })}
          title="Đến ngày"
          className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />

        {/* Reset Filter Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          title="Đặt lại bộ lọc"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Đặt lại</span>
        </Button>
      </div>
    </div>
  );
};
