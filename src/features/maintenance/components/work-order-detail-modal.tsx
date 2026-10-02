import React, { useState } from 'react';
import {
  X,
  ClipboardList,
  User,
  Wrench,
  CheckCircle2,
  Edit,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MaintenanceWorkOrder } from '../types';
import type { WorkOrderStatusUpdateValues } from '../validation/maintenance-schemas';
import {
  WorkOrderPriorityBadge,
  WorkOrderStatusBadge,
} from './maintenance-badges';

export interface WorkOrderDetailModalProps {
  order: MaintenanceWorkOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (order: MaintenanceWorkOrder) => void;
  onStatusUpdate: (id: string, values: WorkOrderStatusUpdateValues) => Promise<void>;
  canManage: boolean;
  isUpdatingStatus: boolean;
}

export const WorkOrderDetailModal: React.FC<WorkOrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onEdit,
  onStatusUpdate,
  canManage,
  isUpdatingStatus,
}) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [rootCause, setRootCause] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [downtimeMinutes, setDowntimeMinutes] = useState<number | undefined>(undefined);
  const [laborHours, setLaborHours] = useState<number | undefined>(undefined);
  const [sparePartsCost, setSparePartsCost] = useState<number | undefined>(undefined);

  if (!isOpen || !order) return null;

  const handleStartWork = async () => {
    await onStatusUpdate(order.id, { status: 'in_progress' });
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onStatusUpdate(order.id, {
      status: 'completed',
      root_cause: rootCause || order.root_cause,
      resolution_summary: resolutionSummary || order.resolution_summary,
      downtime_minutes: downtimeMinutes ?? order.downtime_minutes,
      labor_hours: laborHours ?? order.labor_hours,
      spare_parts_cost: sparePartsCost ?? order.spare_parts_cost,
    });
    setIsCompleting(false);
  };

  const handleCancelOrder = async () => {
    if (confirm('Bạn có chắc chắn muốn hủy phiếu sửa chữa này?')) {
      await onStatusUpdate(order.id, { status: 'cancelled' });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in-50 zoom-in-95">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-foreground bg-accent px-2 py-0.5 rounded border border-border">
                  {order.work_order_number}
                </span>
                <WorkOrderStatusBadge status={order.status} />
                <WorkOrderPriorityBadge priority={order.priority} />
              </div>
              <h2 id="order-detail-title" className="text-sm font-bold text-foreground mt-0.5">
                {order.reported_issue}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canManage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(order);
                }}
                className="gap-1.5 text-xs"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Chỉnh sửa</span>
              </Button>
            )}
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
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Main Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl border border-border/80 bg-accent/20 p-3.5 space-y-1">
              <span className="text-muted-foreground">Thiết bị bảo trì:</span>
              <div className="font-bold text-foreground">
                {order.machines?.machine_code} - {order.machines?.name}
              </div>
              {order.machines?.line_location && (
                <div className="text-[11px] text-muted-foreground">
                  Vị trí: {order.machines.line_location}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-border/80 bg-accent/20 p-3.5 space-y-1">
              <span className="text-muted-foreground">Kỹ thuật viên phụ trách:</span>
              <div className="font-bold text-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" />
                <span>
                  {order.assigned_technician
                    ? `${order.assigned_technician.first_name} ${order.assigned_technician.last_name} (${order.assigned_technician.employee_code})`
                    : 'Chưa phân công'}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Ngày dự kiến: <span className="font-semibold text-foreground">{order.scheduled_date}</span>
              </div>
            </div>
          </div>

          {/* Issue & Resolution Section */}
          <div className="space-y-4 rounded-xl border border-border p-4 bg-muted/10 text-xs">
            <div>
              <span className="font-bold text-foreground">Nội dung / Hiện tượng hư hỏng:</span>
              <p className="mt-1 text-muted-foreground leading-relaxed bg-background/80 p-3 rounded-lg border border-border/50">
                {order.reported_issue}
              </p>
            </div>

            {order.root_cause && (
              <div>
                <span className="font-bold text-foreground">Nguyên nhân gốc rễ:</span>
                <p className="mt-1 text-muted-foreground leading-relaxed bg-background/80 p-3 rounded-lg border border-border/50">
                  {order.root_cause}
                </p>
              </div>
            )}

            {order.resolution_summary && (
              <div>
                <span className="font-bold text-foreground">Biện pháp xử lý & kết quả nghiệm thu:</span>
                <p className="mt-1 text-muted-foreground leading-relaxed bg-background/80 p-3 rounded-lg border border-border/50">
                  {order.resolution_summary}
                </p>
              </div>
            )}
          </div>

          {/* Downtime & Cost Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <span className="text-[11px] text-muted-foreground">Thời gian dừng máy</span>
              <div className="text-lg font-bold text-destructive mt-1">
                {order.downtime_minutes ? `${order.downtime_minutes} ph` : '0 ph'}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <span className="text-[11px] text-muted-foreground">Giờ công kỹ thuật</span>
              <div className="text-lg font-bold text-foreground mt-1">
                {order.labor_hours ? `${order.labor_hours} h` : '—'}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3 text-center">
              <span className="text-[11px] text-muted-foreground">Chi phí linh kiện</span>
              <div className="text-lg font-bold text-foreground mt-1">
                {order.spare_parts_cost
                  ? new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(order.spare_parts_cost)
                  : '0 đ'}
              </div>
            </div>
          </div>

          {/* Workflow Action Bar */}
          {canManage && (
            <div className="border-t border-border pt-4">
              <h4 className="text-xs font-bold text-foreground mb-3">Thao tác quy trình</h4>

              {!isCompleting ? (
                <div className="flex flex-wrap items-center gap-2">
                  {order.status === 'open' && (
                    <Button
                      size="sm"
                      onClick={handleStartWork}
                      disabled={isUpdatingStatus}
                      className="gap-1.5 bg-amber-600 text-white hover:bg-amber-700 text-xs"
                    >
                      {isUpdatingStatus ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Wrench className="h-3.5 w-3.5" />
                      )}
                      <span>Bắt đầu sửa chữa</span>
                    </Button>
                  )}

                  {order.status === 'in_progress' && (
                    <Button
                      size="sm"
                      onClick={() => setIsCompleting(true)}
                      className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 text-xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Nghiệm thu hoàn thành</span>
                    </Button>
                  )}

                  {order.status !== 'cancelled' && order.status !== 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelOrder}
                      disabled={isUpdatingStatus}
                      className="text-destructive hover:bg-destructive/10 text-xs"
                    >
                      Hủy phiếu
                    </Button>
                  )}
                </div>
              ) : (
                /* Completion Form inline */
                <form
                  onSubmit={handleCompleteSubmit}
                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3 animate-in fade-in-50"
                >
                  <h5 className="text-xs font-bold text-foreground">
                    Xác nhận hoàn thành sửa chữa & Nghiệm thu
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-foreground">Dừng máy (phút)</label>
                      <input
                        type="number"
                        placeholder="VD: 30"
                        defaultValue={order.downtime_minutes || ''}
                        onChange={(e) => setDowntimeMinutes(Number(e.target.value))}
                        className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-foreground">Giờ công (h)</label>
                      <input
                        type="number"
                        step="0.5"
                        placeholder="VD: 2"
                        defaultValue={order.labor_hours || ''}
                        onChange={(e) => setLaborHours(Number(e.target.value))}
                        className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-foreground">Chi phí phụ tùng (đ)</label>
                      <input
                        type="number"
                        placeholder="VD: 500000"
                        defaultValue={order.spare_parts_cost || ''}
                        onChange={(e) => setSparePartsCost(Number(e.target.value))}
                        className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-foreground">Nguyên nhân gốc rễ</label>
                    <input
                      type="text"
                      placeholder="VD: Vòng bi bị kẹt do thiếu mỡ bôi trơn"
                      defaultValue={order.root_cause || ''}
                      onChange={(e) => setRootCause(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-foreground">Biện pháp xử lý & kết quả</label>
                    <textarea
                      rows={2}
                      placeholder="Mô tả các thao tác kỹ thuật đã xử lý..."
                      defaultValue={order.resolution_summary || ''}
                      onChange={(e) => setResolutionSummary(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCompleting(false)}
                      className="text-xs"
                    >
                      Quay lại
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isUpdatingStatus}
                      className="bg-emerald-600 text-white hover:bg-emerald-700 text-xs"
                    >
                      {isUpdatingStatus && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                      Xác nhận hoàn tất
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-border px-6 py-3 bg-muted/10">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};
