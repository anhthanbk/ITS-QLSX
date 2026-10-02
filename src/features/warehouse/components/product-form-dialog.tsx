import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, PackageCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { productSchema, type ProductFormValues } from '../validation/warehouse-schemas';
import type { ProductCatalogItem } from '@/features/warehouse/types';

export interface ProductFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: ProductCatalogItem | null;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export const ProductFormDialog: React.FC<ProductFormDialogProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSubmit,
  isSubmitting,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: '',
      name: '',
      product_type: 'finished_good',
      unit_of_measure: 'Tấn',
      base_sales_price: 0,
      standard_cycle_time_mins: 0,
      standard_labor_cost: 0,
      status: 'active',
    },
  });

  useEffect(() => {
    if (productToEdit) {
      reset({
        sku: productToEdit.sku,
        name: productToEdit.name,
        product_type: productToEdit.product_type,
        unit_of_measure: productToEdit.unit_of_measure,
        base_sales_price: productToEdit.base_sales_price,
        standard_cycle_time_mins: productToEdit.standard_cycle_time_mins,
        standard_labor_cost: productToEdit.standard_labor_cost,
        status: productToEdit.status,
      });
    } else {
      reset({
        sku: '',
        name: '',
        product_type: 'finished_good',
        unit_of_measure: 'Tấn',
        base_sales_price: 0,
        standard_cycle_time_mins: 0,
        standard_labor_cost: 0,
        status: 'active',
      });
    }
  }, [productToEdit, reset, isOpen]);

  const handleFormSubmit = async (data: ProductFormValues) => {
    await onSubmit(data);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in-50 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 id="product-dialog-title" className="text-base font-bold text-foreground">
                {productToEdit ? 'Chỉnh sửa sản phẩm / thành phẩm' : 'Khai báo sản phẩm / thành phẩm mới'}
              </h2>
              <p className="text-xs text-muted-foreground">
                Lưu vào danh mục sản phẩm (bảng products) dùng cho sản xuất & bán hàng
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 p-6 text-xs">
          {/* Row 1: SKU & Product Type */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="product-sku" className="mb-1 block font-semibold text-foreground">
                Mã SKU sản phẩm <span className="text-destructive">*</span>
              </label>
              <input
                id="product-sku"
                type="text"
                placeholder="VD: AL-SAND-01, HYD-WET-02"
                {...register('sku')}
                disabled={!!productToEdit} // SKU shouldn't be freely renamed if editing to protect foreign refs
                className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono uppercase text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden ${
                  productToEdit ? 'opacity-70 cursor-not-allowed bg-muted/50' : ''
                }`}
              />
              {errors.sku && <p className="mt-1 text-[11px] text-destructive">{errors.sku.message}</p>}
            </div>

            <div>
              <label htmlFor="product-type" className="mb-1 block font-semibold text-foreground">
                Loại sản phẩm <span className="text-destructive">*</span>
              </label>
              <select
                id="product-type"
                {...register('product_type')}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
              >
                <option value="finished_good">Thành phẩm hoàn chỉnh (finished_good)</option>
                <option value="semi_finished">Bán thành phẩm (semi_finished)</option>
                <option value="by_product">Phụ phẩm thu hồi (by_product)</option>
              </select>
              {errors.product_type && (
                <p className="mt-1 text-[11px] text-destructive">{errors.product_type.message}</p>
              )}
            </div>
          </div>

          {/* Row 2: Name */}
          <div>
            <label htmlFor="product-name" className="mb-1 block font-semibold text-foreground">
              Tên sản phẩm & Quy cách <span className="text-destructive">*</span>
            </label>
            <input
              id="product-name"
              type="text"
              placeholder="VD: Alumina cát loại 1 (Al2O3 >= 98.6%) hoặc Nhôm Hydroxit Al(OH)3"
              {...register('name')}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
            />
            {errors.name && <p className="mt-1 text-[11px] text-destructive">{errors.name.message}</p>}
          </div>

          {/* Row 3: Unit and Status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="product-unit" className="mb-1 block font-semibold text-foreground">
                Đơn vị tính <span className="text-destructive">*</span>
              </label>
              <input
                id="product-unit"
                type="text"
                placeholder="VD: Tấn, Kg, Bao 50kg, Thùng"
                {...register('unit_of_measure')}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
              />
              {errors.unit_of_measure && (
                <p className="mt-1 text-[11px] text-destructive">{errors.unit_of_measure.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="product-status" className="mb-1 block font-semibold text-foreground">
                Trạng thái kinh doanh
              </label>
              <select
                id="product-status"
                {...register('status')}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-hidden"
              >
                <option value="active">Đang kinh doanh (active)</option>
                <option value="discontinued">Ngừng kinh doanh (discontinued)</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-[11px] text-destructive">{errors.status.message}</p>
              )}
            </div>
          </div>

          {/* Section: Economic & Production parameters */}
          <div className="rounded-xl border border-border/70 bg-muted/20 p-3.5 space-y-3">
            <h4 className="font-semibold text-foreground text-xs flex items-center gap-1.5">
              <span>Định mức sản xuất & Giá bán niêm yết</span>
            </h4>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="product-price" className="mb-1 block text-muted-foreground">
                  Giá bán niêm yết (VNĐ)
                </label>
                <input
                  id="product-price"
                  type="number"
                  step="any"
                  min="0"
                  {...register('base_sales_price')}
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-hidden"
                />
                {errors.base_sales_price && (
                  <p className="mt-1 text-[10px] text-destructive">{errors.base_sales_price.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="product-cycle-time" className="mb-1 block text-muted-foreground">
                  Chu kỳ sản xuất (phút)
                </label>
                <input
                  id="product-cycle-time"
                  type="number"
                  step="any"
                  min="0"
                  {...register('standard_cycle_time_mins')}
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-hidden"
                />
                {errors.standard_cycle_time_mins && (
                  <p className="mt-1 text-[10px] text-destructive">
                    {errors.standard_cycle_time_mins.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="product-labor-cost" className="mb-1 block text-muted-foreground">
                  Định mức nhân công (VNĐ)
                </label>
                <input
                  id="product-labor-cost"
                  type="number"
                  step="any"
                  min="0"
                  {...register('standard_labor_cost')}
                  className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-hidden"
                />
                {errors.standard_labor_cost && (
                  <p className="mt-1 text-[10px] text-destructive">{errors.standard_labor_cost.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="gap-2">
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{productToEdit ? 'Lưu thay đổi' : 'Thêm sản phẩm'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
