import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Hash,
  Shield,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { PendingRegistration } from '../types';
import { useDepartments } from '../hooks/use-departments';
import { usePositions } from '../hooks/use-positions';
import { useEmployees, useRoles, useApproveRegistration, useRejectRegistration } from '../hooks/use-employees';

const ROLE_DETAILS: Record<string, { desc: string; permissions: string; badgeColor: string }> = {
  admin: {
    desc: 'Toàn quyền cấu hình tham số hệ thống, quản trị tài khoản nhân viên, phân quyền và dữ liệu.',
    permissions: 'Toàn quyền Quản trị (Admin)',
    badgeColor: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
  },
  plant_manager: {
    desc: 'Duyệt kế hoạch sản xuất, giám sát OEE dây chuyền, xác nhận & khóa số liệu ca toàn nhà máy.',
    permissions: 'Lập & duyệt kế hoạch SX, khóa số liệu ca, xem dashboard OEE',
    badgeColor: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
  },
  production_lead: {
    desc: 'Lập kế hoạch phân công ca, điều hành dây chuyền, ghi nhận và xử lý sự cố dừng máy (downtime).',
    permissions: 'Điều hành ca SX, phân công nhân sự, ký xác nhận báo cáo ca',
    badgeColor: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
  },
  shift_leader: {
    desc: 'Lập kế hoạch phân công ca, điều hành dây chuyền, ghi nhận và xử lý sự cố dừng máy (downtime).',
    permissions: 'Điều hành ca SX, phân công nhân sự, ký xác nhận báo cáo ca',
    badgeColor: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
  },
  operator: {
    desc: 'Ghi nhận số đo cân/điện, cập nhật sản lượng thực tế, tiêu hao vật tư và nhật ký ca.',
    permissions: 'Nhập số liệu ca, ghi nhận downtime & sản lượng thực tế',
    badgeColor: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  },
  qc_inspector: {
    desc: 'Kiểm tra chất lượng nguyên vật liệu, thành phẩm, lập phiếu KCS và xử lý lô hàng không đạt.',
    permissions: 'Lập biên bản KCS, đánh giá chất lượng lô hàng, chặn xuất hàng lỗi',
    badgeColor: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  },
  warehouse_keeper: {
    desc: 'Quản lý tồn kho, xác nhận phiếu nhập/xuất kho nguyên vật liệu, thành phẩm và phụ phẩm.',
    permissions: 'Tạo & ký nhận phiếu xuất/nhập kho, theo dõi thẻ kho vật tư',
    badgeColor: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
  },
  maintenance_tech: {
    desc: 'Tiếp nhận phiếu sửa chữa, bảo dưỡng thiết bị máy móc, xử lý dừng máy kỹ thuật.',
    permissions: 'Tạo & cập nhật phiếu bảo trì, theo dõi lịch bảo dưỡng máy móc',
    badgeColor: 'border-orange-500/40 bg-orange-500/10 text-orange-300',
  },
  safety_officer: {
    desc: 'Giám sát an toàn lao động, kiểm tra tuân thủ HSSE và điều tra sự cố môi trường.',
    permissions: 'Giám sát an toàn HSSE, lập biên bản sự cố môi trường',
    badgeColor: 'border-teal-500/40 bg-teal-500/10 text-teal-300',
  },
  accountant: {
    desc: 'Hạch toán chi phí sản xuất, tính giá thành theo đơn/lô và kiểm soát định mức.',
    permissions: 'Hạch toán chi phí, tính giá thành sản phẩm theo lô',
    badgeColor: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300',
  },
};

