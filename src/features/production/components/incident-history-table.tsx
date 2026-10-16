import React, { useState } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Wrench,
  AlertTriangle,
  PauseCircle,
  FileSpreadsheet,
} from 'lucide-react';
import type { DowntimeIncidentRecord } from '../types';
import { cn } from '@/lib/utils';

interface IncidentHistoryTableProps {
  records: DowntimeIncidentRecord[];
  isLoading?: boolean;
}

export const IncidentHistoryTable: React.FC<IncidentHistoryTableProps> = ({
  records,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const filteredRecords = records.filter((r) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase().trim();
    return (
      r.reason.toLowerCase().includes(q) ||
      (r.equipment_code && r.equipment_code.toLowerCase().includes(q)) ||
      (r.incident_category && r.incident_category.toLowerCase().includes(q)) ||
      (r.action_taken && r.action_taken.toLowerCase().includes(q)) ||
      r.shift_code?.toLowerCase().includes(q) ||
      r.line_name?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize);

  const handleExportCSV = () => {
    if (records.length === 0) return;
    const headers = [
      'Ngày',
      'Ca',
      'Mã Line',
      'Mã thiết bị',
      'Loại dừng',
      'Phân loại chi tiết',
      'Từ giờ',
      'Đến giờ',
      'Thời lượng (giờ)',
      'Thời lượng (phút)',
      'Lý do / Hiện tượng',
      'Biện pháp xử lý',
    ];

    const rows = filteredRecords.map((r) => [
      r.shift_date,
      `Ca ${r.shift_number}`,
      r.line_code || '',
      r.equipment_code || '',
      r.type === 'breakdown_incident'
        ? 'Sự cố'
        : r.type === 'planned_maintenance'
        ? 'Bảo trì'
        : 'Nghỉ kế hoạch',
      r.incident_category || r.maintenance_type || r.shutdown_type || '',
      r.start_time,
      r.end_time,
      r.duration_hours,
      r.duration_minutes,
      `"${(r.reason || '').replace(/"/g, '""')}"`,
      `"${(r.action_taken || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lich_su_su_co_dung_chuyen_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-xs overflow-hidden">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 bg-muted/20">
        <div>
          <h3 className="text-sm font-bold text-foreground">
            Lịch Sử Sự Cố & Dừng Chuyền Chi Tiết
          </h3>
          <p className="text-xs text-muted-foreground">
            Tổng hợp toàn bộ các lần dừng máy ghi nhận từ nhật ký ca sản xuất ({filteredRecords.length} lần dừng)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm theo mã máy, lý do, phân loại..."
              className="h-8 w-56 rounded-lg border border-input bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Export button */}
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredRecords.length === 0}
            className="inline-flex items-center gap-1.5 h-8 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            Xuất Excel/CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
            <tr>
              <th className="px-3.5 py-2.5">Ngày & Ca</th>
              <th className="px-3 py-2.5 text-center">Line</th>
              <th className="px-3 py-2.5 text-center">Mã thiết bị</th>
              <th className="px-3 py-2.5">Loại dừng</th>
              <th className="px-3 py-2.5">Phân loại chi tiết</th>
              <th className="px-3 py-2.5 text-center">Khung giờ</th>
              <th className="px-3 py-2.5 text-center">Thời lượng</th>
              <th className="px-3.5 py-2.5">Hiện tượng / Lý do</th>
              <th className="px-3.5 py-2.5">Biện pháp xử lý / Khắc phục</th>
            </tr>
          </thead>
          <tbody className="divide-y border-border text-foreground">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-muted-foreground">
                  Đang tải dữ liệu lịch sử sự cố...
                </td>
              </tr>
            ) : paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-muted-foreground">
                  Không tìm thấy lần dừng máy nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              paginatedRecords.map((r) => {
                const isInc = r.type === 'breakdown_incident';
                const isMaint = r.type === 'planned_maintenance';
                const detailType = isInc
                  ? r.incident_category
                  : isMaint
                  ? r.maintenance_type
                  : r.shutdown_type;

                return (
                  <tr key={r.id} className="transition-colors hover:bg-muted/30">
                    {/* Ngày & Ca */}
                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                      <div className="font-semibold text-foreground">{r.shift_date}</div>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        Ca {r.shift_number} ({r.shift_code})
                      </span>
                    </td>

                    {/* Mã Line */}
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <span className="rounded bg-primary/10 px-2 py-0.5 font-mono font-bold text-xs text-primary">
                        {r.line_code || 'LINE'}
                      </span>
                    </td>

                    {/* Mã thiết bị */}
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      {r.equipment_code ? (
                        <span
                          className="inline-block rounded font-mono font-bold text-xs bg-muted px-2 py-0.5 text-foreground border border-border/60"
                          title={r.equipment_name || undefined}
                        >
                          {r.equipment_code}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">Toàn line</span>
                      )}
                    </td>

                    {/* Loại dừng */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
                          isInc
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : isMaint
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
                        )}
                      >
                        {isInc ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : isMaint ? (
                          <Wrench className="h-3 w-3" />
                        ) : (
                          <PauseCircle className="h-3 w-3" />
                        )}
                        {isInc ? 'Sự cố' : isMaint ? 'Bảo trì' : 'Nghỉ KH'}
                      </span>
                    </td>

                    {/* Phân loại chi tiết */}
                    <td className="px-3 py-2.5 text-foreground font-medium whitespace-nowrap">
                      {detailType || '---'}
                    </td>

                    {/* Khung giờ */}
                    <td className="px-3 py-2.5 text-center font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {(r.start_time.includes('T') ? r.start_time.split('T')[1]?.slice(0, 5) : r.start_time) || r.start_time} →{' '}
                      {(r.end_time.includes('T') ? r.end_time.split('T')[1]?.slice(0, 5) : r.end_time) || r.end_time}
                    </td>

                    {/* Thời lượng */}
                    <td className="px-3 py-2.5 text-center font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      {r.duration_hours}h{' '}
                      <span className="text-[10px] font-normal text-muted-foreground">
                        ({r.duration_minutes}p)
                      </span>
                    </td>

                    {/* Hiện tượng / Lý do */}
                    <td className="px-3.5 py-2.5 text-foreground max-w-xs truncate" title={r.reason}>
                      {r.reason || '---'}
                    </td>

                    {/* Biện pháp xử lý */}
                    <td
                      className="px-3.5 py-2.5 text-muted-foreground max-w-xs truncate"
                      title={r.action_taken || undefined}
                    >
                      {r.action_taken || '---'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
        <div>
          Hiển thị{' '}
          <span className="font-semibold text-foreground">
            {filteredRecords.length > 0 ? (page - 1) * pageSize + 1 : 0}
          </span>{' '}
          đến{' '}
          <span className="font-semibold text-foreground">
            {Math.min(page * pageSize, filteredRecords.length)}
          </span>{' '}
          trong tổng số <span className="font-semibold text-foreground">{filteredRecords.length}</span> lần dừng
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
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
            onClick={() => setPage(page + 1)}
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
