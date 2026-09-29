import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { useAuth } from '../hooks/use-auth';
import {
  loginSchema,
  signUpSchema,
  type LoginInput,
  type SignUpInput,
} from '../validation/auth-schema';
import { Mail, Lock, User, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { signIn, signUp } = useAuth();
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      email: '',
      password: '',
      roleCode: 'operator',
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
      const { error } = await signUp(data.email, data.password, data.fullName, data.roleCode);
      if (error) {
        setServerError(error.message);
      } else {
        setSuccessMessage('Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay.');
        setIsSignUpMode(false);
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
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-md shadow-blue-500/30">
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
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
            className="mt-6 w-full py-2.5 text-sm font-semibold shadow-md shadow-blue-500/20"
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
        <form onSubmit={signUpForm.handleSubmit(onSignUpSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Họ và tên
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
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            {signUpForm.formState.errors.fullName && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {signUpForm.formState.errors.fullName.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Email
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
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            {signUpForm.formState.errors.email && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {signUpForm.formState.errors.email.message}
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
                id="signup-password-input"
                type="password"
                placeholder="Ít nhất 6 ký tự"
                {...signUpForm.register('password')}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            {signUpForm.formState.errors.password && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {signUpForm.formState.errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Vai trò khởi tạo
            </label>
            <select
              id="signup-role-select"
              {...signUpForm.register('roleCode')}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="operator">Công nhân vận hành (Operator)</option>
              <option value="production_lead">Trưởng ca sản xuất (Production Lead)</option>
              <option value="plant_manager">Quản đốc nhà máy (Plant Manager)</option>
              <option value="admin">Quản trị viên (Admin)</option>
            </select>
          </div>

          <Button
            id="signup-submit-button"
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full py-2.5 text-sm font-semibold shadow-md shadow-blue-500/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tạo tài khoản...
              </>
            ) : (
              'Đăng Ký Tài Khoản'
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
          className="text-xs font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline"
        >
          {isSignUpMode
            ? 'Đã có tài khoản? Quay lại đăng nhập'
            : 'Chưa có tài khoản? Đăng ký người dùng mới'}
        </button>
      </div>
    </div>
  );
};
