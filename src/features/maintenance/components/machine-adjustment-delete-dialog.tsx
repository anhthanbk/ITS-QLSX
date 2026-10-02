import React from 'react';
import { AlertTriangle, Loader2, Calendar, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MachineAdjustment } from '../types';

export interface MachineAdjustmentDeleteDialogProps {
  adjustment: MachineAdjustment | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export const MachineAdjustmentDeleteDialog: React.FC<MachineAdjustmentDeleteDialogProps> = ({
  adjustment,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  if (!isOpen || !adjustment) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-adjustment-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-6 shadow-2xl animate-in fade-in-50 zoom-in-95">
        <div className="flex items-center gap-3 text-destructive">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 id="delete-adjustment-title" className="text-base font-bold text-foreground">
              Xóa Nhật Ký Cải Tiến Thiết Bị
            </h3>
            <p className="text-xs text-muted-foreground">Hành động này không thể hoàn tác</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3.5 text-xs text-muted-foreground space-y-2">
          {adjustment.machines && (
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <span className="font-mono text-primary bg-primary/10 px-2 py-0.5 rounded text-[11px] border border-primary/20">
                {adjustment.machines.machine_code}
              </span>
              <span>{adjustment.machines.name}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Ngày thực hiện: <strong className="text-foreground">{adjustment.performed_at}</strong></span>
          </div>

          <div className="rounded-lg border border-border/80 bg-background/60 p-2.5 space-y-1">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
              <Wrench className="h-3 w-3 text-primary" />
              <span>Nội dung cải tiến:</span>
            </div>
            <p className="line-clamp-2 text-foreground font-medium text-[11px]">
              {adjustment.improvement_content}
            </p>
          </div>

          <p className="text-[11px] text-destructive/80 font-medium">
            Lưu ý: Thao tác này sẽ xóa vĩnh viễn hồ sơ cải tiến kỹ thuật này khỏi lịch sử máy móc.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
            className="text-xs"
          >
            Hủy bỏ
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={isDeleting}
            className="gap-2 text-xs"
          >
            {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>Xác nhận xóa</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
