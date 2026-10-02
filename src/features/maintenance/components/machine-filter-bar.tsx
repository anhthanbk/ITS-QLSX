import React from 'react';
import { Search, RotateCcw, Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MachineStatus } from '../types';

interface MachineFilterBarProps {
  search: string;
  status: MachineStatus | 'all';
  onSearchChange: (search: string) => void;
  onStatusChange: (status: MachineStatus | 'all') => void;
  onReset: () => void;
  canCreate: boolean;
  onOpenCreate: () => void;
}

export const MachineFilterBar: React.FC<MachineFilterBarProps> = ({
  search,
  status,
  onSearchChange,
  onStatusChange,
  onReset,
  canCreate,
  onOpenCreate,
}) => {
  const isFiltered = search !== '' || status !== 'all';

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      {/* Search and Filters */}
      <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo mã TB, tên thiết bị, model, serial, vị trí..."
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-4 text-xs font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative min-w-[170px]">
            <Filter className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value as MachineStatus | 'all')}
              className="w-full appearance-none rounded-lg border border-input bg-background py-2 pl-8 pr-8 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="operational">Đang vận hành</option>
              <option value="in_maintenance">Đang bảo dưỡng</option>
              <option value="breakdown">Sự cố / Hỏng</option>
              <option value="standby">Dự phòng (Standby)</option>
              <option value="decommissioned">Ngừng sử dụng</option>
            </select>
          </div>

          {/* Reset Filters */}
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Đặt lại
            </Button>
          )}
        </div>
      </div>

      {/* Action Button */}
      {canCreate && (
        <div className="flex items-center gap-2 border-t border-border pt-3 md:border-t-0 md:pt-0">
          <Button
            size="sm"
            onClick={onOpenCreate}
            className="w-full gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 md:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm thiết bị</span>
          </Button>
        </div>
      )}
    </div>
  );
};
