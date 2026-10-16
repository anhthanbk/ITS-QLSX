import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, Building2, Edit3 } from 'lucide-react';
import type { Supplier } from '../types';
import { supplierSchema, type SupplierFormValues } from '../validation/sales-schemas';
import { Button } from '@/components/ui/button';

interface SupplierFormDialogProps {
  isOpen: boolean;
  supplier?: Supplier | null;
  onClose: () => void;
  onSubmit: (values: SupplierFormValues) => Promise<void>;
}

export const SupplierFormDialog: React.FC<SupplierFormDialogProps> = ({
  isOpen,
  supplier,
  onClose,
  onSubmit,
}) => {
  const isEdit = !!supplier;

  const defaultValues: SupplierFormValues = {
    code: supplier?.code || '',
    name: supplier?.name || '',
    tax_id: supplier?.tax_id || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    address: supplier?.address || '',
    status: supplier?.status || 'active',
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues,
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        code: supplier?.code || '',
        name: supplier?.name || '',
        tax_id: supplier?.tax_id || '',
        email: supplier?.email || '',
        phone: supplier?.phone || '',
        address: supplier?.address || '',
        status: supplier?.status || 'active',
      });
    }
  }, [isOpen, supplier, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {isEdit ? <Edit3 className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {isEdit ? 'Cập nhật nhà cung cấp' : 'Thêm mới nhà cung cấp'}
              </h3>
              <p className="text-xs text-muted-foreground">
                Thông tin đối tác cung ứng vật tư & dịch vụ
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

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-foreground">
                Mã nhà cung cấp <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                placeholder="VD: NCC-PETRO"
                {...register('code')}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm uppercase placeholder:normal-case focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {errors.code && (
                <p className="mt-1 text-xs text-destructive">{errors.code.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">
                Trạng thái hoạt động
              </label>
              <select
                {...register('status')}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="active">Đang giao dịch (active)</option>
                <option value="inactive">Ngừng giao dịch (inactive)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">
              Tên nhà cung cấp / Doanh nghiệp <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Công ty CP Xăng Dầu Petrolimex Khánh Hòa"
              {...register('name')}
              className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-foreground">Mã số thuế</label>
              <input
                type="text"
                placeholder="VD: 4200101010"
                {...register('tax_id')}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {errors.tax_id && (
                <p className="mt-1 text-xs text-destructive">{errors.tax_id.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Số điện thoại</label>
              <input
                type="tel"
                placeholder="VD: 02583822456"
                {...register('phone')}
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {errors.phone && (
                <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Email giao dịch</label>
            <input
              type="email"
              placeholder="VD: khanhhoa@petrolimex.com.vn"
              {...register('email')}
              className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Địa chỉ trụ sở / Kho</label>
            <input
              type="text"
              placeholder="Số nhà, đường, phường, quận/huyện, tỉnh/thành phố"
              {...register('address')}
              className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {errors.address && (
              <p className="mt-1 text-xs text-destructive">{errors.address.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
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
              {isEdit ? 'Lưu thay đổi' : 'Thêm nhà cung cấp'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
