import React, { useState } from 'react';
import {
  Filter,
  AlertTriangle,
  Clock,
  Wrench,
  Layers,
} from 'lucide-react';
import { useProductionIncidents } from '../hooks/use-production-incidents';
import { ParetoChart } from './pareto-chart';
import { IncidentAIInsights } from './incident-ai-insights';
import { IncidentHistoryTable } from './incident-history-table';
import type { ProductionLine, IncidentAnalyticsFilters } from '../types';
import { cn } from '@/lib/utils';

interface IncidentAnalyticsTabProps {
  lines: ProductionLine[];
}

export const IncidentAnalyticsTab: React.FC<IncidentAnalyticsTabProps> = ({ lines }) => {
  const [filters, setFilters] = useState<IncidentAnalyticsFilters>({
    lineId: 'all',
    downtimeType: 'all',
    dimension: 'incident_category',
    fromDate: '',
    toDate: '',
    search: '',
  });

  const {
    incidents,
    frequencyPareto,
    durationPareto,
    totalIncidents,
    totalHours,
    aiInsights,
    isLoading,
  } = useProductionIncidents(filters);

  // Breakdown counts & hours by primary type
  const incidentCount = incidents.filter((r) => r.type === 'breakdown_incident').length;
  const maintenanceCount = incidents.filter((r) => r.type === 'planned_maintenance').length;
  const shutdownCount = incidents.filter((r) => r.type === 'scheduled_shutdown').length;

  const incidentHours = Number(
    incidents
      .filter((r) => r.type === 'breakdown_incident')
      .reduce((sum, r) => sum + r.duration_hours, 0)
      .toFixed(1),
  );
  const maintenanceHours = Number(
    incidents
      .filter((r) => r.type === 'planned_maintenance')
      .reduce((sum, r) => sum + r.duration_hours, 0)
      .toFixed(1),
  );
  const shutdownHours = Number(
    incidents
      .filter((r) => r.type === 'scheduled_shutdown')
      .reduce((sum, r) => sum + r.duration_hours, 0)
      .toFixed(1),
  );

  const handlePresetDate = (preset: 'all' | 'this_month' | 'this_year') => {
    const now = new Date();
    if (preset === 'all') {
      setFilters((prev) => ({ ...prev, fromDate: '', toDate: '' }));
    } else if (preset === 'this_month') {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
      setFilters((prev) => ({
        ...prev,
        fromDate: `${year}-${month}-01`,
        toDate: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
      }));
    } else if (preset === 'this_year') {
      const year = now.getFullYear();
      setFilters((prev) => ({
        ...prev,
        fromDate: `${year}-01-01`,
        toDate: `${year}-12-31`,
      }));
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* 1. Filter Control Bar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Bộ Lọc Thống Kê Sự Cố & Dừng Chuyền
            </h3>
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] text-muted-foreground hidden sm:inline">Khoảng thời gian:</span>
            <button
              type="button"
              onClick={() => handlePresetDate('all')}
              className={cn(
                'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                !filters.fromDate && !filters.toDate
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              Toàn bộ
            </button>
            <button
              type="button"
              onClick={() => handlePresetDate('this_month')}
              className={cn(
                'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                filters.fromDate && filters.fromDate.endsWith('-01')
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              Tháng này
            </button>
            <button
              type="button"
              onClick={() => handlePresetDate('this_year')}
              className="rounded px-2.5 py-1 text-xs font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              Năm nay
            </button>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Dimension Selector (Phân loại sự cố vs Mã thiết bị) */}
          <div>
            <label className="block text-[11px] font-semibold text-foreground">
              Chiều phân tích Pareto *
            </label>
            <div className="mt-1 flex rounded-lg border border-border bg-background p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, dimension: 'incident_category' }))}
                className={cn(
                  'flex-1 rounded-md py-1 text-xs font-medium transition-all text-center',
                  filters.dimension === 'incident_category'
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Theo Phân loại sự cố
              </button>
              <button
                type="button"
                onClick={() => setFilters((prev) => ({ ...prev, dimension: 'equipment_code' }))}
                className={cn(
                  'flex-1 rounded-md py-1 text-xs font-medium transition-all text-center',
                  filters.dimension === 'equipment_code'
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Theo Mã thiết bị
              </button>
            </div>
          </div>

          {/* Dây chuyền sản xuất */}
          <div>
            <label className="block text-[11px] font-semibold text-foreground">
              Dây chuyền sản xuất
            </label>
            <select
              value={filters.lineId || 'all'}
              onChange={(e) => setFilters((prev) => ({ ...prev, lineId: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
            >
              <option value="all">Tất cả dây chuyền</option>
              {lines.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.code} - {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Loại dừng máy */}
          <div>
            <label className="block text-[11px] font-semibold text-foreground">
              Loại dừng máy
            </label>
            <select
              value={filters.downtimeType || 'all'}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  downtimeType: e.target.value as IncidentAnalyticsFilters['downtimeType'],
                }))
              }
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
            >
              <option value="all">Tất cả (Sự cố + Bảo trì + Nghỉ KH)</option>
              <option value="breakdown_incident">Chỉ sự cố dừng chuyền</option>
              <option value="planned_maintenance">Chỉ dừng bảo trì</option>
              <option value="scheduled_shutdown">Chỉ nghỉ kế hoạch</option>
            </select>
          </div>

          {/* Date range pickers */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="block text-[11px] font-medium text-muted-foreground">
                Từ ngày
              </label>
              <input
                type="date"
                value={filters.fromDate || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-medium text-muted-foreground">
                Đến ngày
              </label>
              <input
                type="date"
                value={filters.toDate || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total downtime incidents */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Tổng số lần dừng chuyền</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {totalIncidents} <span className="text-xs font-normal text-muted-foreground">lần</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="text-rose-600 font-medium">{incidentCount} sự cố</span>
            <span>•</span>
            <span className="text-amber-600 font-medium">{maintenanceCount} bảo trì</span>
            <span>•</span>
            <span className="text-blue-600 font-medium">{shutdownCount} nghỉ KH</span>
          </div>
        </div>

        {/* Total downtime hours */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Tổng thời gian dừng máy</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {totalHours} <span className="text-xs font-normal text-muted-foreground">giờ</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="text-rose-600 font-medium">{incidentHours}h sự cố</span>
            <span>•</span>
            <span className="text-amber-600 font-medium">{maintenanceHours}h bảo trì</span>
            <span>•</span>
            <span className="text-blue-600 font-medium">{shutdownHours}h nghỉ KH</span>
          </div>
        </div>

        {/* Pareto 80% Vital Causes count */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Số nhóm thuộc Pareto 80%</span>
            <Layers className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {durationPareto.filter((p) => p.is_in_vital_few).length} / {durationPareto.length}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            20% nhóm gây ra 80% thời gian tổn thất
          </div>
        </div>

        {/* Top bottleneck equipment */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Điểm nghẽn nghiêm trọng nhất</span>
            <Wrench className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 text-base font-bold text-rose-600 dark:text-rose-400 truncate" title={durationPareto[0]?.label}>
            {durationPareto[0]?.label || '---'}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Chiếm {durationPareto[0]?.percentage || 0}% ({durationPareto[0]?.duration_hours || 0}h)
          </div>
        </div>
      </div>

      {/* 3. The 2 Pareto Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Pareto 1: Frequency (Số lần dừng chuyền) */}
        <ParetoChart
          title="1. Biểu đồ Pareto Số Lần Dừng Chuyền (Tần Suất)"
          subtitle={`Phân tích số lần phát sinh theo ${filters.dimension === 'equipment_code' ? 'mã thiết bị' : 'phân loại sự cố'}`}
          items={frequencyPareto}
          metricType="count"
          unitLabel="Số lần dừng"
        />

        {/* Pareto 2: Duration (Thời gian dừng chuyền) */}
        <ParetoChart
          title="2. Biểu đồ Pareto Thời Gian Dừng Chuyền (Thời Lượng)"
          subtitle={`Phân tích tổng số giờ tê liệt chuyền theo ${filters.dimension === 'equipment_code' ? 'mã thiết bị' : 'phân loại sự cố'}`}
          items={durationPareto}
          metricType="hours"
          unitLabel="Giờ dừng"
        />
      </div>

      {/* 4. AI Incident Root Cause & Actionable Insights */}
      <IncidentAIInsights
        insights={aiInsights}
        frequencyPareto={frequencyPareto}
        durationPareto={durationPareto}
        totalIncidents={totalIncidents}
        totalHours={totalHours}
        dimension={filters.dimension || 'incident_category'}
      />

      {/* 5. Incident History Table */}
      <IncidentHistoryTable records={incidents} isLoading={isLoading} />
    </div>
  );
};
