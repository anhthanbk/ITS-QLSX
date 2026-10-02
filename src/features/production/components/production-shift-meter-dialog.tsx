import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Gauge } from 'lucide-react';
import {
  shiftMeterSchema,
  type ShiftMeterFormValues,
} from '../validation/production-schemas';

interface ProductionShiftMeterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: ShiftMeterFormValues) => Promise<void>;
  shiftId: string;
  isSubmitting?: boolean;
}

export const ProductionShiftMeterDialog: React.FC<ProductionShiftMeterDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  shiftId,
  isSubmitting = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ShiftMeterFormValues>({
    resolver: zodResolver(shiftMeterSchema),
    defaultValues: {
      shift_id: shiftId,
      meter_code: 'DH-DIEN-01',
      meter_name: 'Đồng hồ điện tổng trạm biến áp',
      meter_type: 'electric_meter',
      start_reading: 1000,
      end_reading: 1120,
      multiplier: 1.0,
      consumed_quantity: 120,
      unit_of_measure: 'kWh',
      notes: '',
    },
  });

  const startVal = watch('start_reading') || 0;
  const endVal = watch('end_reading') || 0;
  const mult = watch('multiplier') || 1;

  React.useEffect(() => {
    const diff = Math.max(0, endVal - startVal) * mult;
    setValue('consumed_quantity', Number(diff.toFixed(2)));
  }, [startVal, endVal, mult, setValue]);

  React.useEffect(() => {
    if (isOpen) {
      reset({
        shift_id: shiftId,
        meter_code: 'DH-DIEN-01',
        meter_name: 'Đồng hồ điện tổng trạm biến áp',
        meter_type: 'electric_meter',
        start_reading: 1000,
        end_reading: 1120,
        multiplier: 1.0,
        consumed_quantity: 120,
        unit_of_measure: 'kWh',
        notes: '',
      });
    }
  }, [isOpen, shiftId, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <Gauge className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Ghi nhận chỉ số đo ca</h3>
              <p className="text-xs text-muted-foreground">
                Ghi số đo cân, điện năng, dầu, than và lượng hóa chất tiêu hao
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground">Loại đồng hồ *</label>
              <select
                {...register('meter_type')}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'electric_meter') {
                    setValue('meter_code', 'DH-DIEN-01');
                    setValue('meter_name', 'Đồng hồ điện tổng');
                    setValue('unit_of_measure', 'kWh');
                  } else if (val === 'input_scale') {
                    setValue('meter_code', 'CAN-DAU-VAO');
                    setValue('meter_name', 'Cân băng tải quặng cấp');
                    setValue('unit_of_measure', 'Tấn');
                  } else if (val === 'output_scale') {
                    setValue('meter_code', 'CAN-DAU-RA');
                    setValue('meter_name', 'Cân thành phẩm cát');
                    setValue('unit_of_measure', 'Tấn');
                  } else if (val === 'diesel_meter') {
                    setValue('meter_code', 'DH-DAU-DO');
                    setValue('meter_name', 'Công tơ dầu máy phát / xúc');
                    setValue('unit_of_measure', 'Lít');
                  } else if (val === 'water_meter') {
                    setValue('meter_code', 'DH-NUOC-01');
                    setValue('meter_name', 'Đồng hồ nước tuần hoàn');
                    setValue('unit_of_measure', 'm3');
                  }
                }}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground"
              >
                <option value="electric_meter">Điện năng (kWh)</option>
                <option value="input_scale">Cân cấp quặng đầu vào (Tấn)</option>
                <option value="output_scale">Cân thành phẩm đầu ra (Tấn)</option>
                <option value="diesel_meter">Dầu Diesel (Lít)</option>
                <option value="water_meter">Nước tuần hoàn (m3)</option>
                <option value="coal_scale">Than đốt sấy (Tấn)</option>
                <option value="chemical_meter">Hóa chất tuyển (kg/lít)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground">Mã đồng hồ *</label>
              <input
                type="text"
                {...register('meter_code')}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground"
              />
              {errors.meter_code && (
                <p className="mt-0.5 text-[10px] text-destructive">{errors.meter_code.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground">Tên đồng hồ / Vị trí *</label>
            <input
              type="text"
              {...register('meter_name')}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground"
            />
            {errors.meter_name && (
              <p className="mt-0.5 text-[10px] text-destructive">{errors.meter_name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground">Chỉ số đầu *</label>
              <input
                type="number"
                step="0.01"
                {...register('start_reading', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground">Chỉ số cuối *</label>
              <input
                type="number"
                step="0.01"
                {...register('end_reading', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground">Hệ số nhân</label>
              <input
                type="number"
                step="0.01"
                {...register('multiplier', { valueAsNumber: true })}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/20 p-2.5">
            <div>
              <span className="text-[11px] text-muted-foreground">Tiêu hao tính toán:</span>
              <p className="text-sm font-bold text-primary">
                {watch('consumed_quantity')} {watch('unit_of_measure')}
              </p>
            </div>
            <div>
              <label className="block text-[11px] text-muted-foreground">Đơn vị đo</label>
              <input
                type="text"
                {...register('unit_of_measure')}
                className="mt-0.5 w-full rounded border border-input bg-background px-2 py-1 text-xs text-foreground"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-input bg-background px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu chỉ số'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
