import React, { useState, useEffect, useMemo } from 'react';
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
import type { ProductionShift, ProductionLine, ShiftProductOutput } from '../types';
import { useShiftPlanContext } from '../hooks/use-production-shifts';
import { AddShiftProductDialog } from './add-shift-product-dialog';

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
      raw_material_input_tons: 800,
      product_output_tons: 0,
      byproduct_output_tons: 80,
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
      },
    },
  });

  const selectedLineId = watch('line_id');
  const selectedDate = watch('shift_date');
  const selectedShiftNumber = watch('shift_number');
  const stdHours = watch('standard_shift_hours') || 8;
  const rawInputTons = watch('raw_material_input_tons') || 0;

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

  // Watch downtime breakdown to calculate total downtime and running hours
  const maintenanceHours = watch('downtime_breakdown.maintenance_hours') || 0;
  const incidentHours = watch('downtime_breakdown.incident_hours') || 0;
  const plannedShutdownHours = watch('downtime_breakdown.planned_shutdown_hours') || 0;
  const rawWatchedProducts = watch('products_output');
  const watchProducts = useMemo(() => rawWatchedProducts ?? [], [rawWatchedProducts]);

  const totalDowntime = useMemo(() => {
    return Number((maintenanceHours + incidentHours + plannedShutdownHours).toFixed(2));
  }, [maintenanceHours, incidentHours, plannedShutdownHours]);

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
  }, [totalDowntime, setValue]);

  useEffect(() => {
    setValue('product_output_tons', totalFinishedOutput);
  }, [totalFinishedOutput, setValue]);

  // KPI Calculations
  const calculatedCapacity =
    runningHours > 0 ? (totalFinishedOutput / runningHours).toFixed(2) : '0.00';
  const calculatedRecovery =
    rawInputTons > 0 ? ((totalFinishedOutput / rawInputTons) * 100).toFixed(2) : '0.00';

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

  // Prepopulate products & materials from plan when context is loaded (only if new shift or empty)
  useEffect(() => {
    if (!isEditing && planContext && planContext.products && planContext.materials) {
      // If products_output is currently empty, initialize with plan products
      if (productFields.length === 0 && planContext.products.length > 0) {
        const initialProds = planContext.products.map((p) => ({
          product_id: p.productId,
          product_name: p.productName,
          product_sku: p.productSku,
          unit_of_measure: p.unitOfMeasure,
          is_out_of_plan: false,
          quantity_tons: 0,
        }));
        replaceProducts(initialProds);
      } else if (productFields.length === 0 && planContext.products.length === 0) {
        // Fallback default product if plan has no products yet
        replaceProducts([
          {
            product_id: '',
            product_name: 'Cát thạch anh tiêu chuẩn',
            product_sku: 'CAT-TC-01',
            unit_of_measure: 'tấn',
            is_out_of_plan: false,
            quantity_tons: 680,
          },
        ]);
      }

      // If materials_consumption is empty, initialize with plan materials
      if (materialFields.length === 0 && planContext.materials.length > 0) {
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
      } else if (materialFields.length === 0 && planContext.materials.length === 0) {
        // Default standard materials list
        replaceMaterials([
          {
            material_id: '',
            resource_name: 'Điện năng tiêu thụ (Điện sản xuất)',
            category: 'fuel',
            unit_of_measure: 'kWh',
            planned_norm: 0,
            actual_quantity: 0,
            notes: '',
          },
          {
            material_id: '',
            resource_name: 'Dầu DO chạy máy phát & sấy',
            category: 'fuel',
            unit_of_measure: 'Lít',
            planned_norm: 0,
            actual_quantity: 0,
            notes: '',
          },
          {
            material_id: '',
            resource_name: 'Nước cấp tuyển rửa công nghiệp',
            category: 'material',
            unit_of_measure: 'm³',
            planned_norm: 0,
            actual_quantity: 0,
            notes: '',
          },
          {
            material_id: '',
            resource_name: 'Hóa chất keo tụ / tuyển rửa',
            category: 'supply',
            unit_of_measure: 'Kg',
            planned_norm: 0,
            actual_quantity: 0,
            notes: '',
          },
        ]);
      }
    }
  }, [planContext, isEditing, productFields.length, materialFields.length, replaceProducts, replaceMaterials]);

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset({
        shift_code: initialData.shift_code,
        line_id: initialData.line_id,
        shift_date: initialData.shift_date,
        shift_number: initialData.shift_number,
        standard_shift_hours: initialData.standard_shift_hours,
        total_downtime_hours: initialData.total_downtime_hours,
        raw_material_input_tons: initialData.raw_material_input_tons,
        product_output_tons: initialData.product_output_tons,
        byproduct_output_tons: initialData.byproduct_output_tons,
        operator_employee_id: initialData.operator_employee_id,
        status: initialData.status,
        notes: initialData.notes || '',
        products_output: initialData.products_output || [
          {
            product_name: 'Cát thạch anh tiêu chuẩn',
            product_sku: 'CAT-TC-01',
            unit_of_measure: 'tấn',
            is_out_of_plan: false,
            quantity_tons: initialData.product_output_tons,
          },
        ],
        materials_consumption: initialData.materials_consumption || [],
        downtime_breakdown: initialData.downtime_breakdown || {
          maintenance_hours: 0,
          maintenance_note: '',
          incident_hours: initialData.total_downtime_hours,
          incident_category: 'mechanical',
          incident_reason: '',
          incident_action: '',
          planned_shutdown_hours: 0,
          planned_shutdown_reason: '',
          total_downtime_hours: initialData.total_downtime_hours,
        },
      });
    } else {
      const cleanDate = todayStr.replace(/-/g, '');
      reset({
        shift_code: `CA-${cleanDate}-${lines[0]?.code || 'LINE'}-S1`,
        line_id: lines[0]?.id || '',
        shift_date: todayStr,
        shift_number: 1,
        standard_shift_hours: 8.0,
        total_downtime_hours: 0,
        raw_material_input_tons: 800,
        product_output_tons: 0,
        byproduct_output_tons: 80,
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
        },
      });
    }
  }, [initialData, reset, todayStr, lines]);

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

  const existingProductIds = watchProducts
    .map((p) => p.product_id)
    .filter((id): id is string => !!id);

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
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-y-auto">
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

                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  3. Dừng máy & Sự cố ({totalDowntime}h)
                </button>
              </div>

              {/* TAB 1: SẢN LƯỢNG THÀNH PHẨM (Yêu cầu 3) */}
              {activeTab === 'products' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Quặng cấp đầu vào & Phụ phẩm */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-border bg-card p-4">
                      <label className="block text-xs font-semibold text-foreground">
                        Quặng cấp đầu vào (Tấn) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        {...register('raw_material_input_tons', { valueAsNumber: true })}
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-bold text-foreground"
                      />
                      {errors.raw_material_input_tons && (
                        <p className="mt-1 text-[11px] text-rose-500">
                          {errors.raw_material_input_tons.message}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Tổng khối lượng quặng thô nạp vào dây chuyền trong ca
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-4">
                      <label className="block text-xs font-semibold text-foreground">
                        Phụ phẩm thu hồi (Tấn)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        {...register('byproduct_output_tons', { valueAsNumber: true })}
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
                      />
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Sản phẩm phụ, quặng đuôi hoặc bùn thải có ích
                      </p>
                    </div>
                  </div>

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
                        + Thêm sản phẩm ngoài kế hoạch
                      </button>
                    </div>

                    {productFields.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        Chưa có sản phẩm nào. Nhấp vào nút &quot;+ Thêm sản phẩm ngoài kế hoạch&quot; để thêm.
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

                  {/* Summary Metric Preview */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-border bg-muted/20 p-3">
                      <span className="text-[11px] text-muted-foreground">Tổng quặng cấp:</span>
                      <p className="mt-0.5 text-base font-bold text-foreground">
                        {rawInputTons.toLocaleString()} Tấn
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-emerald-50/50 p-3 dark:bg-emerald-950/20">
                      <span className="text-[11px] text-muted-foreground">Tổng thành phẩm:</span>
                      <p className="mt-0.5 text-base font-bold text-emerald-600 dark:text-emerald-400">
                        {totalFinishedOutput.toLocaleString()} Tấn
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/20 p-3">
                      <span className="text-[11px] text-muted-foreground">Công suất thực tế:</span>
                      <p className="mt-0.5 text-base font-bold text-primary">
                        {calculatedCapacity} TPH
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/20 p-3">
                      <span className="text-[11px] text-muted-foreground">Tỷ lệ thu hồi cát:</span>
                      <p className="mt-0.5 text-base font-bold text-foreground">
                        {calculatedRecovery}%
                      </p>
                    </div>
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
                        + Thêm tiêu hao khác
                      </button>
                    </div>

                    {materialFields.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        Chưa có mục tiêu hao nào. Nhấp vào &quot;+ Thêm tiêu hao khác&quot; để thêm.
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

              {/* TAB 3: THỜI GIAN DỪNG CHUYỀN & SỰ CỐ (Yêu cầu 2) */}
              {activeTab === 'downtime' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {/* 1. Dừng bảo trì */}
                    <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
                      <div className="flex items-center gap-2 border-b border-border pb-2 text-primary font-bold text-xs">
                        <Wrench className="h-4 w-4" />
                        1. Dừng bảo trì
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-foreground">
                          Thời gian dừng (giờ)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          {...register('downtime_breakdown.maintenance_hours', {
                            valueAsNumber: true,
                          })}
                          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-bold text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-foreground">
                          Nội dung bảo trì
                        </label>
                        <textarea
                          rows={3}
                          placeholder="VD: Bảo dưỡng định kỳ trạm nghiền, thay vòng bi băng tải, tra mỡ..."
                          {...register('downtime_breakdown.maintenance_note')}
                          className="mt-1 w-full rounded-lg border border-input bg-background p-2 text-xs text-foreground"
                        />
                      </div>
                    </div>

                    {/* 2. Sự cố dừng chuyền */}
                    <div className="rounded-xl border border-rose-200 bg-rose-50/20 p-4 shadow-sm space-y-3 dark:border-rose-950/50 dark:bg-rose-950/10">
                      <div className="flex items-center gap-2 border-b border-rose-200 pb-2 text-rose-600 font-bold text-xs dark:border-rose-900 dark:text-rose-400">
                        <AlertTriangle className="h-4 w-4" />
                        2. Sự cố dừng chuyền
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-foreground">
                          Thời gian sự cố (giờ) *
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          {...register('downtime_breakdown.incident_hours', {
                            valueAsNumber: true,
                          })}
                          className="mt-1 w-full rounded-lg border border-rose-300 bg-background px-3 py-2 text-xs font-bold text-rose-600 dark:border-rose-900 dark:text-rose-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-foreground">
                          Loại sự cố *
                        </label>
                        <select
                          {...register('downtime_breakdown.incident_category')}
                          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground"
                        >
                          <option value="Sự cố Cơ khí">Sự cố Cơ khí (Máy nghiền, Băng tải, Bơm)</option>
                          <option value="Sự cố Điện & Tự động hóa">Sự cố Điện & Tự động hóa (Mất điện, Nhảy át, Motor)</option>
                          <option value="Sự cố Cấp liệu & Kẹt liệu">Sự cố Cấp liệu & Kẹt liệu (Tắc phễu, Liệu bết)</option>
                          <option value="Sự cố Công nghệ & Tuyển khoáng">Sự cố Công nghệ (Sai tỷ trọng, Bọt tuyển)</option>
                          <option value="Sự cố An toàn & Môi trường">Sự cố An toàn & Môi trường</option>
                          <option value="Sự cố khác">Sự cố khác</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-foreground">
                          Lí do / Nguyên nhân sự cố *
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Ghi rõ hiện tượng và nguyên nhân gốc rễ..."
                          {...register('downtime_breakdown.incident_reason')}
                          className="mt-1 w-full rounded-lg border border-input bg-background p-2 text-xs text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-foreground">
                          Khắc phục như thế nào (Biện pháp xử lý) *
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Mô tả biện pháp kỹ thuật đã xử lý để đưa máy hoạt động lại..."
                          {...register('downtime_breakdown.incident_action')}
                          className="mt-1 w-full rounded-lg border border-input bg-background p-2 text-xs text-foreground"
                        />
                      </div>
                    </div>

                    {/* 3. Nghỉ trong kế hoạch */}
                    <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
                      <div className="flex items-center gap-2 border-b border-border pb-2 text-muted-foreground font-bold text-xs">
                        <PauseCircle className="h-4 w-4" />
                        3. Nghỉ trong kế hoạch
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-foreground">
                          Thời gian nghỉ (giờ)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          {...register('downtime_breakdown.planned_shutdown_hours', {
                            valueAsNumber: true,
                          })}
                          className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-bold text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-foreground">
                          Lý do nghỉ kế hoạch
                        </label>
                        <textarea
                          rows={3}
                          placeholder="VD: Nghỉ theo lịch điều độ điện lực, nghỉ lễ, chờ giải phóng kho chứa..."
                          {...register('downtime_breakdown.planned_shutdown_reason')}
                          className="mt-1 w-full rounded-lg border border-input bg-background p-2 text-xs text-foreground"
                        />
                      </div>
                    </div>
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
