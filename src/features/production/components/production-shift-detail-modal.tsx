import React, { useState } from 'react';
import {
  X,
  Clock,
  Gauge,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import type { ProductionShift } from '../types';
import { useProductionShiftDetail } from '../hooks/use-production-shifts';
import { ShiftStatusBadge } from './production-status-badge';
import { ProductionShiftDowntimeDialog } from './production-shift-downtime-dialog';
import { ProductionShiftMeterDialog } from './production-shift-meter-dialog';
import { ProductionShiftLogDialog } from './production-shift-log-dialog';
import {
  useCreateShiftDowntime,
  useCreateShiftMeterReading,
  useCreateShiftLog,
} from '../hooks/use-production-shifts';
import { cn } from '@/lib/utils';

interface ProductionShiftDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: ProductionShift | null;
  onVerify?: (shift: ProductionShift) => void;
  canVerify?: boolean;
  canManage?: boolean;
}

type ShiftDetailTab = 'summary' | 'meters' | 'downtime' | 'logs';

export const ProductionShiftDetailModal: React.FC<ProductionShiftDetailModalProps> = ({
  isOpen,
  onClose,
  shift,
  onVerify,
  canVerify,
  canManage,
}) => {
  const [activeTab, setActiveTab] = useState<ShiftDetailTab>('summary');
  const [isDowntimeOpen, setIsDowntimeOpen] = useState(false);
  const [isMeterOpen, setIsMeterOpen] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);

  const { data: detailData, isLoading } = useProductionShiftDetail(shift ? shift.id : null);
  const createDowntimeMutation = useCreateShiftDowntime();
  const createMeterMutation = useCreateShiftMeterReading();
  const createLogMutation = useCreateShiftLog();

  if (!isOpen || !shift) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground">{shift.shift_code}</h2>
                  <ShiftStatusBadge status={shift.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Ngày {shift.shift_date} • Ca {shift.shift_number} • {shift.line_name} (
                  {shift.line_code}) • Vận hành: {shift.operator_name || '---'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Sub-tabs Header */}
          <div className="mt-4 flex items-center gap-2 border-b border-border">
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={cn(
                'flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors',
                activeTab === 'summary'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              Tổng quan sản lượng ca
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('meters')}
              className={cn(
                'flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors',
                activeTab === 'meters'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Gauge className="h-3.5 w-3.5" />
              Đồng hồ đo & Cân ({detailData?.meters.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('downtime')}
              className={cn(
                'flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors',
                activeTab === 'downtime'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Sự cố dừng máy ({detailData?.downtimes.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={cn(
                'flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors',
                activeTab === 'logs'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Nhật ký vận hành ({detailData?.logs.length || 0})
            </button>
          </div>

          {/* Sub-tab Content */}
          <div className="mt-4">
            {/* 1. Summary Tab */}
            {activeTab === 'summary' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <span className="text-[11px] text-muted-foreground">Giờ chạy máy thực</span>
                    <div className="mt-1 text-base font-bold text-primary">
                      {shift.running_hours ?? shift.standard_shift_hours - shift.total_downtime_hours}
                      h / {shift.standard_shift_hours}h
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <span className="text-[11px] text-muted-foreground">Thời gian dừng chuyền</span>
                    <div className="mt-1 text-base font-bold text-rose-500">
                      {shift.total_downtime_hours} giờ
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <span className="text-[11px] text-muted-foreground">Công suất vận hành</span>
                    <div className="mt-1 text-base font-bold text-foreground">
                      {shift.actual_capacity_tph ?? '---'} TPH
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <span className="text-[11px] text-muted-foreground">Tỷ lệ thu hồi cát</span>
                    <div className="mt-1 text-base font-bold text-emerald-600 dark:text-emerald-400">
                      {shift.actual_recovery_rate_pct}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border p-3">
                    <span className="text-xs text-muted-foreground">Quặng cấp vào (Tấn):</span>
                    <p className="mt-1 text-lg font-bold text-foreground">
                      {shift.raw_material_input_tons.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <span className="text-xs text-muted-foreground">Thành phẩm thu hồi (Tấn):</span>
                    <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {shift.product_output_tons.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <span className="text-xs text-muted-foreground">Phụ phẩm thu hồi (Tấn):</span>
                    <p className="mt-1 text-lg font-bold text-foreground">
                      {shift.byproduct_output_tons.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* 1.1 Chi tiết thành phẩm sản xuất trong ca */}
                {shift.products_output && shift.products_output.length > 0 && (
                  <div className="space-y-2 rounded-lg border border-border p-3">
                    <h3 className="text-xs font-semibold text-foreground">
                      Danh mục thành phẩm thu hồi ({shift.products_output.length})
                    </h3>
                    <div className="overflow-x-auto rounded border border-border">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-muted/40 text-muted-foreground">
                          <tr>
                            <th className="px-3 py-1.5">Mã SP</th>
                            <th className="px-3 py-1.5">Tên sản phẩm</th>
                            <th className="px-3 py-1.5 text-center">Phân loại</th>
                            <th className="px-3 py-1.5 text-right">Sản lượng (Tấn)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {shift.products_output.map((p, idx) => (
                            <tr key={idx} className="hover:bg-muted/20">
                              <td className="px-3 py-1.5 font-mono text-primary font-medium">
                                {p.product_sku || '---'}
                              </td>
                              <td className="px-3 py-1.5 font-medium">{p.product_name}</td>
                              <td className="px-3 py-1.5 text-center">
                                {p.is_out_of_plan ? (
                                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                    Ngoài KH
                                  </span>
                                ) : (
                                  <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                                    Trong KH
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-1.5 text-right font-bold text-foreground">
                                {Number(p.quantity_tons).toLocaleString()} {p.unit_of_measure}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 1.2 Tiêu hao nguyên nhiên liệu & năng lượng */}
                {shift.materials_consumption && shift.materials_consumption.length > 0 && (
                  <div className="space-y-2 rounded-lg border border-border p-3">
                    <h3 className="text-xs font-semibold text-foreground">
                      Tiêu hao nguyên nhiên liệu & năng lượng trong ca ({shift.materials_consumption.length})
                    </h3>
                    <div className="overflow-x-auto rounded border border-border">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-muted/40 text-muted-foreground">
                          <tr>
                            <th className="px-3 py-1.5">Loại</th>
                            <th className="px-3 py-1.5">Tên vật tư / Năng lượng</th>
                            <th className="px-3 py-1.5 text-right">Lượng tiêu hao</th>
                            <th className="px-3 py-1.5">ĐVT</th>
                            <th className="px-3 py-1.5 text-right">KH tháng</th>
                            <th className="px-3 py-1.5">Ghi chú</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {shift.materials_consumption.map((m, idx) => (
                            <tr key={idx} className="hover:bg-muted/20">
                              <td className="px-3 py-1.5">
                                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                  {m.category === 'fuel'
                                    ? 'Nhiên liệu / Năng lượng'
                                    : m.category === 'supply'
                                      ? 'Vật tư phụ'
                                      : 'Nguyên vật liệu'}
                                </span>
                              </td>
                              <td className="px-3 py-1.5 font-medium">{m.resource_name}</td>
                              <td className="px-3 py-1.5 text-right font-bold text-foreground">
                                {Number(m.actual_quantity).toLocaleString()}
                              </td>
                              <td className="px-3 py-1.5 text-muted-foreground">{m.unit_of_measure}</td>
                              <td className="px-3 py-1.5 text-right text-muted-foreground">
                                {m.planned_norm ? Number(m.planned_norm).toLocaleString() : '---'}
                              </td>
                              <td className="px-3 py-1.5 text-muted-foreground">{m.notes || '---'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 1.3 Phân loại dừng chuyền & khắc phục */}
                {shift.downtime_breakdown && (
                  <div className="space-y-3 rounded-lg border border-border p-3">
                    <h3 className="text-xs font-semibold text-foreground">
                      Chi tiết dừng chuyền & Biện pháp khắc phục (Tổng: {shift.total_downtime_hours}h)
                    </h3>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                      {/* Bảo trì */}
                      <div className="rounded border border-amber-200 bg-amber-50/50 p-2.5 text-xs dark:border-amber-900/50 dark:bg-amber-950/20">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-amber-900 dark:text-amber-300">
                            Dừng bảo trì
                          </span>
                          <span className="font-bold text-amber-700 dark:text-amber-400">
                            {shift.downtime_breakdown.maintenance_hours || 0} giờ
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {shift.downtime_breakdown.maintenance_note || 'Không có dừng bảo trì'}
                        </p>
                      </div>

                      {/* Sự cố */}
                      <div className="rounded border border-rose-200 bg-rose-50/50 p-2.5 text-xs dark:border-rose-900/50 dark:bg-rose-950/20">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-rose-900 dark:text-rose-300">
                            Dừng sự cố
                          </span>
                          <span className="font-bold text-rose-700 dark:text-rose-400">
                            {shift.downtime_breakdown.incident_hours || 0} giờ
                          </span>
                        </div>
                        {shift.downtime_breakdown.incident_category && (
                          <span className="mt-1 inline-block rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800 dark:bg-rose-900/60 dark:text-rose-200">
                            Loại: {shift.downtime_breakdown.incident_category}
                          </span>
                        )}
                        <p className="mt-1 text-[11px] text-foreground font-medium">
                          {shift.downtime_breakdown.incident_reason || 'Không có sự cố'}
                        </p>
                        {shift.downtime_breakdown.incident_action && (
                          <div className="mt-1.5 border-t border-rose-200/60 pt-1 text-[11px] text-rose-700 dark:border-rose-800/60 dark:text-rose-300">
                            <span className="font-semibold">Khắc phục: </span>
                            {shift.downtime_breakdown.incident_action}
                          </div>
                        )}
                      </div>

                      {/* Nghỉ kế hoạch */}
                      <div className="rounded border border-blue-200 bg-blue-50/50 p-2.5 text-xs dark:border-blue-900/50 dark:bg-blue-950/20">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-blue-900 dark:text-blue-300">
                            Nghỉ kế hoạch
                          </span>
                          <span className="font-bold text-blue-700 dark:text-blue-400">
                            {shift.downtime_breakdown.planned_shutdown_hours || 0} giờ
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {shift.downtime_breakdown.planned_shutdown_reason || 'Không có nghỉ kế hoạch'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. Meters Tab */}
            {activeTab === 'meters' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Chỉ số điện năng, cân cấp quặng và vật tư tiêu hao trong ca
                  </p>
                  {canManage && shift.status !== 'verified' && (
                    <button
                      type="button"
                      onClick={() => setIsMeterOpen(true)}
                      className="inline-flex items-center gap-1 rounded bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Ghi chỉ số đo
                    </button>
                  )}
                </div>

                {isLoading ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    Đang tải chỉ số đo...
                  </div>
                ) : !detailData?.meters || detailData.meters.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
                    Chưa có số đo cân/điện nào được ghi nhận cho ca này.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/40 text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2">Mã đồng hồ</th>
                          <th className="px-3 py-2">Tên thiết bị đo</th>
                          <th className="px-3 py-2 text-right">Chỉ số đầu</th>
                          <th className="px-3 py-2 text-right">Chỉ số cuối</th>
                          <th className="px-3 py-2 text-right">Tiêu thụ</th>
                          <th className="px-3 py-2">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {detailData.meters.map((m) => (
                          <tr key={m.id}>
                            <td className="px-3 py-2 font-mono font-medium text-primary">
                              {m.meter_code}
                            </td>
                            <td className="px-3 py-2">{m.meter_name}</td>
                            <td className="px-3 py-2 text-right">{m.start_reading}</td>
                            <td className="px-3 py-2 text-right">{m.end_reading}</td>
                            <td className="px-3 py-2 text-right font-bold text-foreground">
                              {m.consumed_quantity.toLocaleString()} {m.unit_of_measure}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">{m.notes || '---'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 3. Downtime Tab */}
            {activeTab === 'downtime' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Danh mục các sự kiện dừng máy và nguyên nhân trong ca
                  </p>
                  {canManage && shift.status !== 'verified' && (
                    <button
                      type="button"
                      onClick={() => setIsDowntimeOpen(true)}
                      className="inline-flex items-center gap-1 rounded bg-rose-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Ghi nhận dừng máy
                    </button>
                  )}
                </div>

                {isLoading ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    Đang tải sự kiện dừng máy...
                  </div>
                ) : !detailData?.downtimes || detailData.downtimes.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
                    Ca vận hành liên tục, không ghi nhận sự cố dừng chuyền.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {detailData.downtimes.map((dt) => (
                      <div
                        key={dt.id}
                        className="rounded-lg border border-border bg-card p-3 shadow-sm text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-rose-600 dark:text-rose-400">
                            {dt.reason}
                          </span>
                          <span className="rounded bg-rose-100 px-2 py-0.5 font-bold text-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                            {dt.duration_minutes} phút ({Number((dt.duration_minutes / 60).toFixed(2))}h)
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                          <div>
                            Bắt đầu: {new Date(dt.start_time).toLocaleTimeString()} • Kết thúc:{' '}
                            {new Date(dt.end_time).toLocaleTimeString()}
                          </div>
                          <div className="text-right">
                            {dt.action_taken ? `Xử lý: ${dt.action_taken}` : 'Chưa ghi biện pháp'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. Logs Tab */}
            {activeTab === 'logs' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Nhật ký điều hành công nghệ và chỉ đạo vận hành trong ca
                  </p>
                  {canManage && shift.status !== 'verified' && (
                    <button
                      type="button"
                      onClick={() => setIsLogOpen(true)}
                      className="inline-flex items-center gap-1 rounded bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Thêm mục nhật ký
                    </button>
                  )}
                </div>

                {isLoading ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    Đang tải nhật ký ca...
                  </div>
                ) : !detailData?.logs || detailData.logs.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
                    Chưa có mục nhật ký nào được ghi nhận cho ca này.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {detailData.logs.map((log) => (
                      <div
                        key={log.id}
                        className="rounded-lg border border-border bg-card p-3 shadow-sm text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-primary">{log.content}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(log.log_time).toLocaleTimeString()}
                          </span>
                        </div>
                        {log.changed_by_name && (
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            Người ghi nhận: {log.changed_by_name}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <div className="text-xs text-muted-foreground">
              {shift.status === 'verified' ? (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  ✓ Ca sản xuất đã được kiểm tra và nghiệm thu
                </span>
              ) : (
                <span>Số liệu ca đang ở trạng thái chốt ca vận hành</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {canVerify && shift.status !== 'verified' && onVerify && (
                <button
                  type="button"
                  onClick={() => {
                    onVerify(shift);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Nghiệm thu ca
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-input bg-background px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Sub-dialogs */}
      <ProductionShiftDowntimeDialog
        isOpen={isDowntimeOpen}
        onClose={() => setIsDowntimeOpen(false)}
        onSubmit={async (values) => {
          await createDowntimeMutation.mutateAsync(values);
          setIsDowntimeOpen(false);
        }}
        shiftId={shift.id}
        lineId={shift.line_id}
        isSubmitting={createDowntimeMutation.isPending}
      />

      <ProductionShiftMeterDialog
        isOpen={isMeterOpen}
        onClose={() => setIsMeterOpen(false)}
        onSubmit={async (values) => {
          await createMeterMutation.mutateAsync(values);
          setIsMeterOpen(false);
        }}
        shiftId={shift.id}
        isSubmitting={createMeterMutation.isPending}
      />

      <ProductionShiftLogDialog
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
        onSubmit={async (values) => {
          await createLogMutation.mutateAsync(values);
          setIsLogOpen(false);
        }}
        shiftId={shift.id}
        isSubmitting={createLogMutation.isPending}
      />
    </>
  );
};
