import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  X,
  Clock,
  Package,
  Fuel,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
  Wrench,
  PauseCircle,
} from 'lucide-react';
import {
  productionShiftSchema,
  type ProductionShiftFormValues,
} from '../validation/production-schemas';
import type { ProductionShift, ProductionLine, ShiftProductOutput, ShiftDowntimeEvent } from '../types';
import { useShiftPlanContext } from '../hooks/use-production-shifts';
import { AddShiftProductDialog } from './add-shift-product-dialog';

const calculateDowntimeDuration = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return { minutes: 0, hours: 0 };
  const [shStr, smStr] = startTime.split(':');
  const [ehStr, emStr] = endTime.split(':');
  const sh = Number(shStr);
  const sm = Number(smStr);
  const eh = Number(ehStr);
  const em = Number(emStr);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return { minutes: 0, hours: 0 };

  const startMinutes = sh * 60 + sm;
  let endMinutes = eh * 60 + em;

  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60; // qua đêm (ca 3 hoặc vắt qua 00:00)
  }

  const diffMinutes = Math.max(0, endMinutes - startMinutes);
  const diffHours = Number((diffMinutes / 60).toFixed(2));
  return { minutes: diffMinutes, hours: diffHours };
};

const formatOffsetTime = (startTime: string, hoursOffset: number): string => {
  const [hStr, mStr] = startTime.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (isNaN(h) || isNaN(m)) return startTime;
  const totalM = Math.round(h * 60 + m + hoursOffset * 60) % (24 * 60);
  const rh = String(Math.floor(totalM / 60)).padStart(2, '0');
  const rm = String(totalM % 60).padStart(2, '0');
  return `${rh}:${rm}`;
};

interface ProductionShiftFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: ProductionShiftFormValues) => Promise<void>;
  initialData?: ProductionShift | null;
  lines: ProductionLine[];
  isSubmitting?: boolean;
}

