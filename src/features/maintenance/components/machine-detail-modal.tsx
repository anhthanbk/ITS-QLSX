import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Cpu,
  Zap,
  Calendar,
  Layers,
  MapPin,
  Building2,
  Wrench,
  ClipboardList,
  Edit,
  GitCommit,
  Plus,
  ArrowRight,
  CheckCircle,
  Edit2,
  Trash2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Camera,
  Maximize2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/features/auth/hooks/use-permissions';
import type { Machine, MachineAdjustment } from '../types';
import { MachineStatusBadge } from './maintenance-badges';
import { useMaintenancePlans } from '../hooks/use-maintenance-plans';
import { useWorkOrders } from '../hooks/use-work-orders';
import {
  useMachineAdjustments,
  useDeleteMachineAdjustment,
} from '../hooks/use-machine-adjustments';
import {
  useMachinePatrolIncidents,
  useUpdateIncidentResolutionPhoto,
} from '@/features/production/hooks/use-production-patrols';
import { uploadIncidentPhoto } from '@/features/production/api/production-patrol-api';
import { MachineAdjustmentDialog } from './machine-adjustment-dialog';
import { MachineAdjustmentDeleteDialog } from './machine-adjustment-delete-dialog';

export interface MachineDetailModalProps {
  machine: Machine | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (machine: Machine) => void;
  canManage: boolean;
  initialTab?: 'info' | 'adjustments' | 'plans' | 'orders';
}

