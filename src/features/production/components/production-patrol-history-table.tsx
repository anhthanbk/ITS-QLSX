import React, { useState } from 'react';
import {
  Search,
  RotateCcw,
  QrCode,
  AlertTriangle,
  Printer,
  CheckCircle2,
  Clock,
  Wrench,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  HardHat,
  Check,
  Plus,
  Maximize2,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type {
  PatrolArea,
  PatrolLog,
  PatrolFilterParams,
} from '../types';

interface ProductionPatrolHistoryTableProps {
  logs: PatrolLog[];
  areas: PatrolArea[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  filters: PatrolFilterParams;
  onFilterChange: (filters: PatrolFilterParams) => void;
  isLoading: boolean;
  onOpenScanner: () => void;
  onOpenQuickIncident: () => void;
  onOpenPrintQr: () => void;
  onOpenCreateArea: () => void;
}

export const ProductionPatrolHistoryTable: React.FC<ProductionPatrolHistoryTableProps> = ({
  logs,
  areas,
  totalCount,
  currentPage,
  totalPages,
  filters,
  onFilterChange,
  isLoading,
  onOpenScanner,
  onOpenQuickIncident,
  onOpenPrintQr,
  onOpenCreateArea,
}) => {
  // Lightbox preview ảnh sự cố / sau khắc phục
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  // KPI computations from logs
  const normalLogsCount = logs.filter((l) => !l.has_issue).length;
  const normalPct = logs.length > 0 ? Math.round((normalLogsCount / logs.length) * 100) : 100;

  // Incident resolution counts
  const allIncidents = logs.flatMap((l) => l.incidents || []);
  const resolvedCount = allIncidents.filter((i) => i.resolution_type === 'resolved').length;
  const scheduledCount = allIncidents.filter((i) => i.resolution_type === 'maintenance_scheduled').length;

  return (
    <div className="space-y-4">
      {/* 4 KPI Summary Cards for Patrols */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tổng lượt tuần kiểm</span>
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">{totalCount}</span>
            <span className="text-xs text-muted-foreground">lượt quét</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tỷ lệ bình thường</span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {normalPct}%
            </span>
            <span className="text-xs text-muted-foreground">{normalLogsCount}/{logs.length} ca</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Đã xử lý tại chỗ</span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <Check className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">{resolvedCount}</span>
            <span className="text-xs text-muted-foreground">sự cố khắc phục ngay</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Đưa vào bảo dưỡng</span>
            <div className="rounded-lg bg-rose-500/10 p-2 text-rose-500">
              <Wrench className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
              {scheduledCount}
            </span>
            <span className="text-xs text-muted-foreground">phiếu bảo trì đã tạo</span>
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">
              Lịch sử quét QR & Tuần kiểm thiết bị
            </h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {totalCount} bản ghi
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Button 0: Tạo QR khu vực mới */}
            <button
              type="button"
              onClick={onOpenCreateArea}
              className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3.5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
            >
              <Plus className="h-4 w-4" />
              <span>Tạo QR khu vực</span>
            </button>

            {/* Button 1: Quét QR Tuần kiểm */}
            <button
              type="button"
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              <QrCode className="h-4 w-4" />
              <span>Quét QR tuần kiểm</span>
            </button>

            {/* Button 2: Báo sự cố nhanh */}
            <button
              type="button"
              onClick={onOpenQuickIncident}
              className="flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 shadow-sm transition-colors hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/50"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Báo sự cố nhanh</span>
            </button>

            {/* Button 3: In mã QR các khu vực */}
            <button
              type="button"
              onClick={onOpenPrintQr}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Printer className="h-4 w-4" />
              <span>In mã QR khu vực</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-5">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value, page: 1 })}
              placeholder="Tìm công nhân, ghi chú..."
              className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* Area Filter */}
          <div>
            <select
              value={filters.areaId || 'all'}
              onChange={(e) => onFilterChange({ ...filters, areaId: e.target.value, page: 1 })}
              className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="all">Tất cả khu vực tuần kiểm</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.area_code} - {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Result Filter */}
          <div>
            <select
              value={filters.hasIssue || 'all'}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  hasIssue: e.target.value as 'all' | 'normal' | 'has_issue',
                  page: 1,
                })
              }
              className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="all">Tất cả kết quả</option>
              <option value="normal">✅ Thiết bị bình thường</option>
              <option value="has_issue">🚨 Có sự cố phát hiện</option>
            </select>
          </div>

          {/* From Date */}
          <div>
            <input
              type="date"
              value={filters.fromDate || ''}
              onChange={(e) => onFilterChange({ ...filters, fromDate: e.target.value, page: 1 })}
              className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* To Date & Reset */}
          <div className="flex gap-1.5">
            <input
              type="date"
              value={filters.toDate || ''}
              onChange={(e) => onFilterChange({ ...filters, toDate: e.target.value, page: 1 })}
              className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={() =>
                onFilterChange({
                  search: '',
                  areaId: 'all',
                  hasIssue: 'all',
                  fromDate: '',
                  toDate: '',
                  page: 1,
                })
              }
              title="Đặt lại bộ lọc"
              className="flex items-center justify-center rounded-lg border border-border px-2.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Thời điểm quét</th>
                <th className="px-4 py-3 font-semibold">Khu vực tuần kiểm</th>
                <th className="px-4 py-3 font-semibold">Công nhân</th>
                <th className="px-4 py-3 font-semibold text-center">Thiết bị kiểm</th>
                <th className="px-4 py-3 font-semibold">Kết quả tuần kiểm</th>
                <th className="px-4 py-3 font-semibold">Chi tiết sự cố & Phương án xử lý</th>
                <th className="px-4 py-3 font-semibold">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Đang tải lịch sử tuần kiểm thiết bị...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Không tìm thấy lịch sử tuần kiểm nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const scannedDate = new Date(log.scanned_at);
                  const incidents = log.incidents || [];

                  return (
                    <tr
                      key={log.id}
                      className={cn(
                        'transition-colors hover:bg-muted/40',
                        log.has_issue && 'bg-rose-50/20 dark:bg-rose-950/10',
                      )}
                    >
                      {/* Scanned Time */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="font-semibold text-foreground">
                          {format(scannedDate, 'HH:mm:ss', { locale: vi })}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {format(scannedDate, 'dd/MM/yyyy', { locale: vi })}
                        </div>
                      </td>

                      {/* Area */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
                            {log.area_code || 'KV'}
                          </span>
                          <span className="font-medium text-foreground">{log.area_name}</span>
                        </div>
                      </td>

                      {/* Inspector */}
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <HardHat className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{log.inspector_name}</span>
                        </div>
                      </td>

                      {/* Checked machines count */}
                      <td className="whitespace-nowrap px-4 py-3 text-center">
                        <span className="rounded-full bg-muted px-2 py-0.5 font-semibold text-foreground">
                          {log.checked_machines_count} máy
                        </span>
                      </td>

                      {/* Result Badge */}
                      <td className="whitespace-nowrap px-4 py-3">
                        {log.has_issue ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                            <AlertTriangle className="h-3 w-3" />
                            Phát hiện sự cố
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            Bình thường
                          </span>
                        )}
                      </td>

                      {/* Incidents & Resolutions */}
                      <td className="px-4 py-3">
                        {incidents.length === 0 ? (
                          <span className="text-[11px] text-muted-foreground">
                            Không có bất thường
                          </span>
                        ) : (
                          <div className="space-y-1.5">
                            {incidents.map((inc) => (
                              <div
                                key={inc.id}
                                className="rounded border border-border bg-card p-2 text-[11px] shadow-2xs space-y-1"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-mono font-bold text-foreground">
                                    {inc.machine_code}: {inc.machine_name}
                                  </span>
                                  {/* Resolution Badge */}
                                  {inc.resolution_type === 'resolved' && (
                                    <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 font-medium text-emerald-600 dark:text-emerald-400">
                                      <Check className="h-2.5 w-2.5" />
                                      Đã xử lý tại chỗ
                                    </span>
                                  )}
                                  {inc.resolution_type === 'temporary_fix' && (
                                    <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 font-medium text-amber-600 dark:text-amber-400">
                                      <Clock className="h-2.5 w-2.5" />
                                      Xử lý tạm thời
                                    </span>
                                  )}
                                  {inc.resolution_type === 'maintenance_scheduled' && (
                                    <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-1.5 py-0.5 font-medium text-rose-600 dark:text-rose-400">
                                      <Wrench className="h-2.5 w-2.5" />
                                      Đưa vào bảo dưỡng
                                    </span>
                                  )}
                                </div>
                                <div className="text-muted-foreground">
                                  <span className="font-semibold text-foreground">
                                    {inc.condition_type}:
                                  </span>{' '}
                                  {inc.description}
                                </div>

                                {/* Incident & Resolution Photos */}
                                {(inc.incident_image_url || inc.resolution_image_url) && (
                                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/40">
                                    {inc.incident_image_url && (
                                      <button
                                        type="button"
                                        onClick={() => setPreviewImage({ url: inc.incident_image_url!, title: `Ảnh sự cố [${inc.machine_code}] ${inc.incident_code}` })}
                                        className="group inline-flex items-center gap-1 rounded border border-rose-500/30 bg-rose-500/5 px-1.5 py-0.5 text-[10px] text-rose-700 dark:text-rose-300 hover:bg-rose-500/15 transition-all"
                                      >
                                        <img src={inc.incident_image_url} alt="Sự cố" className="h-4 w-4 rounded object-cover" />
                                        <span className="font-medium">Ảnh sự cố</span>
                                        <Maximize2 className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100" />
                                      </button>
                                    )}
                                    {inc.resolution_image_url && (
                                      <button
                                        type="button"
                                        onClick={() => setPreviewImage({ url: inc.resolution_image_url!, title: `Ảnh sau khắc phục [${inc.machine_code}] ${inc.incident_code}` })}
                                        className="group inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/5 px-1.5 py-0.5 text-[10px] text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15 transition-all"
                                      >
                                        <img src={inc.resolution_image_url} alt="Sau khắc phục" className="h-4 w-4 rounded object-cover" />
                                        <span className="font-medium">Sau khắc phục</span>
                                        <Maximize2 className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="px-4 py-3 text-muted-foreground">
                        {log.notes || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-xs text-muted-foreground">
              Trang {currentPage} / {totalPages} (Tổng {totalCount} lượt tuần kiểm)
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => onFilterChange({ ...filters, page: currentPage - 1 })}
                className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-foreground hover:bg-muted disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Trước</span>
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => onFilterChange({ ...filters, page: currentPage + 1 })}
                className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs text-foreground hover:bg-muted disabled:opacity-40"
              >
                <span>Sau</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Modal xem ảnh toàn màn hình */}
      {previewImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative flex flex-col max-h-[92vh] max-w-4xl overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between bg-zinc-900/90 px-4 py-3 text-white border-b border-zinc-800">
              <span className="text-sm font-semibold truncate pr-4">{previewImage.title}</span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="rounded-full bg-zinc-800 p-1.5 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                title="Đóng (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3 flex items-center justify-center bg-zinc-950">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[78vh] w-auto max-w-full rounded-lg object-contain shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
