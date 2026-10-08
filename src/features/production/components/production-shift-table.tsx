import React from 'react';
import { Eye, Edit, Trash2, ChevronLeft, ChevronRight, CheckCircle2, PackageCheck } from 'lucide-react';
import type { ProductionShift } from '../types';
import { isFinishedProduct, isSemiFinishedProduct } from '../types';
import { cn } from '@/lib/utils';

interface ProductionShiftTableProps {
  data: ProductionShift[];
  isLoading: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onView: (shift: ProductionShift) => void;
  onEdit: (shift: ProductionShift) => void;
  onDelete: (shift: ProductionShift) => void;
  canManage: boolean;
  canDelete?: boolean;
  plannedProductivityTph?: number;
  plannedRecoveryRatePct?: number;
  selectedShiftIds?: string[];
  onToggleSelectShift?: (shiftId: string) => void;
  onToggleSelectAll?: (shiftIds: string[]) => void;
  onOpenBatchWarehouseSync?: () => void;
  canBatchSyncWarehouse?: boolean;
}

export const ProductionShiftTable: React.FC<ProductionShiftTableProps> = ({
  data,
  isLoading,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  canManage,
  canDelete = false,
  plannedProductivityTph,
  plannedRecoveryRatePct,
  selectedShiftIds = [],
  onToggleSelectShift,
  onToggleSelectAll,
  onOpenBatchWarehouseSync,
  canBatchSyncWarehouse = false,
}) => {
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  const currentPageShiftIds = data.map((s) => s.id);
  const isAllSelected =
    currentPageShiftIds.length > 0 &&
    currentPageShiftIds.every((id) => selectedShiftIds.includes(id));
  const isSomeSelected =
    currentPageShiftIds.some((id) => selectedShiftIds.includes(id));

  const handleSelectAll = () => {
    if (!onToggleSelectAll) return;
    if (isAllSelected) {
      // Unselect all current page shifts
      const remaining = selectedShiftIds.filter(
        (id) => !currentPageShiftIds.includes(id),
      );
      onToggleSelectAll(remaining);
    } else {
      // Select all current page shifts
      const merged = Array.from(
        new Set([...selectedShiftIds, ...currentPageShiftIds]),
      );
      onToggleSelectAll(merged);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card">
        <div className="flex flex-col items-center gap-2">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs text-muted-foreground">Đang tải nhật ký ca sản xuất...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-6 text-center">
        <p className="text-sm font-medium text-foreground">Không tìm thấy ca sản xuất nào</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Thử thay đổi điều kiện lọc hoặc tạo nhật ký ca sản xuất mới.
        </p>
      </div>
    );
  }

  // Target planned benchmarks per shift
  const TARGET_CAPACITY_TPH = 70.0; // 70 tấn quặng/h
  const TARGET_PRODUCTIVITY_TPH = 50.0; // ~50 TPH thành phẩm/h chuẩn
  const TARGET_RECOVERY_PCT = 84.19; // 84.19% thu hồi chuẩn
  const TARGET_OUTPUT_TONS = 400.0; // ~400 tấn TP chuẩn / ca
  const TARGET_OEE_PCT = 80.0; // 80% OEE chuẩn

  const renderMetricCell = (
    value: string | number,
    unit: string,
    isMet: boolean,
  ) => (
    <div className="flex items-center justify-center">
      <span
        className={cn(
          'text-xs tracking-tight transition-colors',
          isMet
            ? 'font-bold text-emerald-600 dark:text-emerald-400'
            : 'font-semibold text-foreground',
        )}
      >
        {value}{unit ? ` ${unit}` : ''}
      </span>
    </div>
  );

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Batch selection action banner */}
      {canBatchSyncWarehouse && selectedShiftIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/20 bg-primary/5 px-4 py-2.5 text-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-5 items-center justify-center rounded-full bg-primary px-2 text-[11px] font-bold text-primary-foreground">
              {selectedShiftIds.length}
            </span>
            <span className="font-semibold text-foreground">
              Đã chọn {selectedShiftIds.length} ca sản xuất
            </span>
            <span className="hidden sm:inline text-muted-foreground">
              — Sẵn sàng nghiệm thu & sinh phiếu nhập/xuất kho
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleSelectAll?.([])}
              className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              Bỏ chọn
            </button>
            <button
              type="button"
              onClick={onOpenBatchWarehouseSync}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              <PackageCheck className="h-3.5 w-3.5" />
              Nghiệm thu & Sinh phiếu kho
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="border-b border-border bg-muted/40 font-medium text-muted-foreground">
            <tr>
              {canBatchSyncWarehouse && (
                <th className="px-3 py-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected && !isAllSelected;
                    }}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                    title="Chọn tất cả ca trong trang này"
                  />
                </th>
              )}
              <th className="px-3 py-3">Ngày & Ca</th>
              <th className="px-3 py-3 text-center">Mã Line</th>
              <th className="px-3 py-3 text-center">Thời gian vận hành</th>
              <th className="px-3 py-3 text-center">Công suất</th>
              <th className="px-3 py-3 text-center">Năng suất</th>
              <th className="px-3 py-3 text-center">Thu hồi</th>
              <th className="px-3 py-3 text-center">Sản lượng</th>
              <th className="px-3 py-3 text-center">OEE</th>
              <th className="px-3 py-3 text-center">Kho</th>
              <th className="px-3 py-3">Người cập nhật</th>
              <th className="px-3 py-3 text-center w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y border-border text-foreground">
            {data.map((shift) => {
              const targetOperatingHours = Number(shift.standard_shift_hours || 8.0);
              const runHours = Number(
                (
                  shift.running_hours ??
                  Math.max(0, targetOperatingHours - shift.total_downtime_hours)
                ).toFixed(1),
              );

              const rawInput = (() => {
                const direct = Number(shift.raw_material_input_tons || 0);
                if (direct > 0) return direct;
                const mats = Array.isArray(shift.materials_consumption)
                  ? (shift.materials_consumption as Array<{
                      resource_name?: string;
                      category?: string;
                      actual_quantity?: number;
                    }>)
                  : [];
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

              // Sản lượng: chỉ tính thành phẩm (loại trừ phụ phẩm, bán thành phẩm MM/Magmin/VFS/FSAP)
              const finishedOutput = (() => {
                if (Array.isArray(shift.products_output) && shift.products_output.length > 0) {
                  return shift.products_output.reduce((acc, p) => {
                    return isFinishedProduct(p) ? acc + (Number(p.quantity_tons) || 0) : acc;
                  }, 0);
                }
                return Number(shift.product_output_tons || 0);
              })();

              // Bán thành phẩm: tính riêng
              const semiFinishedOutput = (() => {
                if (Array.isArray(shift.products_output) && shift.products_output.length > 0) {
                  return shift.products_output.reduce((acc, p) => {
                    return isSemiFinishedProduct(p) ? acc + (Number(p.quantity_tons) || 0) : acc;
                  }, 0);
                }
                return 0;
              })();

              // Công suất = Nguyên liệu cấp / Giờ chạy (TPH)
              const actualCapacity =
                runHours > 0 && rawInput > 0
                  ? Number((rawInput / runHours).toFixed(1))
                  : (shift.actual_capacity_tph && shift.actual_capacity_tph > 0 ? Number(shift.actual_capacity_tph) : 0);

              // Năng suất = Sản lượng (thành phẩm hoặc bán thành phẩm) / Giờ chạy (TPH)
              const effectiveOutputForProductivity = finishedOutput > 0 ? finishedOutput : semiFinishedOutput;
              const actualProductivity =
                runHours > 0 && effectiveOutputForProductivity > 0
                  ? Number((effectiveOutputForProductivity / runHours).toFixed(1))
                  : 0;

              // Thu hồi BTP riêng
              const actualSemiRecovery =
                rawInput > 0 && semiFinishedOutput > 0
                  ? Number(((semiFinishedOutput / rawInput) * 100).toFixed(2))
                  : 0;

              // Thu hồi = Thành phẩm / Nguyên liệu * 100%
              const actualRecovery =
                rawInput > 0 && finishedOutput > 0
                  ? Number(((finishedOutput / rawInput) * 100).toFixed(2))
                  : (shift.actual_recovery_rate_pct && shift.actual_recovery_rate_pct > 0 ? Number(shift.actual_recovery_rate_pct) : 0);

              // Lấy giờ sự cố từ downtime_breakdown
              const shiftIncidentHours = (() => {
                const bd = shift.downtime_breakdown as Record<string, unknown> | undefined;
                if (!bd || typeof bd !== 'object') return 0;
                if (bd.incident_hours !== undefined && bd.incident_hours !== null) {
                  return Number(bd.incident_hours) || 0;
                }
                if (Array.isArray(bd.events)) {
                  return (
                    bd.events as Array<{
                      type?: string;
                      duration_minutes?: number;
                      duration_hours?: number;
                    }>
                  ).reduce((sum: number, ev) => {
                    if (ev.type === 'breakdown_incident') {
                      const mins = Number(ev.duration_minutes) || (Number(ev.duration_hours) || 0) * 60;
                      return sum + mins / 60;
                    }
                    return sum;
                  }, 0);
                }
                return 0;
              })();

              // OEE = A x P x Q
              // A: Thời gian vận hành / (Thời gian vận hành + Thời gian sự cố)
              const availScore =
                runHours + shiftIncidentHours > 0
                  ? (runHours / (runHours + shiftIncidentHours)) * 100
                  : (runHours > 0 ? 100 : 0);

              // P: Năng suất thực tế / Năng suất kế hoạch
              const effectivePlannedRecovery =
                plannedRecoveryRatePct && plannedRecoveryRatePct > 0
                  ? plannedRecoveryRatePct
                  : TARGET_RECOVERY_PCT;

              const plannedProductivity =
                plannedProductivityTph && plannedProductivityTph > 0
                  ? plannedProductivityTph
                  : (targetOperatingHours <= 8 ? TARGET_PRODUCTIVITY_TPH : (70.0 * (effectivePlannedRecovery / 100)));

              const perfScore =
                plannedProductivity > 0 && actualProductivity > 0
                  ? (actualProductivity / plannedProductivity) * 100
                  : 0;

              // Q: Chất lượng thành phẩm
              const actualQuality =
                shift.actual_quality_rate_pct !== null && shift.actual_quality_rate_pct !== undefined
                  ? Number(shift.actual_quality_rate_pct)
                  : 100;

              const availabilityScore = Math.min(100, Math.max(0, availScore));
              const performanceScore = Math.min(100, Math.max(0, perfScore));
              const qualityScore = Math.min(100, Math.max(0, actualQuality));

              const oee =
                runHours > 0 && actualProductivity > 0
                  ? Number(
                      (
                        ((availabilityScore / 100) *
                          (performanceScore / 100) *
                          (qualityScore / 100)) *
                        100
                      ).toFixed(1),
                    )
                  : 0;

              // Comparisons with Target / Plan
              const isRunHoursMet = runHours >= targetOperatingHours;
              const isCapMet = actualCapacity >= TARGET_CAPACITY_TPH;
              const isProdMet = actualProductivity >= plannedProductivity;
              const isRecMet = actualRecovery >= effectivePlannedRecovery;
              const isOutputMet = finishedOutput >= TARGET_OUTPUT_TONS;
              const isOeeMet = oee >= TARGET_OEE_PCT;
              const isSelected = selectedShiftIds.includes(shift.id);

              return (
                <tr
                  key={shift.id}
                  className={cn(
                    'transition-colors hover:bg-muted/30',
                    isSelected && 'bg-primary/5 hover:bg-primary/10',
                  )}
                >
                  {/* 0. Batch select checkbox */}
                  {canBatchSyncWarehouse && (
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelectShift?.(shift.id)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                        title={`Chọn ca ${shift.shift_code || shift.shift_date}`}
                      />
                    </td>
                  )}

                  {/* 1. Ngày & Ca */}
                  <td className="px-3 py-3">
                    {(() => {
                      const isRange = Boolean(
                        shift.end_date ||
                        shift.shift_code?.startsWith('KY-') ||
                        shift.downtime_breakdown?.is_date_range
                      );
                      const toDate = shift.end_date || shift.downtime_breakdown?.to_date;

                      return (
                        <>
                          <div className="font-semibold text-foreground">
                            {shift.shift_date}
                            {isRange && toDate && toDate !== shift.shift_date && (
                              <span className="text-muted-foreground font-normal"> → {toDate}</span>
                            )}
                          </div>
                          {isRange ? (
                            <span className="inline-flex items-center rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 text-[10px] font-semibold">
                              Theo kỳ ({targetOperatingHours}h)
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                              Ca {shift.shift_number}
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </td>

                  {/* 2. Mã Line */}
                  <td className="px-3 py-3 text-center">
                    <span
                      className="inline-block rounded font-mono font-bold text-xs bg-primary/10 text-primary px-2 py-0.5"
                      title={shift.line_name || shift.shift_code}
                    >
                      {shift.line_code || shift.line_name || 'LINE'}
                    </span>
                  </td>

                  {/* 3. Thời gian vận hành: chỉ hiện số tg chay/tg dừng */}
                  <td className="px-3 py-3 text-center">
                    {renderMetricCell(
                      `${runHours}h / ${shift.total_downtime_hours}h`,
                      '',
                      isRunHoursMet,
                    )}
                  </td>

                  {/* 4. Công suất: chỉ hiện công suất (= nguyên liệu / thời gian vận hành) */}
                  <td className="px-3 py-3 text-center">
                    {renderMetricCell(
                      actualCapacity,
                      'TPH',
                      isCapMet,
                    )}
                  </td>

                  {/* 5. Năng suất (= sản lượng thành phẩm / thời gian vận hành) */}
                  <td className="px-3 py-3 text-center">
                    {renderMetricCell(
                      actualProductivity,
                      'TPH',
                      isProdMet,
                    )}
                  </td>

                  {/* 6. Thu hồi (= sản lượng thành phẩm / nguyên liệu, tính riêng BTP nếu là ca bán thành phẩm) */}
                  <td className="px-3 py-3 text-center">
                    {finishedOutput > 0 ? (
                      renderMetricCell(
                        `${actualRecovery}%`,
                        '',
                        isRecMet,
                      )
                    ) : semiFinishedOutput > 0 ? (
                      renderMetricCell(
                        `${actualSemiRecovery}%`,
                        'BTP',
                        actualSemiRecovery >= effectivePlannedRecovery,
                      )
                    ) : (
                      renderMetricCell(
                        `${actualRecovery}%`,
                        '',
                        isRecMet,
                      )
                    )}
                  </td>

                  {/* 7. Sản lượng: hiển thị thành phẩm và bán thành phẩm nếu có */}
                  <td className="px-3 py-3 text-center">
                    {finishedOutput > 0 ? (
                      renderMetricCell(
                        finishedOutput.toLocaleString('vi-VN'),
                        'T',
                        isOutputMet,
                      )
                    ) : semiFinishedOutput > 0 ? (
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {semiFinishedOutput.toLocaleString('vi-VN')}
                        </span>
                        <span className="text-[10px] text-muted-foreground">T (BTP)</span>
                      </div>
                    ) : (
                      renderMetricCell(
                        '0',
                        'T',
                        false,
                      )
                    )}
                  </td>

                  {/* 8. OEE (tính lại) */}
                  <td className="px-3 py-3 text-center">
                    {renderMetricCell(
                      `${oee}%`,
                      '',
                      isOeeMet,
                    )}
                  </td>

                  {/* 9. Trạng thái kho */}
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    {shift.warehouse_synced ? (
                      <span
                        className="inline-flex items-center gap-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 text-[10px] font-semibold"
                        title={
                          shift.warehouse_synced_at
                            ? `Đã nghiệm thu nhập kho: ${new Date(shift.warehouse_synced_at).toLocaleString('vi-VN')}`
                            : 'Đã nghiệm thu nhập kho'
                        }
                      >
                        <CheckCircle2 className="h-3 w-3" /> Đã nhập
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 text-[10px] font-semibold">
                        Chưa nhập
                      </span>
                    )}
                  </td>

                  {/* 10. Trưởng ca (người cập nhật) */}
                  <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                    {shift.operator_name || '---'}
                  </td>

                  {/* 10. Thao tác */}
                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onView(shift)}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title="Xem chi tiết ca"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => onEdit(shift)}
                          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          title="Chỉnh sửa ca"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(shift)}
                          className="rounded p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                          title="Xóa ca nhập liệu"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
        <div>
          Hiển thị{' '}
          <span className="font-medium text-foreground">
            {Math.min((page - 1) * pageSize + 1, totalCount)}
          </span>{' '}
          đến{' '}
          <span className="font-medium text-foreground">
            {Math.min(page * pageSize, totalCount)}
          </span>{' '}
          trong tổng số <span className="font-medium text-foreground">{totalCount}</span> ca vận
          hành
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground disabled:opacity-50"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Trước
          </button>
          <span className="px-2 font-medium text-foreground">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium text-foreground disabled:opacity-50"
          >
            Sau
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
