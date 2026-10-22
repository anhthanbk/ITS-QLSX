import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Factory,
  ShieldCheck,
  Loader2,
  HardHat,
  Info,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { PatrolArea, PatrolAreaMachineItem } from '../types';

interface ProductionAreaChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  area: PatrolArea | null;
  inspectorName: string;
  onInspectorNameChange: (name: string) => void;
  onConfirmNormal: (payload: {
    area_id: string;
    inspector_name: string;
    checked_machines_count: number;
    notes?: string;
  }) => Promise<void>;
  onOpenReportIncident: (machine?: PatrolAreaMachineItem) => void;
  isConfirming: boolean;
}

export const ProductionAreaChecklistModal: React.FC<ProductionAreaChecklistModalProps> = ({
  isOpen,
  onClose,
  area,
  inspectorName,
  onInspectorNameChange,
  onConfirmNormal,
  onOpenReportIncident,
  isConfirming,
}) => {
  const [patrolNotes, setPatrolNotes] = useState('');
  const [confirmSuccess, setConfirmSuccess] = useState(false);

  if (!isOpen || !area) return null;

  const machines = area.machines || [];
  const now = new Date();

  const handleConfirm = async () => {
    if (!inspectorName.trim()) {
      alert('Vui lòng nhập họ tên người tuần kiểm trước khi xác nhận.');
      return;
    }

    try {
      await onConfirmNormal({
        area_id: area.id,
        inspector_name: inspectorName.trim(),
        checked_machines_count: machines.length,
        notes: patrolNotes.trim() || undefined,
      });
      setConfirmSuccess(true);
      setTimeout(() => {
        setConfirmSuccess(false);
        onClose();
      }, 1200);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
                  {area.area_code}
                </span>
                <span className="text-xs text-muted-foreground">• Quét QR thành công</span>
              </div>
              <h2 className="text-base font-bold text-foreground">
                {area.name}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {confirmSuccess ? (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in-95 duration-200">
              <div className="rounded-full bg-emerald-500/20 p-4 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <h3 className="mt-3 text-lg font-bold text-foreground">
                Xác nhận tuần kiểm thành công!
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Đã ghi nhận toàn bộ {machines.length} thiết bị hoạt động bình thường vào nhật ký.
              </p>
            </div>
          ) : (
            <>
              {/* Info banner */}
              <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-muted/40 p-3 sm:grid-cols-2 text-xs">
                <div className="flex items-center gap-2">
                  <Factory className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <span className="text-muted-foreground">Dây chuyền: </span>
                    <span className="font-semibold text-foreground">
                      {area.line_name || 'Toàn nhà máy'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <span className="text-muted-foreground">Thời điểm quét: </span>
                    <span className="font-semibold text-foreground">
                      {format(now, 'HH:mm - dd/MM/yyyy', { locale: vi })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Inspector input */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  Công nhân thực hiện tuần kiểm <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={inspectorName}
                    onChange={(e) => onInspectorNameChange(e.target.value)}
                    placeholder="Nhập tên người kiểm tra..."
                    className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                  <HardHat className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>

              {/* Machine Checklist */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-foreground">
                      Danh sách thiết bị cần kiểm tra tại khu vực
                    </span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      {machines.length} thiết bị
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Kiểm tra các hạng mục theo quy chuẩn
                  </span>
                </div>

                <div className="divide-y divide-border rounded-lg border border-border bg-card">
                  {machines.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      Khu vực này chưa được gán thiết bị cụ thể.
                    </div>
                  ) : (
                    machines.map((machine, idx) => (
                      <div
                        key={machine.machine_id}
                        className="flex flex-col gap-2 p-3 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                              {idx + 1}
                            </span>
                            <span className="font-mono text-xs font-bold text-foreground">
                              {machine.machine_code}
                            </span>
                            <span className="text-xs font-semibold text-foreground">
                              {machine.machine_name}
                            </span>
                          </div>

                          {machine.inspection_notes && (
                            <div className="flex items-start gap-1 text-[11px] text-amber-700 dark:text-amber-400">
                              <Info className="h-3 w-3 mt-0.5 shrink-0" />
                              <span>{machine.inspection_notes}</span>
                            </div>
                          )}
                        </div>

                        {/* Machine single report button */}
                        <button
                          type="button"
                          onClick={() => onOpenReportIncident(machine)}
                          className="flex items-center gap-1 rounded-md border border-rose-300 bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/50 self-start sm:self-center shrink-0"
                        >
                          <AlertTriangle className="h-3 w-3" />
                          <span>Báo sự cố máy này</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Optional notes */}
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Ghi chú tuần kiểm (nếu có):
                </label>
                <input
                  type="text"
                  value={patrolNotes}
                  onChange={(e) => setPatrolNotes(e.target.value)}
                  placeholder="Ví dụ: Đã vệ sinh khu vực sàn thao tác, áp lực nước cấp ổn định..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer Decision Buttons */}
        {!confirmSuccess && (
          <div className="flex flex-col-reverse gap-2.5 border-t border-border bg-muted/20 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Quick incident button for any other machine in the area */}
            <button
              type="button"
              onClick={() => onOpenReportIncident()}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-500/20 dark:text-rose-400"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>🚨 Phát hiện sự cố tại khu vực</span>
            </button>

            {/* 1-click confirmation button */}
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isConfirming}
              className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang ghi nhận...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>✅ Xác nhận tất cả thiết bị bình thường</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