export const ProductionShiftFormDialog: React.FC<ProductionShiftFormDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  lines,
  isSubmitting = false,
}) => {
  const isEditing = !!initialData;
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [activeTab, setActiveTab] = useState<'products' | 'materials' | 'downtime'>('products');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<ProductionShiftFormValues>({
    resolver: zodResolver(productionShiftSchema),
    defaultValues: {
      shift_code: '',
      line_id: lines[0]?.id || '',
      shift_date: todayStr,
      shift_number: 1,
      standard_shift_hours: 8.0,
      total_downtime_hours: 0,
      raw_material_input_tons: 0,
      product_output_tons: 0,
      byproduct_output_tons: 0,
      status: 'completed',
      notes: '',
      products_output: [],
      materials_consumption: [],
      downtime_breakdown: {
        maintenance_hours: 0,
        maintenance_note: '',
        incident_hours: 0,
        incident_category: 'mechanical',
        incident_reason: '',
        incident_action: '',
        planned_shutdown_hours: 0,
        planned_shutdown_reason: '',
        total_downtime_hours: 0,
        events: [],
      },
    },
  });

  const selectedLineId = watch('line_id');
  const selectedDate = watch('shift_date');
  const selectedShiftNumber = watch('shift_number');
  const stdHours = watch('standard_shift_hours') || 8;

  // Field arrays
  const {
    fields: productFields,
    append: appendProduct,
    remove: removeProduct,
    replace: replaceProducts,
  } = useFieldArray({
    control,
    name: 'products_output',
  });

  const {
    fields: materialFields,
    append: appendMaterial,
    remove: removeMaterial,
    replace: replaceMaterials,
  } = useFieldArray({
    control,
    name: 'materials_consumption',
  });

  const {
    fields: downtimeEventFields,
    append: appendDowntimeEvent,
    remove: removeDowntimeEvent,
  } = useFieldArray({
    control,
    name: 'downtime_breakdown.events',
  });

  // Watch downtime events & breakdown to calculate total downtime and running hours
  const rawWatchedEvents = watch('downtime_breakdown.events');
  const watchEvents = useMemo(() => rawWatchedEvents ?? [], [rawWatchedEvents]);
  const rawWatchedProducts = watch('products_output');
  const watchProducts = useMemo(() => rawWatchedProducts ?? [], [rawWatchedProducts]);

  const watchMaintHours = watch('downtime_breakdown.maintenance_hours');
  const watchIncHours = watch('downtime_breakdown.incident_hours');
  const watchShutHours = watch('downtime_breakdown.planned_shutdown_hours');

  const {
    maintenanceHours,
    incidentHours,
    plannedShutdownHours,
    totalDowntime,
  } = useMemo(() => {
    if (watchEvents.length > 0) {
      let maint = 0;
      let inc = 0;
      let plan = 0;
      for (const evt of watchEvents) {
        const dur = calculateDowntimeDuration(evt.start_time, evt.end_time).hours;
        if (evt.type === 'planned_maintenance') maint += dur;
        else if (evt.type === 'scheduled_shutdown') plan += dur;
        else inc += dur;
      }
      const total = Number((maint + inc + plan).toFixed(2));
      return {
        maintenanceHours: Number(maint.toFixed(2)),
        incidentHours: Number(inc.toFixed(2)),
        plannedShutdownHours: Number(plan.toFixed(2)),
        totalDowntime: total,
      };
    }

    const m = Number(watchMaintHours || 0);
    const i = Number(watchIncHours || 0);
    const p = Number(watchShutHours || 0);
    return {
      maintenanceHours: m,
      incidentHours: i,
      plannedShutdownHours: p,
      totalDowntime: Number((m + i + p).toFixed(2)),
    };
  }, [
    watchEvents,
    watchMaintHours,
    watchIncHours,
    watchShutHours,
  ]);

  const runningHours = Math.max(0, Number((stdHours - totalDowntime).toFixed(2)));

  // Auto sum finished products
  const totalFinishedOutput = useMemo(() => {
    return Number(
      watchProducts.reduce((sum, p) => sum + (Number(p.quantity_tons) || 0), 0).toFixed(2),
    );
  }, [watchProducts]);

  // Keep total_downtime_hours and product_output_tons in sync
  useEffect(() => {
    setValue('total_downtime_hours', totalDowntime);
    setValue('downtime_breakdown.total_downtime_hours', totalDowntime);
    if (watchEvents.length > 0) {
      setValue('downtime_breakdown.maintenance_hours', maintenanceHours);
      setValue('downtime_breakdown.incident_hours', incidentHours);
      setValue('downtime_breakdown.planned_shutdown_hours', plannedShutdownHours);

      watchEvents.forEach((evt, idx) => {
        const { minutes, hours } = calculateDowntimeDuration(evt.start_time, evt.end_time);
        if (evt.duration_minutes !== minutes) {
          setValue(`downtime_breakdown.events.${idx}.duration_minutes`, minutes);
        }
        if (evt.duration_hours !== hours) {
          setValue(`downtime_breakdown.events.${idx}.duration_hours`, hours);
        }
      });
    }
  }, [
    totalDowntime,
    maintenanceHours,
    incidentHours,
    plannedShutdownHours,
    watchEvents,
    setValue,
  ]);

  useEffect(() => {
    setValue('product_output_tons', totalFinishedOutput);
  }, [totalFinishedOutput, setValue]);

  // Fetch plan context (registered products & planned materials for this line and month)
  const { data: planContext, isLoading: _isLoadingPlan } = useShiftPlanContext(
    selectedLineId,
    selectedDate,
    isOpen,
  );

  // Auto-generate shift code
  useEffect(() => {
    if (!isEditing && selectedLineId && selectedDate && selectedShiftNumber) {
      const line = lines.find((l) => l.id === selectedLineId);
      const lineCode = line?.code || 'LINE';
      const cleanDate = selectedDate.replace(/-/g, '');
      setValue('shift_code', `CA-${cleanDate}-${lineCode}-S${selectedShiftNumber}`);
    }
  }, [selectedLineId, selectedDate, selectedShiftNumber, isEditing, lines, setValue]);

  const prevIsOpenRef = useRef(false);
  const lastContextKeyRef = useRef('');

  // Initialize or reset form when dialog opens
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      lastContextKeyRef.current = '';
      if (initialData) {
        const breakdown = initialData.downtime_breakdown;
        let initialEvents: ShiftDowntimeEvent[] = breakdown?.events ? [...breakdown.events] : [];

        // If no events array exists in saved breakdown, but there were legacy downtime hours recorded:
        if (
          initialEvents.length === 0 &&
          (initialData.total_downtime_hours > 0 || (breakdown && breakdown.total_downtime_hours > 0))
        ) {
          const eventsFromLegacy: ShiftDowntimeEvent[] = [];
          if (breakdown?.incident_hours && breakdown.incident_hours > 0) {
            const eTime = formatOffsetTime('08:00', breakdown.incident_hours);
            const { minutes, hours } = calculateDowntimeDuration('08:00', eTime);
            eventsFromLegacy.push({
              type: 'breakdown_incident',
              start_time: '08:00',
              end_time: eTime,
              duration_minutes: minutes,
              duration_hours: hours || breakdown.incident_hours,
              incident_category: breakdown.incident_category || 'Sự cố Cơ khí',
              reason: breakdown.incident_reason || 'Sự cố dừng chuyền',
              action_taken: breakdown.incident_action || '',
            });
          }
          if (breakdown?.maintenance_hours && breakdown.maintenance_hours > 0) {
            const eTime = formatOffsetTime('10:00', breakdown.maintenance_hours);
            const { minutes, hours } = calculateDowntimeDuration('10:00', eTime);
            eventsFromLegacy.push({
              type: 'planned_maintenance',
              start_time: '10:00',
              end_time: eTime,
              duration_minutes: minutes,
              duration_hours: hours || breakdown.maintenance_hours,
              reason: breakdown.maintenance_note || 'Dừng bảo trì thiết bị',
              action_taken: '',
            });
          }
          if (breakdown?.planned_shutdown_hours && breakdown.planned_shutdown_hours > 0) {
            const eTime = formatOffsetTime('12:00', breakdown.planned_shutdown_hours);
            const { minutes, hours } = calculateDowntimeDuration('12:00', eTime);
            eventsFromLegacy.push({
              type: 'scheduled_shutdown',
              start_time: '12:00',
              end_time: eTime,
              duration_minutes: minutes,
              duration_hours: hours || breakdown.planned_shutdown_hours,
              reason: breakdown.planned_shutdown_reason || 'Nghỉ theo kế hoạch',
              action_taken: '',
            });
          }
          if (eventsFromLegacy.length > 0) {
            initialEvents = eventsFromLegacy;
          }
        }

        reset({
          shift_code: initialData.shift_code,
          line_id: initialData.line_id,
          shift_date: initialData.shift_date,
          shift_number: initialData.shift_number,
          standard_shift_hours: initialData.standard_shift_hours,
          total_downtime_hours: initialData.total_downtime_hours,
          raw_material_input_tons: initialData.raw_material_input_tons || 0,
          product_output_tons: initialData.product_output_tons || 0,
          byproduct_output_tons: initialData.byproduct_output_tons || 0,
          actual_quality_rate_pct:
            initialData.actual_quality_rate_pct !== undefined && initialData.actual_quality_rate_pct !== null
              ? Number(initialData.actual_quality_rate_pct)
              : 100,
          operator_employee_id: initialData.operator_employee_id,
          status: initialData.status,
          notes: initialData.notes || '',
          products_output: initialData.products_output || [],
          materials_consumption: initialData.materials_consumption || [],
          downtime_breakdown: {
            maintenance_hours: breakdown?.maintenance_hours || 0,
            maintenance_note: breakdown?.maintenance_note || '',
            incident_hours: breakdown?.incident_hours || 0,
            incident_category: breakdown?.incident_category || 'mechanical',
            incident_reason: breakdown?.incident_reason || '',
            incident_action: breakdown?.incident_action || '',
            planned_shutdown_hours: breakdown?.planned_shutdown_hours || 0,
            planned_shutdown_reason: breakdown?.planned_shutdown_reason || '',
            total_downtime_hours: initialData.total_downtime_hours,
            events: initialEvents,
          },
        });
      } else {
        const cleanDate = todayStr.replace(/-/g, '');
        const targetLineId = lines[0]?.id || '';

        // If planContext is already cached and available, prepopulate immediately
        const initialProds = (planContext?.products && planContext.products.length > 0)
          ? planContext.products.map((p) => ({
              product_id: p.productId,
              product_name: p.productName,
              product_sku: p.productSku,
              unitOfMeasure: p.unitOfMeasure,
              is_out_of_plan: false,
              quantity_tons: 0,
            }))
          : [];

        const initialMats = (planContext?.materials && planContext.materials.length > 0)
          ? planContext.materials.map((m) => ({
              material_id: m.materialId,
              resource_name: m.resourceName,
              category: m.categoryGroup,
              unitOfMeasure: m.unitOfMeasure,
              planned_norm: m.monthlyPlannedQty,
              actual_quantity: 0,
              notes: '',
            }))
          : [];

        if (initialProds.length > 0 || initialMats.length > 0) {
          lastContextKeyRef.current = `${targetLineId}_${todayStr}`;
        }

        reset({
          shift_code: `CA-${cleanDate}-${lines[0]?.code || 'LINE'}-S1`,
          line_id: targetLineId,
          shift_date: todayStr,
          shift_number: 1,
          standard_shift_hours: 8.0,
          total_downtime_hours: 0,
          raw_material_input_tons: 0,
          product_output_tons: 0,
          byproduct_output_tons: 0,
          actual_quality_rate_pct: 100,
          status: 'completed',
          notes: '',
          products_output: initialProds,
          materials_consumption: initialMats,
          downtime_breakdown: {
            maintenance_hours: 0,
            maintenance_note: '',
            incident_hours: 0,
            incident_category: 'mechanical',
            incident_reason: '',
            incident_action: '',
            planned_shutdown_hours: 0,
            planned_shutdown_reason: '',
            total_downtime_hours: 0,
            events: [],
          },
        });
      }
    } else if (!isOpen) {
      lastContextKeyRef.current = '';
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialData, todayStr, lines, reset, planContext]);

  // Prepopulate products & materials from monthly plan when planContext is available or line/date changes
  useEffect(() => {
    if (!isOpen || isEditing) return;
    const currentKey = `${selectedLineId}_${selectedDate}`;

    if (planContext && lastContextKeyRef.current !== currentKey) {
      lastContextKeyRef.current = currentKey;

      if (planContext.products && planContext.products.length > 0) {
        const initialProds = planContext.products.map((p) => ({
          product_id: p.productId,
          product_name: p.productName,
          product_sku: p.productSku,
          unit_of_measure: p.unitOfMeasure,
          is_out_of_plan: false,
          quantity_tons: 0,
        }));
        replaceProducts(initialProds);
      } else {
        replaceProducts([]);
      }

      if (planContext.materials && planContext.materials.length > 0) {
        const initialMats = planContext.materials.map((m) => ({
          material_id: m.materialId,
          resource_name: m.resourceName,
          category: m.categoryGroup,
          unit_of_measure: m.unitOfMeasure,
          planned_norm: m.monthlyPlannedQty,
          actual_quantity: 0,
          notes: '',
        }));
        replaceMaterials(initialMats);
      } else {
        replaceMaterials([]);
      }
    }
  }, [isOpen, isEditing, planContext, selectedLineId, selectedDate, replaceProducts, replaceMaterials]);

  if (!isOpen) return null;

  const handleAddOutOfPlanProduct = (product: ShiftProductOutput) => {
    appendProduct(product);
  };

  const handleAddCustomMaterial = () => {
    appendMaterial({
      resource_name: 'Vật tư / Nhiên liệu mới',
      category: 'supply',
      unit_of_measure: 'Kg',
      planned_norm: 0,
      actual_quantity: 0,
      notes: '',
    });
  };

  const handleAddDowntimeEvent = (
    type: 'breakdown_incident' | 'planned_maintenance' | 'scheduled_shutdown' = 'breakdown_incident',
  ) => {
    let defaultStart = '08:00';
    let defaultEnd = '08:30';
    if (selectedShiftNumber === 2) {
      defaultStart = '16:00';
      defaultEnd = '16:30';
    } else if (selectedShiftNumber === 3) {
      defaultStart = '00:00';
      defaultEnd = '00:30';
    }

    const currentEvents = watch('downtime_breakdown.events') || [];
    if (currentEvents.length > 0) {
      const lastEvent = currentEvents[currentEvents.length - 1];
      if (lastEvent?.end_time) {
        defaultStart = lastEvent.end_time;
        const timeParts = lastEvent.end_time.split(':');
        const lh = Number(timeParts[0]);
        const lm = Number(timeParts[1]);
        if (!isNaN(lh) && !isNaN(lm)) {
          const nextMin = (lh * 60 + lm + 30) % (24 * 60);
          const nh = String(Math.floor(nextMin / 60)).padStart(2, '0');
          const nm = String(nextMin % 60).padStart(2, '0');
          defaultEnd = `${nh}:${nm}`;
        }
      }
    }

    const { minutes, hours } = calculateDowntimeDuration(defaultStart, defaultEnd);

    appendDowntimeEvent({
      type,
      start_time: defaultStart,
      end_time: defaultEnd,
      duration_minutes: minutes,
      duration_hours: hours,
      incident_category: type === 'breakdown_incident' ? 'Sự cố Cơ khí' : undefined,
      reason: '',
      action_taken: '',
    });
  };

  const existingProductIds = watchProducts
    .map((p) => p.product_id)
    .filter((id): id is string => !!id);

  const handleFormSubmit = async (values: ProductionShiftFormValues) => {
    const prods = values.products_output || [];
    const finishedSum = prods.reduce((acc, p) => {
      const sku = (p.product_sku || '').toLowerCase();
      const name = (p.product_name || '').toLowerCase();
      const isByproduct = sku.includes('mm') || sku.includes('magmin') || name.includes('phụ phẩm');
      return !isByproduct ? acc + (Number(p.quantity_tons) || 0) : acc;
    }, 0);
    const byproductSum = prods.reduce((acc, p) => {
      const sku = (p.product_sku || '').toLowerCase();
      const name = (p.product_name || '').toLowerCase();
      const isByproduct = sku.includes('mm') || sku.includes('magmin') || name.includes('phụ phẩm');
      return isByproduct ? acc + (Number(p.quantity_tons) || 0) : acc;
    }, 0);

    const finalFinished =
      Number(values.product_output_tons) > 0
        ? Number(values.product_output_tons)
        : (finishedSum > 0 ? finishedSum : prods.reduce((a, p) => a + (Number(p.quantity_tons) || 0), 0));

    const finalByproduct =
      Number(values.byproduct_output_tons) > 0
        ? Number(values.byproduct_output_tons)
        : byproductSum;

    await onSubmit({
      ...values,
      product_output_tons: finalFinished,
      byproduct_output_tons: finalByproduct,
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-inner">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  {isEditing ? 'Chỉnh sửa số liệu ca sản xuất' : 'Ghi nhận số liệu ca sản xuất'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Theo dõi thành phẩm, tiêu hao nguyên nhiên liệu theo kế hoạch và dừng máy
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-1 flex-col overflow-y-auto">
            <div className="space-y-6 p-6">
              {/* 1. Thông tin chung ca sản xuất */}
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground">Mã ca *</label>
                    <input
                      type="text"
                      {...register('shift_code')}
                      className="mt-1 w-full rounded-lg border border-input bg-muted/40 px-3 py-2 text-xs font-mono font-medium text-foreground"
                    />
                    {errors.shift_code && (
                      <p className="mt-1 text-[11px] text-rose-500">{errors.shift_code.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground">Dây chuyền *</label>
                    <select
                      {...register('line_id')}
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:ring-1 focus:ring-primary"
                    >
                      <option value="">-- Chọn dây chuyền --</option>
                      {lines.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.code} - {l.name}
                        </option>
                      ))}
                    </select>
                    {errors.line_id && (
                      <p className="mt-1 text-[11px] text-rose-500">{errors.line_id.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground">Ngày vận hành *</label>
                    <input
                      type="date"
                      {...register('shift_date')}
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
                    />
                    {errors.shift_date && (
                      <p className="mt-1 text-[11px] text-rose-500">{errors.shift_date.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground">Ca sản xuất *</label>
                    <select
                      {...register('shift_number', { valueAsNumber: true })}
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
                    >
                      <option value={1}>Ca 1 (06:00 - 14:00)</option>
                      <option value={2}>Ca 2 (14:00 - 22:00)</option>
                      <option value={3}>Ca 3 (22:00 - 06:00)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground">
                      Số giờ tiêu chuẩn ca (giờ) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      {...register('standard_shift_hours', { valueAsNumber: true })}
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-foreground">
                        Chất lượng sản phẩm (%) *
                      </label>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Mặc định 100%
                      </span>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      {...register('actual_quality_rate_pct', { valueAsNumber: true })}
                      placeholder="100"
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:ring-1 focus:ring-primary"
                    />
                    {errors.actual_quality_rate_pct && (
                      <p className="mt-1 text-[11px] text-rose-500">{errors.actual_quality_rate_pct.message}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 mt-auto">
                    <span className="text-xs text-muted-foreground">Giờ chạy máy thực tế:</span>
                    <span className="text-sm font-bold text-primary">{runningHours} giờ</span>
                  </div>
                </div>
              </div>

              {/* Sub-tab navigation */}
              <div className="flex border-b border-border">
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all ${
                    activeTab === 'products'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Package className="h-4 w-4" />
                  1. Thành phẩm & Sản lượng ({watchProducts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('materials')}
                  className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all ${
                    activeTab === 'materials'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Fuel className="h-4 w-4" />
                  2. Tiêu hao Nguyên nhiên liệu ({materialFields.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('downtime')}
                  className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all ${
                    activeTab === 'downtime'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <AlertTriangle className="h-4 w-4" />
                  3. Dừng máy & Sự cố ({watchEvents.length > 0 ? `${watchEvents.length} lần • ${totalDowntime}h` : `${totalDowntime}h`})
                </button>
              </div>

              {/* TAB 1: SẢN LƯỢNG THÀNH PHẨM (Yêu cầu 3) */}
              {activeTab === 'products' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Registered & Out-of-plan Products List */}
                  <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div>
                        <h3 className="text-xs font-bold text-foreground">
                          Danh mục thành phẩm sản xuất trong ca
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Ghi nhận các thành phẩm đã đăng ký ở kế hoạch hoặc sản phẩm ngoài kế hoạch
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAddProductOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Thêm sản phẩm ngoài kế hoạch
                      </button>
                    </div>

                    {productFields.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        Chưa có sản phẩm nào. Nhấp vào nút &quot;Thêm sản phẩm ngoài kế hoạch&quot; để thêm.
                      </div>
                    ) : (
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-muted/40 font-semibold text-muted-foreground">
                            <tr>
                              <th className="px-3 py-2">Mã SKU</th>
                              <th className="px-3 py-2">Tên thành phẩm</th>
                              <th className="px-3 py-2 text-center">Phân loại</th>
                              <th className="px-3 py-2 text-center">ĐVT</th>
                              <th className="px-3 py-2 text-right w-44">Sản lượng ca (Tấn) *</th>
                              <th className="px-3 py-2 text-center w-12"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {productFields.map((field, idx) => {
                              const isOutOfPlan = watch(`products_output.${idx}.is_out_of_plan`);
                              return (
                                <tr key={field.id} className="hover:bg-muted/20">
                                  <td className="px-3 py-2.5 font-mono font-medium text-foreground">
                                    {watch(`products_output.${idx}.product_sku`) || '---'}
                                  </td>
                                  <td className="px-3 py-2.5 font-medium text-foreground">
                                    {watch(`products_output.${idx}.product_name`)}
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    {isOutOfPlan ? (
                                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                        Ngoài kế hoạch
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                        Trong kế hoạch
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2.5 text-center text-muted-foreground">
                                    {watch(`products_output.${idx}.unit_of_measure`) || 'tấn'}
                                  </td>
                                  <td className="px-3 py-2.5 text-right">
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      {...register(`products_output.${idx}.quantity_tons`, {
                                        valueAsNumber: true,
                                      })}
                                      className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-right text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:ring-1 focus:ring-primary"
                                    />
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    {isOutOfPlan && (
                                      <button
                                        type="button"
                                        onClick={() => removeProduct(idx)}
                                        className="rounded p-1 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                                        title="Xóa sản phẩm này"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="border-t-2 border-border bg-muted/20 font-bold">
                            <tr>
                              <td colSpan={4} className="px-3 py-2.5 text-right text-foreground">
                                Tổng sản lượng thành phẩm thu hồi:
                              </td>
                              <td className="px-3 py-2.5 text-right text-sm text-emerald-600 dark:text-emerald-400">
                                {totalFinishedOutput.toLocaleString()} Tấn
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: TIÊU HAO NGUYÊN NHIÊN LIỆU (Yêu cầu 1) */}
              {activeTab === 'materials' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div>
                        <h3 className="text-xs font-bold text-foreground">
                          Tiêu hao Nguyên nhiên liệu & Năng lượng theo kế hoạch
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Bao gồm toàn bộ các loại điện, than, dầu, nước, hóa chất đã đề cập ở kế hoạch sản xuất
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddCustomMaterial}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Thêm tiêu hao khác
                      </button>
                    </div>

                    {materialFields.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        Chưa có mục tiêu hao nào. Nhấp vào &quot;Thêm tiêu hao khác&quot; để thêm.
                      </div>
                    ) : (
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-muted/40 font-semibold text-muted-foreground">
                            <tr>
                              <th className="px-3 py-2">Tên vật tư / Nhiên liệu / Năng lượng</th>
                              <th className="px-3 py-2 text-center">Nhóm</th>
                              <th className="px-3 py-2 text-center">Đơn vị</th>
                              <th className="px-3 py-2 text-right w-44">Tiêu hao thực tế trong ca *</th>
                              <th className="px-3 py-2">Ghi chú</th>
                              <th className="px-3 py-2 text-center w-12"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {materialFields.map((field, idx) => {
                              const cat = watch(`materials_consumption.${idx}.category`);
                              return (
                                <tr key={field.id} className="hover:bg-muted/20">
                                  <td className="px-3 py-2.5">
                                    <input
                                      type="text"
                                      {...register(`materials_consumption.${idx}.resource_name`)}
                                      className="w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs font-semibold text-foreground focus:bg-background"
                                    />
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    <span
                                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                        cat === 'fuel'
                                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                          : cat === 'supply'
                                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                      }`}
                                    >
                                      {cat === 'fuel'
                                        ? 'Nhiên liệu/Điện'
                                        : cat === 'supply'
                                        ? 'Vật tư tiêu hao'
                                        : 'Nguyên liệu'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 text-center text-muted-foreground">
                                    <input
                                      type="text"
                                      {...register(`materials_consumption.${idx}.unit_of_measure`)}
                                      className="w-16 rounded border border-input bg-transparent px-1.5 py-1 text-center text-xs text-foreground focus:bg-background"
                                    />
                                  </td>
                                  <td className="px-3 py-2.5 text-right">
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      {...register(`materials_consumption.${idx}.actual_quantity`, {
                                        valueAsNumber: true,
                                      })}
                                      className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-right text-xs font-bold text-primary focus:ring-1 focus:ring-primary"
                                    />
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <input
                                      type="text"
                                      placeholder="Chỉ số công tơ, bồn..."
                                      {...register(`materials_consumption.${idx}.notes`)}
                                      className="w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs text-foreground focus:bg-background"
                                    />
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    <button
                                      type="button"
                                      onClick={() => removeMaterial(idx)}
                                      className="rounded p-1 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                                      title="Xóa mục này"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: THỜI GIAN DỪNG CHUYỀN & SỰ CỐ (Nhiều lần dừng trong ca) */}
              {activeTab === 'downtime' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
                      <div>
                        <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          Nhật ký các lần dừng máy trong ca ({downtimeEventFields.length} lần)
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Ghi nhận chi tiết từng lần dừng: chọn loại dừng, khoảng thời gian từ giờ phút đến giờ phút và nguyên nhân xử lý
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleAddDowntimeEvent('breakdown_incident')}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                          Sự cố dừng chuyền
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddDowntimeEvent('planned_maintenance')}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                          Dừng bảo trì
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddDowntimeEvent('scheduled_shutdown')}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          Nghỉ kế hoạch
                        </button>
                      </div>
                    </div>

                    {downtimeEventFields.length === 0 ? (
                      <div className="py-10 text-center space-y-2">
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-medium text-foreground">Ca vận hành liên tục, không có lần dừng máy nào.</p>
                        <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
                          Nếu trong ca có phát sinh dừng bảo dưỡng thiết bị, sự cố kỹ thuật hoặc nghỉ theo kế hoạch, hãy nhấn các nút ở trên để ghi nhận.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {downtimeEventFields.map((field, idx) => {
                          const currentType = watch(`downtime_breakdown.events.${idx}.type`) || 'breakdown_incident';
                          const sTime = watch(`downtime_breakdown.events.${idx}.start_time`) || '08:00';
                          const eTime = watch(`downtime_breakdown.events.${idx}.end_time`) || '08:30';
                          const { minutes, hours } = calculateDowntimeDuration(sTime, eTime);

                          const isIncident = currentType === 'breakdown_incident';
                          const isMaint = currentType === 'planned_maintenance';
                          const isShutdown = currentType === 'scheduled_shutdown';

                          return (
                            <div
                              key={field.id}
                              className={`rounded-xl border p-3.5 shadow-xs transition-all ${
                                isIncident
                                  ? 'border-rose-200 bg-rose-50/20 dark:border-rose-900/50 dark:bg-rose-950/10'
                                  : isMaint
                                  ? 'border-amber-200 bg-amber-50/20 dark:border-amber-900/50 dark:bg-amber-950/10'
                                  : 'border-blue-200 bg-blue-50/20 dark:border-blue-900/50 dark:bg-blue-950/10'
                              }`}
                            >
                              {/* Event Top Bar */}
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
                                    #{idx + 1}
                                  </span>
                                  {/* Event Type Selector */}
                                  <div className="flex rounded-lg border border-border bg-background p-0.5 text-xs">
                                    <button
                                      type="button"
                                      onClick={() => setValue(`downtime_breakdown.events.${idx}.type`, 'breakdown_incident')}
                                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                                        isIncident
                                          ? 'bg-rose-100 text-rose-800 font-bold dark:bg-rose-950 dark:text-rose-200 shadow-xs'
                                          : 'text-muted-foreground hover:text-foreground'
                                      }`}
                                    >
                                      <AlertTriangle className="h-3 w-3" />
                                      Sự cố dừng chuyền
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setValue(`downtime_breakdown.events.${idx}.type`, 'planned_maintenance')}
                                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                                        isMaint
                                          ? 'bg-amber-100 text-amber-800 font-bold dark:bg-amber-950 dark:text-amber-200 shadow-xs'
                                          : 'text-muted-foreground hover:text-foreground'
                                      }`}
                                    >
                                      <Wrench className="h-3 w-3" />
                                      Dừng bảo trì
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setValue(`downtime_breakdown.events.${idx}.type`, 'scheduled_shutdown')}
                                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                                        isShutdown
                                          ? 'bg-blue-100 text-blue-800 font-bold dark:bg-blue-950 dark:text-blue-200 shadow-xs'
                                          : 'text-muted-foreground hover:text-foreground'
                                      }`}
                                    >
                                      <PauseCircle className="h-3 w-3" />
                                      Nghỉ kế hoạch
                                    </button>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                      isIncident
                                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                        : isMaint
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                    }`}
                                  >
                                    <Clock className="h-3 w-3" />
                                    {minutes} phút ({hours} giờ)
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => removeDowntimeEvent(idx)}
                                    className="rounded p-1 text-muted-foreground hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/40 transition-colors"
                                    title="Xóa lần dừng này"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Event Fields Grid */}
                              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-12 items-start">
                                {/* Time Range */}
                                <div className="sm:col-span-4 flex items-center gap-2 bg-background p-2.5 rounded-lg border border-border">
                                  <div className="flex-1">
                                    <label className="block text-[10px] font-semibold text-muted-foreground">
                                      Từ giờ (HH:mm) *
                                    </label>
                                    <input
                                      type="time"
                                      {...register(`downtime_breakdown.events.${idx}.start_time`)}
                                      className="mt-0.5 w-full rounded border border-input bg-transparent px-2 py-1 text-xs font-bold text-foreground focus:bg-background"
                                    />
                                  </div>
                                  <span className="text-muted-foreground text-xs font-bold pt-3">→</span>
                                  <div className="flex-1">
                                    <label className="block text-[10px] font-semibold text-muted-foreground">
                                      Đến giờ (HH:mm) *
                                    </label>
                                    <input
                                      type="time"
                                      {...register(`downtime_breakdown.events.${idx}.end_time`)}
                                      className="mt-0.5 w-full rounded border border-input bg-transparent px-2 py-1 text-xs font-bold text-foreground focus:bg-background"
                                    />
                                  </div>
                                </div>

                                {/* Incident Category (If breakdown) */}
                                {isIncident && (
                                  <div className="sm:col-span-8 bg-background p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/50">
                                    <label className="block text-[10px] font-semibold text-rose-700 dark:text-rose-400">
                                      Phân loại sự cố *
                                    </label>
                                    <select
                                      {...register(`downtime_breakdown.events.${idx}.incident_category`)}
                                      className="mt-0.5 w-full rounded border border-input bg-transparent px-2 py-1 text-xs text-foreground focus:bg-background"
                                    >
                                      <option value="Sự cố Cơ khí">Sự cố Cơ khí (Máy nghiền, Băng tải, Bơm, Sàng)</option>
                                      <option value="Sự cố Điện & Tự động hóa">Sự cố Điện & Tự động hóa (Mất điện, Nhảy át, Motor, PLC)</option>
                                      <option value="Sự cố Cấp liệu & Kẹt liệu">Sự cố Cấp liệu & Kẹt liệu (Tắc phễu, Liệu ẩm bết)</option>
                                      <option value="Sự cố Công nghệ & Tuyển khoáng">Sự cố Công nghệ (Sai tỷ trọng, Bọt tuyển)</option>
                                      <option value="Sự cố An toàn & Môi trường">Sự cố An toàn & Môi trường</option>
                                      <option value="Sự cố khác">Sự cố khác</option>
                                    </select>
                                  </div>
                                )}

                                {/* Details and Actions */}
                                <div className={isIncident ? "sm:col-span-12 grid grid-cols-1 sm:grid-cols-2 gap-2.5" : "sm:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-2.5"}>
                                  <div className="bg-background p-2.5 rounded-lg border border-border">
                                    <label className="block text-[10px] font-semibold text-foreground">
                                      {isIncident
                                        ? 'Nguyên nhân / Hiện tượng sự cố *'
                                        : isMaint
                                        ? 'Nội dung bảo trì thiết bị *'
                                        : 'Lý do nghỉ theo kế hoạch *'}
                                    </label>
                                    <input
                                      type="text"
                                      placeholder={
                                        isIncident
                                          ? 'VD: Kẹt dị vật buồng nghiền, nhảy rơle nhiệt...'
                                          : isMaint
                                          ? 'VD: Tra mỡ vòng bi, cân chỉnh băng tải, thay tấm lót...'
                                          : 'VD: Nghỉ theo lịch điều độ điện, chuyển đổi ca...'
                                      }
                                      {...register(`downtime_breakdown.events.${idx}.reason`)}
                                      className="mt-0.5 w-full rounded border border-input bg-transparent px-2 py-1 text-xs text-foreground focus:bg-background"
                                    />
                                  </div>

                                  <div className="bg-background p-2.5 rounded-lg border border-border">
                                    <label className="block text-[10px] font-semibold text-foreground">
                                      {isIncident
                                        ? 'Biện pháp khắc phục / Xử lý *'
                                        : isMaint
                                        ? 'Người/Đội thực hiện hoặc Kết quả'
                                        : 'Ghi chú thêm'}
                                    </label>
                                    <input
                                      type="text"
                                      placeholder={
                                        isIncident
                                          ? 'VD: Đã gắp dị vật, kiểm tra tải và chạy lại bình thường...'
                                          : isMaint
                                          ? 'VD: Tổ Cơ điện hoàn tất bảo dưỡng, chạy thử đạt yêu cầu...'
                                          : 'Ghi chú thông tin điều độ...'
                                      }
                                      {...register(`downtime_breakdown.events.${idx}.action_taken`)}
                                      className="mt-0.5 w-full rounded border border-input bg-transparent px-2 py-1 text-xs text-foreground focus:bg-background"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Downtime live computation card */}
                  <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-rose-500/10 p-2 text-rose-500">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">
                          Tổng thời gian dừng chuyền: <span className="text-rose-600 dark:text-rose-400">{totalDowntime} giờ</span>
                          {watchEvents.length > 0 && (
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              ({watchEvents.length} lần dừng)
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Bảo trì: {maintenanceHours}h • Sự cố: {incidentHours}h • Nghỉ kế hoạch: {plannedShutdownHours}h
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-muted-foreground">Giờ chạy máy thực tế:</span>
                      <p className="text-base font-bold text-primary">{runningHours} giờ / {stdHours}h</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions (Bỏ ô trạng thái ca và nhật ký tóm tắt) */}
            <div className="flex items-center justify-between border-t border-border bg-muted/20 px-6 py-4">
              <div className="text-xs text-muted-foreground">
                Tự động lưu với trạng thái hoàn tất ca và đồng bộ chỉ số vận hành.
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-input bg-background px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isSubmitting ? 'Đang lưu...' : isEditing ? 'Cập nhật ca' : 'Lưu bản ghi ca'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Dialog for adding out-of-plan products */}
      <AddShiftProductDialog
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onAdd={handleAddOutOfPlanProduct}
        existingProductIds={existingProductIds}
      />
    </>
  );
};
