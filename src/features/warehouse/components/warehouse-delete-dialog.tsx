import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Warehouse } from '@/features/warehouse/types';

interface WarehouseDeleteDialogProps {
  isOpen: boolean;
  warehouse: Warehouse | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export const WarehouseDeleteDialog: React.FC<WarehouseDeleteDialogProps> = ({
  isOpen,
  warehouse,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  if (!isOpen || !warehouse) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-warehouse-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-6 shadow-2xl animate-in fade-in-50 zoom-in-95">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 id="delete-warehouse-dialog-title" className="text-sm font-bold text-foreground">
              Xác nhận xóa kho lưu trữ
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hành động này không thể hoàn tác nếu đã thực hiện.
            </p>
          </div>
        </div>

        <div className="my-4 rounded-xl border border-border bg-muted/40 p-3 text-xs">
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Mã kho:</span>
            <span className="font-mono font-bold text-foreground">{warehouse.code}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Tên kho:</span>
            <span className="font-semibold text-foreground">{warehouse.name}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted-foreground">Vị trí:</span>
            <span className="text-foreground">{warehouse.location || '—'}</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Lưu ý: Hệ thống sẽ chặn xóa nếu kho đang có số dư tồn hàng hóa hoặc đã phát sinh lịch sử giao dịch nhập/xuất.
        </p>

        <div className="mt-5 flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isDeleting}>
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={isDeleting}
            className="gap-2"
          >
            {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>Xác nhận xóa</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
