import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, GitCommit, Plus, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  machineAdjustmentSchema,
  type MachineAdjustmentFormValues,
} from '../validation/maintenance-schemas';
import type { Machine } from '../types';
import { useCreateMachineAdjustment } from '../hooks/use-machine-adjustments';
import { MachineStatusBadge } from './maintenance-badges';

import { useMachineOptions } from '../hooks/use-machines';

export interface MachineAdjustmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  machine?: Machine | null;
}

export const MachineAdjustmentDialog: React.FC<MachineAdjustmentDialogProps> = ({
  isOpen,
  onClose,
  machine,
}) => {
  const { mutateAsync: createAdjustment, isPending } = useCreateMachineAdjustment();
  const { data: machineOptions } = useMachineOptions();

  const [paramRows, setParamRows] = useState<Array<{ key: string; value: string }>>([]);

  const todayStr = new Date().toISOString().split('T')[0];

  const defaultMachineId = machine?.id || (machineOptions?.[0]?.id ?? '');
  const defaultStatus = machine?.status || (machineOptions?.[0]?.status ?? 'operational');

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
  }, [isOpen, machine, machineOptions, reset, todayStr]);

  const handleMachineChange = (mId: string) => {
    setValue('machine_id', mId);
    const m = machineOptions?.find((opt) => opt.id === mId);
    if (m) {
      setValue('status_before', m.status);
      setValue('status_after', m.status);
    }
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

    await createAdjustment({
      ...values,
      changed_params: Object.keys(paramsMap).length > 0 ? paramsMap : null,
    });

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
                Ghi Nhận Điều Chỉnh, Cải Tiến Thiết Bị
              </h2>
              <p className="text-[11px] text-muted-foreground font-mono">
                {machine ? `${machine.name} (${machine.machine_code})` : 'Cập nhật giải pháp kỹ thuật & thông số'}
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
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          <input type="hidden" {...register('machine_id')} />
          <input type="hidden" {...register('status_before')} />

          {/* Machine selector if opened from global tab */}
          {!machine && (
            <div className="space-y-1">
              <label htmlFor="machine_id_select" className="text-xs font-semibold text-foreground">
                Chọn thiết bị cần điều chỉnh / cải tiến <span className="text-destructive">*</span>
              </label>
              <select
                id="machine_id_select"
                value={selectedMachineId}
                onChange={(e) => handleMachineChange(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Chọn thiết bị máy móc --</option>
                {machineOptions?.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.machine_code} - {opt.name} ({opt.status})
                  </option>
                ))}
              </select>
              {errors.machine_id && (
                <p className="text-[11px] text-destructive">{errors.machine_id.message}</p>
              )}
            </div>
          )}

          {/* Status before and after */}
          <div className="rounded-xl border border-border bg-accent/15 p-4 space-y-3">
            <div className="text-xs font-bold text-foreground uppercase tracking-wider">
              Trạng thái vận hành thiết bị
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                  Trạng thái trước điều chỉnh
                </label>
                <div className="flex items-center gap-2">
                  <MachineStatusBadge status={selectedStatusBefore} />
                  <span className="text-xs text-muted-foreground">
                    ({selectedStatusBefore})
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="status_after"
                  className="text-[11px] font-semibold text-foreground block mb-1"
                >
                  Trạng thái sau điều chỉnh <span className="text-destructive">*</span>
                </label>
                <select
                  id="status_after"
                  {...register('status_after')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="operational">Đang vận hành (operational)</option>
                  <option value="in_maintenance">Đang bảo dưỡng (in_maintenance)</option>
                  <option value="standby">Dự phòng (standby)</option>
                  <option value="breakdown">Sự cố / Hỏng (breakdown)</option>
                  <option value="decommissioned">Ngừng sử dụng (decommissioned)</option>
                </select>
                {errors.status_after && (
                  <p className="text-[11px] text-destructive mt-1">
                    {errors.status_after.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Operating condition before */}
          <div className="space-y-1">
            <label
              htmlFor="operating_condition_before"
              className="text-xs font-semibold text-foreground"
            >
              Tình trạng hoạt động thực tế (trước điều chỉnh)
            </label>
            <textarea
              id="operating_condition_before"
              rows={2}
              placeholder="VD: Băng tải bị lệch tâm 15mm khi tải nặng 50 tấn/h; rung lắc mạnh tại cụm gối đỡ..."
              {...register('operating_condition_before')}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y"
            />
            {errors.operating_condition_before && (
              <p className="text-[11px] text-destructive">
                {errors.operating_condition_before.message}
              </p>
            )}
          </div>

          {/* Improvement Content */}
          <div className="space-y-1">
            <label
              htmlFor="improvement_content"
              className="text-xs font-semibold text-foreground"
            >
              Nội dung điều chỉnh, cải tiến <span className="text-destructive">*</span>
            </label>
            <textarea
              id="improvement_content"
              rows={3}
              placeholder="VD: Gia công thay thế cụm con lăn tự lựa trung tâm, bọc thêm cao su PU chống trượt mép, căn chỉnh lại góc nghiêng máng cấp liệu..."
              {...register('improvement_content')}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y"
            />
            {errors.improvement_content && (
              <p className="text-[11px] text-destructive">
                {errors.improvement_content.message}
              </p>
            )}
          </div>

          {/* Result after adjustment */}
          <div className="space-y-1">
            <label htmlFor="result" className="text-xs font-semibold text-foreground">
              Kết quả sau điều chỉnh / Nghiệm thu <span className="text-destructive">*</span>
            </label>
            <textarea
              id="result"
              rows={2}
              placeholder="VD: Băng chạy êm, thẳng tâm tuyệt đối, đạt công suất định mức 50 tấn/h, không còn tiếng ồn rung lắc."
              {...register('result')}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y"
            />
            {errors.result && (
              <p className="text-[11px] text-destructive">{errors.result.message}</p>
            )}
          </div>

          {/* Date performed */}
          <div className="space-y-1">
            <label htmlFor="performed_at" className="text-xs font-semibold text-foreground">
              Ngày thực hiện <span className="text-destructive">*</span>
            </label>
            <input
              id="performed_at"
              type="date"
              {...register('performed_at')}
              className="w-full max-w-xs rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.performed_at && (
              <p className="text-[11px] text-destructive">{errors.performed_at.message}</p>
            )}
          </div>

          {/* Changed parameters */}
          <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Các thông số thay đổi sau điều chỉnh
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Ghi lại các thông số kỹ thuật mới sau cải tiến (ví dụ: tốc độ 1.5m/s, khe hở 20mm...)
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setParamRows([...paramRows, { key: '', value: '' }])}
                className="h-7 text-xs gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm thông số</span>
              </Button>
            </div>

            {paramRows.length === 0 ? (
              <div className="text-center py-2.5 text-[11px] text-muted-foreground border border-dashed border-border rounded-lg bg-background/50">
                Chưa có thông số nào thay đổi. Nhấn "Thêm thông số" nếu có điều chỉnh thông số kỹ thuật.
              </div>
            ) : (
              <div className="space-y-2">
                {paramRows.map((row, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Tên thông số (VD: Tốc độ băng tải, Khe hở...)"
                      value={row.key}
                      onChange={(e) => {
                        const val = e.target.value;
                        setParamRows((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, key: val } : item)),
                        );
                      }}
                      className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      placeholder="Giá trị mới (VD: 1.5 m/s, 20 mm...)"
                      value={row.value}
                      onChange={(e) => {
                        const val = e.target.value;
                        setParamRows((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, value: val } : item)),
                        );
                      }}
                      className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const updated = paramRows.filter((_, i) => i !== index);
                        setParamRows(updated);
                      }}
                      aria-label="Xóa thông số"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
              disabled={isPending}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Lưu nhật ký điều chỉnh</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