export const MachineDetailModal: React.FC<MachineDetailModalProps> = ({
  machine,
  isOpen,
  onClose,
  onEdit,
  canManage,
  initialTab = 'info',
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'adjustments' | 'plans' | 'orders'>(
    initialTab,
  );
  const [orderView, setOrderView] = useState<'patrol_incidents' | 'work_orders'>('patrol_incidents');
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [editingAdjustment, setEditingAdjustment] = useState<MachineAdjustment | null>(null);
  const [deletingAdjustment, setDeletingAdjustment] = useState<MachineAdjustment | null>(null);

  // Lightbox xem ảnh sự cố / sau khắc phục
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
  const [uploadingIncidentId, setUploadingIncidentId] = useState<string | null>(null);
  const resolutionFileInputRef = useRef<HTMLInputElement>(null);
  const [targetIncidentForPhoto, setTargetIncidentForPhoto] = useState<string | null>(null);

  const updateResolutionPhotoMutation = useUpdateIncidentResolutionPhoto();

  const handleTriggerUploadResolutionPhoto = (incidentId: string) => {
    setTargetIncidentForPhoto(incidentId);
    if (resolutionFileInputRef.current) {
      resolutionFileInputRef.current.value = '';
      resolutionFileInputRef.current.click();
    }
  };

  const handleResolutionFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetIncidentForPhoto) return;

    setUploadingIncidentId(targetIncidentForPhoto);
    try {
      const publicUrl = await uploadIncidentPhoto(file, 'resolution');
      await updateResolutionPhotoMutation.mutateAsync({
        incidentId: targetIncidentForPhoto,
        resolutionImageUrl: publicUrl,
      });
    } catch (err) {
      console.error('Failed to update resolution photo:', err);
      alert(err instanceof Error ? err.message : 'Tải ảnh sau khắc phục thất bại.');
    } finally {
      setUploadingIncidentId(null);
      setTargetIncidentForPhoto(null);
    }
  };

  const { isAdmin, hasRole } = usePermissions();
  const canAdminEditDelete = isAdmin || hasRole('admin');

  const { mutateAsync: deleteAdjustment, isPending: isDeletingAdj } =
    useDeleteMachineAdjustment();

  const handleConfirmDeleteAdj = async () => {
    if (!deletingAdjustment) return;
    await deleteAdjustment(deletingAdjustment.id);
    setDeletingAdjustment(null);
  };

  useEffect(() => {
    if (isOpen) {
      setActiveSubTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const { data: plansData } = useMaintenancePlans({
    machineId: machine?.id,
    page: 1,
    pageSize: 10,
  });

  const { data: ordersData } = useWorkOrders({
    machineId: machine?.id,
    page: 1,
    pageSize: 10,
  });

  const { data: adjustmentsData } = useMachineAdjustments({
    machineId: machine?.id || '',
    page: 1,
    pageSize: 50,
  });

  const { data: patrolIncidents = [] } = useMachinePatrolIncidents(machine?.id);

  if (!isOpen || !machine) return null;

  const plans = plansData?.data ?? [];
  const orders = ordersData?.data ?? [];
  const adjustments = adjustmentsData?.data ?? [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="machine-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in-50 zoom-in-95">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                  {machine.machine_code}
                </span>
                <MachineStatusBadge status={machine.status} />
              </div>
              <h2 id="machine-detail-title" className="text-base font-bold text-foreground mt-0.5">
                {machine.name}
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
                  onEdit(machine);
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

        {/* Sub-tab navigation */}
        <div className="flex border-b border-border bg-muted/20 px-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('info')}
            className={`border-b-2 py-3 px-3 text-xs font-semibold whitespace-nowrap transition-colors ${
              activeSubTab === 'info'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Thông số kỹ thuật
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('adjustments')}
            className={`border-b-2 py-3 px-3 text-xs font-semibold whitespace-nowrap transition-colors ${
              activeSubTab === 'adjustments'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Điều chỉnh, cải tiến ({adjustments.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('plans')}
            className={`border-b-2 py-3 px-3 text-xs font-semibold whitespace-nowrap transition-colors ${
              activeSubTab === 'plans'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Kế hoạch bảo dưỡng định kỳ ({plans.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('orders')}
            className={`border-b-2 py-3 px-3 text-xs font-semibold whitespace-nowrap transition-colors ${
              activeSubTab === 'orders'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Lịch sử sửa chữa & Sự cố ({orders.length + patrolIncidents.length})
          </button>
        </div>

        {/* Body content */}
        <div className="p-6">
          {activeSubTab === 'info' && (
            <div className="space-y-6">
              {/* Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="rounded-xl border border-border/80 bg-accent/20 p-3.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Layers className="h-3.5 w-3.5" />
                    <span>Dây chuyền sản xuất</span>
                  </div>
                  <div className="text-xs font-semibold text-foreground">
                    {machine.production_lines?.name || 'Chưa gán'}
                  </div>
                  {machine.production_lines?.code && (
                    <div className="text-[11px] text-muted-foreground font-mono">
                      Mã: {machine.production_lines.code}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-border/80 bg-accent/20 p-3.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>Bộ phận quản lý</span>
                  </div>
                  <div className="text-xs font-semibold text-foreground">
                    {machine.departments?.name || 'Chưa gán'}
                  </div>
                </div>

                <div className="rounded-xl border border-border/80 bg-accent/20 p-3.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>Vị trí lắp đặt</span>
                  </div>
                  <div className="text-xs font-semibold text-foreground">
                    {machine.line_location || 'Chưa xác định'}
                  </div>
                </div>

                <div className="rounded-xl border border-border/80 bg-accent/20 p-3.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    <span>Công suất điện</span>
                  </div>
                  <div className="text-xs font-semibold text-foreground">
                    {machine.power_rating_kw ? `${machine.power_rating_kw} kW` : '—'}
                  </div>
                </div>

                <div className="rounded-xl border border-border/80 bg-accent/20 p-3.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Cpu className="h-3.5 w-3.5" />
                    <span>Công suất định mức</span>
                  </div>
                  <div className="text-xs font-semibold text-foreground">
                    {machine.rated_capacity_per_hour
                      ? `${machine.rated_capacity_per_hour} tấn/giờ`
                      : '—'}
                  </div>
                </div>

                <div className="rounded-xl border border-border/80 bg-accent/20 p-3.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Ngày đưa vào sử dụng</span>
                  </div>
                  <div className="text-xs font-semibold text-foreground">
                    {machine.installation_date || '—'}
                  </div>
                </div>
              </div>

              {/* Hardware Identifiers */}
              <div className="rounded-xl border border-border p-4 bg-muted/10 space-y-2">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Định danh phần cứng
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Model máy: </span>
                    <span className="font-semibold text-foreground">{machine.model || '—'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Số Serial (S/N): </span>
                    <span className="font-mono font-semibold text-foreground">
                      {machine.serial_number || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Thông số kỹ thuật khác (Thông số phụ) */}
              <div className="rounded-xl border border-border p-4 bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Thông số kỹ thuật khác (Thông số phụ)
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Các thông số phụ chi tiết như tốc độ băng tải, kích thước, vật liệu...
                    </p>
                  </div>
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onClose();
                        onEdit(machine);
                      }}
                      className="h-7 text-xs text-primary gap-1"
                    >
                      <Edit className="h-3 w-3" />
                      <span>Sửa thông số</span>
                    </Button>
                  )}
                </div>

                {machine.extra_specs && Object.keys(machine.extra_specs).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                    {Object.entries(machine.extra_specs).map(([key, value]) => (
                      <div
                        key={key}
                        className="rounded-lg border border-border/80 bg-accent/15 p-3 text-xs"
                      >
                        <div className="text-[11px] text-muted-foreground font-medium">{key}</div>
                        <div className="text-xs font-bold text-foreground font-mono mt-0.5">
                          {String(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-muted-foreground italic py-2 rounded-lg border border-dashed border-border text-center bg-muted/10">
                    Chưa có thông số phụ nào được ghi nhận cho thiết bị này.
                  </div>
                )}
              </div>
            </div>
          )}


          {activeSubTab === 'adjustments' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Lịch sử điều chỉnh & cải tiến thiết bị
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Theo dõi tình trạng vận hành, nội dung cải tiến, kết quả nghiệm thu và thay đổi thông số.
                  </p>
                </div>
                {canManage && (
                  <Button
                    size="sm"
                    onClick={() => setIsAdjustmentOpen(true)}
                    className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Thêm điều chỉnh / cải tiến</span>
                  </Button>
                )}
              </div>

              {adjustments.length === 0 ? (
                <div className="text-center py-10 text-xs text-muted-foreground border border-dashed border-border rounded-xl bg-card">
                  <GitCommit className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="font-semibold text-foreground">Chưa có lịch sử điều chỉnh nào</p>
                  <p className="text-[11px] mt-1 text-muted-foreground">
                    Ghi nhận tình trạng trước cải tiến, giải pháp kỹ thuật và kết quả sau điều chỉnh.
                  </p>
                  {canManage && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAdjustmentOpen(true)}
                      className="mt-3 text-xs gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Ghi nhận điều chỉnh đầu tiên</span>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {adjustments.map((adj) => (
                    <div
                      key={adj.id}
                      className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs hover:border-primary/40 transition-colors"
                    >
                      {/* Header row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            {adj.performed_at}
                          </span>
                          {adj.profiles?.full_name && (
                            <span className="text-[11px] text-muted-foreground">
                              • Kỹ thuật viên: <strong className="text-foreground">{adj.profiles.full_name}</strong>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {adj.applied_to_machine && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              <CheckCircle className="h-3 w-3" />
                              Đã cập nhật vào hồ sơ
                            </span>
                          )}
                          <div className="flex items-center gap-1.5 text-xs">
                            <MachineStatusBadge status={adj.status_before} />
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <MachineStatusBadge status={adj.status_after} />
                          </div>

                          {canAdminEditDelete && (
                            <div className="flex items-center gap-1 ml-2 border-l border-border/80 pl-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingAdjustment(adj)}
                                className="h-6 px-1.5 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                                title="Sửa cải tiến thiết bị"
                              >
                                <Edit2 className="h-3 w-3 text-primary" />
                                <span>Sửa</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeletingAdjustment(adj)}
                                className="h-6 px-1.5 text-[11px] gap-1 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                                title="Xóa cải tiến thiết bị"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Xóa</span>
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Operating condition */}
                      {adj.operating_condition_before && (
                        <div className="text-xs rounded-md bg-muted/20 p-2.5">
                          <span className="text-muted-foreground font-semibold">Tình trạng trước điều chỉnh: </span>
                          <span className="text-foreground">{adj.operating_condition_before}</span>
                        </div>
                      )}

                      {/* Content & Result */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="rounded-lg border border-border/80 bg-accent/15 p-3 space-y-1">
                          <div className="font-bold text-foreground flex items-center gap-1.5">
                            <Wrench className="h-3.5 w-3.5 text-primary" />
                            Nội dung điều chỉnh, cải tiến
                          </div>
                          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                            {adj.improvement_content}
                          </p>
                        </div>

                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-1">
                          <div className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Kết quả sau điều chỉnh / Nghiệm thu
                          </div>
                          <p className="text-foreground leading-relaxed whitespace-pre-line">
                            {adj.result}
                          </p>
                        </div>
                      </div>

                      {/* Changed parameters */}
                      {adj.changed_params && Object.keys(adj.changed_params).length > 0 && (
                        <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
                          <div className="text-[11px] font-bold text-foreground mb-1.5">
                            Thông số kỹ thuật thay đổi:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(adj.changed_params).map(([k, v]) => (
                              <span
                                key={k}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-background border border-border text-foreground font-medium"
                              >
                                <span className="text-muted-foreground">{k}:</span>
                                <strong className="text-primary font-mono">{String(v)}</strong>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'plans' && (
            <div className="space-y-3">
              {plans.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  <Wrench className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                  Chưa có kế hoạch bảo dưỡng định kỳ nào cho thiết bị này.
                </div>
              ) : (
                <div className="divide-y divide-border rounded-xl border border-border overflow-hidden text-xs">
                  {plans.map((p) => (
                    <div key={p.id} className="p-3.5 flex items-center justify-between hover:bg-accent/20">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-foreground bg-accent/60 px-1.5 py-0.5 rounded text-[11px]">
                            {p.plan_code}
                          </span>
                          <span className="font-semibold text-foreground">{p.title}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1">
                          Chu kỳ: {p.frequency_days} ngày • Thời lượng chuẩn: {p.standard_duration_hours ?? '—'} giờ
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${p.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                          {p.is_active ? 'Đang áp dụng' : 'Tạm dừng'}
                        </span>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Tới hạn: {p.next_due_date || 'Chưa đặt'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'orders' && (
            <div className="space-y-4">
              {/* Segmented view switcher for Patrol Incidents vs Work Orders */}
              <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
                <button
                  type="button"
                  onClick={() => setOrderView('patrol_incidents')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    orderView === 'patrol_incidents'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-2xs'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent'
                  }`}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Sự cố tuần kiểm hiện trường ({patrolIncidents.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrderView('work_orders')}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    orderView === 'work_orders'
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-2xs'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent'
                  }`}
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  <span>Phiếu sửa chữa Cơ điện ({orders.length})</span>
                </button>
              </div>

              {/* View 1: Sự cố tuần kiểm hiện trường */}
              {orderView === 'patrol_incidents' && (
                <div className="space-y-3">
                  {patrolIncidents.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted-foreground rounded-xl border border-dashed border-border p-6 bg-muted/10">
                      <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-emerald-500/70" />
                      <div className="font-semibold text-foreground">Không có sự cố tuần kiểm nào</div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Các ca tuần kiểm gần đây của thiết bị này đều được xác nhận hoạt động bình thường.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {patrolIncidents.map((inc) => (
                        <div
                          key={inc.id}
                          className="rounded-xl border border-border bg-card p-4 space-y-3 text-xs shadow-2xs transition-colors hover:border-primary/30"
                        >
                          {/* Top Row: Mã sự cố, Khu vực, Thời gian & Người báo cáo */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-foreground bg-accent px-2 py-0.5 rounded border border-border">
                                {inc.incident_code}
                              </span>
                              <span className="font-medium text-muted-foreground">
                                {inc.area_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span>Công nhân: <strong className="text-foreground">{inc.reporter_name}</strong></span>
                              <span>•</span>
                              <span>{new Date(inc.reported_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                            </div>
                          </div>

                          {/* Middle Row: Hiện tượng & Nội dung chi tiết */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-foreground">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                              <span>{inc.condition_type}</span>
                            </div>
                            <p className="text-muted-foreground leading-relaxed pl-5 whitespace-pre-line">
                              {inc.description}
                            </p>
                          </div>

                          {/* Images Section: Ảnh sự cố & Ảnh sau khắc phục */}
                          {(inc.incident_image_url || inc.resolution_image_url || inc.resolution_type !== 'maintenance_scheduled') && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                              {/* Ảnh sự cố */}
                              {inc.incident_image_url ? (
                                <div className="rounded-xl border border-border bg-muted/20 p-2 space-y-1.5">
                                  <div className="flex items-center justify-between text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                                    <span className="flex items-center gap-1">
                                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                                      1. Ảnh sự cố hiện trường
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setLightboxImage({ url: inc.incident_image_url!, title: `Ảnh sự cố: ${inc.incident_code}` })}
                                      className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-[10px]"
                                    >
                                      <Maximize2 className="h-3 w-3" /> Xem lớn
                                    </button>
                                  </div>
                                  <div
                                    onClick={() => setLightboxImage({ url: inc.incident_image_url!, title: `Ảnh sự cố: ${inc.incident_code}` })}
                                    className="relative group h-28 w-full overflow-hidden rounded-lg border border-border bg-background cursor-pointer"
                                  >
                                    <img
                                      src={inc.incident_image_url}
                                      alt="Ảnh sự cố"
                                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1">
                                      <Maximize2 className="h-4 w-4" /> Phóng to
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="rounded-xl border border-dashed border-border/80 bg-muted/10 p-3 flex items-center justify-center text-center text-muted-foreground text-[11px]">
                                  Chưa có ảnh sự cố hiện trường
                                </div>
                              )}

                              {/* Ảnh sau khắc phục */}
                              {inc.resolution_image_url ? (
                                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-2 space-y-1.5">
                                  <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                    <span className="flex items-center gap-1">
                                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                      2. Ảnh sau khắc phục
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleTriggerUploadResolutionPhoto(inc.id)}
                                        disabled={uploadingIncidentId === inc.id}
                                        className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5"
                                        title="Cập nhật ảnh khác"
                                      >
                                        <Camera className="h-3 w-3" /> Đổi ảnh
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setLightboxImage({ url: inc.resolution_image_url!, title: `Ảnh sau khắc phục: ${inc.incident_code}` })}
                                        className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-[10px]"
                                      >
                                        <Maximize2 className="h-3 w-3" /> Xem lớn
                                      </button>
                                    </div>
                                  </div>
                                  <div
                                    onClick={() => setLightboxImage({ url: inc.resolution_image_url!, title: `Ảnh sau khắc phục: ${inc.incident_code}` })}
                                    className="relative group h-28 w-full overflow-hidden rounded-lg border border-border bg-background cursor-pointer"
                                  >
                                    <img
                                      src={inc.resolution_image_url}
                                      alt="Ảnh sau khắc phục"
                                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1">
                                      <Maximize2 className="h-4 w-4" /> Phóng to
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="rounded-xl border border-dashed border-border/80 bg-muted/10 p-3 flex flex-col items-center justify-center text-center gap-1.5">
                                  <span className="text-[11px] text-muted-foreground">Chưa có ảnh sau khắc phục</span>
                                  <button
                                    type="button"
                                    onClick={() => handleTriggerUploadResolutionPhoto(inc.id)}
                                    disabled={uploadingIncidentId === inc.id}
                                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                                  >
                                    {uploadingIncidentId === inc.id ? (
                                      <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        <span>Đang tải...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Camera className="h-3.5 w-3.5" />
                                        <span>+ Bổ sung ảnh sau xử lý</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Bottom Row: Cách thức xử lý & Liên kết Phiếu bảo dưỡng */}
                          <div className="pt-1">
                            {inc.resolution_type === 'resolved' && (
                              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-emerald-700 dark:text-emerald-300">
                                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                <div>
                                  <span className="font-bold">Đã xử lý tại chỗ: </span>
                                  <span className="text-muted-foreground text-[11px]">Đã được công nhân tuần kiểm tự khắc phục xong ngay trong ca làm việc.</span>
                                </div>
                              </div>
                            )}

                            {inc.resolution_type === 'temporary_fix' && (
                              <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-amber-700 dark:text-amber-300">
                                <Clock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                <div>
                                  <span className="font-bold">Xử lý tạm thời: </span>
                                  <span className="text-muted-foreground text-[11px]">Đã khắc phục tạm hoặc giảm tải để duy trì chạy máy, đang tiếp tục theo dõi sát.</span>
                                </div>
                              </div>
                            )}

                            {inc.resolution_type === 'maintenance_scheduled' && (
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2">
                                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
                                  <Wrench className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                                  <span className="font-bold">Đã đưa vào kế hoạch bảo dưỡng Cơ điện</span>
                                </div>
                                {inc.work_order_number ? (
                                  <div className="flex items-center gap-2 text-[11px]">
                                    <span className="text-muted-foreground">Phiếu sửa chữa:</span>
                                    <span className="font-mono font-bold text-foreground bg-background px-2 py-0.5 rounded border border-border">
                                      {inc.work_order_number}
                                    </span>
                                    {inc.work_order_status && (
                                      <span className="font-bold uppercase text-[10px] px-1.5 py-0.5 rounded bg-rose-200 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200">
                                        {inc.work_order_status}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-muted-foreground italic">
                                    Đang chờ phòng Cơ điện tiếp nhận lập phiếu
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* View 2: Phiếu sửa chữa Cơ điện (Work Orders) */}
              {orderView === 'work_orders' && (
                <div className="space-y-3">
                  {orders.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted-foreground rounded-xl border border-dashed border-border p-6 bg-muted/10">
                      <ClipboardList className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                      Chưa có phiếu sửa chữa nào được tạo cho thiết bị này.
                    </div>
                  ) : (
                    <div className="divide-y divide-border rounded-xl border border-border overflow-hidden text-xs">
                      {orders.map((o) => (
                        <div key={o.id} className="p-3.5 flex items-center justify-between hover:bg-accent/20">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-foreground bg-accent/60 px-1.5 py-0.5 rounded text-[11px]">
                                {o.work_order_number}
                              </span>
                              <span className="font-semibold text-foreground">{o.reported_issue}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-1">
                              Kỹ thuật viên: {o.assigned_technician ? `${o.assigned_technician.first_name} ${o.assigned_technician.last_name}` : 'Chưa gán'} • Ngày: {o.scheduled_date}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-accent text-foreground">
                              {o.status}
                            </span>
                            {o.downtime_minutes !== null && (
                              <div className="text-[11px] text-destructive mt-0.5 font-medium">
                                Dừng máy: {o.downtime_minutes} phút
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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

      {/* Machine Adjustment Dialog (Create or Edit) */}
      <MachineAdjustmentDialog
        isOpen={isAdjustmentOpen || !!editingAdjustment}
        onClose={() => {
          setIsAdjustmentOpen(false);
          setEditingAdjustment(null);
        }}
        machine={machine}
        adjustmentToEdit={editingAdjustment}
      />

      {/* Machine Adjustment Delete Dialog */}
      <MachineAdjustmentDeleteDialog
        isOpen={!!deletingAdjustment}
        adjustment={deletingAdjustment}
        onClose={() => setDeletingAdjustment(null)}
        onConfirm={handleConfirmDeleteAdj}
        isDeleting={isDeletingAdj}
      />

      {/* Hidden input to upload resolution photo */}
      <input
        ref={resolutionFileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleResolutionFileSelected}
        className="hidden"
      />

      {/* Lightbox Modal xem ảnh toàn màn hình */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative flex flex-col max-h-[92vh] max-w-4xl overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between bg-zinc-900/90 px-4 py-3 text-white border-b border-zinc-800">
              <span className="text-sm font-semibold truncate pr-4">{lightboxImage.title}</span>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="rounded-full bg-zinc-800 p-1.5 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                title="Đóng (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3 flex items-center justify-center bg-zinc-950">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="max-h-[78vh] w-auto max-w-full rounded-lg object-contain shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

