import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  X,
  Plus,
  Trash2,
  Loader2,
  ShoppingCart,
  Edit3,
  Calendar,
  Building2,
  Coins,
  FileText,
} from 'lucide-react';
import type { PurchaseOrder, Supplier, MaterialOption, ProcurementRequest } from '../types';
import {
  purchaseOrderSchema,
  type PurchaseOrderFormValues,
  type PurchaseOrderItemFormValues,
} from '../validation/sales-schemas';
import { Button } from '@/components/ui/button';

export interface PurchaseOrderFormDialogProps {
  isOpen: boolean;
  order?: PurchaseOrder | null;
  suppliers: Supplier[];
  materials: MaterialOption[];
  sourcePR?: ProcurementRequest | null;
  availablePRs?: ProcurementRequest[];
  onSelectPR?: (pr: ProcurementRequest | null) => void;
  onClose: () => void;
  onSubmit: (values: PurchaseOrderFormValues) => Promise<void>;
}

export const PurchaseOrderFormDialog: React.FC<PurchaseOrderFormDialogProps> = ({
  isOpen,
  order,
  suppliers,
  materials,
  sourcePR,
  availablePRs,
  onSelectPR,
  onClose,
  onSubmit,
}) => {
  const isEdit = !!order;
  const [activePR, setActivePR] = React.useState<ProcurementRequest | null>(null);

  const generateDefaultCode = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const rand = Math.floor(100 + Math.random() * 900);
    return `PO-${y}${m}${d}-${rand}`;
  };

  const defaultValues: PurchaseOrderFormValues = {
    po_code: order?.po_code || generateDefaultCode(),
    supplier_id: order?.supplier_id || (suppliers[0]?.id || ''),
    order_date: order?.order_date || (new Date().toISOString().split('T')[0] ?? ''),
    expected_delivery_date: order?.expected_delivery_date || '',
    currency: order?.currency || 'VND',
    tax_rate: order && order.subtotal_amount > 0 ? Math.round((order.tax_amount / order.subtotal_amount) * 100) : 10,
    payment_terms: order?.payment_terms || 'Thanh toán sau khi nghiệm thu kho 15 ngày',
    notes: order?.notes || '',
    status: order?.status || 'draft',
    items:
      order?.items && order.items.length > 0
        ? order.items.map((it) => ({
            material_id: it.material_id,
            quantity: it.quantity,
            unit_price: it.unit_price,
            line_total: it.line_total,
            received_quantity: it.received_quantity || 0,
          }))
        : [
            {
              material_id: materials[0]?.id || '',
              quantity: 1000,
              unit_price: materials[0]?.standard_cost || 0,
              line_total: (materials[0]?.standard_cost || 0) * 1000,
              received_quantity: 0,
            },
          ],
  };

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  useEffect(() => {
    if (isOpen) {
      const prToUse = sourcePR || null;
      setActivePR(prToUse);

      if (prToUse) {
        const matchedMat = materials.find(
          (m) =>
            m.id === prToUse.material_id ||
            m.name.toLowerCase() === prToUse.material_name.toLowerCase() ||
            prToUse.material_name.toLowerCase().includes(m.name.toLowerCase()),
        );
        const matId = matchedMat?.id || prToUse.material_id || materials[0]?.id || '';
        const qty = prToUse.quantity > 0 ? prToUse.quantity : 1;
        const estCost =
          prToUse.estimated_cost > 0
            ? prToUse.estimated_cost
            : (matchedMat?.standard_cost || 0) * qty;
        const unitPrice = qty > 0 ? Math.round(estCost / qty) : (matchedMat?.standard_cost || 0);

        const priorityLabel =
          prToUse.priority === 'urgent'
            ? 'Khẩn cấp'
            : prToUse.priority === 'high'
            ? 'Ưu tiên cao'
            : prToUse.priority === 'low'
            ? 'Thấp'
            : 'Bình thường';

        reset({
          po_code: generateDefaultCode(),
          supplier_id: suppliers[0]?.id || '',
          order_date: new Date().toISOString().split('T')[0] ?? '',
          expected_delivery_date: prToUse.required_date || '',
          currency: 'VND',
          tax_rate: 10,
          payment_terms: 'Thanh toán sau khi nghiệm thu kho 15 ngày',
          notes: `[Từ ${prToUse.pr_code} - ${prToUse.department}] Mức độ: ${priorityLabel}. ${prToUse.reason ? `Lý do: ${prToUse.reason}` : ''}`,
          status: 'draft',
          items: [
            {
              material_id: matId,
              quantity: qty,
              unit_price: unitPrice,
              line_total: estCost,
              received_quantity: 0,
            },
          ],
        });
      } else {
        reset({
          po_code: order?.po_code || generateDefaultCode(),
          supplier_id: order?.supplier_id || (suppliers[0]?.id || ''),
          order_date: order?.order_date || (new Date().toISOString().split('T')[0] ?? ''),
          expected_delivery_date: order?.expected_delivery_date || '',
          currency: order?.currency || 'VND',
          tax_rate:
            order && order.subtotal_amount > 0
              ? Math.round((order.tax_amount / order.subtotal_amount) * 100)
              : 10,
          payment_terms: order?.payment_terms || 'Thanh toán sau khi nghiệm thu kho 15 ngày',
          notes: order?.notes || '',
          status: order?.status || 'draft',
          items:
            order?.items && order.items.length > 0
              ? order.items.map((it) => ({
                  material_id: it.material_id,
                  quantity: it.quantity,
                  unit_price: it.unit_price,
                  line_total: it.line_total,
                  received_quantity: it.received_quantity || 0,
                }))
              : [
                  {
                    material_id: materials[0]?.id || '',
                    quantity: 1000,
                    unit_price: materials[0]?.standard_cost || 0,
                    line_total: (materials[0]?.standard_cost || 0) * 1000,
                    received_quantity: 0,
                  },
                ],
        });
      }
    }
  }, [isOpen, order, sourcePR, reset, suppliers, materials]);

  const handleSelectPR = (prId: string) => {
    const pr = availablePRs?.find((p) => p.id === prId) || null;
    setActivePR(pr);
    if (onSelectPR) onSelectPR(pr);

    if (pr) {
      const matchedMat = materials.find(
        (m) =>
          m.id === pr.material_id ||
          m.name.toLowerCase() === pr.material_name.toLowerCase() ||
          pr.material_name.toLowerCase().includes(m.name.toLowerCase()),
      );
      const matId = matchedMat?.id || pr.material_id || materials[0]?.id || '';
      const qty = pr.quantity > 0 ? pr.quantity : 1;
      const estCost =
        pr.estimated_cost > 0
          ? pr.estimated_cost
          : (matchedMat?.standard_cost || 0) * qty;
      const unitPrice = qty > 0 ? Math.round(estCost / qty) : (matchedMat?.standard_cost || 0);

      const priorityLabel =
        pr.priority === 'urgent'
          ? 'Khẩn cấp'
          : pr.priority === 'high'
          ? 'Ưu tiên cao'
          : pr.priority === 'low'
          ? 'Thấp'
          : 'Bình thường';

      setValue('expected_delivery_date', pr.required_date || '');
      setValue(
        'notes',
        `[Từ ${pr.pr_code} - ${pr.department}] Mức độ: ${priorityLabel}. ${pr.reason ? `Lý do: ${pr.reason}` : ''}`,
      );
      setValue('items.0.material_id', matId);
      setValue('items.0.quantity', qty);
      setValue('items.0.unit_price', unitPrice);
      setValue('items.0.line_total', estCost);
    }
  };

  if (!isOpen) return null;

  const watchedItems = (watch('items') as Array<Partial<PurchaseOrderItemFormValues>> | undefined) || [];
  const watchedTaxRate = watch('tax_rate') ?? 10;

  const subtotal = watchedItems.reduce(
    (sum, it) => sum + (Number(it?.quantity) || 0) * (Number(it?.unit_price) || 0),
    0,
  );
  const taxAmount = subtotal * (watchedTaxRate / 100);
  const totalAmount = subtotal + taxAmount;

  const handleMaterialChange = (index: number, materialId: string) => {
    setValue(`items.${index}.material_id`, materialId);
    const mat = materials.find((m) => m.id === materialId);
    if (mat) {
      const price = mat.standard_cost || 0;
      setValue(`items.${index}.unit_price`, price);
      const qty = watchedItems[index]?.quantity || 1;
      setValue(`items.${index}.line_total`, price * qty);
    }
  };

  const handleQuantityOrPriceChange = (index: number, qty: number, price: number) => {
    setValue(`items.${index}.quantity`, qty);
    setValue(`items.${index}.unit_price`, price);
    setValue(`items.${index}.line_total`, qty * price);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {isEdit ? <Edit3 className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {isEdit ? 'Cập nhật đơn mua hàng (PO)' : 'Lập đơn đặt mua hàng (PO)'}
              </h3>
              <p className="text-xs text-muted-foreground">
                Đơn mua nguyên vật liệu, vật tư và nhiên liệu phục vụ sản xuất
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* PR Link Selector (for new PO or linking) */}
            {!isEdit && availablePRs && availablePRs.length > 0 && (
              <div className="flex flex-col gap-2 rounded-xl border border-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/20 p-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900 dark:text-indigo-300">
                  <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Liên kết Đề xuất Mua sắm (PR):</span>
                </label>
                <select
                  value={activePR?.id || ''}
                  onChange={(e) => handleSelectPR(e.target.value)}
                  className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-background px-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:max-w-md"
                >
                  <option value="">-- Không liên kết phiếu đề xuất PR --</option>
                  {availablePRs.map((pr) => (
                    <option key={pr.id} value={pr.id}>
                      {pr.pr_code} - {pr.material_name} ({pr.quantity.toLocaleString('vi-VN')} {pr.unit_of_measure}) - {pr.department}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Prominent PR Details Badge / Card */}
            {activePR && (
              <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-50/70 to-blue-50/50 dark:from-indigo-950/50 dark:to-blue-950/30 p-4 text-xs space-y-2.5 shadow-xs animate-in fade-in">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-indigo-700 dark:text-indigo-400">
                      Phiếu đề xuất PR: {activePR.pr_code}
                    </span>
                    <span className="rounded-md bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                      {activePR.department}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground text-[11px]">Mức độ ưu tiên:</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        activePR.priority === 'urgent'
                          ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                          : activePR.priority === 'high'
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          : activePR.priority === 'low'
                          ? 'bg-slate-500/15 text-slate-600 dark:text-slate-400'
                          : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {activePR.priority === 'urgent'
                        ? 'Khẩn cấp'
                        : activePR.priority === 'high'
                        ? 'Ưu tiên cao'
                        : activePR.priority === 'low'
                        ? 'Thấp'
                        : 'Bình thường'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2 border-t border-indigo-200/50 dark:border-indigo-900/50 text-[11px]">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-medium">Vật tư yêu cầu</span>
                    <p className="font-bold text-foreground text-xs">{activePR.material_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-medium">Số lượng cần</span>
                    <p className="font-bold text-foreground text-xs">
                      {activePR.quantity.toLocaleString('vi-VN')} {activePR.unit_of_measure}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-medium">Đơn giá / Dự toán</span>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                      {formatCurrency(activePR.quantity > 0 ? activePR.estimated_cost / activePR.quantity : 0)} / {formatCurrency(activePR.estimated_cost)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-medium">Hạn cần vật tư</span>
                    <p className="font-bold text-foreground text-xs">
                      {activePR.required_date ? new Date(activePR.required_date).toLocaleDateString('vi-VN') : '—'}
                    </p>
                  </div>
                </div>

                {activePR.reason && (
                  <p className="text-[11px] text-muted-foreground italic border-t border-indigo-200/40 dark:border-indigo-900/40 pt-1.5">
                    Lý do đề xuất: {activePR.reason}
                  </p>
                )}
              </div>
            )}

            {/* General Info */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Mã đơn mua (PO Code) <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder="PO-YYYYMMDD-XXX"
                  {...register('po_code')}
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-semibold uppercase text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {errors.po_code && (
                  <p className="mt-1 text-xs text-destructive">{errors.po_code.message}</p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Nhà cung cấp <span className="text-destructive">*</span>
                </label>
                <select
                  {...register('supplier_id')}
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">-- Chọn nhà cung cấp --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} - {s.name}
                    </option>
                  ))}
                </select>
                {errors.supplier_id && (
                  <p className="mt-1 text-xs text-destructive">{errors.supplier_id.message}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Trạng thái đơn mua
                </label>
                <select
                  {...register('status')}
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="draft">Bản nháp (draft)</option>
                  <option value="sent">Đã gửi NCC (sent)</option>
                  <option value="confirmed">NCC xác nhận (confirmed)</option>
                  <option value="partially_received">Đã nhận một phần (partially_received)</option>
                  <option value="received">Đã nhập đủ kho (received)</option>
                  <option value="cancelled">Hủy đơn (cancelled)</option>
                </select>
              </div>
            </div>

            {/* Dates & Terms */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Ngày đặt mua <span className="text-destructive">*</span>
                </label>
                <input
                  type="date"
                  {...register('order_date')}
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {errors.order_date && (
                  <p className="mt-1 text-xs text-destructive">{errors.order_date.message}</p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Dự kiến giao hàng
                </label>
                <input
                  type="date"
                  {...register('expected_delivery_date')}
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                  Thuế VAT (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  {...register('tax_rate')}
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-foreground">Điều khoản thanh toán</label>
                <input
                  type="text"
                  placeholder="VD: Thanh toán sau khi nghiệm thu kho 15 ngày"
                  {...register('payment_terms')}
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Ghi chú đơn hàng</label>
                <input
                  type="text"
                  placeholder="Ghi chú mục đích sử dụng, yêu cầu kiểm định COA..."
                  {...register('notes')}
                  className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Danh mục nguyên vật liệu đặt mua
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Chọn nguyên vật liệu từ danh mục kho hoặc nhập số lượng dự kiến
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      material_id: materials[0]?.id || '',
                      quantity: 100,
                      unit_price: materials[0]?.standard_cost || 0,
                      line_total: (materials[0]?.standard_cost || 0) * 100,
                      received_quantity: 0,
                    })
                  }
                  className="gap-1 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Thêm nguyên vật liệu
                </Button>
              </div>

              {errors.items?.message && (
                <p className="text-xs text-destructive">{errors.items.message}</p>
              )}

              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 font-semibold text-muted-foreground border-b border-border">
                    <tr>
                      <th className="px-3 py-2">Nguyên vật liệu</th>
                      <th className="px-3 py-2 w-28 text-right">Số lượng</th>
                      <th className="px-3 py-2 w-36 text-right">Đơn giá (₫)</th>
                      <th className="px-3 py-2 w-36 text-right">Thành tiền</th>
                      <th className="px-2 py-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {fields.map((field, index) => {
                      const currentItem = watchedItems[index];
                      const itemTotal = (Number(currentItem?.quantity) || 0) * (Number(currentItem?.unit_price) || 0);

                      return (
                        <tr key={field.id} className="hover:bg-muted/10">
                          <td className="p-2">
                            <select
                              value={currentItem?.material_id || ''}
                              onChange={(e) => handleMaterialChange(index, e.target.value)}
                              className="w-full rounded border border-input bg-background p-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                              <option value="">-- Chọn nguyên vật liệu --</option>
                              {materials.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.code} - {m.name} ({m.unit_of_measure})
                                </option>
                              ))}
                            </select>
                            {errors.items?.[index]?.material_id && (
                              <p className="text-[10px] text-destructive mt-0.5">
                                {errors.items[index]?.material_id?.message}
                              </p>
                            )}
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              step="any"
                              min="0.0001"
                              value={currentItem?.quantity ?? ''}
                              onChange={(e) =>
                                handleQuantityOrPriceChange(
                                  index,
                                  Number(e.target.value),
                                  Number(currentItem?.unit_price || 0),
                                )
                              }
                              className="w-full text-right rounded border border-input bg-background p-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                            {errors.items?.[index]?.quantity && (
                              <p className="text-[10px] text-destructive mt-0.5">
                                {errors.items[index]?.quantity?.message}
                              </p>
                            )}
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={currentItem?.unit_price ?? ''}
                              onChange={(e) =>
                                handleQuantityOrPriceChange(
                                  index,
                                  Number(currentItem?.quantity || 0),
                                  Number(e.target.value),
                                )
                              }
                              className="w-full text-right rounded border border-input bg-background p-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                          </td>
                          <td className="p-2 text-right font-medium text-foreground">
                            {formatCurrency(itemTotal)}
                          </td>
                          <td className="p-2 text-center">
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations Summary Card */}
            <div className="flex justify-end pt-2">
              <div className="w-full sm:w-80 rounded-xl border border-border bg-muted/20 p-4 space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Tiền hàng chưa thuế:</span>
                  <span className="font-semibold text-foreground">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tiền thuế VAT ({watchedTaxRate}%):</span>
                  <span className="font-semibold text-foreground">{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-sm font-bold text-primary">
                  <span>Tổng giá trị đơn mua:</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dialog Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4 bg-muted/10">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy bỏ
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="gap-2">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Cập nhật đơn PO' : 'Tạo đơn đặt mua PO'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
