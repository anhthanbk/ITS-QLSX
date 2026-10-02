import React from 'react';
import { Search, RotateCcw, Plus } from 'lucide-react';
import type { OrderStatus, OrderPriority, ProductionLine } from '../types';

interface ProductionOrderFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: OrderStatus | 'all';
  onStatusChange: (value: OrderStatus | 'all') => void;
  priority: OrderPriority | 'all';
  onPriorityChange: (value: OrderPriority | 'all') => void;
  lineId: string | 'all';
  onLineIdChange: (value: string | 'all') => void;
  lines: ProductionLine[];
  onReset: () => void;
  onCreate?: () => void;
  canManage: boolean;
}

export const ProductionOrderFilterBar: React.FC<ProductionOrderFilterBarProps> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  lineId,
  onLineIdChange,
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
            placeholder="Tìm theo mã lệnh sản xuất..."
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
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Tạo lệnh sản xuất (LSX)
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

        {/* Status */}
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as OrderStatus | 'all')}
          aria-label="Trạng thái lệnh"
          className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="scheduled">Đã lên lịch</option>
          <option value="released">Đã phát lệnh</option>
          <option value="in_progress">Đang gia công</option>
          <option value="completed">Đã hoàn thành</option>
          <option value="on_hold">Tạm dừng</option>
          <option value="cancelled">Đã hủy</option>
        </select>

        {/* Priority */}
        <select
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value as OrderPriority | 'all')}
          aria-label="Mức độ ưu tiên"
          className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">Tất cả độ ưu tiên</option>
          <option value="urgent">Khẩn cấp</option>
          <option value="high">Ưu tiên cao</option>
          <option value="medium">Trung bình</option>
          <option value="low">Thấp</option>
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
