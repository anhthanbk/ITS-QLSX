import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Plus, Trash2, Loader2, FilePlus, Edit3 } from 'lucide-react';
import type { SalesOrder, Customer, ProductOption } from '../types';
import {
  salesOrderSchema,
  type SalesOrderFormValues,
  type SalesOrderItemFormValues,
} from '../validation/sales-schemas';
import { Button } from '@/components/ui/button';

interface SalesOrderFormDialogProps {
  isOpen: boolean;
  order?: SalesOrder | null;
  customers: Customer[];
  products: ProductOption[];
  onClose: () => void;
  onSubmit: (values: SalesOrderFormValues) => Promise<void>;
}

export const SalesOrderFormDialog: React.FC<SalesOrderFormDialogProps> = ({
  isOpen,
  order,
  customers,
  products,
  onClose,
  onSubmit,
}) => {
  const isEdit = !!order;

  const generateDefaultCode = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const rand = Math.floor(100 + Math.random() * 900);
    return `SO-${y}${m}${d}-${rand}`;
  };

  const defaultValues: SalesOrderFormValues = {
    order_code: order?.order_code || generateDefaultCode(),
    customer_id: order?.customer_id || (customers[0]?.id || ''),
    order_date: order?.order_date || (new Date().toISOString().split('T')[0] ?? ''),
    promised_delivery_date: order?.promised_delivery_date || '',
    currency: order?.currency || 'VND',
    tax_rate: order && order.subtotal_amount > 0 ? Math.round((order.tax_amount / order.subtotal_amount) * 100) : 10,
    payment_terms: order?.payment_terms || 'Thanh toán 30 ngày sau khi nhận hàng',
    notes: order?.notes || '',
    status: order?.status || 'draft',
    items:
      order?.items && order.items.length > 0
        ? order.items.map((it) => ({
            product_id: it.product_id,
            quantity: it.quantity,
            unit_price: it.unit_price,
            line_total: it.line_total,
            fulfilled_quantity: it.fulfilled_quantity || 0,
          }))
        : [
            {
              product_id: products[0]?.id || '',
              quantity: 100,
              unit_price: products[0]?.base_sales_price || 0,
              line_total: (products[0]?.base_sales_price || 0) * 100,
              fulfilled_quantity: 0,
            },
          ],
  };

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SalesOrderFormValues>({
    resolver: zodResolver(salesOrderSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        order_code: order?.order_code || generateDefaultCode(),
        customer_id: order?.customer_id || (customers[0]?.id || ''),
        order_date: order?.order_date || (new Date().toISOString().split('T')[0] ?? ''),
        promised_delivery_date: order?.promised_delivery_date || '',
        currency: order?.currency || 'VND',
        tax_rate:
          order && order.subtotal_amount > 0
            ? Math.round((order.tax_amount / order.subtotal_amount) * 100)
            : 10,
        payment_terms: order?.payment_terms || 'Thanh toán 30 ngày sau khi nhận hàng',
        notes: order?.notes || '',
        status: order?.status || 'draft',
        items:
          order?.items && order.items.length > 0
            ? order.items.map((it) => ({
                product_id: it.product_id,
                quantity: it.quantity,
                unit_price: it.unit_price,
                line_total: it.line_total,
                fulfilled_quantity: it.fulfilled_quantity || 0,
              }))
            : [
                {
                  product_id: products[0]?.id || '',
                  quantity: 100,
                  unit_price: products[0]?.base_sales_price || 0,
                  line_total: (products[0]?.base_sales_price || 0) * 100,
                  fulfilled_quantity: 0,
                },
              ],
      });
    }
  }, [isOpen, order, reset, customers, products]);

  if (!isOpen) return null;

  const watchedItems = (watch('items') as Array<Partial<SalesOrderItemFormValues>> | undefined) || [];
  const watchedTaxRate = watch('tax_rate') ?? 10;

  const subtotal = watchedItems.reduce(
    (sum, it) => sum + (Number(it?.quantity) || 0) * (Number(it?.unit_price) || 0),
    0,
  );
  const taxAmount = subtotal * (watchedTaxRate / 100);
  const totalAmount = subtotal + taxAmount;

  const handleProductChange = (index: number, productId: string) => {
    setValue(`items.${index}.product_id`, productId);
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      const price = prod.base_sales_price || 0;
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
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {isEdit ? <Edit3 className="h-4 w-4" /> : <FilePlus className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="font-bold text-foreground">
                {isEdit ? 'Chỉnh sửa đơn bán hàng' : 'Lập đơn đặt hàng bán mới'}
              </h3>
              <p className="text-xs text-muted-foreground">
                Khai báo thông tin đơn hàng thương mại và mặt hàng xuất bán
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* General Info Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Mã đơn hàng (SO) <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  {...register('order_code')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="SO-2026-..."
                />
                {errors.order_code && (
                  <p className="mt-1 text-xs text-destructive">{errors.order_code.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Khách hàng đối tác <span className="text-destructive">*</span>
                </label>
                <select
                  {...register('customer_id')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">-- Chọn khách hàng --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                </select>
                {errors.customer_id && (
                  <p className="mt-1 text-xs text-destructive">{errors.customer_id.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Trạng thái đơn hàng
                </label>
                <select
                  {...register('status')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="draft">Dự thảo (Draft)</option>
                  <option value="confirmed">Đã xác nhận (Confirmed)</option>
                  <option value="in_production">Đang sản xuất (In Production)</option>
                  <option value="ready_to_ship">Sẵn sàng giao (Ready to Ship)</option>
                  <option value="shipped">Đang vận chuyển (Shipped)</option>
                  <option value="delivered">Đã giao hàng (Delivered)</option>
                  <option value="cancelled">Đã hủy (Cancelled)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Ngày đặt hàng <span className="text-destructive">*</span>
                </label>
                <input
                  type="date"
                  {...register('order_date')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {errors.order_date && (
                  <p className="mt-1 text-xs text-destructive">{errors.order_date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Hạn hẹn giao hàng
                </label>
                <input
                  type="date"
                  {...register('promised_delivery_date')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Thuế suất GTGT (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  {...register('tax_rate', { valueAsNumber: true })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="10"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-foreground mb-1">
                  Điều khoản thanh toán
                </label>
                <input
                  type="text"
                  {...register('payment_terms')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Ví dụ: Tạm ứng 30%, thanh toán 70% sau khi nhận hàng..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Ghi chú</label>
                <input
                  type="text"
                  {...register('notes')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Ghi chú đơn hàng..."
                />
              </div>
            </div>

            {/* Dynamic Items Section */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-sm font-semibold text-foreground">
                  Chi tiết mặt hàng bán ({fields.length})
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      product_id: products[0]?.id || '',
                      quantity: 100,
                      unit_price: products[0]?.base_sales_price || 0,
                      line_total: (products[0]?.base_sales_price || 0) * 100,
                      fulfilled_quantity: 0,
                    })
                  }
                  className="gap-1.5 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Thêm mặt hàng</span>
                </Button>
              </div>

              {errors.items?.root && (
                <p className="text-xs text-destructive mb-2">{errors.items.root.message}</p>
              )}

              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-muted/40 uppercase tracking-wider text-muted-foreground font-medium">
                    <tr>
                      <th className="px-3 py-2">Sản phẩm</th>
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
                              value={currentItem?.product_id || ''}
                              onChange={(e) => handleProductChange(index, e.target.value)}
                              className="w-full rounded border border-input bg-background p-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                              <option value="">-- Chọn sản phẩm --</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.sku} - {p.name} ({p.unit_of_measure})
                                </option>
                              ))}
                            </select>
                            {errors.items?.[index]?.product_id && (
                              <p className="text-[10px] text-destructive mt-0.5">
                                {errors.items[index]?.product_id?.message}
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
                                className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                title="Xóa dòng"
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

            {/* Totals Summary */}
            <div className="flex justify-end pt-2">
              <div className="w-full sm:w-72 space-y-1.5 rounded-xl border border-border bg-muted/20 p-3.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Tạm tính tiền hàng:</span>
                  <span className="font-semibold text-foreground">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Thuế GTGT ({watchedTaxRate}%):</span>
                  <span className="font-semibold text-foreground">{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1.5 text-sm font-bold text-foreground">
                  <span>Tổng cộng:</span>
                  <span className="text-primary">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dialog Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-3.5 bg-muted/20">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="gap-2">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Lưu thay đổi' : 'Tạo đơn hàng'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
