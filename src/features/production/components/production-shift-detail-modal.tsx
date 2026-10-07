import React, { useState } from 'react';
import {
  X,
  Clock,
  AlertTriangle,
  Trash2,
  Award,
  Plus,
} from 'lucide-react';
import { type ProductionShift, isFinishedProduct } from '../types';
import { useProductionShiftDetail } from '../hooks/use-production-shifts';
import { ProductionShiftDowntimeDialog } from './production-shift-downtime-dialog';
import { useCreateShiftDowntime } from '../hooks/use-production-shifts';
import { cn } from '@/lib/utils';

interface ProductionShiftDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: ProductionShift | null;
  onDelete?: (shift: ProductionShift) => void;
  canManage?: boolean;
  canDelete?: boolean;
}

type ShiftDetailTab = 'summary' | 'downtime';

export const ProductionShiftDetailModal: React.FC<ProductionShiftDetailModalProps> = ({
  isOpen,
  onClose,
  shift,
  onDelete,
  canManage,
  canDelete = false,
}) => {
  const [activeTab, setActiveTab] = useState<ShiftDetailTab>('summary');
  const [isDowntimeOpen, setIsDowntimeOpen] = useState(false);

  const { data: detailData } = useProductionShiftDetail(shift ? shift.id : null);
  const createDowntimeMutation = useCreateShiftDowntime();

  if (!isOpen || !shift) return null;

  const runHours = Number(
    (
      shift.running_hours ??
      Math.max(0, shift.standard_shift_hours - shift.total_downtime_hours)
    ).toFixed(1),
  );

  const rawInput = (() => {
    const direct = Number(shift.raw_material_input_tons || 0);
    if (direct > 0) return direct;
    const mats = Array.isArray(shift.materials_consumption) ? shift.materials_consumption : [];
    const m = mats.find((item) => {
      const name = (item.resource_name || '').toLowerCase();
      return (
        item.category === 'material' ||
        name.includes('cát nguyên khai') ||
        name.includes('quặng') ||
        name.includes('nguyên khai')
      );
    });
    return Number(m?.actual_quantity) || 0;
  })();

  const finishedOutput = (() => {
    if (Array.isArray(shift.products_output) && shift.products_output.length > 0) {
      return shift.products_output.reduce((acc, p) => {
        return isFinishedProduct(p) ? acc + (Number(p.quantity_tons) || 0) : acc;
      }, 0);
    }
    return Number(shift.product_output_tons || 0);
  })();

  // Công suất = Nguyên liệu cấp / Giờ chạy (TPH)
  const actualCapacity =
    runHours > 0 && rawInput > 0
      ? Number((rawInput / runHours).toFixed(1))
      : (shift.actual_capacity_tph && Number(shift.actual_capacity_tph) > 0 ? Number(shift.actual_capacity_tph) : '---');

  // Thu hồi = Thành phẩm / Nguyên liệu * 100% (chỉ tính thành phẩm)
  const actualRecovery =
    rawInput > 0 && finishedOutput > 0
      ? Number(((finishedOutput / rawInput) * 100).toFixed(2))
      : (shift.actual_recovery_rate_pct && Number(shift.actual_recovery_rate_pct) > 0 ? Number(shift.actual_recovery_rate_pct) : 0);

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
                  {shift.warehouse_synced ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      ✓ Đã nhập kho
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                      Chưa nhập kho
                    </span>
                  )}
                </div>
                {(() => {
                  const isRange = Boolean(
                    shift.end_date ||
                    shift.shift_code?.startsWith('KY-') ||
                    shift.downtime_breakdown?.is_date_range
                  );
                  const toDate = shift.end_date || shift.downtime_breakdown?.to_date;

                  return (
                    <p className="text-xs text-muted-foreground">
                      {isRange
                        ? `Kỳ từ ${shift.shift_date}${toDate && toDate !== shift.shift_date ? ` đến ${toDate}` : ''} (${shift.standard_shift_hours || 24}h tiêu chuẩn)`
                        : `Ngày ${shift.shift_date} • Ca ${shift.shift_number}`} • {shift.line_name} (
                      {shift.line_code}) • Vận hành: {shift.operator_name || '---'}
                    </p>
                  );
                })()}
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
          </div>

          {/* Sub-tab Content */}
          <div className="mt-4">
            {/* 1. Summary Tab */}
            {activeTab === 'summary' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <span className="text-[11px] text-muted-foreground">Giờ chạy máy thực</span>
                    <div className="mt-1 text-base font-bold text-primary">
                      {runHours}h / {shift.standard_shift_hours}h
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
                      {actualCapacity} TPH
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <span className="text-[11px] text-muted-foreground">Tỷ lệ thu hồi cát</span>
                    <div className="mt-1 text-base font-bold text-emerald-600 dark:text-emerald-400">
                      {actualRecovery}%
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <span className="text-[11px] text-muted-foreground">Chất lượng sản phẩm</span>
                    <div className="mt-1 flex items-center gap-1 text-base font-bold text-emerald-600 dark:text-emerald-400">
                      <Award className="h-4 w-4" />
                      {shift.actual_quality_rate_pct ?? 100}%
                    </div>
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
                            <th className="px-3 py-1.5">Kho nhập & Vị trí</th>
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
                              <td className="px-3 py-1.5 text-muted-foreground">
                                {p.warehouse_name ? (
                                  <span className="font-medium text-foreground">
                                    {p.warehouse_name}
                                    {p.storage_location ? ` • ${p.storage_location}` : ''}
                                  </span>
                                ) : (
                                  '---'
                                )}
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
                            <th className="px-3 py-1.5">Kho xuất</th>
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
                              <td className="px-3 py-1.5 text-muted-foreground">
                                {(m.resource_name?.toLowerCase().includes('điện') || m.unit_of_measure?.toLowerCase() === 'kwh') ? (
                                  <span className="italic text-[11px] text-amber-600 dark:text-amber-400">
                                    Không qua kho (Lưới điện)
                                  </span>
                                ) : (
                                  m.warehouse_name || '---'
                                )}
                              </td>
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
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-foreground">
                        Chi tiết dừng chuyền & Biện pháp khắc phục (Tổng: {shift.total_downtime_hours}h
                        {shift.downtime_breakdown.events && shift.downtime_breakdown.events.length > 0
                          ? ` • ${shift.downtime_breakdown.events.length} lần dừng`
                          : ''}
                        )
                      </h3>
                    </div>

                    {shift.downtime_breakdown.events && shift.downtime_breakdown.events.length > 0 ? (
                      <div className="overflow-x-auto rounded border border-border">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-muted/40 text-muted-foreground font-semibold">
                            <tr>
                              <th className="px-3 py-1.5 w-10 text-center">#</th>
                              <th className="px-3 py-1.5">Phân loại dừng</th>
                              <th className="px-3 py-1.5 text-center">Mã thiết bị</th>
                              <th className="px-3 py-1.5 text-center">Thời gian (Từ - Đến)</th>
                              <th className="px-3 py-1.5 text-center">Thời lượng</th>
                              <th className="px-3 py-1.5">Lý do / Nguyên nhân</th>
                              <th className="px-3 py-1.5">Biện pháp xử lý / Ghi chú</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {shift.downtime_breakdown.events.map((evt, idx) => {
                              const isInc = evt.type === 'breakdown_incident';
                              const isMaint = evt.type === 'planned_maintenance';
                              const subType = isInc
                                ? evt.incident_category
                                : isMaint
                                ? evt.maintenance_type
                                : evt.shutdown_type;

                              return (
                                <tr key={idx} className="hover:bg-muted/20">
                                  <td className="px-3 py-2 text-center font-bold text-muted-foreground">
                                    {idx + 1}
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex flex-col gap-0.5 items-start">
                                      <span
                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                          isInc
                                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                            : isMaint
                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                        }`}
                                      >
                                        {isInc
                                          ? 'Sự cố dừng chuyền'
                                          : isMaint
                                          ? 'Dừng bảo trì'
                                          : 'Nghỉ kế hoạch'}
                                      </span>
                                      {subType && (
                                        <span className="text-[10px] font-medium text-muted-foreground">
                                          {subType}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    {evt.equipment_code ? (
                                      <span className="inline-block rounded font-mono font-bold text-xs bg-primary/10 text-primary px-2 py-0.5">
                                        {evt.equipment_code}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground text-xs">---</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-center font-mono font-medium text-foreground">
                                    {evt.start_time} → {evt.end_time}
                                  </td>
                                  <td className="px-3 py-2 text-center font-semibold text-rose-600 dark:text-rose-400">
                                    {evt.duration_minutes || Math.round((evt.duration_hours || 0) * 60)} phút ({evt.duration_hours || 0}h)
                                  </td>
                                  <td className="px-3 py-2 text-foreground font-medium">
                                    {evt.reason || '---'}
                                  </td>
                                  <td className="px-3 py-2 text-muted-foreground">
                                    {evt.action_taken || '---'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
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
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 2. Downtime Tab */}
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

                {!detailData?.downtimes || detailData.downtimes.length === 0 ? (
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
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <div className="text-xs text-muted-foreground">
              Người cập nhật:{' '}
              <span className="font-semibold text-foreground">
                {shift.operator_name || 'Quản trị viên'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {canDelete && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(shift);
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/50"
                  title="Xóa ca nhập liệu"
                >
                  <Trash2 className="h-4 w-4" />
                  Xóa ca
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
    </>
  );
};
