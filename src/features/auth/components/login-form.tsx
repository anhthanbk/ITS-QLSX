import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { useAuth } from '../hooks/use-auth';
import { supabase } from '@/lib/supabase/client';
import {
  loginSchema,
  signUpSchema,
  type LoginInput,
  type SignUpInput,
} from '../validation/auth-schema';
import {
  Mail,
  Lock,
  User,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Calendar,
  Phone,
  Building2,
  Briefcase,
  CreditCard,
  Camera,
  Trash2,
} from 'lucide-react';
import { useDepartments } from '@/features/hr/hooks/use-departments';
import { usePositions } from '@/features/hr/hooks/use-positions';

export interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { signIn, signUp } = useAuth();
  const { data: departments } = useDepartments();
  const { data: positions } = usePositions();

  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Avatar upload state for candidate registration
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setServerError('Vui lòng chọn tệp hình ảnh (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setServerError('Kích thước ảnh đại diện không được vượt quá 5MB.');
      return;
    }

    setServerError(null);
    setAvatarFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Form for login
  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Form for sign up
  const signUpForm = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      fullName: '',
      dateOfBirth: '',
      phone: '',
      idCardNumber: '',
      departmentId: '',
      positionId: '',
      email: '',
      password: '',
    },
  });

  const onLoginSubmit = async (data: LoginInput) => {
    setServerError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const { error } = await signIn(data.email, data.password);
      if (error) {
        setServerError(
          error.message.includes('Invalid login credentials')
            ? 'Email hoặc mật khẩu không chính xác'
            : error.message,
        );
      } else {
        onSuccess?.();
      }
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi đăng nhập');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSignUpSubmit = async (data: SignUpInput) => {
    setServerError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      let uploadedAvatarUrl: string | undefined = undefined;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop() || 'png';
        const filePath = `candidates/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          uploadedAvatarUrl = publicUrlData.publicUrl;
        } else {
          console.warn('Could not upload candidate avatar:', uploadError);
        }
      }

      const { error } = await signUp({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        avatarUrl: uploadedAvatarUrl,
        dateOfBirth: data.dateOfBirth,
        phone: data.phone || undefined,
        idCardNumber: data.idCardNumber || undefined,
        departmentId: data.departmentId,
        positionId: data.positionId,
      });
      if (error) {
        setServerError(error.message);
      } else {
        setSuccessMessage(
          'Đăng ký tài khoản thành công! Hồ sơ của bạn đang ở trạng thái chờ xét duyệt. Quản trị viên/HR sẽ hoàn thiện thông tin trước khi bạn có thể truy cập hệ thống.',
        );
        setIsSignUpMode(false);
        handleRemoveAvatar();
        loginForm.setValue('email', data.email);
      }
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra khi đăng ký');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-xl">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground shadow-md shadow-primary/25">
          ITS
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {isSignUpMode ? 'Đăng Ký Tài Khoản Mới' : 'Đăng Nhập Hệ Thống'}
        </h2>
        <p className="mt-1 text-xs text-slate-500">Hệ thống Quản lý Sản xuất &bull; ITS-QLSX</p>
      </div>

      {/* Server Alerts */}
      {serverError && (
        <div
          id="login-error-alert"
          className="mb-6 flex items-start space-x-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {successMessage && (
        <div
          id="login-success-alert"
          className="mb-6 flex items-start space-x-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Form Content */}
      {!isSignUpMode ? (
        <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Email
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="login-email-input"
                type="email"
                placeholder="ten@congty.com"
                {...loginForm.register('email')}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {loginForm.formState.errors.email && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {loginForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Mật khẩu
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="login-password-input"
                type="password"
                placeholder="••••••••"
                {...loginForm.register('password')}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            {loginForm.formState.errors.password && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {loginForm.formState.errors.password.message}
              </p>
            )}
          </div>

          <Button
            id="login-submit-button"
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full py-2.5 text-sm font-semibold shadow-md shadow-primary/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xác thực...
              </>
            ) : (
              'Đăng Nhập'
            )}
          </Button>
        </form>
      ) : (
        <form onSubmit={signUpForm.handleSubmit(onSignUpSubmit)} className="space-y-3.5">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center justify-center pb-1">
            <div className="relative group">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-50 transition-colors group-hover:border-primary shadow-inner">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Ảnh đại diện"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-slate-300 group-hover:text-primary transition-colors" />
                )}
              </div>

              {/* Upload trigger button */}
              <button
                type="button"
                id="signup-avatar-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Tải ảnh chân dung"
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110 hover:bg-primary/90"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>

              <input
                ref={fileInputRef}
                id="signup-avatar-input"
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="mt-2 flex items-center gap-2">
              <span className="text-[11px] font-medium text-slate-500">
                Ảnh chân dung đại diện (tùy chọn)
              </span>
              {avatarPreview && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Xóa ảnh</span>
                </button>
              )}
            </div>
          </div>

          {/* Họ và tên */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <User className="h-4 w-4" />
              </div>
              <input
                id="signup-name-input"
                type="text"
                placeholder="Nguyễn Văn A"
                {...signUpForm.register('fullName')}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 transition-colors placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            {signUpForm.formState.errors.fullName && (
              <p className="mt-1 text-[11px] font-medium text-red-600">
                {signUpForm.formState.errors.fullName.message}
              </p>
            )}
          </div>

          {/* Ngày sinh & CCCD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Ngày sinh <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Calendar className="h-4 w-4" />
                </div>
                <input
                  id="signup-dob-input"
                  type="date"
                  {...signUpForm.register('dateOfBirth')}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              {signUpForm.formState.errors.dateOfBirth && (
                <p className="mt-1 text-[11px] font-medium text-red-600">
                  {signUpForm.formState.errors.dateOfBirth.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Số CCCD / CMND
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <CreditCard className="h-4 w-4" />
                </div>
                <input
                  id="signup-idcard-input"
                  type="text"
                  placeholder="12 chữ số"
                  {...signUpForm.register('idCardNumber')}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 transition-colors placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              {signUpForm.formState.errors.idCardNumber && (
                <p className="mt-1 text-[11px] font-medium text-red-600">
                  {signUpForm.formState.errors.idCardNumber.message}
                </p>
              )}
            </div>
          </div>

          {/* Số điện thoại */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Số điện thoại
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Phone className="h-4 w-4" />
              </div>
              <input
                id="signup-phone-input"
                type="tel"
                placeholder="0912345678"
                {...signUpForm.register('phone')}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 transition-colors placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            {signUpForm.formState.errors.phone && (
              <p className="mt-1 text-[11px] font-medium text-red-600">
                {signUpForm.formState.errors.phone.message}
              </p>
            )}
          </div>

          {/* Phòng ban & Vị trí ứng tuyển */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Phòng ban <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Building2 className="h-4 w-4" />
                </div>
                <select
                  id="signup-department-select"
                  {...signUpForm.register('departmentId')}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Chọn phòng ban --</option>
                  {departments?.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>
              {signUpForm.formState.errors.departmentId && (
                <p className="mt-1 text-[11px] font-medium text-red-600">
                  {signUpForm.formState.errors.departmentId.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Vị trí ứng tuyển <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Briefcase className="h-4 w-4" />
                </div>
                <select
                  id="signup-position-select"
                  {...signUpForm.register('positionId')}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Chọn vị trí --</option>
                  {positions?.map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      {pos.title} ({pos.code})
                    </option>
                  ))}
                </select>
              </div>
              {signUpForm.formState.errors.positionId && (
                <p className="mt-1 text-[11px] font-medium text-red-600">
                  {signUpForm.formState.errors.positionId.message}
                </p>
              )}
            </div>
          </div>

          {/* Email đăng nhập */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Email đăng nhập <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="signup-email-input"
                type="email"
                placeholder="ten@congty.com"
                {...signUpForm.register('email')}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 transition-colors placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            {signUpForm.formState.errors.email && (
              <p className="mt-1 text-[11px] font-medium text-red-600">
                {signUpForm.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Mật khẩu */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Mật khẩu <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="signup-password-input"
                type="password"
                placeholder="Ít nhất 6 ký tự"
                {...signUpForm.register('password')}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 transition-colors placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            {signUpForm.formState.errors.password && (
              <p className="mt-1 text-[11px] font-medium text-red-600">
                {signUpForm.formState.errors.password.message}
              </p>
            )}
          </div>

          <Button
            id="signup-submit-button"
            type="submit"
            disabled={isSubmitting}
            className="mt-4 w-full py-2.5 text-xs font-semibold shadow-md shadow-primary/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang gửi hồ sơ...
              </>
            ) : (
              'Gửi Hồ Sơ Đăng Ký'
            )}
          </Button>
        </form>
      )}

      {/* Mode Switcher */}
      <div className="mt-6 border-t border-slate-100 pt-6 text-center">
        <button
          type="button"
          onClick={() => {
            setIsSignUpMode(!isSignUpMode);
            setServerError(null);
            setSuccessMessage(null);
          }}
          className="text-xs font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
        >
          {isSignUpMode
            ? 'Đã có tài khoản? Quay lại đăng nhập'
            : 'Chưa có tài khoản? Đăng ký người dùng mới'}
        </button>
      </div>
    </div>
  );
};
