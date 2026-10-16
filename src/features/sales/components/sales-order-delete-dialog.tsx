import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { SalesOrder } from '../types';
import { Button } from '@/components/ui/button';

interface SalesOrderDeleteDialogProps {
  isOpen: boolean;
  order: SalesOrder | null;
  onClose: () => void;
  onConfirm: (orderId: string) => Promise<void>;
}

export const SalesOrderDeleteDialog: React.FC<SalesOrderDeleteDialogProps> = ({
  isOpen,
  order,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !order) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onConfirm(order.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Xác nhận xóa đơn hàng</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Bạn có chắc chắn muốn xóa đơn hàng bán{' '}
              <strong className="text-foreground">{order.order_code}</strong> của khách hàng{' '}
              <strong className="text-foreground">{order.customer?.name}</strong>?
            </p>
            <p className="mt-2 text-xs text-destructive">
              Hành động này sẽ xóa toàn bộ các dòng chi tiết sản phẩm của đơn hàng và không thể khôi phục.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isDeleting}>
            Hủy
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-2"
          >
            {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Xác nhận xóa
          </Button>
        </div>
      </div>
    </div>
  );
};
