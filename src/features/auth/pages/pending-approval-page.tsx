import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Clock,
  ShieldAlert,
  LogOut,
  RefreshCw,
  Building2,
  Briefcase,
  Calendar,
  Mail,
  User,
  CreditCard,
  Phone,
  Edit3,
  Camera,
  Loader2,
  Send,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/feedback/use-toast';
import { useAuth } from '../hooks/use-auth';
import { useDepartments } from '@/features/hr/hooks/use-departments';
import { usePositions } from '@/features/hr/hooks/use-positions';
import { resubmitRejectedRegistration, uploadUserAvatar } from '../api/auth-api';

export const PendingApprovalPage: React.FC = () => {
  const { user, signOut, refreshUser, isLoading } = useAuth();
  const { success, error } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit form states
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [idCardNumber, setIdCardNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [positionId, setPositionId] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { data: departments } = useDepartments();
  const { data: positions } = usePositions(departmentId || undefined);

  const profile = user?.profile;
  const isRejected = profile?.status === 'rejected';

  // Initialize form when editing starts or profile changes
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setDateOfBirth(profile.date_of_birth || '');
      setIdCardNumber(profile.id_card_number || '');
      setPhone(profile.phone || '');
      setDepartmentId(profile.department_id || '');
      setPositionId(profile.position_id || '');
      setAvatarUrl(profile.avatar_url || null);
      setAvatarPreview(profile.avatar_url || null);
    }
  }, [profile, isEditing]);

  // If not logged in, go to login
  if (!user && !isLoading) {
    return <Navigate to="/login" replace />;
  }

  // If already active, go to home dashboard
  if (user?.profile?.status === 'active') {
    return <Navigate to="/" replace />;
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      error('Vui lòng nhập họ và tên.');
      return;
    }
    if (!departmentId || !positionId) {
      error('Vui lòng chọn phòng ban và vị trí ứng tuyển.');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalAvatarUrl = avatarUrl;
      if (avatarFile && user?.id) {
        finalAvatarUrl = await uploadUserAvatar(avatarFile, user.id);
      }

      await resubmitRejectedRegistration({
        fullName: fullName.trim(),
        dateOfBirth: dateOfBirth || null,
        idCardNumber: idCardNumber.trim() || null,
        phone: phone.trim() || null,
        departmentId,
        positionId,
        avatarUrl: finalAvatarUrl,
      });

      success('Đã gửi lại hồ sơ xét duyệt thành công! Quản trị viên sẽ sớm kiểm tra lại thông tin của bạn.');
      setIsEditing(false);
      await refreshUser();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể gửi lại hồ sơ.';
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-4 sm:p-6 text-slate-100">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-6 sm:p-8 shadow-2xl animate-in fade-in-50 zoom-in-95">
        {/* Header Icon or Avatar */}
        <div className="flex flex-col items-center text-center">
          <div
            className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl shadow-lg ${
              isRejected
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="h-full w-full object-cover"
              />
            ) : isRejected ? (
              <ShieldAlert className="h-8 w-8" />
            ) : (
              <Clock className="h-8 w-8" />
            )}
          </div>

          <h2 className="mt-4 text-xl font-bold tracking-tight text-white">
            {isRejected ? 'Hồ Sơ Bị Từ Chối Phê Duyệt' : 'Hồ Sơ Đang Chờ Phê Duyệt'}
          </h2>

          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            {isRejected
              ? 'Rất tiếc, hồ sơ đăng ký tài khoản của bạn chưa được phê duyệt. Vui lòng xem lý do bên dưới và bổ sung/chỉnh sửa thông tin để gửi lại.'
              : 'Tài khoản của bạn đã được đăng ký thành công và đang chờ Quản trị viên/HR kiểm duyệt thông tin.'}
          </p>
        </div>

        {/* Rejection notice */}
        {isRejected && profile?.rejection_reason && (
          <div className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
            <span className="font-semibold text-rose-200">Lý do từ chối:</span>{' '}
            {profile.rejection_reason}
          </div>
        )}

        {/* Edit Form Mode */}
        {isEditing ? (
          <form onSubmit={handleResubmit} className="mt-5 space-y-4 rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-xs animate-in fade-in-50">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Edit3 className="h-3.5 w-3.5 text-primary" />
                Chỉnh sửa & Cập nhật hồ sơ
              </span>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Avatar upload */}
            <div className="flex items-center gap-3 py-1">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-700 bg-slate-800 text-slate-400">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar Preview" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-6 w-6" />
                )}
                <label
                  htmlFor="resubmit-avatar"
                  className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                >
                  <Camera className="h-4 w-4 text-white" />
                </label>
              </div>
              <div>
                <label htmlFor="resubmit-avatar" className="cursor-pointer text-xs font-semibold text-primary hover:underline">
                  Đổi ảnh đại diện
                </label>
                <input
                  id="resubmit-avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <p className="text-[10px] text-slate-500">Tối đa 5MB (.jpg, .png)</p>
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1">
              <label htmlFor="resubmit-fullname" className="text-slate-300 font-medium">
                Họ và tên <span className="text-rose-400">*</span>
              </label>
              <input
                id="resubmit-fullname"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên đầy đủ"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-primary focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* DOB */}
              <div className="space-y-1">
                <label htmlFor="resubmit-dob" className="text-slate-300 font-medium">
                  Ngày sinh
                </label>
                <input
                  id="resubmit-dob"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-primary focus:outline-none"
                />
              </div>

              {/* ID Card */}
              <div className="space-y-1">
                <label htmlFor="resubmit-idcard" className="text-slate-300 font-medium">
                  Số CCCD / CMND
                </label>
                <input
                  id="resubmit-idcard"
                  type="text"
                  value={idCardNumber}
                  onChange={(e) => setIdCardNumber(e.target.value)}
                  placeholder="12 chữ số"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label htmlFor="resubmit-phone" className="text-slate-300 font-medium">
                Số điện thoại
              </label>
              <input
                id="resubmit-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-primary focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Department */}
              <div className="space-y-1">
                <label htmlFor="resubmit-dept" className="text-slate-300 font-medium">
                  Phòng ban <span className="text-rose-400">*</span>
                </label>
                <select
                  id="resubmit-dept"
                  required
                  value={departmentId}
                  onChange={(e) => {
                    setDepartmentId(e.target.value);
                    setPositionId('');
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-primary focus:outline-none"
                >
                  <option value="">-- Chọn phòng ban --</option>
                  {departments?.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Position */}
              <div className="space-y-1">
                <label htmlFor="resubmit-pos" className="text-slate-300 font-medium">
                  Vị trí ứng tuyển <span className="text-rose-400">*</span>
                </label>
                <select
                  id="resubmit-pos"
                  required
                  value={positionId}
                  onChange={(e) => setPositionId(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 focus:border-primary focus:outline-none"
                >
                  <option value="">-- Chọn chức danh --</option>
                  {positions?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                disabled={isSubmitting}
                className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Gửi lại xét duyệt</span>
              </Button>
            </div>
          </form>
        ) : (
          /* Profile Summary Card */
          profile && (
            <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <span className="text-slate-400 font-medium">Mã đăng ký tạm:</span>
                <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                  {profile.temp_employee_code || 'Chưa cấp'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <User className="h-3.5 w-3.5 text-slate-500" /> Họ và tên:
                </span>
                <span className="font-semibold text-slate-200">{profile.full_name}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Mail className="h-3.5 w-3.5 text-slate-500" /> Email:
                </span>
                <span className="font-mono text-slate-300">{user.email}</span>
              </div>

              {profile.date_of_birth && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" /> Ngày sinh:
                  </span>
                  <span className="text-slate-200">{profile.date_of_birth}</span>
                </div>
              )}

              {profile.id_card_number && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <CreditCard className="h-3.5 w-3.5 text-slate-500" /> CCCD/CMND:
                  </span>
                  <span className="font-mono text-slate-200">{profile.id_card_number}</span>
                </div>
              )}

              {profile.phone && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Phone className="h-3.5 w-3.5 text-slate-500" /> Số điện thoại:
                  </span>
                  <span className="font-mono text-slate-200">{profile.phone}</span>
                </div>
              )}

              {profile.departments && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Building2 className="h-3.5 w-3.5 text-slate-500" /> Phòng ban:
                  </span>
                  <span className="font-medium text-slate-200">{profile.departments.name}</span>
                </div>
              )}

              {profile.positions && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Briefcase className="h-3.5 w-3.5 text-slate-500" /> Vị trí ứng tuyển:
                  </span>
                  <span className="font-medium text-slate-200">{profile.positions.title}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-400">Trạng thái:</span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isRejected
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {isRejected ? 'Bị từ chối' : 'Chờ xét duyệt'}
                </span>
              </div>
            </div>
          )
        )}

        {/* Rejection action: edit profile button */}
        {isRejected && !isEditing && (
          <div className="mt-4">
            <Button
              size="sm"
              onClick={() => setIsEditing(true)}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 rounded-xl shadow-md transition-colors"
              data-testid="btn-reapply"
            >
              <Edit3 className="h-4 w-4" />
              <span>Chỉnh sửa hồ sơ & Gửi lại xét duyệt</span>
            </Button>
          </div>
        )}

        {/* Guidance Info */}
        <p className="mt-4 text-center text-[11px] text-slate-400 leading-normal">
          Sau khi Quản trị viên/HR hoàn thiện kiểm tra thông tin và phân quyền chính thức, bạn sẽ có
          thể đăng nhập và làm việc bình thường.
        </p>

        {/* Bottom Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshUser()}
            className="flex-1 flex items-center justify-center gap-1.5 border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Kiểm tra lại</span>
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => signOut()}
            className="flex-1 flex items-center justify-center gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Đăng xuất</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
