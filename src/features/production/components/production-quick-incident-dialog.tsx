import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  Loader2,
  HardHat,
  Camera,
  Trash2,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveMachineWorkOrder } from '../hooks/use-production-patrols';
import { uploadIncidentPhoto } from '../api/production-patrol-api';
import type {
  PatrolArea,
  PatrolAreaMachineItem,
  PatrolResolutionType,
  QuickIncidentFormValues,
} from '../types';

interface ProductionQuickIncidentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: QuickIncidentFormValues) => Promise<void>;
  isSubmitting: boolean;
  area: PatrolArea | null;
  allAreas?: PatrolArea[];
  preselectedMachine?: PatrolAreaMachineItem | null;
  defaultReporterName?: string;
}

const COMMON_CONDITIONS = [
  'Rung ồn bất thường',
  'Nhiệt độ gối bi cao (> 75°C)',
  'Rách lưới sàng rung',
  'Kẹt liệu phễu nạp',
  'Rò rỉ gioăng phớt trục bơm cát',
  'Đứt / chùng đai truyền động',
  'Mòn quá mức búa nghiền / tang từ',
  'Dừng máy khẩn cấp',
  'Khác',
];

export const ProductionQuickIncidentDialog: React.FC<ProductionQuickIncidentDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  area,
  allAreas = [],
  preselectedMachine,
  defaultReporterName = '',
}) => {
  const [selectedAreaId, setSelectedAreaId] = useState<string>(area?.id || '');
  const [selectedMachineId, setSelectedMachineId] = useState<string>(
    preselectedMachine?.machine_id || '',
  );
  const [reporterName, setReporterName] = useState<string>(defaultReporterName || 'Công nhân tuần kiểm');
  const [conditionType, setConditionType] = useState<string>(COMMON_CONDITIONS[0] ?? 'Rung ồn bất thường');
  const [description, setDescription] = useState<string>('');
  const [resolutionType, setResolutionType] = useState<PatrolResolutionType>('temporary_fix');
  const [createNewWorkOrder, setCreateNewWorkOrder] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Hình ảnh sự cố & sau khắc phục
  const [incidentImageUrl, setIncidentImageUrl] = useState<string | null>(null);
  const [resolutionImageUrl, setResolutionImageUrl] = useState<string | null>(null);
  const [isUploadingIncident, setIsUploadingIncident] = useState<boolean>(false);
  const [isUploadingResolution, setIsUploadingResolution] = useState<boolean>(false);

  const incidentFileRef = useRef<HTMLInputElement>(null);
  const resolutionFileRef = useRef<HTMLInputElement>(null);

  // Check active open work order for the selected machine to prevent duplicates
  const { data: activeWorkOrder } = useActiveMachineWorkOrder(selectedMachineId);

  // Sync state when props change
  useEffect(() => {
    if (area) {
      setSelectedAreaId(area.id);
    } else if (allAreas.length > 0 && !selectedAreaId) {
      const firstArea = allAreas[0];
      if (firstArea) {
        setSelectedAreaId(firstArea.id);
      }
    }
  }, [area, allAreas, selectedAreaId]);

  useEffect(() => {
    if (preselectedMachine) {
      setSelectedMachineId(preselectedMachine.machine_id);
    }
  }, [preselectedMachine]);

  // Current area object
  const currentArea = useMemo(() => {
    const list = allAreas.length > 0 ? allAreas : area ? [area] : [];
    return list.find((a) => a.id === selectedAreaId) || area;
  }, [allAreas, area, selectedAreaId]);

  // Available machines for current area
  const availableMachines = useMemo(() => currentArea?.machines || [], [currentArea]);

  useEffect(() => {
    if (availableMachines.length > 0 && !availableMachines.some((m) => m.machine_id === selectedMachineId)) {
      const firstM = availableMachines[0];
      if (firstM) {
        setSelectedMachineId(firstM.machine_id);
      }
    }
  }, [availableMachines, selectedMachineId]);

  const handleUploadIncidentPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingIncident(true);
    setErrorMessage(null);
    try {
      const url = await uploadIncidentPhoto(file, 'incident');
      setIncidentImageUrl(url);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Tải ảnh sự cố thất bại.');
    } finally {
      setIsUploadingIncident(false);
      if (incidentFileRef.current) incidentFileRef.current.value = '';
    }
  };

  const handleUploadResolutionPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingResolution(true);
    setErrorMessage(null);
    try {
      const url = await uploadIncidentPhoto(file, 'resolution');
      setResolutionImageUrl(url);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Tải ảnh sau khắc phục thất bại.');
    } finally {
      setIsUploadingResolution(false);
      if (resolutionFileRef.current) resolutionFileRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedAreaId) {
      setErrorMessage('Vui lòng chọn khu vực tuần kiểm.');
      return;
    }
    if (!selectedMachineId) {
      setErrorMessage('Vui lòng chọn thiết bị gặp sự cố.');
      return;
    }
    if (!reporterName.trim()) {
      setErrorMessage('Vui lòng nhập tên người báo cáo sự cố.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Vui lòng mô tả ngắn gọn hiện tượng / nội dung sự cố.');
      return;
    }

    try {
      await onSubmit({
        area_id: selectedAreaId,
        machine_id: selectedMachineId,
        reporter_name: reporterName.trim(),
        condition_type: conditionType,
        description: description.trim(),
        resolution_type: resolutionType,
        incident_image_url: incidentImageUrl,
        resolution_image_url: resolutionImageUrl,
        existing_work_order_id: !createNewWorkOrder && activeWorkOrder ? activeWorkOrder.id : null,
        create_new_work_order: createNewWorkOrder || !activeWorkOrder,
      });
      // Reset form
      setDescription('');
      setIncidentImageUrl(null);
      setResolutionImageUrl(null);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu báo cáo sự cố.',
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-rose-500/10 p-2 text-rose-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Báo cáo sự cố thiết bị nhanh
              </h2>
              <p className="text-xs text-muted-foreground">
                Ghi nhận tình trạng bất thường và phân luồng phương án xử lý tức thời
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMessage && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              {errorMessage}
            </div>
          )}

          {/* Area & Machine Row */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Khu vực */}
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">
                Khu vực tuần kiểm <span className="text-destructive">*</span>
              </label>
              <select
                value={selectedAreaId}
                onChange={(e) => setSelectedAreaId(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                {(allAreas.length > 0 ? allAreas : area ? [area] : []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.area_code} - {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Thiết bị */}
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">
                Thiết bị máy móc <span className="text-destructive">*</span>
              </label>
              <select
                value={selectedMachineId}
                onChange={(e) => setSelectedMachineId(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                {availableMachines.length === 0 ? (
                  <option value="">Không có máy nào được cấu hình</option>
                ) : (
                  availableMachines.map((m) => (
                    <option key={m.machine_id} value={m.machine_id}>
                      {m.machine_code} - {m.machine_name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Cảnh báo trùng lặp nếu máy đang có phiếu bảo dưỡng đang mở */}
          {activeWorkOrder && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Phát hiện Phiếu bảo dưỡng đang mở cho thiết bị này:</span>
              </div>
              <div className="pl-5 text-[11px] space-y-1">
                <div>
                  <span className="font-semibold text-foreground">Mã phiếu: </span>
                  <span className="font-mono font-bold text-primary bg-background px-1.5 py-0.5 rounded border border-border">
                    {activeWorkOrder.work_order_number}
                  </span>
                  <span className="ml-2 font-medium text-muted-foreground">
                    (Trạng thái: <strong className="text-foreground font-semibold">{activeWorkOrder.status}</strong>)
                  </span>
                </div>
                <div className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Nội dung ghi nhận trước đó: </span>
                  <span className="line-clamp-2 italic">{activeWorkOrder.reported_issue}</span>
                </div>
              </div>
            </div>
          )}

          {/* Người báo cáo & Tình trạng bất thường */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">
                Người báo cáo <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="Nhập họ tên công nhân..."
                  className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
                <HardHat className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">
                Hiện tượng / Tình trạng <span className="text-destructive">*</span>
              </label>
              <select
                value={conditionType}
                onChange={(e) => setConditionType(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                {COMMON_CONDITIONS.map((cond) => (
                  <option key={cond} value={cond}>
                    {cond}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nội dung chi tiết */}
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">
              Mô tả chi tiết nội dung sự cố <span className="text-destructive">*</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả cụ thể vị trí, mức độ rung lắc, nhiệt độ hoặc vật cản phát hiện..."
              className="w-full rounded-lg border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* HÌNH ẢNH SỰ CỐ & SAU KHẮC PHỤC (Before & After) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5 text-primary" />
                <span>Hình ảnh hiện trường & sau khắc phục</span>
              </label>
              <span className="text-[11px] text-muted-foreground">
                (Hỗ trợ chụp trực tiếp từ camera hoặc tải từ thư viện ảnh)
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Cột 1: Ảnh hiện trường sự cố */}
              <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    1. Ảnh hiện trường sự cố
                  </span>
                  {incidentImageUrl && (
                    <button
                      type="button"
                      onClick={() => setIncidentImageUrl(null)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                      title="Xóa ảnh sự cố"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <input
                  ref={incidentFileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleUploadIncidentPhoto}
                  className="hidden"
                />

                {incidentImageUrl ? (
                  <div className="relative group overflow-hidden rounded-lg border border-border bg-background">
                    <img
                      src={incidentImageUrl}
                      alt="Hiện trường sự cố"
                      className="h-28 w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                      Đã tải lên
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => incidentFileRef.current?.click()}
                    disabled={isUploadingIncident}
                    className="flex h-28 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-rose-400 hover:bg-rose-500/5 transition-all text-center p-2"
                  >
                    {isUploadingIncident ? (
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin text-rose-500" />
                        <span className="text-[11px]">Đang nén & tải ảnh...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <Upload className="h-5 w-5 text-rose-500" />
                        <span className="text-xs font-medium text-foreground">Chụp / Chọn ảnh sự cố</span>
                        <span className="text-[10px] text-muted-foreground">Chụp vết nứt, rung lắc, rò rỉ...</span>
                      </div>
                    )}
                  </button>
                )}
              </div>

              {/* Cột 2: Ảnh sau khắc phục */}
              <div className={cn(
                'rounded-xl border p-3 space-y-2 transition-all',
                resolutionType === 'resolved' || resolutionType === 'temporary_fix'
                  ? 'border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                  : 'border-border bg-muted/20'
              )}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    2. Ảnh sau khắc phục
                  </span>
                  {resolutionImageUrl && (
                    <button
                      type="button"
                      onClick={() => setResolutionImageUrl(null)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                      title="Xóa ảnh sau khắc phục"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <input
                  ref={resolutionFileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleUploadResolutionPhoto}
                  className="hidden"
                />

                {resolutionImageUrl ? (
                  <div className="relative group overflow-hidden rounded-lg border border-border bg-background">
                    <img
                      src={resolutionImageUrl}
                      alt="Sau khi khắc phục"
                      className="h-28 w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                      Đã khắc phục
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => resolutionFileRef.current?.click()}
                    disabled={isUploadingResolution}
                    className="flex h-28 w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-emerald-400 hover:bg-emerald-500/5 transition-all text-center p-2"
                  >
                    {isUploadingResolution ? (
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                        <span className="text-[11px]">Đang nén & tải ảnh...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <Camera className="h-5 w-5 text-emerald-500" />
                        <span className="text-xs font-medium text-foreground">Chụp / Chọn ảnh sau xử lý</span>
                        <span className="text-[10px] text-muted-foreground">
                          {resolutionType === 'resolved'
                            ? 'Khuyến nghị chụp sau khi xử lý tại chỗ'
                            : 'Minh chứng máy đã sẵn sàng chạy'}
                        </span>
                      </div>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* LỰA CHỌN PHƯƠNG ÁN XỬ LÝ (3 Cards lớn theo đúng yêu cầu) */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-foreground">
              Lựa chọn phương án xử lý <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {/* Option 1: Đã xử lý */}
              <button
                type="button"
                onClick={() => setResolutionType('resolved')}
                className={cn(
                  'flex flex-col items-start rounded-xl border p-3 text-left transition-all',
                  resolutionType === 'resolved'
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500'
                    : 'border-border bg-card hover:bg-muted/50',
                )}
              >
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-xs font-bold">Đã xử lý tại chỗ</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Đã tự khắc phục (châm mỡ, siết ốc, thông kẹt liệu, căng đai...).
                </p>
              </button>

              {/* Option 2: Xử lý tạm thời */}
              <button
                type="button"
                onClick={() => setResolutionType('temporary_fix')}
                className={cn(
                  'flex flex-col items-start rounded-xl border p-3 text-left transition-all',
                  resolutionType === 'temporary_fix'
                    ? 'border-amber-500 bg-amber-500/10 shadow-sm ring-1 ring-amber-500'
                    : 'border-border bg-card hover:bg-muted/50',
                )}
              >
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-bold">Xử lý tạm thời</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Giảm tải hoặc xử lý tạm để tiếp tục chạy ca, theo dõi sát.
                </p>
              </button>

              {/* Option 3: Đưa vào kế hoạch bảo dưỡng */}
              <button
                type="button"
                onClick={() => setResolutionType('maintenance_scheduled')}
                className={cn(
                  'flex flex-col items-start rounded-xl border p-3 text-left transition-all',
                  resolutionType === 'maintenance_scheduled'
                    ? 'border-rose-500 bg-rose-500/10 shadow-sm ring-1 ring-rose-500'
                    : 'border-border bg-card hover:bg-muted/50',
                )}
              >
                <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                  <Wrench className="h-4 w-4" />
                  <span className="text-xs font-bold">Lập kế hoạch bảo dưỡng</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Tự động chuyển phiếu yêu cầu bảo trì sang phân hệ Cơ điện.
                </p>
              </button>
            </div>

            {/* Tùy chọn chống trùng lặp khi có Phiếu bảo dưỡng đang mở */}
            {resolutionType === 'maintenance_scheduled' && activeWorkOrder && (
              <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">
                    Cơ chế ngăn ngừa trùng lặp Phiếu bảo dưỡng:
                  </span>
                  <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Khuyên dùng
                  </span>
                </div>
                <div className="space-y-2">
                  <label className={cn(
                    'flex items-start gap-2.5 rounded-lg border p-2.5 cursor-pointer transition-colors',
                    !createNewWorkOrder
                      ? 'border-emerald-500 bg-emerald-500/10 text-foreground ring-1 ring-emerald-500/50'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                  )}>
                    <input
                      type="radio"
                      name="antiDuplicateWoOption"
                      checked={!createNewWorkOrder}
                      onChange={() => setCreateNewWorkOrder(false)}
                      className="mt-0.5 text-emerald-600 focus:ring-0"
                    />
                    <div>
                      <div className="font-bold text-foreground">
                        Ghi nhận bổ sung vào Phiếu hiện có: {activeWorkOrder.work_order_number}
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Không tạo trùng phiếu; tự động nối tiếp thông tin sự cố mới vào phiếu bảo dưỡng đang mở của thiết bị.
                      </p>
                    </div>
                  </label>

                  <label className={cn(
                    'flex items-start gap-2.5 rounded-lg border p-2.5 cursor-pointer transition-colors',
                    createNewWorkOrder
                      ? 'border-rose-500 bg-rose-500/10 text-foreground ring-1 ring-rose-500/50'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                  )}>
                    <input
                      type="radio"
                      name="antiDuplicateWoOption"
                      checked={createNewWorkOrder}
                      onChange={() => setCreateNewWorkOrder(true)}
                      className="mt-0.5 text-rose-600 focus:ring-0"
                    />
                    <div>
                      <div className="font-bold text-foreground">
                        Tạo thêm Phiếu bảo dưỡng độc lập mới (WO-TK-...)
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Chỉ chọn nếu sự cố này phát sinh ở cụm chi tiết máy hoàn toàn khác cần quy trình sửa chữa riêng.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
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
              className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-rose-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Gửi báo cáo sự cố</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
