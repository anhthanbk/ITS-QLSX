import {
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Cpu,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Machine, PaginatedResult } from '../types';

import { MachineStatusBadge } from './maintenance-badges';

export interface MachineTableProps {
  data?: PaginatedResult<Machine>;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onPageChange: (newPage: number) => void;
  onViewDetail: (machine: Machine) => void;
  onEdit: (machine: Machine) => void;
  onDelete: (machine: Machine) => void;
  canManage: boolean;
  onOpenCreate?: () => void;
}

export const MachineTable: React.FC<MachineTableProps> = ({
  data,
  isLoading,
  isError,
  onRetry,
  onPageChange,
  onViewDetail,
  onEdit,
  onDelete,
  canManage,
  onOpenCreate,
}) => {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-4 animate-pulse">
          <div className="h-10 bg-accent/40 rounded-lg" />
          <div className="h-12 bg-accent/30 rounded-lg" />
          <div className="h-12 bg-accent/30 rounded-lg" />
          <div className="h-12 bg-accent/30 rounded-lg" />
          <div className="h-12 bg-accent/30 rounded-lg" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <h3 className="mt-2 text-sm font-semibold text-foreground">Không thể tải dữ liệu thiết bị</h3>
        <p className="mt-1 text-xs text-muted-foreground">Đã xảy ra sự cố khi kết nối tới cơ sở dữ liệu.</p>
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-4">
          Thử lại
        </Button>
      </div>
    );
  }

  const machines = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;
  const page = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;
  const pageSize = data?.pageSize ?? 10;

  if (machines.length === 0) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Cpu className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-sm font-bold text-foreground">Chưa có thiết bị nào</h3>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          Không tìm thấy máy móc phù hợp với bộ lọc hiện tại hoặc hệ thống chưa có dữ liệu.
        </p>
        {canManage && onOpenCreate && (
          <Button
            size="sm"
            onClick={onOpenCreate}
            className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Thêm thiết bị đầu tiên
          </Button>
        )}
      </div>
    );
  }

  const startIdx = (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                <th className="py-3 px-4">Mã TB</th>
                <th className="py-3 px-4">Tên thiết bị & Thông số</th>
                <th className="py-3 px-4">Dây chuyền / Vị trí</th>
                <th className="py-3 px-4">Công suất định mức</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {machines.map((m) => (
                <tr
                  key={m.id}
                  className="transition-colors hover:bg-accent/30 group"
                >
                  {/* Mã TB */}
                  <td className="py-3.5 px-4 font-mono font-bold text-foreground whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onViewDetail(m)}
                      className="rounded bg-accent/60 px-2 py-0.5 text-xs text-foreground border border-border/80 hover:border-primary/50 hover:bg-primary/10 transition-colors"
                      title="Xem chi tiết thiết bị"
                    >
                      {m.machine_code}
                    </button>
                  </td>

                  {/* Tên & Model */}
                  <td className="py-3.5 px-4">
                    <button
                      type="button"
                      onClick={() => onViewDetail(m)}
                      className="text-left font-semibold text-foreground group-hover:text-primary transition-colors block"
                    >
                      {m.name}
                    </button>
                    {(m.model || m.serial_number) && (
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {m.model && <span>Model: {m.model}</span>}
                        {m.model && m.serial_number && <span> • </span>}
                        {m.serial_number && <span>SN: {m.serial_number}</span>}
                      </div>
                    )}
                  </td>

                  {/* Dây chuyền & Vị trí */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-medium text-foreground">
                      {m.production_lines?.name || 'Chưa gán dây chuyền'}
                    </div>
                    {m.line_location && (
                      <div className="text-[11px] text-muted-foreground">
                        {m.line_location}
                      </div>
                    )}
                  </td>

                  {/* Công suất */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 font-medium text-foreground">
                      <span>{m.rated_capacity_per_hour ?? '—'}</span>
                      <span className="text-[11px] text-muted-foreground">tấn/h</span>
                    </div>
                    {m.power_rating_kw !== null && (
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                        <Zap className="h-3 w-3 text-amber-500" />
                        <span>{m.power_rating_kw} kW</span>
                      </div>
                    )}
                  </td>

                  {/* Trạng thái */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <MachineStatusBadge status={m.status} />
                  </td>

                  {/* Thao tác */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewDetail(m)}
                        title="Xem chi tiết"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>

                      {canManage && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(m)}
                            title="Chỉnh sửa"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(m)}
                            title="Xóa thiết bị"
                            className="h-7 w-7 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-1">
        <span className="text-xs text-muted-foreground">
          Hiển thị <span className="font-semibold text-foreground">{startIdx}</span> -{' '}
          <span className="font-semibold text-foreground">{endIdx}</span> trong tổng số{' '}
          <span className="font-semibold text-foreground">{totalCount}</span> thiết bị
        </span>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="h-8 gap-1 px-2.5 text-xs"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Trước
          </Button>

          <span className="text-xs font-medium text-foreground px-2">
            Trang {page} / {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="h-8 gap-1 px-2.5 text-xs"
          >
            Sau
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
