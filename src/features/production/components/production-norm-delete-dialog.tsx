import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { TechnoEconomicNorm } from '../types';

interface ProductionNormDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  norm: TechnoEconomicNorm | null;
  isDeleting?: boolean;
}

export const ProductionNormDeleteDialog: React.FC<ProductionNormDeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  norm,
  isDeleting = false,
}) => {
  if (!isOpen || !norm) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-rose-100 p-2 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Xác nhận xóa định mức</h3>
            <p className="text-xs text-muted-foreground">Thao tác này không thể hoàn tác</p>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Bạn có chắc chắn muốn xóa định mức kinh tế kỹ thuật{' '}
          <strong className="text-foreground">{norm.norm_code}</strong> (
          <span className="text-foreground">{norm.resource_name}</span>)?
        </p>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-lg border border-input bg-background px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
          </button>
        </div>
      </div>
    </div>
  );
};
