import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDepartments } from '../hooks/use-departments';
import type { EmployeeStatus } from '../types';

export interface EmployeeFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  departmentId: string;
  onDepartmentChange: (value: string) => void;
  status: EmployeeStatus | 'all';
  onStatusChange: (value: EmployeeStatus | 'all') => void;
  onReset: () => void;
}

export const EmployeeFilterBar: React.FC<EmployeeFilterBarProps> = ({
  search,
  onSearchChange,
  departmentId,
  onDepartmentChange,
  status,
  onStatusChange,
  onReset,
}) => {
  const { data: departments } = useDepartments();

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="employee-search-input"
            type="text"
            placeholder="Tìm theo mã, họ tên, email..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-4 text-xs font-medium placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Department Select */}
          <select
            id="employee-dept-filter"
            value={departmentId}
            onChange={(e) => onDepartmentChange(e.target.value)}
            aria-label="Lọc theo phòng ban"
            className="rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Tất cả phòng ban</option>
            {departments?.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name} ({dept.code})
              </option>
            ))}
          </select>

          {/* Status Select */}
          <select
            id="employee-status-filter"
            value={status}
            onChange={(e) => onStatusChange(e.target.value as EmployeeStatus | 'all')}
            aria-label="Lọc theo trạng thái"
            className="rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang làm việc</option>
            <option value="on_leave">Nghỉ phép</option>
            <option value="terminated">Đã thôi việc</option>
          </select>

          {/* Reset button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            title="Đặt lại bộ lọc"
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Đặt lại
          </Button>
        </div>
      </div>
    </div>
  );
};
