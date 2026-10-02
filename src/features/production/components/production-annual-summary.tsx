import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Filter,
  BarChart3,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  PlusCircle,
  Eye,
} from 'lucide-react';
import type { ProductionLine, ProductionMonthlyPlan } from '../types';
import { useAnnualPlanSummary } from '../hooks/use-production-plans';
import { PlanStatusBadge } from './production-status-badge';
import { cn } from '@/lib/utils';

interface ProductionAnnualSummaryProps {
  lines: ProductionLine[];
  onViewMonthPlan?: (plan: ProductionMonthlyPlan) => void;
  onCreateMonthPlan?: (year: number, month: number, lineId: string) => void;
  canManage?: boolean;
}

// Days in each month helper (handles leap year)
const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};

const formatNumber = (val: number | null | undefined, decimals = 0): string => {
  if (val === null || val === undefined || isNaN(val) || val === 0) return '-';
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val);
};

const formatPercent = (val: number | null | undefined): string => {
  if (val === null || val === undefined || isNaN(val) || val === 0) return '-';
  return `${val.toFixed(1)}%`;
};

export const ProductionAnnualSummary: React.FC<ProductionAnnualSummaryProps> = ({
  lines,
  onViewMonthPlan,
  onCreateMonthPlan,
  canManage = false,
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedLineId, setSelectedLineId] = useState<string>(() => lines[0]?.id || '');

  // Keep selected line updated if lines load asynchronously
  React.useEffect(() => {
    if (!selectedLineId && lines.length > 0) {
      setSelectedLineId(lines[0].id);
    }
  }, [lines, selectedLineId]);

  const selectedLine = useMemo(
    () => lines.find((l) => l.id === selectedLineId),
    [lines, selectedLineId],
  );

  const { data: plans = [], isLoading, isError, error, refetch } = useAnnualPlanSummary(
    selectedYear,
    selectedLineId,
  );

  // Month map 1..12
  const monthMap = useMemo(() => {
    const map = new Map<number, typeof plans[0]>();
    for (const p of plans) {
      map.set(p.month, p);
    }
    return map;
  }, [plans]);

  // Aggregate standard indicators
  const indicators = useMemo(() => {
    // 12 months array
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    // 1. Số giờ trong tháng
    const calendarHours = months.map((m) => {
      const plan = monthMap.get(m);
      if (plan && plan.total_calendar_hours > 0) return plan.total_calendar_hours;
      return getDaysInMonth(selectedYear, m) * 24;
    });
    const totalCalendarHours = calendarHours.reduce((sum, h) => sum + h, 0);

    // 2. Năng suất dây chuyền (TPH)
    const capacities = months.map((m) => monthMap.get(m)?.planned_capacity_tph || 0);
    const validCapacities = capacities.filter((c) => c > 0);
    const avgCapacity =
      validCapacities.length > 0
        ? validCapacities.reduce((a, b) => a + b, 0) / validCapacities.length
        : 0;

    // 3. Hiệu suất (%)
    const recoveryRates = months.map((m) => monthMap.get(m)?.planned_recovery_rate_pct || 0);
    const validRecoveryRates = recoveryRates.filter((r) => r > 0);
    const avgRecoveryRate =
      validRecoveryRates.length > 0
        ? validRecoveryRates.reduce((a, b) => a + b, 0) / validRecoveryRates.length
        : 0;

    // 5. Giờ bảo trì
    const maintenanceHours = months.map((m) => monthMap.get(m)?.planned_maintenance_hours || 0);
    const totalMaintenanceHours = maintenanceHours.reduce((a, b) => a + b, 0);

    // 6. Giờ nghỉ trong KH
    const shutdownHours = months.map((m) => monthMap.get(m)?.planned_shutdown_hours || 0);
    const totalShutdownHours = shutdownHours.reduce((a, b) => a + b, 0);

    // 7. Giờ sự cố
    const breakdownHours = months.map((m) => monthMap.get(m)?.planned_breakdown_hours || 0);
    const totalBreakdownHours = breakdownHours.reduce((a, b) => a + b, 0);

    // 8. Thời gian vận hành
    const operatingHours = months.map((m) => {
      const p = monthMap.get(m);
      if (!p) return 0;
      if (p.planned_operating_hours && p.planned_operating_hours > 0) {
        return p.planned_operating_hours;
      }
      return Math.max(
        0,
        calendarHours[m - 1] -
          (p.planned_maintenance_hours || 0) -
          (p.planned_shutdown_hours || 0) -
          (p.planned_breakdown_hours || 0),
      );
    });
    const totalOperatingHours = operatingHours.reduce((a, b) => a + b, 0);

    // 10. KH sản lượng (Tấn)
    const outputTons = months.map((m) => monthMap.get(m)?.planned_output_product_tons || 0);
    const totalOutputTons = outputTons.reduce((a, b) => a + b, 0);

    // 4. Năng suất sản phẩm (tấn/giờ) = output / operating hours
    const productProductivities = months.map((m, idx) => {
      const opH = operatingHours[idx];
      const out = outputTons[idx];
      return opH > 0 && out > 0 ? out / opH : 0;
    });
    const avgProductProductivity =
      totalOperatingHours > 0 && totalOutputTons > 0 ? totalOutputTons / totalOperatingHours : 0;

    // 9. Chất lượng (%)
    const qualityRates = months.map((m) => monthMap.get(m)?.target_quality_rate_pct || 0);
    const validQuality = qualityRates.filter((q) => q > 0);
    const avgQualityRate =
      validQuality.length > 0 ? validQuality.reduce((a, b) => a + b, 0) / validQuality.length : 100;

    // Collect distinct products across all months
    const productNames = new Set<string>();
    for (const p of plans) {
      for (const prod of p.products || []) {
        if (prod.product_name) productNames.add(prod.product_name);
        else if (prod.product_sku) productNames.add(prod.product_sku);
      }
    }
    const productList = Array.from(productNames).sort();

    // Map product rows
    const productRows = productList.map((name) => {
      const monthVals = months.map((m) => {
        const plan = monthMap.get(m);
        if (!plan) return 0;
        const item = (plan.products || []).find(
          (p) => p.product_name === name || p.product_sku === name,
        );
        return item?.planned_quantity_tons || 0;
      });
      const total = monthVals.reduce((a, b) => a + b, 0);
      return { name, monthVals, total };
    });

    // Collect distinct byproducts across all months
    const byproductNames = new Set<string>();
    for (const p of plans) {
      for (const b of p.byproducts || []) {
        if (b.byproduct_name) byproductNames.add(b.byproduct_name);
      }
    }
    const byproductList = Array.from(byproductNames).sort();

    // Map byproduct rows
    const byproductRows = byproductList.map((name) => {
      const monthVals = months.map((m) => {
        const plan = monthMap.get(m);
        if (!plan) return 0;
        const item = (plan.byproducts || []).find((b) => b.byproduct_name === name);
        return item?.planned_quantity_tons || 0;
      });
      const total = monthVals.reduce((a, b) => a + b, 0);
      return { name, monthVals, total };
    });

    // Status per month
    const monthStatuses = months.map((m) => monthMap.get(m));

    return {
      months,
      calendarHours,
      totalCalendarHours,
      capacities,
      avgCapacity,
      recoveryRates,
      avgRecoveryRate,
      productProductivities,
      avgProductProductivity,
      maintenanceHours,
      totalMaintenanceHours,
      shutdownHours,
      totalShutdownHours,
      breakdownHours,
      totalBreakdownHours,
      operatingHours,
      totalOperatingHours,
      qualityRates,
      avgQualityRate,
      outputTons,
      totalOutputTons,
      productRows,
      byproductRows,
      monthStatuses,
    };
  }, [plans, monthMap, selectedYear]);

  // Export CSV handler
  const handleExportCSV = () => {
    if (!selectedLine) return;
    const headers = [
      'STT',
      'Chỉ tiêu',
      'ĐVT',
      `KH ${selectedYear} (Cả năm)`,
      'T01',
      'T02',
      'T03',
      'T04',
      'T05',
      'T06',
      'T07',
      'T08',
      'T09',
      'T10',
      'T11',
      'T12',
    ];

    const rows: (string | number)[][] = [
      headers,
      ['I', 'Kế hoạch sản lượng, năng suất, thời gian', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['1', 'Số giờ trong tháng', 'Giờ', indicators.totalCalendarHours, ...indicators.calendarHours],
      ['2', 'Năng suất dây chuyền', 'Tấn/Giờ', indicators.avgCapacity.toFixed(1), ...indicators.capacities.map((v) => v ? v.toFixed(1) : '-')],
      ['3', 'Hiệu suất', '%', `${indicators.avgRecoveryRate.toFixed(2)}%`, ...indicators.recoveryRates.map((v) => v ? `${v.toFixed(2)}%` : '-')],
      ['4', 'Năng suất sản phẩm', 'Tấn/Giờ', indicators.avgProductProductivity.toFixed(1), ...indicators.productProductivities.map((v) => v ? v.toFixed(1) : '-')],
      ['5', 'Giờ bảo trì', 'Giờ', indicators.totalMaintenanceHours.toFixed(1), ...indicators.maintenanceHours.map((v) => v ? v.toFixed(1) : '-')],
      ['6', 'Giờ nghỉ trong KH', 'Giờ', indicators.totalShutdownHours.toFixed(1), ...indicators.shutdownHours.map((v) => v ? v.toFixed(1) : '-')],
      ['7', 'Giờ sự cố', 'Giờ', indicators.totalBreakdownHours.toFixed(1), ...indicators.breakdownHours.map((v) => v ? v.toFixed(1) : '-')],
      ['8', 'Thời gian vận hành', 'Giờ', indicators.totalOperatingHours.toFixed(2), ...indicators.operatingHours.map((v) => v ? v.toFixed(2) : '-')],
      ['9', 'Chất lượng', '%', `${indicators.avgQualityRate.toFixed(1)}%`, ...indicators.qualityRates.map((v) => v ? `${v.toFixed(1)}%` : '-')],
      ['10', 'KH sản lượng (ẩm 4.5%)', 'Tấn', indicators.totalOutputTons, ...indicators.outputTons],
      ...indicators.productRows.map((r) => ['', `- ${r.name}`, 'Tấn', r.total, ...r.monthVals]),
      ...indicators.byproductRows.map((r) => ['', `- ${r.name}`, 'Tấn', r.total, ...r.monthVals]),
    ];

    const csvContent =
      '\uFEFF' +
      rows
        .map((row) =>
          row
            .map((cell) => {
              const str = String(cell ?? '');
              return `"${str.replace(/"/g, '""')}"`;
            })
            .join(','),
        )
        .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bang_Tong_Hop_KH_${selectedYear}_${selectedLine.code || 'Line'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Stats
  const plannedMonthsCount = plans.length;
  const approvedMonthsCount = plans.filter((p) => p.status === 'approved' || p.status === 'completed').length;

  return (
    <div className="space-y-5">
      {/* Control & Filter Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Production Line Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Dây chuyền:
            </span>
            <select
              value={selectedLineId}
              onChange={(e) => setSelectedLineId(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {lines.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({l.code})
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector with arrows */}
          <div className="flex items-center gap-1 rounded-lg border border-input bg-background p-0.5">
            <button
              type="button"
              onClick={() => setSelectedYear((y) => y - 1)}
              className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Năm trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1 px-2 text-xs font-bold text-foreground">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>Năm {selectedYear}</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedYear((y) => y + 1)}
              className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Năm sau"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={isLoading || !selectedLine}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            title="Xuất file CSV/Excel"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Xuất Excel/CSV</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            title="In bảng kế hoạch"
          >
            <Printer className="h-3.5 w-3.5 text-muted-foreground" />
            <span>In</span>
          </button>
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Card 1: Tổng sản lượng kế hoạch */}
        <div className="relative overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-4 dark:border-amber-900/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-800 dark:text-amber-300">
              Tổng KH Sản lượng ({selectedYear})
            </span>
            <div className="rounded-lg bg-amber-500/20 p-1.5 text-amber-700 dark:text-amber-400">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black tracking-tight text-foreground">
              {formatNumber(indicators.totalOutputTons)}
            </span>
            <span className="text-xs font-medium text-muted-foreground">Tấn</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Bao gồm toàn bộ sản phẩm và phân bổ
          </p>
        </div>

        {/* Card 2: Tổng giờ vận hành */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tổng Giờ Vận Hành</span>
            <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black tracking-tight text-foreground">
              {formatNumber(indicators.totalOperatingHours, 0)}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              / {indicators.totalCalendarHours} Giờ
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Tỉ lệ huy động:{' '}
            {indicators.totalCalendarHours > 0
              ? `${((indicators.totalOperatingHours / indicators.totalCalendarHours) * 100).toFixed(1)}%`
              : '0%'}
          </p>
        </div>

        {/* Card 3: Năng suất trung bình */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Năng Suất TB Dây Chuyền</span>
            <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-600 dark:text-emerald-400">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black tracking-tight text-foreground">
              {indicators.avgCapacity > 0 ? indicators.avgCapacity.toFixed(1) : '-'}
            </span>
            <span className="text-xs font-medium text-muted-foreground">Tấn/Giờ</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Thu hồi TB: {indicators.avgRecoveryRate > 0 ? `${indicators.avgRecoveryRate.toFixed(1)}%` : '-'}
          </p>
        </div>

        {/* Card 4: Tiến độ lập kế hoạch */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tiến Độ Kế Hoạch Năm</span>
            <div className="rounded-lg bg-blue-500/10 p-1.5 text-blue-600 dark:text-blue-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black tracking-tight text-foreground">
              {plannedMonthsCount}
            </span>
            <span className="text-xs font-medium text-muted-foreground">/ 12 Tháng</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Đã duyệt: {approvedMonthsCount} tháng
          </p>
        </div>
      </div>

      {/* Main Pivot Table Container */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {/* Table Title Banner */}
        <div className="flex flex-wrap items-center justify-between border-b border-border bg-emerald-700 px-4 py-3 text-white dark:bg-emerald-900">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            <h3 className="font-bold tracking-wide uppercase text-xs sm:text-sm">
              KẾ HOẠCH {selectedLine?.code || selectedLine?.name || 'SẢN XUẤT'} {selectedYear}
            </h3>
          </div>
          <div className="text-xs font-medium opacity-90">
            {selectedLine ? `Dây chuyền: ${selectedLine.name}` : ''}
          </div>
        </div>

        {/* Pivot Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              {/* Header Row 1 */}
              <tr className="bg-emerald-600 text-white dark:bg-emerald-800">
                <th
                  rowSpan={2}
                  className="w-12 border border-emerald-500/40 px-3 py-2 text-center font-bold"
                >
                  STT
                </th>
                <th
                  rowSpan={2}
                  className="min-w-[240px] border border-emerald-500/40 px-3 py-2 font-bold"
                >
                  Chỉ tiêu
                </th>
                <th
                  rowSpan={2}
                  className="w-16 border border-emerald-500/40 px-2 py-2 text-center font-bold"
                >
                  ĐVT
                </th>
                <th
                  rowSpan={2}
                  className="min-w-[110px] border border-emerald-500/40 bg-emerald-700/80 px-3 py-2 text-right font-black text-amber-200 dark:bg-emerald-950/80"
                >
                  KH{selectedYear}
                </th>
                <th
                  colSpan={12}
                  className="border border-emerald-500/40 px-3 py-1.5 text-center font-bold uppercase tracking-wider text-[11px]"
                >
                  {selectedYear} {selectedLine?.code || selectedLine?.name}
                </th>
              </tr>

              {/* Header Row 2: Months T01 -> T12 */}
              <tr className="bg-emerald-700 text-white dark:bg-emerald-900 text-[11px]">
                {indicators.months.map((m) => (
                  <th
                    key={m}
                    className="min-w-[76px] border border-emerald-600/40 px-2 py-1.5 text-center font-semibold"
                  >
                    <div>{`T${m.toString().padStart(2, '0')}`}</div>
                    <div className="text-[10px] opacity-75 font-normal">{m}</div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-border text-foreground">
              {/* Section Header I */}
              <tr className="bg-muted/70 font-bold text-foreground">
                <td className="border border-border px-3 py-2 text-center">I</td>
                <td colSpan={15} className="border border-border px-3 py-2 uppercase tracking-wide text-primary">
                  Kế hoạch sản lượng, năng suất, thời gian
                </td>
              </tr>

              {/* Row 1: Số giờ trong tháng */}
              <tr className="hover:bg-muted/30">
                <td className="border border-border px-3 py-1.5 text-center text-muted-foreground">1</td>
                <td className="border border-border px-3 py-1.5 font-medium">Số giờ trong tháng</td>
                <td className="border border-border px-2 py-1.5 text-center text-muted-foreground">Giờ</td>
                <td className="border border-border bg-muted/40 px-3 py-1.5 text-right font-bold text-foreground">
                  {formatNumber(indicators.totalCalendarHours)}
                </td>
                {indicators.calendarHours.map((h, i) => (
                  <td key={i} className="border border-border px-2 py-1.5 text-right">
                    {formatNumber(h)}
                  </td>
                ))}
              </tr>

              {/* Row 2: Năng suất dây chuyền */}
              <tr className="hover:bg-muted/30">
                <td className="border border-border px-3 py-1.5 text-center text-muted-foreground">2</td>
                <td className="border border-border px-3 py-1.5 font-medium">Năng suất dây chuyền</td>
                <td className="border border-border px-2 py-1.5 text-center text-muted-foreground">Tấn/Giờ</td>
                <td className="border border-border bg-muted/40 px-3 py-1.5 text-right font-bold text-foreground">
                  {indicators.avgCapacity > 0 ? indicators.avgCapacity.toFixed(1) : '-'}
                </td>
                {indicators.capacities.map((c, i) => (
                  <td key={i} className="border border-border px-2 py-1.5 text-right">
                    {c > 0 ? c.toFixed(1) : '-'}
                  </td>
                ))}
              </tr>

              {/* Row 3: Hiệu suất */}
              <tr className="hover:bg-muted/30">
                <td className="border border-border px-3 py-1.5 text-center text-muted-foreground">3</td>
                <td className="border border-border px-3 py-1.5 font-medium">Hiệu suất thu hồi</td>
                <td className="border border-border px-2 py-1.5 text-center text-muted-foreground">%</td>
                <td className="border border-border bg-muted/40 px-3 py-1.5 text-right font-bold text-foreground">
                  {indicators.avgRecoveryRate > 0 ? `${indicators.avgRecoveryRate.toFixed(2)}%` : '-'}
                </td>
                {indicators.recoveryRates.map((r, i) => (
                  <td key={i} className="border border-border px-2 py-1.5 text-right">
                    {r > 0 ? `${r.toFixed(2)}%` : '-'}
                  </td>
                ))}
              </tr>

              {/* Row 4: Năng suất sản phẩm */}
              <tr className="hover:bg-muted/30">
                <td className="border border-border px-3 py-1.5 text-center text-muted-foreground">4</td>
                <td className="border border-border px-3 py-1.5 font-medium">Năng suất sản phẩm</td>
                <td className="border border-border px-2 py-1.5 text-center text-muted-foreground">Tấn/Giờ</td>
                <td className="border border-border bg-muted/40 px-3 py-1.5 text-right font-bold text-foreground">
                  {indicators.avgProductProductivity > 0
                    ? indicators.avgProductProductivity.toFixed(1)
                    : '-'}
                </td>
                {indicators.productProductivities.map((p, i) => (
                  <td key={i} className="border border-border px-2 py-1.5 text-right">
                    {p > 0 ? p.toFixed(1) : '-'}
                  </td>
                ))}
              </tr>

              {/* Row 5: Giờ bảo trì */}
              <tr className="hover:bg-muted/30">
                <td className="border border-border px-3 py-1.5 text-center text-muted-foreground">5</td>
                <td className="border border-border px-3 py-1.5 font-medium">Giờ bảo trì</td>
                <td className="border border-border px-2 py-1.5 text-center text-muted-foreground">Giờ</td>
                <td className="border border-border bg-muted/40 px-3 py-1.5 text-right font-bold text-foreground">
                  {formatNumber(indicators.totalMaintenanceHours, 1)}
                </td>
                {indicators.maintenanceHours.map((h, i) => (
                  <td key={i} className="border border-border px-2 py-1.5 text-right">
                    {formatNumber(h, 1)}
                  </td>
                ))}
              </tr>

              {/* Row 6: Giờ nghỉ trong KH */}
              <tr className="hover:bg-muted/30">
                <td className="border border-border px-3 py-1.5 text-center text-muted-foreground">6</td>
                <td className="border border-border px-3 py-1.5 font-medium">Giờ nghỉ trong KH</td>
                <td className="border border-border px-2 py-1.5 text-center text-muted-foreground">Giờ</td>
                <td className="border border-border bg-muted/40 px-3 py-1.5 text-right font-bold text-foreground">
                  {formatNumber(indicators.totalShutdownHours, 1)}
                </td>
                {indicators.shutdownHours.map((h, i) => (
                  <td key={i} className="border border-border px-2 py-1.5 text-right">
                    {formatNumber(h, 1)}
                  </td>
                ))}
              </tr>

              {/* Row 7: Giờ sự cố */}
              <tr className="hover:bg-muted/30">
                <td className="border border-border px-3 py-1.5 text-center text-muted-foreground">7</td>
                <td className="border border-border px-3 py-1.5 font-medium">Giờ sự cố (dự kiến)</td>
                <td className="border border-border px-2 py-1.5 text-center text-muted-foreground">Giờ</td>
                <td className="border border-border bg-muted/40 px-3 py-1.5 text-right font-bold text-foreground">
                  {formatNumber(indicators.totalBreakdownHours, 1)}
                </td>
                {indicators.breakdownHours.map((h, i) => (
                  <td key={i} className="border border-border px-2 py-1.5 text-right">
                    {formatNumber(h, 1)}
                  </td>
                ))}
              </tr>

              {/* Row 8: Thời gian vận hành */}
              <tr className="hover:bg-muted/30">
                <td className="border border-border px-3 py-1.5 text-center text-muted-foreground">8</td>
                <td className="border border-border px-3 py-1.5 font-medium">Thời gian vận hành</td>
                <td className="border border-border px-2 py-1.5 text-center text-muted-foreground">Giờ</td>
                <td className="border border-border bg-muted/40 px-3 py-1.5 text-right font-bold text-foreground">
                  {formatNumber(indicators.totalOperatingHours, 1)}
                </td>
                {indicators.operatingHours.map((h, i) => (
                  <td key={i} className="border border-border px-2 py-1.5 text-right">
                    {formatNumber(h, 1)}
                  </td>
                ))}
              </tr>

              {/* Row 9: Chất lượng */}
              <tr className="hover:bg-muted/30">
                <td className="border border-border px-3 py-1.5 text-center text-muted-foreground">9</td>
                <td className="border border-border px-3 py-1.5 font-medium">Tỷ lệ chất lượng đạt chuẩn</td>
                <td className="border border-border px-2 py-1.5 text-center text-muted-foreground">%</td>
                <td className="border border-border bg-muted/40 px-3 py-1.5 text-right font-bold text-foreground">
                  {formatPercent(indicators.avgQualityRate)}
                </td>
                {indicators.qualityRates.map((q, i) => (
                  <td key={i} className="border border-border px-2 py-1.5 text-right">
                    {formatPercent(q)}
                  </td>
                ))}
              </tr>

              {/* Row 10: KH SẢN LƯỢNG (ẩm 4.5%) - HIGHLIGHTED ROW (Excel Yellow Style) */}
              <tr className="bg-amber-300 font-extrabold text-amber-950 dark:bg-amber-500/25 dark:text-amber-200">
                <td className="border border-amber-400 px-3 py-2 text-center dark:border-amber-800">10</td>
                <td className="border border-amber-400 px-3 py-2 uppercase dark:border-amber-800">
                  KH sản lượng (ẩm 4.5%)
                </td>
                <td className="border border-amber-400 px-2 py-2 text-center dark:border-amber-800">Tấn</td>
                <td className="border border-amber-400 bg-amber-400/80 px-3 py-2 text-right text-sm font-black dark:border-amber-800 dark:bg-amber-500/40">
                  {formatNumber(indicators.totalOutputTons)}
                </td>
                {indicators.outputTons.map((tons, i) => (
                  <td
                    key={i}
                    className="border border-amber-400 px-2 py-2 text-right font-black dark:border-amber-800"
                  >
                    {formatNumber(tons)}
                  </td>
                ))}
              </tr>

              {/* Sub-rows: Distinct Products (e.g. S80, S60...) */}
              {indicators.productRows.map((prod) => (
                <tr key={prod.name} className="hover:bg-muted/20">
                  <td className="border border-border px-3 py-1.5 text-center text-muted-foreground">-</td>
                  <td className="border border-border px-3 py-1.5 pl-8 text-muted-foreground font-medium">
                    {prod.name}
                  </td>
                  <td className="border border-border px-2 py-1.5 text-center text-muted-foreground">Tấn</td>
                  <td className="border border-border bg-muted/40 px-3 py-1.5 text-right font-bold text-foreground">
                    {formatNumber(prod.total)}
                  </td>
                  {prod.monthVals.map((val, i) => (
                    <td key={i} className="border border-border px-2 py-1.5 text-right text-muted-foreground">
                      {formatNumber(val)}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Sub-rows: Distinct Byproducts (e.g. FNS, LIC, MagMin, VFS, Oversize, Bùn hồ...) */}
              {indicators.byproductRows.map((byp) => (
                <tr key={byp.name} className="hover:bg-muted/20">
                  <td className="border border-border px-3 py-1.5 text-center text-muted-foreground">-</td>
                  <td className="border border-border px-3 py-1.5 pl-8 text-muted-foreground font-medium">
                    {byp.name}
                  </td>
                  <td className="border border-border px-2 py-1.5 text-center text-muted-foreground">Tấn</td>
                  <td className="border border-border bg-muted/40 px-3 py-1.5 text-right font-bold text-foreground">
                    {formatNumber(byp.total)}
                  </td>
                  {byp.monthVals.map((val, i) => (
                    <td key={i} className="border border-border px-2 py-1.5 text-right text-muted-foreground">
                      {formatNumber(val)}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Row 11: Trạng thái & Thao tác từng tháng */}
              <tr className="bg-muted/30">
                <td className="border border-border px-3 py-2 text-center text-muted-foreground">11</td>
                <td className="border border-border px-3 py-2 font-medium">Trạng thái kế hoạch</td>
                <td className="border border-border px-2 py-2 text-center text-muted-foreground">-</td>
                <td className="border border-border bg-muted/40 px-3 py-2 text-right text-[11px] font-semibold text-muted-foreground">
                  {plannedMonthsCount}/12 Tháng
                </td>
                {indicators.months.map((m) => {
                  const plan = monthMap.get(m);
                  return (
                    <td key={m} className="border border-border px-1 py-1.5 text-center">
                      {plan ? (
                        <div className="flex flex-col items-center gap-1">
                          <PlanStatusBadge status={plan.status} />
                          {onViewMonthPlan && (
                            <button
                              type="button"
                              onClick={() => onViewMonthPlan(plan)}
                              className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] text-primary hover:bg-primary/10 transition-colors"
                              title={`Xem chi tiết kế hoạch tháng ${m}`}
                            >
                              <Eye className="h-3 w-3" />
                              <span>Chi tiết</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] text-muted-foreground/60 italic">Chưa lập</span>
                          {canManage && onCreateMonthPlan && selectedLineId && (
                            <button
                              type="button"
                              onClick={() => onCreateMonthPlan(selectedYear, m, selectedLineId)}
                              className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
                              title={`Tạo kế hoạch cho tháng ${m}/${selectedYear}`}
                            >
                              <PlusCircle className="h-3 w-3" />
                              <span>Tạo</span>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Empty state when no data exists */}
        {!isLoading && plans.length === 0 && (
          <div className="p-6 text-center text-xs text-muted-foreground border-t border-border">
            Chưa có kế hoạch tháng nào được lập cho dây chuyền{' '}
            <span className="font-semibold text-foreground">{selectedLine?.name}</span> trong năm{' '}
            <span className="font-semibold text-foreground">{selectedYear}</span>. Bạn có thể bấm vào nút "Tạo" ở các cột tháng để bắt đầu lập kế hoạch.
          </div>
        )}
      </div>
    </div>
  );
};