function suggestRole(posCode?: string | null, posTitle?: string | null, availableRoles?: Array<{ code: string }>): string {
  const code = (posCode || '').toUpperCase();
  const title = (posTitle || '').toLowerCase();
  const validCodes = (availableRoles || []).map((r) => r.code);

  const pick = (candidates: [string, ...string[]]): string => {
    for (const c of candidates) {
      if (validCodes.length === 0 || validCodes.includes(c)) return c;
    }
    return candidates[0];
  };

  if (code.includes('QD') || code.includes('GD') || title.includes('quản đốc') || title.includes('giám đốc')) {
    return pick(['plant_manager', 'admin']);
  }
  if (code.includes('TC') || title.includes('trưởng ca') || title.includes('quản lý sản xuất')) {
    return pick(['production_lead', 'shift_leader', 'operator']);
  }
  if (code.includes('KCS') || code.includes('QC') || title.includes('kcs') || title.includes('kiểm phẩm') || title.includes('chất lượng')) {
    return pick(['qc_inspector', 'operator']);
  }
  if (code.includes('KHO') || title.includes('kho') || title.includes('vật tư')) {
    return pick(['warehouse_keeper', 'operator']);
  }
  if (code.includes('KT') || code.includes('BT') || title.includes('bảo trì') || title.includes('kỹ thuật') || title.includes('cơ điện')) {
    return pick(['maintenance_tech', 'operator']);
  }
  if (code.includes('AT') || title.includes('an toàn')) {
    return pick(['safety_officer', 'operator']);
  }
  if (code.includes('KT') || title.includes('kế toán')) {
    return pick(['accountant', 'operator']);
  }

  return 'operator';
}

