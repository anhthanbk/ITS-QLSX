import React, { useState } from 'react';
import {
  Search,
  Plus,
  GitCommit,
  Calendar,
  Wrench,
  CheckCircle,
  ArrowRight,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMachineAdjustments } from '../hooks/use-machine-adjustments';
import { useMachineOptions } from '../hooks/use-machines';
import { MachineStatusBadge } from './maintenance-badges';
import { MachineAdjustmentDialog } from './machine-adjustment-dialog';

export interface AdjustmentsTabProps {
  canManage: boolean;
}

export const AdjustmentsTab: React.FC<AdjustmentsTabProps> = ({ canManage }) => {
  const [search, setSearch] = useState('');
  const [selectedMachineId, setSelectedMachineId] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: machineOptions } = useMachineOptions();

  const { data: adjustmentsData, isLoading, isError } = useMachineAdjustments({
    machineId: selectedMachineId === 'all' ? undefined : selectedMachineId,
    search: search.trim() ? search.trim() : undefined,
    page,
    pageSize,
  });

  const adjustments = adjustmentsData?.data ?? [];
  const totalCount = adjustmentsData?.totalCount ?? 0;
  const totalPages = adjustmentsData?.totalPages ?? 1;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleMachineFilterChange = (machineId: string) => {
    setSelectedMachineId(machineId);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">
            Nhật Ký Điều Chỉnh & Cải Tiến Thiết Bị
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ghi nhận tình trạng trước điều chỉnh, nội dung cải tiến kỹ thuật, kết quả nghiệm thu và lịch sử thay đổi thông số máy móc.
          </p>
        </div>

        {canManage && (
          <Button
            size="sm"
            onClick={() => setIsDialogOpen(true)}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm cải tiến thiết bị</span>
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card p-3 rounded-xl border border-border">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo nội dung cải tiến, kết quả, tình trạng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-input bg-background text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </form>

        {/* Machine Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <select
            value={selectedMachineId}
            onChange={(e) => handleMachineFilterChange(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Tất cả thiết bị ({machineOptions?.length ?? 0})</option>
            {machineOptions?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.machine_code} - {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Adjustments Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-xs">Đang tải nhật ký cải tiến thiết bị...</span>
        </div>
      ) : isError ? (
        <div className="text-center py-12 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive text-xs">
          Không thể tải danh sách điều chỉnh, cải tiến. Vui lòng thử lại.
        </div>
      ) : adjustments.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card space-y-3">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <GitCommit className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Chưa có bản ghi điều chỉnh, cải tiến nào</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Ghi nhận các giải pháp kỹ thuật, tăng tốc độ, thay đổi kích thước và nâng cấp thiết bị để lưu lại vết lịch sử cho nhà máy.
            </p>
          </div>
          {canManage && (
            <Button
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              className="gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Ghi nhận cải tiến đầu tiên</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {adjustments.map((adj) => (
            <div
              key={adj.id}
              className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs hover:border-primary/40 transition-colors"
            >
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Machine Badge */}
                  {adj.machines && (
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                      {adj.machines.machine_code}
                      <span className="font-sans font-medium text-foreground">
                        • {adj.machines.name}
                      </span>
                    </span>
                  )}

                  <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
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
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      <CheckCircle className="h-3 w-3" />
                      Đã cập nhật hồ sơ máy
                    </span>
                  )}

                  <div className="flex items-center gap-1.5 text-xs">
                    <MachineStatusBadge status={adj.status_before} />
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <MachineStatusBadge status={adj.status_after} />
                  </div>
                </div>
              </div>

              {/* Operating Condition Before */}
              {adj.operating_condition_before && (
                <div className="text-xs rounded-xl bg-accent/20 border border-border/60 p-3">
                  <span className="text-muted-foreground font-semibold">Tình trạng thực tế trước cải tiến: </span>
                  <span className="text-foreground">{adj.operating_condition_before}</span>
                </div>
              )}

              {/* Content and Result */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="rounded-xl border border-border/80 bg-accent/15 p-3.5 space-y-1.5">
                  <div className="font-bold text-foreground flex items-center gap-1.5">
                    <Wrench className="h-4 w-4 text-primary" />
                    Nội dung điều chỉnh, biện pháp cải tiến
                  </div>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-xs">
                    {adj.improvement_content}
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 space-y-1.5">
                  <div className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4" />
                    Kết quả sau điều chỉnh / Nghiệm thu
                  </div>
                  <p className="text-foreground leading-relaxed whitespace-pre-line text-xs">
                    {adj.result}
                  </p>
                </div>
              </div>

              {/* Changed Parameters */}
              {adj.changed_params && Object.keys(adj.changed_params).length > 0 && (
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                  <div className="text-[11px] font-bold text-foreground mb-2 uppercase tracking-wider">
                    Các thông số kỹ thuật thay đổi:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(adj.changed_params).map(([key, value]) => (
                      <span
                        key={key}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs bg-card border border-border text-foreground font-medium shadow-2xs"
                      >
                        <span className="text-muted-foreground">{key}:</span>
                        <strong className="text-primary font-mono">{String(value)}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
              <div>
                Hiển thị trang {page} / {totalPages} (Tổng số {totalCount} lần cải tiến)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-8 gap-1 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Trước</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="h-8 gap-1 text-xs"
                >
                  <span>Sau</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialog to create adjustment */}
      <MachineAdjustmentDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </div>
  );
};
