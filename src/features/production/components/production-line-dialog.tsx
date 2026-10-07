import React, { useState, useEffect } from 'react';
import { X, Layers, Save, Trash2, AlertTriangle } from 'lucide-react';
import type { ProductionLine } from '../types';
import {
  useCreateProductionLine,
  useUpdateProductionLine,
  useDeleteProductionLine,
} from '../hooks/use-production-lines';

interface ProductionLineDialogProps {
  isOpen: boolean;
  onClose: () => void;
  line?: ProductionLine | null;
  onSuccess?: (line: ProductionLine) => void;
  onDelete?: (lineId: string) => void;
}

export const ProductionLineDialog: React.FC<ProductionLineDialogProps> = ({
  isOpen,
  onClose,
  line,
  onSuccess,
  onDelete,
}) => {
  const isEditing = !!line;
  const createMutation = useCreateProductionLine();
  const updateMutation = useUpdateProductionLine();
  const deleteMutation = useDeleteProductionLine();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [designedCapacityTph, setDesignedCapacityTph] = useState<number>(100);
  const [standardShiftHours, setStandardShiftHours] = useState<number>(8);
  const [shiftsPerDay, setShiftsPerDay] = useState<number>(3);
  const [status, setStatus] = useState<ProductionLine['status']>('active');
  const [formError, setFormError] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    if (line) {
      setCode(line.code);
      setName(line.name);
      setDesignedCapacityTph(Number(line.designed_capacity_tph) || 0);
      setStandardShiftHours(Number(line.standard_shift_hours) || 8);
      setShiftsPerDay(Number(line.shifts_per_day) || 3);
      setStatus(line.status);
    } else {
      setCode('');
      setName('');
      setDesignedCapacityTph(100);
      setStandardShiftHours(8);
      setShiftsPerDay(3);
      setStatus('active');
    }
    setFormError(null);
    setIsConfirmingDelete(false);
  }, [line, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!code.trim()) {
      setFormError('Vui lòng nhập mã dây chuyền');
      return;
    }
    if (!name.trim()) {
      setFormError('Vui lòng nhập tên dây chuyền');
      return;
    }

    try {
      if (isEditing && line) {
        const updated = await updateMutation.mutateAsync({
          id: line.id,
          values: {
            code: code.trim().toUpperCase(),
            name: name.trim(),
            designed_capacity_tph: designedCapacityTph,
            standard_shift_hours: standardShiftHours,
            shifts_per_day: shiftsPerDay,
            status,
          },
        });
        onSuccess?.(updated);
      } else {
        const created = await createMutation.mutateAsync({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          department_id: null,
          designed_capacity_tph: designedCapacityTph,
          standard_shift_hours: standardShiftHours,
          shifts_per_day: shiftsPerDay,
          status,
        });
        onSuccess?.(created);
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu dây chuyền';
      setFormError(msg);
    }
  };

  const handleDelete = async () => {
    if (!line) return;
    try {
      await deleteMutation.mutateAsync(line.id);
      onDelete?.(line.id);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể xóa dây chuyền sản xuất';
      setFormError(msg);
      setIsConfirmingDelete(false);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4 bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {isEditing ? 'Chỉnh sửa dây chuyền sản xuất' : 'Thiết lập dây chuyền sản xuất mới'}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Khai báo thông số kỹ thuật dây chuyền cho kế hoạch sản xuất
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Delete Confirmation Warning */}
        {isConfirmingDelete && line && (
          <div className="m-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-destructive font-semibold text-xs">
              <AlertTriangle className="h-4 w-4" />
              <span>Xác nhận xóa dây chuyền {line.name}?</span>
            </div>
            <p className="text-[11px] text-foreground/80">
              Dây chuyền và các kế hoạch liên quan sẽ bị xóa vĩnh viễn khỏi hệ thống nếu chưa có dữ liệu ca hoặc lệnh sản xuất.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="rounded-md bg-destructive px-2.5 py-1 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa dây chuyền'}
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {formError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Mã dây chuyền <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="VD: LINE-04, DC-SAY-01"
              className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-xs uppercase text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Tên dây chuyền <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Dây chuyền Sấy & Nghiền Siêu Mịn"
              className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Công suất thiết kế (tấn/h)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={designedCapacityTph}
                onChange={(e) => setDesignedCapacityTph(parseFloat(e.target.value) || 0)}
                className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Trạng thái
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductionLine['status'])}
                className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="active">Đang hoạt động</option>
                <option value="maintenance">Bảo trì</option>
                <option value="inactive">Tạm dừng</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Số ca / ngày
              </label>
              <input
                type="number"
                min="1"
                max="4"
                value={shiftsPerDay}
                onChange={(e) => setShiftsPerDay(parseInt(e.target.value, 10) || 3)}
                className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Giờ chuẩn / ca (h)
              </label>
              <input
                type="number"
                min="1"
                max="12"
                step="0.5"
                value={standardShiftHours}
                onChange={(e) => setStandardShiftHours(parseFloat(e.target.value) || 8)}
                className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <div>
              {isEditing && !isConfirmingDelete && (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-destructive hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Xóa line</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{isSubmitting ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Thêm dây chuyền'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
