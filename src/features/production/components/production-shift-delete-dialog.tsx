import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import type { ProductionShift } from '../types';

interface ProductionShiftDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  shift: ProductionShift | null;
  isDeleting?: boolean;
}

export const ProductionShiftDeleteDialog: React.FC<ProductionShiftDeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  shift,
  isDeleting = false,
}) => {
  if (!isOpen || !shift) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-rose-100 p-2 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Xác nhận xóa ca nhập liệu</h3>
            <p className="text-xs text-muted-foreground">Thao tác này dành cho Quản trị viên và Trưởng phòng SX</p>
          </div>
        </div>

        <div className="mt-4 space-y-2 rounded-lg border border-border bg-muted/30 p-3 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mã ca:</span>
            <span className="font-semibold text-primary">{shift.shift_code}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ngày sản xuất:</span>
            <span className="font-medium text-foreground">{shift.shift_date} (Ca {shift.shift_number})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dây chuyền:</span>
            <span className="font-medium text-foreground">{shift.line_name || '---'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sản lượng thành phẩm:</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              {shift.product_output_tons.toLocaleString()} Tấn
            </span>
          </div>
          {shift.status === 'verified' && (
            <div className="mt-2 rounded bg-amber-500/10 p-2 text-[11px] font-medium text-amber-600 dark:text-amber-400">
              ⚠️ Cảnh báo: Ca sản xuất này đã được nghiệm thu. Xóa ca sẽ ảnh hưởng đến số liệu thống kê luỹ kế.
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Bạn có chắc chắn muốn xóa bản ghi ca này? Toàn bộ dữ liệu sản lượng, tiêu hao nguyên nhiên liệu
          và thời gian dừng chuyền liên quan sẽ bị xóa vĩnh viễn và không thể hoàn tác.
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
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isDeleting ? 'Đang xóa ca...' : 'Xác nhận xóa ca'}
          </button>
        </div>
      </div>
    </div>
  );
};
