import React, { useState } from 'react';
import {
  UserCheck,
  Search,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePendingRegistrations, useDeleteRegistrationProfile } from '../hooks/use-employees';
import { ApproveRegistrationModal } from './approve-registration-modal';
import type { PendingRegistration } from '../types';

export const PendingRegistrationsTab: React.FC = () => {
  const { data: registrations, isLoading, isError, refetch } = usePendingRegistrations();
  const deleteRegMutation = useDeleteRegistrationProfile();
  const [selectedReg, setSelectedReg] = useState<PendingRegistration | null>(null);
  const [deletingReg, setDeletingReg] = useState<PendingRegistration | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRegistrations = (registrations || []).filter((reg) => {
    const term = searchTerm.toLowerCase();
    const matchesName = reg.full_name.toLowerCase().includes(term);
    const matchesEmail = reg.email.toLowerCase().includes(term);
    const matchesCode = reg.temp_employee_code?.toLowerCase().includes(term);
    const matchesPhone = reg.phone?.toLowerCase().includes(term);
    return matchesName || matchesEmail || matchesCode || matchesPhone;
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-4 animate-pulse">
          <div className="h-10 bg-accent/40 rounded-lg" />
          <div className="h-12 bg-accent/30 rounded-lg" />
          <div className="h-12 bg-accent/30 rounded-lg" />
          <div className="h-12 bg-accent/30 rounded-lg" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <h3 className="mt-2 text-sm font-semibold text-foreground">Không thể tải danh sách chờ duyệt</h3>
        <p className="mt-1 text-xs text-muted-foreground">Đã xảy ra lỗi khi truy vấn hồ sơ đăng ký từ hệ thống.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo họ tên, email, CCCD, mã đăng ký..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs gap-1.5"
            title="Làm mới danh sách"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* Table Content */}
      {filteredRegistrations.length === 0 ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <UserCheck className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-foreground">Không có hồ sơ nào đang chờ duyệt</h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            {searchTerm
              ? 'Không tìm thấy hồ sơ đăng ký nào khớp với từ khóa tìm kiếm.'
              : 'Tất cả các tài khoản tự đăng ký đã được ban quản trị xét duyệt hoặc không có đơn đăng ký mới.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" id="pending-registrations-table">
              <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                <tr>
                  <th className="py-3.5 pl-4 pr-3 sm:pl-6">Mã đăng ký</th>
                  <th className="px-3 py-3.5">Ứng viên & Email</th>
                  <th className="px-3 py-3.5">Ngày sinh / CCCD</th>
                  <th className="px-3 py-3.5">Số điện thoại</th>
                  <th className="px-3 py-3.5">Bộ phận dự tuyển</th>
                  <th className="px-3 py-3.5">Thời gian gửi</th>
                  <th className="px-3 py-3.5">Trạng thái</th>
                  <th className="py-3.5 pl-3 pr-4 sm:pr-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRegistrations.map((reg) => (
                  <tr
                    key={reg.id}
                    className="transition-colors hover:bg-muted/30"
                    data-testid={`pending-row-${reg.temp_employee_code || reg.id}`}
                  >
                    {/* Temp Code */}
                    <td className="py-3.5 pl-4 pr-3 font-mono font-bold text-primary sm:pl-6">
                      {reg.temp_employee_code || 'Chưa cấp'}
                    </td>

                    {/* Candidate Name & Email with Avatar */}
                    <td className="px-3 py-3.5 font-medium text-foreground">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-bold text-primary border border-border">
                          {reg.avatar_url ? (
                            <img src={reg.avatar_url} alt={reg.full_name} className="h-full w-full object-cover" />
                          ) : (
                            reg.full_name.charAt(0).toUpperCase() || 'U'
                          )}
                        </div>
                        <div>
                          <div>{reg.full_name}</div>
                          <div className="text-[11px] font-mono text-muted-foreground">{reg.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* DOB & ID Card */}
                    <td className="px-3 py-3.5 text-muted-foreground">
                      <div>{reg.date_of_birth ? `NS: ${reg.date_of_birth}` : '—'}</div>
                      <div className="text-[11px] font-mono text-muted-foreground/80">
                        {reg.id_card_number ? `CCCD: ${reg.id_card_number}` : ''}
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-3 py-3.5 text-muted-foreground font-mono">
                      {reg.phone || '—'}
                    </td>

                    {/* Department & Position */}
                    <td className="px-3 py-3.5">
                      <div className="font-medium text-foreground">
                        {reg.department_name || 'Chưa chọn'}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {reg.position_title || 'Chưa chọn'}
                      </div>
                    </td>

                    {/* Registration Date */}
                    <td className="px-3 py-3.5 text-muted-foreground font-mono">
                      {reg.created_at ? new Date(reg.created_at).toLocaleDateString('vi-VN') : '—'}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3.5">
                      {reg.status === 'rejected' ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-500 border border-rose-500/20">
                            <ShieldAlert className="h-3 w-3" />
                            Bị từ chối
                          </span>
                          {reg.rejection_reason && (
                            <p className="text-[10px] text-rose-400 max-w-[130px] truncate" title={reg.rejection_reason}>
                              {reg.rejection_reason}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500 border border-amber-500/20">
                          <Clock className="h-3 w-3" />
                          Chờ duyệt
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 pl-3 pr-4 sm:pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => setSelectedReg(reg)}
                          className="text-xs gap-1.5 h-8 font-semibold"
                          data-testid={`btn-review-${reg.temp_employee_code || reg.id}`}
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>{reg.status === 'rejected' ? 'Xem lại' : 'Xem & Duyệt'}</span>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeletingReg(reg)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Xóa vĩnh viễn hồ sơ và tài khoản này"
                          data-testid={`btn-delete-reg-${reg.temp_employee_code || reg.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review & Approve Modal */}
      <ApproveRegistrationModal
        isOpen={!!selectedReg}
        registration={selectedReg}
        onClose={() => setSelectedReg(null)}
      />

      {/* Delete Confirmation Modal */}
      {deletingReg && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeletingReg(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center gap-2 text-destructive font-bold text-sm">
              <Trash2 className="h-5 w-5" />
              <span>Xóa vĩnh viễn hồ sơ đăng ký</span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              Bạn có chắc chắn muốn xóa hồ sơ đăng ký của{' '}
              <strong className="text-foreground">{deletingReg.full_name}</strong> (
              <span className="font-mono text-foreground">{deletingReg.email}</span>)?
            </p>
            <div className="mt-2 rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-[11px] text-destructive leading-normal">
              Tài khoản đăng nhập sẽ bị xóa hoàn toàn khỏi hệ thống Supabase Auth và giải phóng email để người này có thể đăng ký lại nếu muốn.
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingReg(null)}
                disabled={deleteRegMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  await deleteRegMutation.mutateAsync(deletingReg.id);
                  setDeletingReg(null);
                }}
                disabled={deleteRegMutation.isPending}
              >
                {deleteRegMutation.isPending ? 'Đang xóa...' : 'Xác nhận xóa'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

