import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { Supplier } from '../types';
import { Button } from '@/components/ui/button';

interface SupplierDeleteDialogProps {
  isOpen: boolean;
  supplier: Supplier | null;
  onClose: () => void;
  onConfirm: (supplierId: string) => Promise<void>;
}

export const SupplierDeleteDialog: React.FC<SupplierDeleteDialogProps> = ({
  isOpen,
  supplier,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !supplier) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onConfirm(supplier.id);
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
            <h3 className="text-base font-bold text-foreground">Xác nhận xóa nhà cung cấp</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Bạn có chắc chắn muốn xóa nhà cung cấp{' '}
              <strong className="text-foreground">{supplier.name}</strong> ({supplier.code})?
            </p>
            <p className="mt-2 text-xs text-destructive">
              Lưu ý: Nếu nhà cung cấp đã có đơn đặt hàng (PO) hoặc phiếu nhập kho, hệ thống sẽ chặn xóa để bảo toàn dữ liệu tài chính.
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
