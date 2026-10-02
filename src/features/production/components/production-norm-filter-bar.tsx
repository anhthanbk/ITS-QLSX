import React from 'react';
import { Search, RotateCcw, Plus } from 'lucide-react';
import type { ResourceType, ProductionLine } from '../types';

interface ProductionNormFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  resourceType: ResourceType | 'all';
  onResourceTypeChange: (value: ResourceType | 'all') => void;
  lineId: string | 'all';
  onLineIdChange: (value: string | 'all') => void;
  isActive: boolean | 'all';
  onIsActiveChange: (value: boolean | 'all') => void;
  lines: ProductionLine[];
  onReset: () => void;
  onCreate?: () => void;
  canManage: boolean;
}

export const ProductionNormFilterBar: React.FC<ProductionNormFilterBarProps> = ({
  search,
  onSearchChange,
  resourceType,
  onResourceTypeChange,
  lineId,
  onLineIdChange,
  isActive,
  onIsActiveChange,
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
            placeholder="Tìm theo mã định mức hoặc tên tài nguyên..."
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
            Thêm định mức KT - KT
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

        {/* Resource Type */}
        <select
          value={resourceType}
          onChange={(e) => onResourceTypeChange(e.target.value as ResourceType | 'all')}
          aria-label="Loại tài nguyên"
          className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">Tất cả tài nguyên tiêu hao</option>
          <option value="electricity">Điện năng (kWh)</option>
          <option value="water">Nước tuần hoàn (m3)</option>
          <option value="chemical">Hóa chất tuyển (kg/lít)</option>
          <option value="diesel">Dầu Diesel (Lít)</option>
          <option value="coal">Than đốt sấy (Tấn)</option>
          <option value="explosive">Vật liệu nổ</option>
          <option value="other">Tài nguyên khác</option>
        </select>

        {/* Is Active Status */}
        <select
          value={isActive === 'all' ? 'all' : isActive ? 'active' : 'inactive'}
          onChange={(e) => {
            const val = e.target.value;
            onIsActiveChange(val === 'all' ? 'all' : val === 'active');
          }}
          aria-label="Trạng thái định mức"
          className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">Tất cả hiệu lực</option>
          <option value="active">Đang áp dụng</option>
          <option value="inactive">Đã ngưng</option>
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
