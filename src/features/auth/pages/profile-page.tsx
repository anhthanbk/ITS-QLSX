import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/layout/page-container';
import { useToast } from '@/components/feedback/use-toast';
import {
  Mail,
  Shield,
  KeyRound,
  LogOut,
  CheckCircle,
  ArrowLeft,
  Camera,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Briefcase,
  Calendar,
  Hash,
  Phone,
  Save,
  ShieldAlert,
} from 'lucide-react';
import {
  updateUserProfile,
  updateUserPassword,
  uploadUserAvatar,
} from '../api/auth-api';

export const ProfilePage: React.FC = () => {
  const { user, signOut, refreshUser } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  // Profile edit state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [idCardNumber, setIdCardNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Initialize fields from current profile
  useEffect(() => {
    if (user?.profile) {
      setFullName(user.profile.full_name || '');
      setPhone(user.profile.phone || '');
      setDateOfBirth(user.profile.date_of_birth || '');
      setIdCardNumber(user.profile.id_card_number || '');
      setAvatarUrl(user.profile.avatar_url || null);
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploadingAvatar(true);
      const url = await uploadUserAvatar(file, user.id);
      setAvatarUrl(url);

      // Save directly to profile
      await updateUserProfile(user.id, {
        full_name: fullName || user.profile?.full_name || 'Người dùng',
        phone,
        date_of_birth: dateOfBirth,
        id_card_number: idCardNumber,
        avatar_url: url,
      });

      await refreshUser();
      success('Ảnh đại diện đã được cập nhật thành công.', 'Thành công');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải ảnh lên';
      toastError(msg, 'Lỗi tải ảnh');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!fullName.trim()) {
      toastError('Vui lòng nhập họ và tên.', 'Thiếu thông tin');
      return;
    }

    try {
      setIsSavingProfile(true);
      await updateUserProfile(user.id, {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        date_of_birth: dateOfBirth || null,
        id_card_number: idCardNumber.trim() || null,
        avatar_url: avatarUrl || null,
      });

      await refreshUser();
      success('Hồ sơ cá nhân đã được lưu thành công.', 'Cập nhật hoàn tất');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi cập nhật hồ sơ';
      toastError(msg, 'Lỗi');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      toastError('Mật khẩu mới phải có tối thiểu 6 ký tự.', 'Mật khẩu quá ngắn');
      return;
    }

    if (newPassword !== confirmPassword) {
      toastError('Mật khẩu xác nhận không khớp với mật khẩu mới.', 'Không khớp');
      return;
    }

    try {
      setIsChangingPassword(true);
      await updateUserPassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      success('Mật khẩu của bạn đã được cập nhật an toàn.', 'Đổi mật khẩu thành công');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể đổi mật khẩu';
      toastError(msg, 'Lỗi đổi mật khẩu');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user) {
    return null;
  }

  const initials = fullName
    ? fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  const roleName = user.roles?.[0]?.name || 'Nhân viên';
  const deptName = user.profile?.departments?.name || 'Chưa phân bổ';
  const posTitle = user.profile?.positions?.title || 'Chưa phân bổ';
  const empCode = user.profile?.temp_employee_code || 'NV-CHINH-THUC';

  return (
    <PageContainer
      title="Hồ Sơ & Tài Khoản Cá Nhân"
      description="Quản lý thông tin cá nhân, cài đặt bảo mật và quyền hạn tài khoản"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Bảng điều khiển</span>
          </Button>
          <Button
            id="profile-logout-button"
            variant="destructive"
            size="sm"
            onClick={handleSignOut}
            className="flex items-center gap-1.5"
          >
            <LogOut className="h-4 w-4" />
            <span>Đăng xuất</span>
          </Button>
        </div>
      }
    >
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Banner with Avatar & Identity */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="h-28 bg-gradient-to-r from-primary via-emerald-900 to-primary/90 px-6" />

          <div className="px-6 pb-6 pt-0">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
              {/* Avatar circle */}
              <div className="relative inline-block">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="h-24 w-24 rounded-2xl border-4 border-card object-cover shadow-lg"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-card bg-primary text-3xl font-extrabold text-primary-foreground shadow-lg">
                    {initials}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110 disabled:opacity-50"
                  title="Thay đổi ảnh đại diện"
                  aria-label="Tải lên ảnh đại diện mới"
                >
                  {isUploadingAvatar ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Camera className="h-3.5 w-3.5" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleAvatarFileSelect}
                />
              </div>

              {/* Status and Role badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <CheckCircle className="mr-1 h-3.5 w-3.5" />
                  Đang hoạt động
                </span>
                <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Shield className="mr-1 h-3.5 w-3.5" />
                  {roleName}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <h2 id="profile-display-name" className="text-xl font-bold text-foreground">
                {fullName || 'Người dùng hệ thống'}
              </h2>
              <p className="flex items-center text-xs text-muted-foreground">
                <Mail className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Two-Column Grid: Personal Profile & Workplace Details */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column (2 spans): Edit Personal Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Details Form */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Save className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">Chỉnh Sửa Hồ Sơ Cá Nhân</h2>
                    <p className="text-[11px] text-muted-foreground">
                      Cập nhật các thông tin cơ bản liên kết với tài khoản của bạn
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label htmlFor="full_name" className="text-xs font-semibold text-foreground">
                    Họ và tên <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="full_name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Nguyễn Văn A"
                    className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Date of Birth */}
                  <div className="space-y-1.5">
                    <label htmlFor="date_of_birth" className="text-xs font-semibold text-foreground">
                      Ngày sinh
                    </label>
                    <input
                      id="date_of_birth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* ID Card Number */}
                  <div className="space-y-1.5">
                    <label htmlFor="id_card_number" className="text-xs font-semibold text-foreground">
                      Số CCCD / CMND
                    </label>
                    <input
                      id="id_card_number"
                      type="text"
                      value={idCardNumber}
                      onChange={(e) => setIdCardNumber(e.target.value)}
                      placeholder="12 số căn cước công dân"
                      className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-xs font-mono font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-xs font-semibold text-foreground">
                    Số điện thoại liên hệ
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912345678"
                    className="w-full rounded-lg border border-input bg-background px-3.5 py-2 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-end pt-3">
                  <Button
                    id="save-profile-btn"
                    type="submit"
                    size="sm"
                    disabled={isSavingProfile}
                    className="flex items-center gap-1.5"
                  >
                    {isSavingProfile ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    <span>Lưu thay đổi hồ sơ</span>
                  </Button>
                </div>
              </form>
            </div>

            {/* Password Change Form (Personal & Admin Security) */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">Bảo Mật & Mật Khẩu Cá Nhân</h2>
                    <p className="text-[11px] text-muted-foreground">
                      Đổi mật khẩu tài khoản đăng nhập của chính bạn
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Privacy Notice */}
              <div className="mt-4 rounded-xl border border-border/80 bg-accent/30 p-3 flex items-start gap-2.5">
                <ShieldAlert className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Mật khẩu cá nhân chỉ hiển thị/được đổi bởi chính bạn khi đăng nhập tài khoản này và Quản trị viên hệ thống (Admin). Mật khẩu được mã hóa an toàn theo tiêu chuẩn bảo mật một chiều.
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label htmlFor="new_password_input" className="text-xs font-semibold text-foreground">
                      Mật khẩu mới <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="new_password_input"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Tối thiểu 6 ký tự"
                        className="w-full rounded-lg border border-input bg-background py-2 pl-3 pr-10 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label htmlFor="confirm_password_input" className="text-xs font-semibold text-foreground">
                      Xác nhận mật khẩu mới <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="confirm_password_input"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới"
                        className="w-full rounded-lg border border-input bg-background py-2 pl-3 pr-10 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2">
                  <Button
                    id="update-password-btn"
                    type="submit"
                    size="sm"
                    disabled={isChangingPassword || !newPassword}
                    className="flex items-center gap-1.5"
                  >
                    {isChangingPassword ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <KeyRound className="h-3.5 w-3.5" />
                    )}
                    <span>Cập nhật mật khẩu</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column (1 span): System & Workplace Information (Read-Only) */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Thông Tin Công Tác
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Được phân bổ bởi phòng tổ chức hành chính & nhân sự
                </p>
              </div>

              <div className="space-y-3.5 border-t border-border pt-3.5 text-xs">
                {/* Employee Code */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                    <Hash className="h-3.5 w-3.5 text-primary" />
                    Mã nhân viên
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    {empCode}
                  </span>
                </div>

                {/* Department */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    Phòng ban
                  </span>
                  <span className="font-semibold text-foreground text-right">
                    {deptName}
                  </span>
                </div>

                {/* Position */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                    <Briefcase className="h-3.5 w-3.5 text-primary" />
                    Chức danh
                  </span>
                  <span className="font-semibold text-foreground text-right">
                    {posTitle}
                  </span>
                </div>

                {/* Account creation date */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    Ngày tạo TK
                  </span>
                  <span className="font-mono text-muted-foreground text-right">
                    {user.profile?.created_at
                      ? new Date(user.profile.created_at).toLocaleDateString('vi-VN')
                      : '—'}
                  </span>
                </div>

                {/* Contact phone */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    SĐT liên hệ
                  </span>
                  <span className="font-medium text-foreground text-right">
                    {phone || 'Chưa cập nhật'}
                  </span>
                </div>
              </div>

              {/* Roles Section */}
              <div className="border-t border-border pt-4">
                <h4 className="mb-2.5 text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  Vai trò hệ thống
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {user.roles.length > 0 ? (
                    user.roles.map((role) => (
                      <span
                        key={role.id}
                        className="inline-flex items-center rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary"
                      >
                        {role.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs italic text-muted-foreground">Chưa được gán vai trò</span>
                  )}
                </div>
              </div>

              {/* Permissions Section */}
              <div className="border-t border-border pt-4">
                <h4 className="mb-2.5 text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Quyền thao tác ({user.permissions.length})
                </h4>
                <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto p-1">
                  {user.permissions.length > 0 ? (
                    user.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="rounded-md border border-border bg-accent/40 px-2 py-0.5 font-mono text-[10px] text-foreground"
                      >
                        {perm}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs italic text-muted-foreground">Không có quyền riêng lẻ</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
