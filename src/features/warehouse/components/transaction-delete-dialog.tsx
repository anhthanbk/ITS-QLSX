import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { InventoryTransaction } from '@/features/warehouse/types';
import { TransactionTypeBadge } from './warehouse-badges';

interface TransactionDeleteDialogProps {
  isOpen: boolean;
  transaction: InventoryTransaction | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export const TransactionDeleteDialog: React.FC<TransactionDeleteDialogProps> = ({
  isOpen,
  transaction,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  if (!isOpen || !transaction) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-tx-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-destructive/30 bg-card p-6 shadow-2xl animate-in fade-in-50 zoom-in-95">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 id="delete-tx-dialog-title" className="text-sm font-bold text-foreground">
              Xác nhận xóa phiếu giao dịch kho
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hành động này sẽ xóa phiếu và hoàn tác số dư tồn kho tương ứng.
            </p>
          </div>
        </div>

        <div className="my-4 rounded-xl border border-border bg-muted/40 p-3.5 space-y-2 text-xs">
          <div className="flex justify-between items-center py-0.5">
            <span className="text-muted-foreground">Số phiếu:</span>
            <span className="font-mono font-bold text-foreground">{transaction.transaction_number}</span>
          </div>
          <div className="flex justify-between items-center py-0.5">
            <span className="text-muted-foreground">Loại giao dịch:</span>
            <TransactionTypeBadge type={transaction.transaction_type} />
          </div>
          <div className="flex justify-between items-center py-0.5">
            <span className="text-muted-foreground">Kho lưu trữ:</span>
            <span className="font-semibold text-foreground">{transaction.warehouse_name}</span>
          </div>
          <div className="flex justify-between items-center py-0.5">
            <span className="text-muted-foreground">Mặt hàng:</span>
            <span className="font-semibold text-foreground">{transaction.item_name}</span>
          </div>
          <div className="flex justify-between items-center py-0.5 border-t border-border/80 pt-1.5 font-medium">
            <span className="text-muted-foreground">Số lượng giao dịch:</span>
            <span className="font-mono font-bold text-foreground">
              {transaction.quantity > 0 ? `+${transaction.quantity.toLocaleString('vi-VN')}` : transaction.quantity.toLocaleString('vi-VN')}
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] text-amber-700 dark:text-amber-400">
          ⚠️ <strong>Lưu ý:</strong> Khi xóa phiếu, hệ thống sẽ tự động hoàn tác lượng xuất/nhập của giao dịch này vào tồn kho sổ sách.
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isDeleting}>
            Hủy
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
