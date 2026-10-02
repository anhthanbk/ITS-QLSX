import React from 'react';
import { AlertTriangle, CheckCircle2, Wrench, XCircle } from 'lucide-react';
import type { MachineStatus, WorkOrderPriority, WorkOrderStatus } from '../types';

export const MachineStatusBadge: React.FC<{ status: MachineStatus }> = ({ status }) => {
  switch (status) {
    case 'operational':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Đang vận hành
        </span>
      );
    case 'in_maintenance':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Đang bảo dưỡng
        </span>
      );
    case 'breakdown':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive border border-destructive/20">
          <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
          Sự cố / Hỏng
        </span>
      );
    case 'standby':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          Dự phòng
        </span>
      );
    case 'decommissioned':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground border border-border">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
          Ngừng sử dụng
        </span>
      );
    default:
      return null;
  }
};

export const WorkOrderPriorityBadge: React.FC<{ priority: WorkOrderPriority }> = ({ priority }) => {
  switch (priority) {
    case 'critical':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-0.5 text-[11px] font-bold text-destructive border border-destructive/30">
          <AlertTriangle className="h-3 w-3" />
          Khẩn cấp
        </span>
      );
    case 'high':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30">
          Ưu tiên cao
        </span>
      );
    case 'medium':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
          Bình thường
        </span>
      );
    case 'low':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground border border-border">
          Thấp
        </span>
      );
    default:
      return null;
  }
};

export const WorkOrderStatusBadge: React.FC<{ status: WorkOrderStatus }> = ({ status }) => {
  switch (status) {
    case 'open':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
          Mới tiếp nhận
        </span>
      );
    case 'in_progress':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Wrench className="h-3 w-3" />
          Đang sửa chữa
        </span>
      );
    case 'pending_parts':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-purple-600 dark:text-purple-400 border border-purple-500/20">
          Chờ phụ tùng
        </span>
      );
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="h-3 w-3" />
          Đã hoàn thành
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground border border-border">
          <XCircle className="h-3 w-3" />
          Đã hủy
        </span>
      );
    default:
      return null;
  }
};
