import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, Camera, Eye, EyeOff, ShieldCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { employeeFormSchema, type EmployeeFormValues } from '../validation/hr-schemas';
import type { Employee } from '../types';
import { useDepartments } from '../hooks/use-departments';
import { usePositions } from '../hooks/use-positions';
import { uploadUserAvatar } from '@/features/auth/api/auth-api';

export interface EmployeeFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  employeeToEdit?: Employee | null;
  onSubmit: (values: EmployeeFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export const EmployeeFormDialog: React.FC<EmployeeFormDialogProps> = ({
  isOpen,
  onClose,
  employeeToEdit,
  onSubmit,
  isSubmitting,
}) => {
  const { data: departments } = useDepartments();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      employee_code: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      department_id: '',
      position_id: '',
      direct_manager_id: null,
      hire_date: new Date().toISOString().split('T')[0],
      status: 'active',
      date_of_birth: '',
      id_card_number: '',
      avatar_url: '',
      new_password: '',
    },
  });

  const selectedDepartmentId = watch('department_id');
  const { data: positions } = usePositions(selectedDepartmentId);

  // Sync form data when dialog opens or employeeToEdit changes
  useEffect(() => {
    if (isOpen && employeeToEdit) {
      reset({
        employee_code: employeeToEdit.employee_code,
        first_name: employeeToEdit.first_name,
        last_name: employeeToEdit.last_name,
        email: employeeToEdit.email || '',
        phone: employeeToEdit.phone || '',
        department_id: employeeToEdit.department_id,
        position_id: employeeToEdit.position_id,
        direct_manager_id: employeeToEdit.direct_manager_id || null,
        hire_date: employeeToEdit.hire_date,
        status: employeeToEdit.status,
        date_of_birth: employeeToEdit.date_of_birth || '',
        id_card_number: employeeToEdit.id_card_number || '',
        avatar_url: employeeToEdit.avatar_url || '',
        new_password: '',
      });
      setAvatarPreview(employeeToEdit.avatar_url || null);
    }
  }, [isOpen, employeeToEdit, reset]);

  // Handle avatar upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !employeeToEdit) return;

    try {
      setIsUploadingAvatar(true);
      const url = await uploadUserAvatar(file, employeeToEdit.id);
      setValue('avatar_url', url);
      setAvatarPreview(url);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể tải ảnh lên';
      alert(message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (!isOpen || !employeeToEdit) return null;

  const initials = employeeToEdit.first_name?.charAt(0).toUpperCase() || 'E';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="employee-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in-50 zoom-in-95">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h2 id="employee-dialog-title" className="text-base font-bold text-foreground">
                Chỉnh Sửa Hồ Sơ Nhân Viên
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Mã NV: <span className="font-mono font-semibold text-foreground">{employeeToEdit.employee_code}</span>
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

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* Avatar Upload Section */}
          <div className="flex items-center gap-4 rounded-xl border border-border/70 bg-accent/20 p-3.5">
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={employeeToEdit.first_name}
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/30"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary ring-2 ring-primary/20">
                  {initials}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110 disabled:opacity-50"
                title="Thay đổi ảnh đại diện"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Camera className="h-3 w-3" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Ảnh đại diện nhân viên</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Nhấn vào nút máy ảnh để chọn ảnh mới (JPG, PNG, WebP tối đa 5MB).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Mã nhân viên */}
            <div className="space-y-1">
              <label htmlFor="employee_code" className="text-xs font-semibold text-foreground">
                Mã NV <span className="text-destructive">*</span>
              </label>
              <input
                id="employee_code"
                type="text"
                placeholder="VD: EMP-003"
                {...register('employee_code')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.employee_code && (
                <p className="text-[11px] text-destructive">{errors.employee_code.message}</p>
              )}
            </div>

            {/* Họ & tên đệm */}
            <div className="space-y-1">
              <label htmlFor="last_name" className="text-xs font-semibold text-foreground">
                Họ & tên đệm <span className="text-destructive">*</span>
              </label>
              <input
                id="last_name"
                type="text"
                placeholder="VD: Nguyễn Văn"
                {...register('last_name')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.last_name && (
                <p className="text-[11px] text-destructive">{errors.last_name.message}</p>
              )}
            </div>

            {/* Tên */}
            <div className="space-y-1">
              <label htmlFor="first_name" className="text-xs font-semibold text-foreground">
                Tên <span className="text-destructive">*</span>
              </label>
              <input
                id="first_name"
                type="text"
                placeholder="VD: Bình"
                {...register('first_name')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.first_name && (
                <p className="text-[11px] text-destructive">{errors.first_name.message}</p>
              )}
            </div>
          </div>

          {/* Profile fields: DOB & CCCD */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="date_of_birth" className="text-xs font-semibold text-foreground">
                Ngày sinh
              </label>
              <input
                id="date_of_birth"
                type="date"
                {...register('date_of_birth')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.date_of_birth && (
                <p className="text-[11px] text-destructive">{errors.date_of_birth.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="id_card_number" className="text-xs font-semibold text-foreground">
                Số CCCD / CMND
              </label>
              <input
                id="id_card_number"
                type="text"
                placeholder="12 số CCCD"
                {...register('id_card_number')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.id_card_number && (
                <p className="text-[11px] text-destructive">{errors.id_card_number.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Email */}
            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-semibold text-foreground">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="binh.nguyen@its-qlsx.vn"
                {...register('email')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.email && (
                <p className="text-[11px] text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Số điện thoại */}
            <div className="space-y-1">
              <label htmlFor="phone" className="text-xs font-semibold text-foreground">
                Số điện thoại
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="0912345678"
                {...register('phone')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.phone && (
                <p className="text-[11px] text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Phòng ban */}
            <div className="space-y-1">
              <label htmlFor="department_id" className="text-xs font-semibold text-foreground">
                Phòng ban <span className="text-destructive">*</span>
              </label>
              <select
                id="department_id"
                {...register('department_id')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Chọn phòng ban --</option>
                {departments?.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
              {errors.department_id && (
                <p className="text-[11px] text-destructive">{errors.department_id.message}</p>
              )}
            </div>

            {/* Chức danh */}
            <div className="space-y-1">
              <label htmlFor="position_id" className="text-xs font-semibold text-foreground">
                Chức danh / Vị trí <span className="text-destructive">*</span>
              </label>
              <select
                id="position_id"
                {...register('position_id')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Chọn chức danh --</option>
                {positions?.map((pos) => (
                  <option key={pos.id} value={pos.id}>
                    {pos.title} ({pos.code} - Cấp {pos.level})
                  </option>
                ))}
              </select>
              {errors.position_id && (
                <p className="text-[11px] text-destructive">{errors.position_id.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Ngày vào làm */}
            <div className="space-y-1">
              <label htmlFor="hire_date" className="text-xs font-semibold text-foreground">
                Ngày vào làm <span className="text-destructive">*</span>
              </label>
              <input
                id="hire_date"
                type="date"
                {...register('hire_date')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.hire_date && (
                <p className="text-[11px] text-destructive">{errors.hire_date.message}</p>
              )}
            </div>

            {/* Trạng thái */}
            <div className="space-y-1">
              <label htmlFor="status" className="text-xs font-semibold text-foreground">
                Trạng thái làm việc <span className="text-destructive">*</span>
              </label>
              <select
                id="status"
                {...register('status')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="active">Đang làm việc</option>
                <option value="on_leave">Nghỉ phép</option>
                <option value="terminated">Đã thôi việc</option>
              </select>
              {errors.status && (
                <p className="text-[11px] text-destructive">{errors.status.message}</p>
              )}
            </div>
          </div>

          {/* Password Reset Section (Admin only) */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold text-foreground">
                Quản lý mật khẩu đăng nhập (Dành cho Admin)
              </h3>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Mật khẩu cá nhân chỉ hiển thị/được đổi bởi người dùng đăng nhập tài khoản đó và Admin. Nhập mật khẩu mới bên dưới nếu cần đặt lại mật khẩu cho nhân viên này. Để trống nếu muốn giữ nguyên mật khẩu cũ.
            </p>
            <div className="relative">
              <input
                id="new_password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự) hoặc để trống"
                {...register('new_password')}
                className="w-full rounded-lg border border-input bg-background py-2 pl-3 pr-10 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            {errors.new_password && (
              <p className="text-[11px] text-destructive">{errors.new_password.message}</p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
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
              id="submit-employee-form-btn"
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Lưu thay đổi hồ sơ</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
