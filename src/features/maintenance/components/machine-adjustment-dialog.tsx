import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, GitCommit, Plus, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  machineAdjustmentSchema,
  type MachineAdjustmentFormValues,
} from '../validation/maintenance-schemas';
import type { Machine, MachineAdjustment } from '../types';
import {
  useCreateMachineAdjustment,
  useUpdateMachineAdjustment,
} from '../hooks/use-machine-adjustments';
import { MachineStatusBadge } from './maintenance-badges';
import { useMachineOptions } from '../hooks/use-machines';

export interface MachineAdjustmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  machine?: Machine | null;
  adjustmentToEdit?: MachineAdjustment | null;
}

export const MachineAdjustmentDialog: React.FC<MachineAdjustmentDialogProps> = ({
  isOpen,
  onClose,
  machine,
  adjustmentToEdit,
}) => {
  const isEditing = !!adjustmentToEdit;
  const { mutateAsync: createAdjustment, isPending: isCreating } = useCreateMachineAdjustment();
  const { mutateAsync: updateAdjustment, isPending: isUpdating } = useUpdateMachineAdjustment();
  const isSubmitting = isCreating || isUpdating;

  const { data: machineOptions } = useMachineOptions();

  const [paramRows, setParamRows] = useState<Array<{ key: string; value: string }>>([]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const defaultMachineId =
    adjustmentToEdit?.machine_id || machine?.id || (machineOptions?.[0]?.id ?? '');
  const defaultStatus =
    adjustmentToEdit?.status_before || machine?.status || (machineOptions?.[0]?.status ?? 'operational');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MachineAdjustmentFormValues>({
    resolver: zodResolver(machineAdjustmentSchema),
    defaultValues: {
      machine_id: defaultMachineId,
      status_before: defaultStatus,
      status_after: defaultStatus,
      operating_condition_before: '',
      improvement_content: '',
      result: '',
      applied_to_machine: true,
      performed_at: todayStr,
    },
  });

  const selectedMachineId = watch('machine_id');
  const selectedStatusAfter = watch('status_after');
  const selectedStatusBefore = watch('status_before');

  useEffect(() => {
    if (isOpen) {
      if (adjustmentToEdit) {
        reset({
          machine_id: adjustmentToEdit.machine_id,
          status_before: adjustmentToEdit.status_before,
          status_after: adjustmentToEdit.status_after,
          operating_condition_before: adjustmentToEdit.operating_condition_before || '',
          improvement_content: adjustmentToEdit.improvement_content,
          result: adjustmentToEdit.result,
          applied_to_machine: adjustmentToEdit.applied_to_machine ?? true,
          performed_at: adjustmentToEdit.performed_at,
        });

        if (adjustmentToEdit.changed_params && Object.keys(adjustmentToEdit.changed_params).length > 0) {
          setParamRows(
            Object.entries(adjustmentToEdit.changed_params).map(([key, value]) => ({
              key,
              value: String(value),
            })),
          );
        } else {
          setParamRows([]);
        }
      } else {
        const initId = machine?.id || (machineOptions?.[0]?.id ?? '');
        const initStatus = machine?.status || (machineOptions?.[0]?.status ?? 'operational');

        reset({
          machine_id: initId,
          status_before: initStatus,
          status_after: initStatus,
          operating_condition_before: '',
          improvement_content: '',
          result: '',
          applied_to_machine: true,
          performed_at: todayStr,
        });

        if (machine?.extra_specs && Object.keys(machine.extra_specs).length > 0) {
          setParamRows(
            Object.entries(machine.extra_specs).map(([key, value]) => ({
              key,
              value: String(value),
            })),
          );
        } else {
          setParamRows([]);
        }
      }
    }
  }, [isOpen, machine, machineOptions, reset, todayStr, adjustmentToEdit]);

  const handleMachineChange = (mId: string) => {
    setValue('machine_id', mId);
    const m = machineOptions?.find((opt) => opt.id === mId);
    if (m) {
      setValue('status_before', m.status);
      setValue('status_after', m.status);
    }
  };

  const handleAddParamRow = () => {
    setParamRows((prev) => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveParamRow = (index: number) => {
    setParamRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleParamChange = (index: number, field: 'key' | 'value', val: string) => {
    setParamRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: val } : row)),
    );
  };

  if (!isOpen) return null;

  const handleFormSubmit = async (values: MachineAdjustmentFormValues) => {
    const paramsMap: Record<string, string> = {};
    paramRows.forEach((row) => {
      const k = row.key.trim();
      const v = row.value.trim();
      if (k && v) {
        paramsMap[k] = v;
      }
    });

    const finalValues: MachineAdjustmentFormValues = {
      ...values,
      changed_params: Object.keys(paramsMap).length > 0 ? paramsMap : null,
    };

    if (isEditing && adjustmentToEdit) {
      await updateAdjustment({
        id: adjustmentToEdit.id,
        values: finalValues,
      });
    } else {
      await createAdjustment(finalValues);
    }

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="adjustment-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in-50 zoom-in-95">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <GitCommit className="h-4 w-4" />
            </div>
            <div>
              <h2 id="adjustment-dialog-title" className="text-base font-bold text-foreground">
                {isEditing
                  ? 'Chỉnh Sửa Cải Tiến & Điều Chỉnh Thiết Bị'
                  : 'Ghi Nhận Điều Chỉnh, Cải Tiến Thiết Bị'}
              </h2>
              <p className="text-[11px] text-muted-foreground font-mono">
                {machine
                  ? `${machine.name} (${machine.machine_code})`
                  : adjustmentToEdit?.machines
                  ? `${adjustmentToEdit.machines.name} (${adjustmentToEdit.machines.machine_code})`
                  : 'Cập nhật giải pháp kỹ thuật & thông số'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Đóng"
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5 p-6">
          {/* Target Machine Selection */}
          <div className="space-y-1.5">
            <label htmlFor="machine_id" className="text-xs font-semibold text-foreground">
              Thiết bị thực hiện cải tiến <span className="text-destructive">*</span>
            </label>
            <select
              id="machine_id"
              {...register('machine_id')}
              value={selectedMachineId}
              onChange={(e) => handleMachineChange(e.target.value)}
              disabled={!!machine}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
            >
              <option value="">-- Chọn thiết bị trong xưởng --</option>
              {machineOptions?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.machine_code} - {m.name}
                </option>
              ))}
            </select>
            {errors.machine_id && (
              <p className="text-[11px] text-destructive">{errors.machine_id.message}</p>
            )}
          </div>

          {/* Date Performed & Status Transitions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="performed_at" className="text-xs font-semibold text-foreground">
                Ngày thực hiện <span className="text-destructive">*</span>
              </label>
              <input
                id="performed_at"
                type="date"
                {...register('performed_at')}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.performed_at && (
                <p className="text-[11px] text-destructive">{errors.performed_at.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="status_before" className="text-xs font-semibold text-foreground">
                Trạng thái trước điều chỉnh
              </label>
              <select
                id="status_before"
                {...register('status_before')}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="operational">Hoạt động bình thường</option>
                <option value="under_maintenance">Đang bảo dưỡng</option>
                <option value="broken">Bị hỏng hóc</option>
                <option value="decommissioned">Ngừng sử dụng</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="status_after" className="text-xs font-semibold text-foreground">
                Trạng thái sau điều chỉnh
              </label>
              <select
                id="status_after"
                {...register('status_after')}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="operational">Hoạt động bình thường</option>
                <option value="under_maintenance">Đang bảo dưỡng</option>
                <option value="broken">Bị hỏng hóc</option>
                <option value="decommissioned">Ngừng sử dụng</option>
              </select>
            </div>
          </div>

          {/* Status transition preview */}
          <div className="flex items-center gap-2 rounded-xl bg-accent/20 border border-border/80 p-2.5 text-xs">
            <span className="text-muted-foreground font-medium">Chuyển trạng thái máy:</span>
            <MachineStatusBadge status={selectedStatusBefore} />
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            <MachineStatusBadge status={selectedStatusAfter} />
          </div>

          {/* Operating Condition Before */}
          <div className="space-y-1.5">
            <label
              htmlFor="operating_condition_before"
              className="text-xs font-semibold text-foreground"
            >
              Hiện trạng hoạt động trước cải tiến (không bắt buộc)
            </label>
            <textarea
              id="operating_condition_before"
              rows={2}
              placeholder="VD: Băng tải thường xuyên bị lệch tâm khi tải nặng vượt 80% định mức..."
              {...register('operating_condition_before')}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {/* Improvement Content */}
          <div className="space-y-1.5">
            <label
              htmlFor="improvement_content"
              className="text-xs font-semibold text-foreground"
            >
              Nội dung điều chỉnh, biện pháp cải tiến <span className="text-destructive">*</span>
            </label>
            <textarea
              id="improvement_content"
              rows={3}
              placeholder="Mô tả chi tiết giải pháp kỹ thuật, linh kiện thay thế hoặc gia công thêm..."
              {...register('improvement_content')}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            {errors.improvement_content && (
              <p className="text-[11px] text-destructive">
                {errors.improvement_content.message}
              </p>
            )}
          </div>

          {/* Result */}
          <div className="space-y-1.5">
            <label htmlFor="result" className="text-xs font-semibold text-foreground">
              Kết quả sau điều chỉnh / Đánh giá nghiệm thu <span className="text-destructive">*</span>
            </label>
            <textarea
              id="result"
              rows={2}
              placeholder="VD: Chạy thử không tải 30 phút và có tải 2 giờ đạt tiêu chuẩn. Băng tải không còn rung lắc..."
              {...register('result')}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
            {errors.result && (
              <p className="text-[11px] text-destructive">{errors.result.message}</p>
            )}
          </div>

          {/* Key-Value Technical Specification Changes */}
          <div className="space-y-3 rounded-2xl border border-border bg-accent/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-foreground">
                  Thông số kỹ thuật máy móc thay đổi (nếu có)
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Ghi nhận sự thay đổi về kích thước, tốc độ, áp suất, công suất thực tế...
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddParamRow}
                className="gap-1.5 text-xs bg-background"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm thông số</span>
              </Button>
            </div>

            {paramRows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-4 text-center text-xs text-muted-foreground">
                Chưa có thông số kỹ thuật nào được thêm. Bấm "Thêm thông số" để bổ sung.
              </div>
            ) : (
              <div className="space-y-2">
                {paramRows.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Tên thông số (VD: Tốc độ vòng quay)"
                      value={row.key}
                      onChange={(e) => handleParamChange(idx, 'key', e.target.value)}
                      className="flex-1 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="text"
                      placeholder="Giá trị mới (VD: 1450 rpm)"
                      value={row.value}
                      onChange={(e) => handleParamChange(idx, 'value', e.target.value)}
                      className="flex-1 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveParamRow(idx)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Option: Direct update to machine profile */}
          <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3">
            <input
              id="applied_to_machine"
              type="checkbox"
              {...register('applied_to_machine')}
              className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary"
            />
            <label htmlFor="applied_to_machine" className="text-xs text-foreground cursor-pointer">
              <span className="font-semibold text-primary block">
                Cập nhật trực tiếp vào hồ sơ thông số thiết bị
              </span>
              <span className="text-[11px] text-muted-foreground">
                Tự động đồng bộ trạng thái mới ({selectedStatusAfter}) và cập nhật các thông số kỹ thuật mới vào hồ sơ thiết bị hiện hành.
              </span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Đang lưu...' : isEditing ? 'Lưu thay đổi' : 'Lưu thông tin cải tiến'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