export interface ApproveRegistrationModalProps {
  registration: PendingRegistration | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ApproveRegistrationModal: React.FC<ApproveRegistrationModalProps> = ({
  registration,
  isOpen,
  onClose,
}) => {
  const { data: departments } = useDepartments();
  const { data: roles } = useRoles();
  const { data: managerList } = useEmployees({ page: 1, pageSize: 100, status: 'active' });

  const approveMutation = useApproveRegistration();
  const rejectMutation = useRejectRegistration();

  // Form states
  const [employeeCode, setEmployeeCode] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [positionId, setPositionId] = useState('');
  const [roleCode, setRoleCode] = useState('operator');
  const [hireDate, setHireDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [directManagerId, setDirectManagerId] = useState('');

  // Rejection mode
  const [isRejectMode, setIsRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { data: positions } = usePositions(departmentId || undefined);

  const activeRoleMeta = ROLE_DETAILS[roleCode] || ROLE_DETAILS.operator;

  useEffect(() => {
    if (registration && isOpen) {
      setEmployeeCode(registration.temp_employee_code || '');
      setDepartmentId(registration.department_id || (departments?.[0]?.id ?? ''));
      setPositionId(registration.position_id || '');
      const suggested = suggestRole(registration.position_code, registration.position_title, roles);
      setRoleCode(suggested);
      setHireDate(new Date().toISOString().slice(0, 10));
      setDirectManagerId('');
      setIsRejectMode(false);
      setRejectReason('');
    }
  }, [registration, isOpen, departments, roles]);

  if (!isOpen || !registration) return null;

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeCode.trim()) return;

    await approveMutation.mutateAsync({
      profileId: registration.id,
      employeeCode: employeeCode.trim(),
      roleCode,
      hireDate,
      departmentId: departmentId || undefined,
      positionId: positionId || undefined,
      directManagerId: directManagerId || undefined,
    });

    onClose();
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;

    await rejectMutation.mutateAsync({
      profileId: registration.id,
      reason: rejectReason.trim(),
    });

    onClose();
  };

  const isSubmitting = approveMutation.isPending || rejectMutation.isPending;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="approve-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in-50 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/20">
          <div>
            <h2 id="approve-modal-title" className="text-base font-bold text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>Xét duyệt hồ sơ đăng ký tài khoản</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kiểm tra thông tin ứng viên, gán mã nhân viên chính thức và cấp vai trò hệ thống
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Đóng"
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Candidate Self-Registered Summary Card */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Thông tin ứng viên tự khai
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                Chờ duyệt
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* Candidate Avatar */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-border bg-card shadow-sm text-lg font-bold text-primary">
                {registration.avatar_url ? (
                  <img
                    src={registration.avatar_url}
                    alt={registration.full_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{registration.full_name.charAt(0).toUpperCase() || 'U'}</span>
                )}
              </div>

              {/* Candidate Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs flex-1 w-full">
                <div>
                  <span className="text-muted-foreground">Họ và tên:</span>{' '}
                  <span className="font-semibold text-foreground">{registration.full_name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="font-mono text-foreground truncate">{registration.email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-foreground">{registration.phone || 'Chưa cung cấp'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>Ngày sinh: <strong className="text-foreground">{registration.date_of_birth || 'Chưa có'}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>CCCD/CMND: <strong className="font-mono text-foreground">{registration.id_card_number || 'Chưa có'}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Mã dự kiến: <strong className="font-mono text-primary font-bold">{registration.temp_employee_code || '—'}</strong></span>
                </div>
                <div className="sm:col-span-2 flex items-center gap-2 pt-1 border-t border-border/50 text-[11px] text-muted-foreground">
                  <span>Nguyện vọng ứng tuyển:</span>
                  <span className="font-medium text-foreground">
                    {registration.department_name || 'Chưa chọn'} — {registration.position_title || 'Chưa chọn'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Rejection Mode View */}
          {isRejectMode ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3 animate-in fade-in-50">
              <div className="flex items-center gap-2 text-destructive font-semibold text-xs">
                <AlertTriangle className="h-4 w-4" />
                <span>Từ chối hồ sơ đăng ký</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Tài khoản sẽ được chuyển sang trạng thái từ chối. Vui lòng nhập lý do cụ thể (sai thông tin, không thuộc nhân sự, v.v.):
              </p>
              <div>
                <label htmlFor="reject_reason" className="block text-xs font-semibold text-foreground mb-1">
                  Lý do từ chối <span className="text-destructive">*</span>
                </label>
                <textarea
                  id="reject_reason"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ví dụ: Số CCCD không hợp lệ, vui lòng liên hệ phòng HCNS để xác minh..."
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-xs text-foreground focus:border-destructive focus:ring-1 focus:ring-destructive"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRejectMode(false)}
                  disabled={isSubmitting}
                >
                  Quay lại
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleReject}
                  disabled={isSubmitting || !rejectReason.trim()}
                  className="gap-1.5"
                >
                  {rejectMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  <span>Xác nhận từ chối</span>
                </Button>
              </div>
            </div>
          ) : (
            /* Approval Form */
            <form onSubmit={handleApprove} className="space-y-4">
              <div className="border-b border-border pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                  Chuẩn hóa thông tin nhân sự & Phân quyền
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Official Employee Code */}
                <div className="space-y-1">
                  <label htmlFor="modal_employee_code" className="text-xs font-semibold text-foreground">
                    Mã nhân viên chính thức <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="modal_employee_code"
                    type="text"
                    required
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                    placeholder="VD: SX-QD-001"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <span className="text-[10px] text-muted-foreground">Mặc định lấy từ mã đăng ký tự động cấp</span>
                </div>

                {/* System Role */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor="modal_role_code" className="text-xs font-semibold text-foreground">
                      Phân quyền hệ thống <span className="text-destructive">*</span>
                    </label>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      <Sparkles className="h-3 w-3" /> Gợi ý theo vị trí
                    </span>
                  </div>
                  <select
                    id="modal_role_code"
                    value={roleCode}
                    onChange={(e) => setRoleCode(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {roles && roles.length > 0 ? (
                      roles.map((r) => (
                        <option key={r.id} value={r.code}>
                          {r.name} ({r.code})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="operator">Công nhân vận hành (operator)</option>
                        <option value="shift_leader">Trưởng ca sản xuất (shift_leader)</option>
                        <option value="production_lead">Trưởng ca / Quản lý sản xuất (production_lead)</option>
                        <option value="plant_manager">Quản đốc nhà máy (plant_manager)</option>
                        <option value="qc_inspector">Kiểm phẩm KCS (qc_inspector)</option>
                        <option value="warehouse_keeper">Thủ kho vật tư (warehouse_keeper)</option>
                        <option value="maintenance_tech">Kỹ thuật bảo trì (maintenance_tech)</option>
                        <option value="safety_officer">Cán bộ HSSE (safety_officer)</option>
                        <option value="accountant">Kế toán giá thành (accountant)</option>
                        <option value="admin">Quản trị hệ thống (admin)</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Role Scope Card & Security Notice */}
                {activeRoleMeta && (
                  <div className={cn("sm:col-span-2 rounded-xl border p-3.5 space-y-1.5 transition-all", activeRoleMeta.badgeColor)}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4" />
                        Phạm vi quyền hạn vai trò: <span className="font-bold underline">{roles?.find(r => r.code === roleCode)?.name || roleCode}</span>
                      </span>
                      <span className="text-[10px] font-mono uppercase font-bold tracking-wider opacity-80">{roleCode}</span>
                    </div>
                    <p className="text-xs leading-relaxed opacity-90">
                      {activeRoleMeta.desc}
                    </p>
                    <div className="text-[11px] font-medium pt-1.5 border-t border-current/20 flex items-center gap-1.5">
                      <span className="opacity-75">Thẩm quyền chính:</span>
                      <strong>{activeRoleMeta.permissions}</strong>
                    </div>
                  </div>
                )}

                {roleCode === 'admin' && (
                  <div className="sm:col-span-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200 flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-300">Cảnh báo bảo mật quyền Admin:</span> Vai trò này có toàn quyền cấu hình, xóa dữ liệu và phân quyền hệ thống. Hãy xác nhận kỹ trước khi phê duyệt quyền Quản trị viên cho người dùng này.
                    </div>
                  </div>
                )}

                {/* Department */}
                <div className="space-y-1">
                  <label htmlFor="modal_dept_id" className="text-xs font-semibold text-foreground">
                    Phòng ban trực thuộc
                  </label>
                  <select
                    id="modal_dept_id"
                    value={departmentId}
                    onChange={(e) => {
                      setDepartmentId(e.target.value);
                      setPositionId('');
                    }}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Chọn phòng ban --</option>
                    {departments?.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Position */}
                <div className="space-y-1">
                  <label htmlFor="modal_pos_id" className="text-xs font-semibold text-foreground">
                    Vị trí / Chức danh
                  </label>
                  <select
                    id="modal_pos_id"
                    value={positionId}
                    onChange={(e) => {
                      const newPosId = e.target.value;
                      setPositionId(newPosId);
                      const selectedPos = positions?.find((p) => p.id === newPosId);
                      if (selectedPos) {
                        const suggested = suggestRole(selectedPos.code, selectedPos.title, roles);
                        setRoleCode(suggested);
                      }
                    }}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Chọn chức danh --</option>
                    {positions?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Direct Manager */}
                <div className="space-y-1">
                  <label htmlFor="modal_manager_id" className="text-xs font-semibold text-foreground">
                    Quản lý trực tiếp
                  </label>
                  <select
                    id="modal_manager_id"
                    value={directManagerId}
                    onChange={(e) => setDirectManagerId(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Không có / Tự quản lý --</option>
                    {managerList?.data?.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.last_name} {emp.first_name} ({emp.employee_code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Hire Date */}
                <div className="space-y-1">
                  <label htmlFor="modal_hire_date" className="text-xs font-semibold text-foreground">
                    Ngày bắt đầu làm việc <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="modal_hire_date"
                    type="date"
                    required
                    value={hireDate}
                    onChange={(e) => setHireDate(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRejectMode(true)}
                  disabled={isSubmitting}
                  className="text-destructive hover:bg-destructive/10 border-destructive/30"
                >
                  <XCircle className="h-4 w-4 mr-1.5" />
                  <span>Từ chối hồ sơ</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    Đóng
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting || !employeeCode.trim()}
                    className="gap-1.5"
                  >
                    {approveMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    <span>Phê duyệt & Tạo nhân viên</span>
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
