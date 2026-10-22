import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  QrCode,
  Trash2,
  CheckCircle2,
  Factory,
  Search,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { ProductionQRCodeSvg } from './production-qr-code-svg';
import type {
  PatrolArea,
  PatrolAreaFormValues,
  AvailableMachineItem,
  ProductionLine,
} from '../types';

interface ProductionPatrolAreaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: PatrolArea | null;
  lines: ProductionLine[];
  availableMachines: AvailableMachineItem[];
  onSubmit: (values: PatrolAreaFormValues) => Promise<void>;
  isSubmitting: boolean;
}

interface AssignedMachineState {
  machine_id: string;
  sort_order: number;
  inspection_notes: string;
}

export const ProductionPatrolAreaDialog: React.FC<ProductionPatrolAreaDialogProps> = ({
  isOpen,
  onClose,
  initialData,
  lines,
  availableMachines,
  onSubmit,
  isSubmitting,
}) => {
  const isEditing = !!initialData;

  const [areaCode, setAreaCode] = useState('');
  const [name, setName] = useState('');
  const [lineId, setLineId] = useState<string>('');
  const [qrCode, setQrCode] = useState('');
  const [description, setDescription] = useState('');
  const [orderIndex, setOrderIndex] = useState(1);
  const [assignedMachines, setAssignedMachines] = useState<AssignedMachineState[]>([]);
  const [machineSearch, setMachineSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize form when opening
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (initialData) {
        setAreaCode(initialData.area_code);
        setName(initialData.name);
        setLineId(initialData.line_id || '');
        setQrCode(initialData.qr_code);
        setDescription(initialData.description || '');
        setOrderIndex(initialData.order_index ?? 1);
        setAssignedMachines(
          (initialData.machines || []).map((m) => ({
            machine_id: m.machine_id,
            sort_order: m.sort_order,
            inspection_notes: m.inspection_notes || '',
          })),
        );
      } else {
        // Defaults for new area
        const nextNum = Math.floor(10 + Math.random() * 90);
        const code = `KV-${nextNum}`;
        setAreaCode(code);
        setName('');
        setLineId(lines[0]?.id || '');
        setQrCode(`ITS-AREA-${code}`);
        setDescription('');
        setOrderIndex(1);
        setAssignedMachines([]);
      }
    }
  }, [isOpen, initialData, lines]);

  // Filtered available machines for selection
  const filteredMachines = useMemo(() => {
    if (!machineSearch.trim()) return availableMachines;
    const s = machineSearch.trim().toLowerCase();
    return availableMachines.filter(
      (m) =>
        m.machine_code.toLowerCase().includes(s) ||
        m.name.toLowerCase().includes(s),
    );
  }, [availableMachines, machineSearch]);

  if (!isOpen) return null;

  // Toggle machine assignment
  const handleToggleMachine = (machine: AvailableMachineItem) => {
    const exists = assignedMachines.some((m) => m.machine_id === machine.id);
    if (exists) {
      setAssignedMachines((prev) => prev.filter((m) => m.machine_id !== machine.id));
    } else {
      setAssignedMachines((prev) => [
        ...prev,
        {
          machine_id: machine.id,
          sort_order: prev.length + 1,
          inspection_notes: `Kiểm tra nhiệt độ, rung ồn, bôi trơn con lăn và truyền động của ${machine.name}`,
        },
      ]);
    }
  };

  const handleUpdateNotes = (machineId: string, notes: string) => {
    setAssignedMachines((prev) =>
      prev.map((m) => (m.machine_id === machineId ? { ...m, inspection_notes: notes } : m)),
    );
  };

  const handleGenerateQr = () => {
    if (areaCode.trim()) {
      setQrCode(`ITS-AREA-${areaCode.trim().toUpperCase()}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!areaCode.trim()) {
      setErrorMsg('Vui lòng nhập mã khu vực (VD: KV-01).');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập tên khu vực tuần kiểm.');
      return;
    }
    if (!qrCode.trim()) {
      setErrorMsg('Vui lòng nhập hoặc tự động tạo mã QR.');
      return;
    }

    try {
      await onSubmit({
        area_code: areaCode.trim().toUpperCase(),
        name: name.trim(),
        line_id: lineId || null,
        qr_code: qrCode.trim().toUpperCase(),
        description: description.trim() || undefined,
        order_index: Number(orderIndex) || 1,
        is_active: true,
        machines: assignedMachines.map((m, idx) => ({
          machine_id: m.machine_id,
          sort_order: idx + 1,
          inspection_notes: m.inspection_notes.trim() || undefined,
        })),
      });
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu khu vực.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {isEditing ? 'Chỉnh sửa Khu vực tuần kiểm & Mã QR' : 'Tạo mới Khu vực tuần kiểm & Mã QR'}
              </h2>
              <p className="text-xs text-muted-foreground">
                Cấu hình thông tin khu vực, dán mã QR hiện trường và phân công danh sách máy móc kiểm tra
              </p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column: Area Info + Live QR Preview (7 cols) */}
            <div className="space-y-4 lg:col-span-7">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Area Code */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">
                    Mã khu vực <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={areaCode}
                    onChange={(e) => setAreaCode(e.target.value.toUpperCase())}
                    placeholder="VD: KV-06-XUATHANG"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Line */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">
                    Dây chuyền sản xuất
                  </label>
                  <select
                    value={lineId}
                    onChange={(e) => setLineId(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="">Toàn nhà máy / Khu vực chung</option>
                    {lines.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.code} - {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Area Name */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  Tên khu vực tuần kiểm <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Khu vực 6: Bãi chứa cát khô & Trạm cân xuất hàng"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              {/* QR Code string & Auto-generate button */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Nội dung mã QR (dán tem hiện trường) <span className="text-destructive">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateQr}
                    className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Tự tạo theo mã khu vực</span>
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value.toUpperCase())}
                    placeholder="VD: ITS-AREA-KV06"
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">
                  Mô tả & Hướng dẫn tuần kiểm chung
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ghi chú phạm vi, vị trí dán tem QR, các lưu ý an toàn khi tuần kiểm..."
                  className="w-full rounded-lg border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              {/* Live QR Sticker Preview Box */}
              <div className="rounded-xl border border-dashed border-primary/40 bg-muted/20 p-4">
                <span className="mb-2 block text-xs font-semibold text-muted-foreground">
                  Xem trước tem QR Decal dán cột mốc hiện trường:
                </span>
                <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-3 shadow-sm">
                  <div className="flex flex-col items-center justify-center rounded border border-border bg-white p-2 shadow-2xs">
                    <ProductionQRCodeSvg value={qrCode || 'ITS-AREA-SAMPLE'} size={96} fgColor="#000000" />
                    <span className="mt-1 font-mono text-[9px] font-bold text-black">
                      {qrCode || 'ITS-AREA-SAMPLE'}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 font-bold uppercase text-primary">
                      <Factory className="h-3.5 w-3.5" />
                      <span>{areaCode || 'MÃ KHU VỰC'}</span>
                    </div>
                    <div className="font-semibold text-foreground">
                      {name || 'Tên khu vực tuần kiểm'}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {assignedMachines.length} thiết bị máy móc trong danh sách tuần kiểm
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Machine Assignment (5 cols) */}
            <div className="space-y-3 lg:col-span-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-foreground">
                    Thiết bị phụ trách ({assignedMachines.length})
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Chọn máy móc cần công nhân kiểm tra tại khu vực
                  </p>
                </div>
              </div>

              {/* Machine Search input */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={machineSearch}
                  onChange={(e) => setMachineSearch(e.target.value)}
                  placeholder="Tìm theo mã hoặc tên máy..."
                  className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              {/* Available machines list with checkboxes */}
              <div className="max-h-52 overflow-y-auto rounded-lg border border-border bg-muted/20 p-2 space-y-1.5">
                {filteredMachines.length === 0 ? (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    Không tìm thấy máy móc phù hợp.
                  </div>
                ) : (
                  filteredMachines.map((m) => {
                    const isSelected = assignedMachines.some((am) => am.machine_id === m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleToggleMachine(m)}
                        className={`flex w-full items-center justify-between rounded-lg border p-2 text-left transition-colors ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/10 text-foreground'
                            : 'border-border bg-card hover:bg-muted/50 text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="h-3.5 w-3.5 rounded text-emerald-600 focus:ring-0"
                          />
                          <div>
                            <span className="font-mono text-xs font-bold">{m.machine_code}</span>
                            <span className="ml-1.5 text-xs font-medium">{m.name}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Assigned Machines Config (Inspection notes per machine) */}
              {assignedMachines.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <span className="text-[11px] font-semibold text-foreground">
                    Nội dung tuần kiểm chi tiết từng máy:
                  </span>
                  <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                    {assignedMachines.map((am, idx) => {
                      const mObj = availableMachines.find((m) => m.id === am.machine_id);
                      return (
                        <div
                          key={am.machine_id}
                          className="rounded-lg border border-border bg-card p-2.5 space-y-1 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-foreground">
                              {idx + 1}. {mObj?.machine_code} - {mObj?.name}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setAssignedMachines((prev) =>
                                  prev.filter((m) => m.machine_id !== am.machine_id),
                                )
                              }
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={am.inspection_notes}
                            onChange={(e) => handleUpdateNotes(am.machine_id, e.target.value)}
                            placeholder="Ghi chú kiểm tra (VD: nhiệt độ, rung ồn, căng đai...)"
                            className="w-full rounded border border-input bg-background px-2 py-1 text-[11px] text-foreground focus:border-primary focus:outline-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{isEditing ? 'Cập nhật khu vực' : 'Tạo khu vực & Mã QR'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
