import React, { useState, useMemo } from 'react';
import {
  X,
  Warehouse as WarehouseIcon,
  Package,
  CheckCircle2,
  Loader2,
  Layers,
  Calendar,
} from 'lucide-react';
import { useWarehouses } from '@/features/warehouse/hooks/use-warehouses';
import { useBatchSyncShiftsToWarehouse } from '../hooks/use-production-shifts';
import type {
  ProductionShift,
  BatchShiftWarehouseSyncItem,
  BatchShiftWarehouseSyncPayload,
} from '../types';
import { isSemiFinishedProduct, isByProduct } from '../types';

interface BatchShiftWarehouseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedShifts: ProductionShift[];
  onSuccess?: () => void;
}

export const BatchShiftWarehouseDialog: React.FC<BatchShiftWarehouseDialogProps> = ({
  isOpen,
  onClose,
  selectedShifts,
  onSuccess,
}) => {
  const { data: warehousesData } = useWarehouses({ page: 1, pageSize: 100 });
  const warehousesList = useMemo(() => warehousesData?.data || [], [warehousesData?.data]);

  const batchSyncMutation = useBatchSyncShiftsToWarehouse();
  const [generalNotes, setGeneralNotes] = useState('');

  // Default warehouse IDs by type for smart pre-filling
  const defaultFinishedGoodsWh = useMemo(
    () => warehousesList.find((w) => w.warehouse_type === 'finished_goods')?.id || '',
    [warehousesList],
  );
  const defaultByproductWh = useMemo(
    () => warehousesList.find((w) => w.warehouse_type === 'byproduct')?.id || '',
    [warehousesList],
  );
  const defaultRawMaterialWh = useMemo(
    () => warehousesList.find((w) => w.warehouse_type === 'raw_material')?.id || '',
    [warehousesList],
  );

  // Grouped Products, Semi-finished goods & Byproducts state
  const [finishedItems, setFinishedItems] = useState<BatchShiftWarehouseSyncItem[]>([]);
  const [semiFinishedItems, setSemiFinishedItems] = useState<BatchShiftWarehouseSyncItem[]>([]);
  const [byproductItems, setByproductItems] = useState<BatchShiftWarehouseSyncItem[]>([]);
  const [materialItems, setMaterialItems] = useState<BatchShiftWarehouseSyncItem[]>([]);

  // Initialize aggregated items whenever dialog opens or selectedShifts changes
  React.useEffect(() => {
    if (!isOpen || selectedShifts.length === 0) return;

    // 1. Group products, semi-finished goods & byproducts by (Item + Warehouse recorded in shifts)
    const finishMap = new Map<string, BatchShiftWarehouseSyncItem>();
    const semiMap = new Map<string, BatchShiftWarehouseSyncItem>();
    const bypMap = new Map<string, BatchShiftWarehouseSyncItem>();

    for (const shift of selectedShifts) {
      const outputs = Array.isArray(shift.products_output) ? shift.products_output : [];
      for (const p of outputs) {
        const qty = Number(p.quantity_tons) || 0;
        if (qty <= 0) continue;

        const isSemi = isSemiFinishedProduct(p);
        const isBP = isByProduct(p);

        // Phân loại: Phụ phẩm -> Bán thành phẩm -> Thành phẩm
        const map = isBP ? bypMap : isSemi ? semiMap : finishMap;
        const itemType = isBP ? 'byproduct' : 'product';
        const itemBaseKey = p.product_id || p.product_sku || p.product_name;
        // Gom nhóm theo mặt hàng VÀ kho mà nhập liệu các ca đã ghi (nếu ca nhập vào 2 kho thì thành 2 dòng riêng biệt)
        const shiftWhId = p.warehouse_id || '';
        const groupKey = `${itemBaseKey}___${shiftWhId || 'unassigned'}`;

        const existing = map.get(groupKey);
        if (existing) {
          existing.total_quantity = Number((existing.total_quantity + qty).toFixed(2));
          if (!existing.shift_ids.includes(shift.id)) existing.shift_ids.push(shift.id);
          if (!existing.shift_codes.includes(shift.shift_code)) existing.shift_codes.push(shift.shift_code);
          if (p.storage_location && !existing.storage_location) existing.storage_location = p.storage_location;
        } else {
          // Gán kho đích theo đúng kho mà nhập liệu ca đã ghi; nếu chưa ghi thì fallback kho mặc định
          const defaultTargetWh = shiftWhId || (isBP ? defaultByproductWh : defaultFinishedGoodsWh);
          map.set(groupKey, {
            id: groupKey,
            item_type: itemType,
            item_id: p.product_id || '',
            item_code: p.product_sku || '---',
            item_name: p.product_name,
            unit_of_measure: p.unit_of_measure || 'Tấn',
            total_quantity: Number(qty.toFixed(2)),
            warehouse_id: defaultTargetWh,
            storage_location: p.storage_location || null,
            shift_ids: [shift.id],
            shift_codes: [shift.shift_code],
          });
        }
      }
    }

    // 2. Group materials by (Material + Warehouse recorded in shifts)
    const matMap = new Map<string, BatchShiftWarehouseSyncItem>();

    for (const shift of selectedShifts) {
      const cons = Array.isArray(shift.materials_consumption) ? shift.materials_consumption : [];
      for (const m of cons) {
        const qty = Number(m.actual_quantity) || 0;
        if (qty <= 0) continue;

        // Bỏ qua các tài nguyên không quản lý tồn kho vật lý (ví dụ: Điện năng tiêu thụ)
        const nameLower = (m.resource_name || '').toLowerCase();
        if (nameLower.includes('điện') || nameLower.includes('electricity') || m.unit_of_measure?.toLowerCase() === 'kwh') {
          continue;
        }

        const matBaseKey = m.material_id || m.resource_name;
        const shiftMatWhId = m.warehouse_id || '';
        const groupKey = `${matBaseKey}___${shiftMatWhId || 'unassigned'}`;

        const isRaw = m.category === 'material' || nameLower.includes('nguyên khai') || nameLower.includes('quặng');
        const isSemiMat = m.category === 'semi_finished' || nameLower.includes('bán thành phẩm');

        const existing = matMap.get(groupKey);
        if (existing) {
          existing.total_quantity = Number((existing.total_quantity + qty).toFixed(2));
          if (!existing.shift_ids.includes(shift.id)) existing.shift_ids.push(shift.id);
          if (!existing.shift_codes.includes(shift.shift_code)) existing.shift_codes.push(shift.shift_code);
        } else {
          matMap.set(groupKey, {
            id: groupKey,
            item_type: 'material',
            item_id: m.material_id || '',
            item_code: matBaseKey,
            item_name: m.resource_name + (isSemiMat ? ' (Bán thành phẩm)' : ''),
            unit_of_measure: m.unit_of_measure || 'Tấn',
            total_quantity: Number(qty.toFixed(2)),
            warehouse_id: shiftMatWhId || (isRaw ? defaultRawMaterialWh : defaultFinishedGoodsWh),
            storage_location: null,
            shift_ids: [shift.id],
            shift_codes: [shift.shift_code],
          });
        }
      }
    }

    setFinishedItems(Array.from(finishMap.values()));
    setSemiFinishedItems(Array.from(semiMap.values()));
    setByproductItems(Array.from(bypMap.values()));
    setMaterialItems(Array.from(matMap.values()));
  }, [isOpen, selectedShifts, defaultFinishedGoodsWh, defaultByproductWh, defaultRawMaterialWh]);

  if (!isOpen) return null;

  const handleUpdateFinishedWh = (idx: number, warehouseId: string) => {
    setFinishedItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, warehouse_id: warehouseId } : item)),
    );
  };

  const handleUpdateFinishedLoc = (idx: number, location: string) => {
    setFinishedItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, storage_location: location } : item)),
    );
  };

  const handleUpdateSemiWh = (idx: number, warehouseId: string) => {
    setSemiFinishedItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, warehouse_id: warehouseId } : item)),
    );
  };

  const handleUpdateSemiLoc = (idx: number, location: string) => {
    setSemiFinishedItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, storage_location: location } : item)),
    );
  };

  const handleUpdateByproductWh = (idx: number, warehouseId: string) => {
    setByproductItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, warehouse_id: warehouseId } : item)),
    );
  };

  const handleUpdateByproductLoc = (idx: number, location: string) => {
    setByproductItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, storage_location: location } : item)),
    );
  };

  const handleUpdateMaterialWh = (idx: number, warehouseId: string) => {
    setMaterialItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, warehouse_id: warehouseId } : item)),
    );
  };

  const handleSubmit = async () => {
    const payload: BatchShiftWarehouseSyncPayload = {
      selected_shift_ids: selectedShifts.map((s) => s.id),
      products: finishedItems,
      semi_finished_products: semiFinishedItems,
      byproducts: byproductItems,
      materials: materialItems,
      notes: generalNotes.trim() || null,
    };

    try {
      await batchSyncMutation.mutateAsync(payload);
      onSuccess?.();
      onClose();
    } catch {
      // Error handled by mutation onError
    }
  };

  const totalShiftsCount = selectedShifts.length;
  const totalFinishOutput = finishedItems.reduce((acc, p) => acc + p.total_quantity, 0);
  const totalSemiOutput = semiFinishedItems.reduce((acc, s) => acc + s.total_quantity, 0);
  const totalByproductOutput = byproductItems.reduce((acc, b) => acc + b.total_quantity, 0);
  const totalTxExpected =
    finishedItems.filter((p) => p.warehouse_id).length +
    semiFinishedItems.filter((s) => s.warehouse_id).length +
    byproductItems.filter((b) => b.warehouse_id).length +
    materialItems.filter((m) => m.warehouse_id).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
              <WarehouseIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">
                  Nghiệm thu & Sinh phiếu kho Sản xuất
                </h2>
                <span className="inline-flex items-center rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  Đã gom {totalShiftsCount} ca
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Quy trình nghiệm thu 2 bước: Nhập kho Thành phẩm & Phụ phẩm, sau đó Xuất kho Vật tư, Nguyên nhiên liệu.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Shift info chips */}
          <div className="rounded-xl border border-border bg-muted/30 p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground mb-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span>Danh sách các ca sản xuất được chọn để nghiệm thu:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedShifts.map((s) => (
                <div
                  key={s.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs shadow-xs"
                >
                  <span className="font-mono font-bold text-foreground">{s.shift_code}</span>
                  <span className="text-[11px] text-muted-foreground">({s.shift_date})</span>
                  {s.warehouse_synced ? (
                    <span className="text-[10px] text-emerald-600 font-semibold dark:text-emerald-400">
                      • Đã nhập
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-600 font-semibold dark:text-amber-400">
                      • Chưa nhập
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 1: NHẬP THÀNH PHẨM, BÁN THÀNH PHẨM & PHỤ PHẨM */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  1
                </span>
                <h3 className="text-sm font-bold text-foreground">
                  Giai đoạn 1: Nhập Thành phẩm, Bán thành phẩm & Phụ phẩm thu hồi
                </h3>
                <span className="text-xs text-muted-foreground">
                  ({finishedItems.length + semiFinishedItems.length + byproductItems.length} mặt hàng • {totalFinishOutput.toLocaleString()} Tấn TP{totalSemiOutput > 0 ? ` • ${totalSemiOutput.toLocaleString()} Tấn BTP` : ''})
                </span>
              </div>
            </div>

            {/* 1. Finished Goods Table */}
            {finishedItems.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Package className="h-3.5 w-3.5 text-blue-500" />
                  <span>Thành phẩm đạt chuẩn ({finishedItems.length} • {totalFinishOutput.toLocaleString()} Tấn)</span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 font-semibold text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 w-28">Mã SKU</th>
                        <th className="px-3 py-2">Tên thành phẩm</th>
                        <th className="px-3 py-2 text-right w-36">Tổng sản lượng</th>
                        <th className="px-3 py-2 w-48">Kho nhập đích *</th>
                        <th className="px-3 py-2 w-36">Vị trí / Bãi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {finishedItems.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-muted/20">
                          <td className="px-3 py-2.5 font-mono font-bold text-foreground">
                            {item.item_code}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-foreground">
                            <div className="flex flex-col">
                              <span>{item.item_name}</span>
                              {item.shift_codes && item.shift_codes.length > 0 && (
                                <span className="text-[10px] text-muted-foreground">
                                  Ca: {item.shift_codes.join(', ')}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            {item.total_quantity.toLocaleString()} {item.unit_of_measure}
                          </td>
                          <td className="px-3 py-2.5">
                            <select
                              value={item.warehouse_id}
                              onChange={(e) => handleUpdateFinishedWh(idx, e.target.value)}
                              className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary font-medium"
                            >
                              <option value="">-- Chọn kho nhập --</option>
                              {warehousesList.map((w) => (
                                <option key={w.id} value={w.id}>
                                  [{w.code}] {w.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2.5">
                            <input
                              type="text"
                              value={item.storage_location || ''}
                              onChange={(e) => handleUpdateFinishedLoc(idx, e.target.value)}
                              placeholder="VD: Bãi 4K, Silo..."
                              className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. Semi-Finished Goods Table (Mục riêng cho Bán thành phẩm) */}
            {semiFinishedItems.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-amber-500" />
                  <span className="font-bold text-amber-700 dark:text-amber-400">Bán thành phẩm sản xuất ({semiFinishedItems.length} mặt hàng • {totalSemiOutput.toLocaleString()} Tấn)</span>
                  <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                    Tính thu hồi riêng
                  </span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-amber-500/20 bg-amber-500/5">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-amber-500/10 font-semibold text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 w-28">Mã SKU</th>
                        <th className="px-3 py-2">Tên bán thành phẩm</th>
                        <th className="px-3 py-2 text-right w-36">Tổng sản lượng</th>
                        <th className="px-3 py-2 w-48">Kho nhập đích *</th>
                        <th className="px-3 py-2 w-36">Vị trí / Bãi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                      {semiFinishedItems.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-amber-500/10">
                          <td className="px-3 py-2.5 font-mono font-bold text-foreground">
                            {item.item_code}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-foreground">
                            <div className="flex flex-col">
                              <span>{item.item_name}</span>
                              {item.shift_codes && item.shift_codes.length > 0 && (
                                <span className="text-[10px] text-muted-foreground">
                                  Ca: {item.shift_codes.join(', ')}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-amber-600 dark:text-amber-400">
                            {item.total_quantity.toLocaleString()} {item.unit_of_measure}
                          </td>
                          <td className="px-3 py-2.5">
                            <select
                              value={item.warehouse_id}
                              onChange={(e) => handleUpdateSemiWh(idx, e.target.value)}
                              className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary font-medium"
                            >
                              <option value="">-- Chọn kho nhập --</option>
                              {warehousesList.map((w) => (
                                <option key={w.id} value={w.id}>
                                  [{w.code}] {w.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2.5">
                            <input
                              type="text"
                              value={item.storage_location || ''}
                              onChange={(e) => handleUpdateSemiLoc(idx, e.target.value)}
                              placeholder="VD: Bãi BTP, Silo trung gian..."
                              className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. Byproducts Table */}
            {byproductItems.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <div className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5 text-purple-500" />
                  <span>Phụ phẩm phát sinh thu hồi ({byproductItems.length} • {totalByproductOutput.toLocaleString()} Tấn)</span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 font-semibold text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 w-28">Mã SKU</th>
                        <th className="px-3 py-2">Tên phụ phẩm</th>
                        <th className="px-3 py-2 text-right w-36">Tổng sản lượng</th>
                        <th className="px-3 py-2 w-48">Kho nhập đích *</th>
                        <th className="px-3 py-2 w-36">Vị trí / Bãi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {byproductItems.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-muted/20">
                          <td className="px-3 py-2.5 font-mono font-bold text-foreground">
                            {item.item_code}
                          </td>
                          <td className="px-3 py-2.5 font-medium text-foreground">
                            {item.item_name}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-purple-600 dark:text-purple-400">
                            {item.total_quantity.toLocaleString()} {item.unit_of_measure}
                          </td>
                          <td className="px-3 py-2.5">
                            <select
                              value={item.warehouse_id}
                              onChange={(e) => handleUpdateByproductWh(idx, e.target.value)}
                              className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary font-medium"
                            >
                              <option value="">-- Chọn kho nhập --</option>
                              {warehousesList.map((w) => (
                                <option key={w.id} value={w.id}>
                                  [{w.code}] {w.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2.5">
                            <input
                              type="text"
                              value={item.storage_location || ''}
                              onChange={(e) => handleUpdateByproductLoc(idx, e.target.value)}
                              placeholder="VD: Moong khai thác..."
                              className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: XUẤT VẬT TƯ & NGUYÊN NHIÊN LIỆU */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                  2
                </span>
                <h3 className="text-sm font-bold text-foreground">
                  Giai đoạn 2: Xuất Vật tư, Nguyên nhiên liệu tiêu hao phục vụ sản xuất
                </h3>
                <span className="text-xs text-muted-foreground">
                  ({materialItems.length} danh mục nguyên vật liệu)
                </span>
              </div>
            </div>

            {materialItems.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Tên vật tư / Nguyên nhiên liệu</th>
                      <th className="px-3 py-2 text-right w-36">Tổng tiêu hao</th>
                      <th className="px-3 py-2 w-48">Kho xuất nguồn *</th>
                      <th className="px-3 py-2 w-36">Đơn vị tính</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {materialItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-muted/20">
                        <td className="px-3 py-2.5 font-medium text-foreground">
                          {item.item_name}
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-rose-600 dark:text-rose-400">
                          - {item.total_quantity.toLocaleString()} {item.unit_of_measure}
                        </td>
                        <td className="px-3 py-2.5">
                          <select
                            value={item.warehouse_id}
                            onChange={(e) => handleUpdateMaterialWh(idx, e.target.value)}
                            className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-primary font-medium"
                          >
                            <option value="">-- Chọn kho xuất --</option>
                            {warehousesList.map((w) => (
                              <option key={w.id} value={w.id}>
                                [{w.code}] {w.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {item.unit_of_measure}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Không có nguyên nhiên liệu kho vật lý nào cần xuất trong các ca này.
              </p>
            )}
          </div>

          {/* Ghi chú chung */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Ghi chú biên bản nghiệm thu (tùy chọn)
            </label>
            <textarea
              rows={2}
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="VD: Nghiệm thu sản lượng ca sản xuất đợt 1 tháng 01/2026..."
              className="w-full rounded-xl border border-input bg-background p-3 text-xs text-foreground focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>
              Dự kiến sinh <strong className="text-foreground">{totalTxExpected}</strong> phiếu kho (Nhập TP/PP & Xuất NVL).
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={batchSyncMutation.isPending}
              className="rounded-xl border border-input bg-background px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={batchSyncMutation.isPending || totalTxExpected === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
            >
              {batchSyncMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang sinh phiếu kho...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Xác nhận & Sinh phiếu kho ({totalTxExpected})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
