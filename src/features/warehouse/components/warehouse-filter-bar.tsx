import React from 'react';
import { Search, Plus, Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WarehouseFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  warehouseType: string;
  onWarehouseTypeChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  onReset: () => void;
  onOpenCreate: () => void;
  canManage: boolean;
}

export const WarehouseFilterBar: React.FC<WarehouseFilterBarProps> = ({
  search,
  onSearchChange,
  warehouseType,
  onWarehouseTypeChange,
  status,
  onStatusChange,
  onReset,
  onOpenCreate,
  canManage,
}) => {
  const hasFilter = search !== '' || warehouseType !== 'all' || status !== 'all';

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        {/* Search Input */}
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo mã kho, tên kho, vị trí..."
            className="w-full rounded-lg border border-input bg-background py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Warehouse Type Filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={warehouseType}
            onChange={(e) => onWarehouseTypeChange(e.target.value)}
            className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Tất cả loại kho</option>
            <option value="raw_material">Kho nguyên liệu</option>
            <option value="finished_goods">Kho thành phẩm</option>
            <option value="spare_parts">Kho phụ tùng</option>
            <option value="quarantine">Kho cách ly</option>
            <option value="byproduct">Kho phụ phẩm</option>
            <option value="transit">Kho trung chuyển</option>
          </select>
        </div>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Tạm dừng</option>
        </select>

        {/* Reset Filters */}
        {hasFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
            Đặt lại
          </Button>
        )}
      </div>

      {/* Action button */}
      {canManage && (
        <Button
          size="sm"
          onClick={onOpenCreate}
          className="gap-1.5 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" />
          Thêm kho mới
        </Button>
      )}
    </div>
  );
};
