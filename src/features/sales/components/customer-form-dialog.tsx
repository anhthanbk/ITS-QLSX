import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, UserPlus, Edit3 } from 'lucide-react';
import type { Customer } from '../types';
import { customerSchema, type CustomerFormValues } from '../validation/sales-schemas';
import { Button } from '@/components/ui/button';

interface CustomerFormDialogProps {
  isOpen: boolean;
  customer?: Customer | null;
  onClose: () => void;
  onSubmit: (values: CustomerFormValues) => Promise<void>;
}

export const CustomerFormDialog: React.FC<CustomerFormDialogProps> = ({
  isOpen,
  customer,
  onClose,
  onSubmit,
}) => {
  const isEdit = !!customer;

  const defaultValues: CustomerFormValues = {
    code: customer?.code || '',
    name: customer?.name || '',
    tax_id: customer?.tax_id || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    credit_limit: customer?.credit_limit || 0,
    status: customer?.status || 'active',
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues,
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        code: customer?.code || '',
        name: customer?.name || '',
        tax_id: customer?.tax_id || '',
        email: customer?.email || '',
        phone: customer?.phone || '',
        address: customer?.address || '',
        credit_limit: customer?.credit_limit || 0,
        status: customer?.status || 'active',
      });
    }
  }, [isOpen, customer, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {isEdit ? <Edit3 className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="font-bold text-foreground">
                {isEdit ? 'Chỉnh sửa thông tin khách hàng' : 'Thêm mới khách hàng đối tác'}
              </h3>
              <p className="text-xs text-muted-foreground">
                Hồ sơ thông tin liên hệ và hạn mức thanh toán thương mại
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

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Mã khách hàng <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  {...register('code')}
                  placeholder="KH-..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {errors.code && (
                  <p className="mt-1 text-xs text-destructive">{errors.code.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Trạng thái hoạt động
                </label>
                <select
                  {...register('status')}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Ngừng giao dịch</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-foreground mb-1">
                  Tên doanh nghiệp / Khách hàng <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="Công ty CP..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Mã số thuế (MST)
                </label>
                <input
                  type="text"
                  {...register('tax_id')}
                  placeholder="0100..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  {...register('phone')}
                  placeholder="024..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-foreground mb-1">
                  Email liên hệ
                </label>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="contact@company.com"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-foreground mb-1">
                  Địa chỉ trụ sở / Xưởng nhận hàng
                </label>
                <input
                  type="text"
                  {...register('address')}
                  placeholder="KCN, tỉnh thành..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-foreground mb-1">
                  Hạn mức tín dụng / Công nợ (₫)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000000"
                  {...register('credit_limit', { valueAsNumber: true })}
                  placeholder="0"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {errors.credit_limit && (
                  <p className="mt-1 text-xs text-destructive">{errors.credit_limit.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-3.5 bg-muted/20">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="gap-2">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Lưu thay đổi' : 'Thêm khách hàng'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
