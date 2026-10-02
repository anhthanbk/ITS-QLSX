import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Machine } from '../types';

export interface MachineDeleteDialogProps {
  machine: Machine | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export const MachineDeleteDialog: React.FC<MachineDeleteDialogProps> = ({
  machine,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  if (!isOpen || !machine) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-machine-title"
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
            <h3 id="delete-machine-title" className="text-base font-bold text-foreground">
              Xóa Thiết Bị Máy Móc
            </h3>
            <p className="text-xs text-muted-foreground">Hành động này không thể hoàn tác</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3.5 text-xs text-muted-foreground space-y-1">
          <p>
            Bạn có chắc chắn muốn xóa thiết bị{' '}
            <span className="font-bold text-foreground">{machine.name}</span> (Mã:{' '}
            <span className="font-mono font-bold text-foreground">{machine.machine_code}</span>)?
          </p>
          <p className="text-[11px] text-destructive/80">
            Lưu ý: Nếu thiết bị đã có kế hoạch bảo dưỡng hoặc phiếu sửa chữa liên quan, hãy cập nhật trạng thái sang "Ngừng sử dụng" thay vì xóa vĩnh viễn.
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
