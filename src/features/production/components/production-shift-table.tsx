import React from 'react';
import { Eye, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ProductionShift } from '../types';
import { ShiftStatusBadge } from './production-status-badge';
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
  onVerify?: (shift: ProductionShift) => void;
  canManage: boolean;
  canVerify?: boolean;
  canDelete?: boolean;
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
}) => {
  const totalPages = Math.ceil(totalCount / pageSize) || 1;

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
  const TARGET_OPERATING_HOURS = 7.0; // 7.0h chạy / ca 8h
  const TARGET_CAPACITY_TPH = 70.0; // 70 tấn quặng/h
  const TARGET_EFFICIENCY_PCT = 100.0; // 100% hiệu suất
  const TARGET_RECOVERY_PCT = 84.19; // 84.19% thu hồi chuẩn
  const TARGET_OUTPUT_TONS = 400.0; // ~400 tấn TP chuẩn / ca
  const TARGET_OEE_PCT = 80.0; // 80% OEE chuẩn

  const renderMetricCell = (
    value: string | number,
    unit: string,
    isMet: boolean,
    targetLabel: string,
    subNote?: string,
  ) => (
    <div
      className={cn(
        'inline-flex flex-col items-center justify-center rounded-lg px-2.5 py-1 text-center min-w-[76px] transition-colors',
        isMet
          ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/35'
          : 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/35',
      )}
    >
      <span className="font-bold text-xs tracking-tight">
        {value} <span className="text-[10px] font-normal opacity-85">{unit}</span>
      </span>
      <span className="text-[9px] font-medium opacity-80">{targetLabel}</span>
      {subNote && <span className="text-[8px] opacity-70 mt-0.5">{subNote}</span>}
    </div>
  );

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="border-b border-border bg-muted/40 font-medium text-muted-foreground">
            <tr>
              <th className="px-3 py-3">Ngày & Ca</th>
              <th className="px-3 py-3 text-center">Mã Line</th>
              <th className="px-3 py-3 text-center">Thời gian vận hành</th>
              <th className="px-3 py-3 text-center">Công suất</th>
              <th className="px-3 py-3 text-center">Hiệu suất</th>
              <th className="px-3 py-3 text-center">Thu hồi</th>
              <th className="px-3 py-3 text-center">Sản lượng</th>
              <th className="px-3 py-3 text-center">OEE</th>
              <th className="px-3 py-3">Trưởng ca</th>
              <th className="px-3 py-3 text-center">Trạng thái</th>
              <th className="px-3 py-3 text-center w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-foreground">
            {data.map((shift) => {
              const runHours = Number(
                (
                  shift.running_hours ??
                  Math.max(0, shift.standard_shift_hours - shift.total_downtime_hours)
                ).toFixed(1),
              );
              const rawInput = Number(shift.raw_material_input_tons || 0);
              const finishedOutput = Number(shift.product_output_tons || 0);

              // Công suất = Nguyên liệu cấp / Giờ chạy (TPH)
              const actualCapacity =
                shift.actual_capacity_tph && shift.actual_capacity_tph > 0
                  ? Number(shift.actual_capacity_tph)
                  : runHours > 0 && rawInput > 0
                    ? Number((rawInput / runHours).toFixed(1))
                    : 0;

              // Hiệu suất = Công suất thực tế / Công suất kế hoạch (70 TPH) * 100%
              const efficiencyPct = Number(((actualCapacity / TARGET_CAPACITY_TPH) * 100).toFixed(1));

              // Thu hồi = Thành phẩm / Nguyên liệu * 100%
              const actualRecovery =
                shift.actual_recovery_rate_pct && shift.actual_recovery_rate_pct > 0
                  ? Number(shift.actual_recovery_rate_pct)
                  : rawInput > 0 && finishedOutput > 0
                    ? Number(((finishedOutput / rawInput) * 100).toFixed(2))
                    : 0;

              // OEE = A x P x Q (Q = Chất lượng sản phẩm thực tế, mặc định ban đầu 100%)
              const actualQuality =
                shift.actual_quality_rate_pct !== null && shift.actual_quality_rate_pct !== undefined
                  ? Number(shift.actual_quality_rate_pct)
                  : 100;
              const availScore = Math.min(100, Math.max(0, (runHours / (shift.standard_shift_hours || 8)) * 100));
              const perfScore = Math.min(100, (actualCapacity / TARGET_CAPACITY_TPH) * 100);
              const qualScore = Math.min(100, actualQuality);
              const oee =
                runHours > 0 && actualCapacity > 0
                  ? Number((((availScore / 100) * (perfScore / 100) * (qualScore / 100)) * 100).toFixed(1))
                  : 0;

              // Comparisons with Target / Plan
              const isRunHoursMet = runHours >= TARGET_OPERATING_HOURS;
              const isCapMet = actualCapacity >= TARGET_CAPACITY_TPH;
              const isEffMet = efficiencyPct >= TARGET_EFFICIENCY_PCT;
              const isRecMet = actualRecovery >= TARGET_RECOVERY_PCT;
              const isOutputMet = finishedOutput >= TARGET_OUTPUT_TONS;
              const isOeeMet = oee >= TARGET_OEE_PCT;

              return (
                <tr key={shift.id} className="transition-colors hover:bg-muted/30">
                  {/* 1. Ngày & Ca */}
                  <td className="px-3 py-3">
                    <div className="font-semibold text-foreground">{shift.shift_date}</div>
                    <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      Ca {shift.shift_number}
                    </span>
                  </td>

                  {/* 2. Mã Line (thay thế cho Tên Dây chuyền và Mã ca) */}
                  <td className="px-3 py-3 text-center">
                    <span
                      className="inline-block rounded font-mono font-bold text-xs bg-primary/10 text-primary px-2 py-0.5"
                      title={shift.line_name || shift.shift_code}
                    >
                      {shift.line_code || shift.line_name || 'LINE'}
                    </span>
                  </td>

                  {/* 3. Thời gian vận hành (h) */}
                  <td className="px-3 py-3 text-center">
                    {renderMetricCell(
                      runHours,
                      'h',
                      isRunHoursMet,
                      `KH: ${TARGET_OPERATING_HOURS}h`,
                      shift.total_downtime_hours > 0 ? `(${shift.total_downtime_hours}h dừng)` : undefined,
                    )}
                  </td>

                  {/* 4. Công suất (TPH) */}
                  <td className="px-3 py-3 text-center">
                    {renderMetricCell(
                      actualCapacity,
                      'TPH',
                      isCapMet,
                      `KH: ${TARGET_CAPACITY_TPH}`,
                    )}
                  </td>

                  {/* 5. Hiệu suất (%) */}
                  <td className="px-3 py-3 text-center">
                    {renderMetricCell(
                      efficiencyPct,
                      '%',
                      isEffMet,
                      `KH: ${TARGET_EFFICIENCY_PCT}%`,
                    )}
                  </td>

                  {/* 6. Thu hồi (%) */}
                  <td className="px-3 py-3 text-center">
                    {renderMetricCell(
                      actualRecovery,
                      '%',
                      isRecMet,
                      `KH: ${TARGET_RECOVERY_PCT}%`,
                    )}
                  </td>

                  {/* 7. Sản lượng (Tấn) */}
                  <td className="px-3 py-3 text-center">
                    {renderMetricCell(
                      finishedOutput.toLocaleString('vi-VN'),
                      'T',
                      isOutputMet,
                      `KH: ${TARGET_OUTPUT_TONS}T`,
                      rawInput > 0 ? `Quặng: ${rawInput}T` : undefined,
                    )}
                  </td>

                  {/* 8. OEE (%) */}
                  <td className="px-3 py-3 text-center">
                    {renderMetricCell(
                      oee,
                      '%',
                      isOeeMet,
                      `KH: ${TARGET_OEE_PCT}%`,
                    )}
                  </td>

                  {/* 9. Trưởng ca */}
                  <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                    {shift.operator_name || '---'}
                  </td>

                  {/* 10. Trạng thái */}
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    <ShiftStatusBadge status={shift.status} />
                  </td>

                  {/* 11. Thao tác (ĐÃ BỎ NÚT NGHIỆM THU) */}
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
                      {canManage && shift.status !== 'verified' && (
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
