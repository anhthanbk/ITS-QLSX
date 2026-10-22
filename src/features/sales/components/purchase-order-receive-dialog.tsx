import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  PackageCheck,
  Warehouse as WarehouseIcon,
  Zap,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  FileText,
  Layers,
  Truck,
  UserCheck,
} from 'lucide-react';
import type { PurchaseOrder } from '../types';
import { useReceivePurchaseOrder, usePurchaseOrderDetail } from '../hooks/use-sales-queries';
import { useWarehouses } from '@/features/warehouse/hooks/use-warehouses';
import { useDepartments } from '@/features/hr/hooks/use-departments';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/feedback/use-toast';

export interface PurchaseOrderReceiveDialogProps {
  isOpen: boolean;
  order: PurchaseOrder | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PurchaseOrderReceiveDialog: React.FC<PurchaseOrderReceiveDialogProps> = ({
  isOpen,
  order,
  onClose,
  onSuccess,
}) => {
  const { success, error: toastError } = useToast();
  const receiveMutation = useReceivePurchaseOrder();

  // Fetch full order detail with items if not already present
  const orderId = isOpen && order ? order.id : null;
  const { data: fullOrder, isLoading: isOrderDetailLoading } = usePurchaseOrderDetail(orderId);
  const effectiveOrder = fullOrder || order;

  // 1. Kịch bản: 1 = warehouse_storage (Nhập kho dự trữ), 2 = direct_issue (Bàn giao xuất dùng ngay)
  const [receiptMode, setReceiptMode] = useState<'warehouse_storage' | 'direct_issue'>('warehouse_storage');

  // 2. Thông tin chứng từ phiếu nhập kho đầy đủ
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [receiptDate, setReceiptDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [productionPeriodCode, setProductionPeriodCode] = useState<string>('');
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState<string>('');

  // 3. Trường bổ sung cho Kịch bản 2
  const [targetDepartment, setTargetDepartment] = useState<string>('');
  const [targetEquipment, setTargetEquipment] = useState<string>('');
  const [receiverName, setReceiverName] = useState<string>('');

  // 4. Ghi chú & Đánh giá nghiệm thu
  const [notes, setNotes] = useState<string>('');

  // 5. Chi tiết từng mặt hàng: SL thực nhận & Đơn giá nhập
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [itemUnitCosts, setItemUnitCosts] = useState<Record<string, number>>({});

  // Fetch active warehouses
  const { data: warehouseData } = useWarehouses({
    page: 1,
    pageSize: 50,
    status: 'active',
  });
  const warehouses = useMemo(() => warehouseData?.data || [], [warehouseData?.data]);

  // Fetch HR departments for direct issue option
  const { data: hrDepartments } = useDepartments();

  // Reset & initialize form when order opens
  useEffect(() => {
    if (isOpen && order) {
      setItemQuantities({});
      setItemUnitCosts({});
      setNotes('');
      setReceiptMode('warehouse_storage');
      setReceiverName('');

      const now = new Date();
      const poCode = order.po_code || '';
      const dateStr = now.toISOString().slice(0, 10);
      const dateClean = dateStr.replace(/-/g, '');

      setReceiptNumber(`PNK-${poCode}-${now.getTime().toString().slice(-4)}`);
      setReceiptDate(dateStr);
      setProductionPeriodCode(`KY-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
      setDeliveryNoteNumber(`GH-${poCode}-${dateClean}`);
    }
  }, [isOpen, order]);

  // Initialize item quantities & unit costs when items arrive
  useEffect(() => {
    if (isOpen && effectiveOrder?.items && effectiveOrder.items.length > 0) {
      setItemQuantities((prev) => {
        const nextQty: Record<string, number> = { ...prev };
        let changed = false;
        effectiveOrder.items?.forEach((item) => {
          if (nextQty[item.id] === undefined) {
            const remaining = Math.max(0, Number(item.quantity) - Number(item.received_quantity || 0));
            nextQty[item.id] = remaining;
            changed = true;
          }
        });
        return changed ? nextQty : prev;
      });

      setItemUnitCosts((prev) => {
        const nextCosts: Record<string, number> = { ...prev };
        let changed = false;
        effectiveOrder.items?.forEach((item) => {
          if (nextCosts[item.id] === undefined) {
            nextCosts[item.id] = Number(item.unit_price) || 0;
            changed = true;
          }
        });
        return changed ? nextCosts : prev;
      });
    }
  }, [isOpen, effectiveOrder]);

  // Set default warehouse
  useEffect(() => {
    if (warehouses.length > 0 && !selectedWarehouseId) {
      setSelectedWarehouseId(warehouses[0]?.id || '');
    }
  }, [warehouses, selectedWarehouseId]);

  // Set default HR department
  useEffect(() => {
    if (hrDepartments && hrDepartments.length > 0 && !targetDepartment) {
      setTargetDepartment(hrDepartments[0]?.name || '');
    }
  }, [hrDepartments, targetDepartment]);

  if (!isOpen || !order) return null;

  const orderItems = effectiveOrder?.items || [];

  const handleQtyChange = (itemId: string, value: number, maxAllowed: number) => {
    const validVal = Math.max(0, Math.min(value, maxAllowed));
    setItemQuantities((prev) => ({
      ...prev,
      [itemId]: validVal,
    }));
  };

  const handleUnitCostChange = (itemId: string, value: number) => {
    const validCost = Math.max(0, value);
    setItemUnitCosts((prev) => ({
      ...prev,
      [itemId]: validCost,
    }));
  };

  const handleSetMax = (itemId: string, maxAllowed: number) => {
    setItemQuantities((prev) => ({
      ...prev,
      [itemId]: maxAllowed,
    }));
  };

  // Calculations
  const totalReceivingItemsCount = orderItems.filter((item) => {
    const remainingBefore = Math.max(0, (Number(item.quantity) || 0) - (Number(item.received_quantity) || 0));
    const qty = itemQuantities[item.id] !== undefined ? Number(itemQuantities[item.id]) || 0 : remainingBefore;
    return qty > 0;
  }).length;

  const totalReceivingQuantity = orderItems.reduce((acc, item) => {
    const remainingBefore = Math.max(0, (Number(item.quantity) || 0) - (Number(item.received_quantity) || 0));
    const qty = itemQuantities[item.id] !== undefined ? Number(itemQuantities[item.id]) || 0 : remainingBefore;
    return acc + qty;
  }, 0);

  const totalReceivingAmount = orderItems.reduce((acc, item) => {
    const remainingBefore = Math.max(0, (Number(item.quantity) || 0) - (Number(item.received_quantity) || 0));
    const qty = itemQuantities[item.id] !== undefined ? Number(itemQuantities[item.id]) || 0 : remainingBefore;
    const cost = itemUnitCosts[item.id] !== undefined ? Number(itemUnitCosts[item.id]) : Number(item.unit_price) || 0;
    return acc + qty * cost;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedWarehouseId) {
      toastError('Vui lòng chọn kho tiếp nhận hàng.');
      return;
    }

    if (!receiptNumber.trim()) {
      toastError('Vui lòng nhập số phiếu nhập kho.');
      return;
    }

    const receiveItems = orderItems
      .map((item) => {
        const remainingBefore = Math.max(0, (Number(item.quantity) || 0) - (Number(item.received_quantity) || 0));
        const currentQty = itemQuantities[item.id] !== undefined ? Number(itemQuantities[item.id]) || 0 : remainingBefore;
        return {
          order_item_id: item.id,
          material_id: item.material_id,
          received_quantity: currentQty,
          unit_cost: itemUnitCosts[item.id] !== undefined ? Number(itemUnitCosts[item.id]) : Number(item.unit_price) || 0,
        };
      })
      .filter((it) => it.received_quantity > 0);

    if (receiveItems.length === 0) {
      toastError('Vui lòng nhập số lượng thực nhận lớn hơn 0 cho ít nhất một mặt hàng.');
      return;
    }

    try {
      const result = await receiveMutation.mutateAsync({
        purchase_order_id: effectiveOrder?.id || order.id,
        po_code: effectiveOrder?.po_code || order.po_code,
        receipt_mode: receiptMode,
        warehouse_id: selectedWarehouseId,
        receipt_number: receiptNumber.trim() || undefined,
        receipt_date: receiptDate || undefined,
        production_period_code: productionPeriodCode.trim() || undefined,
        delivery_note_number: deliveryNoteNumber.trim() || undefined,
        target_department: receiptMode === 'direct_issue' ? targetDepartment : undefined,
        target_equipment: receiptMode === 'direct_issue' ? targetEquipment.trim() || undefined : undefined,
        receiver_name: receiptMode === 'direct_issue' ? receiverName.trim() || undefined : undefined,
        notes: notes.trim() || undefined,
        items: receiveItems,
      });

      success(result.message);
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Lỗi khi thực hiện nhập kho bàn giao');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative flex max-h-[94vh] w-full max-w-4xl flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
              <PackageCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">
                  Nghiệm thu & Nhập kho theo đơn PO: <span className="text-primary">{effectiveOrder?.po_code || order.po_code}</span>
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Nhà cung cấp: <strong className="text-foreground">{effectiveOrder?.supplier?.name || order.supplier?.name || 'Chưa xác định'}</strong> • Ngày đặt PO: {effectiveOrder?.order_date || order.order_date}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto px-6 py-4 space-y-5">
          {/* 1. Chọn Kịch bản Bàn giao */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2">
              Kịch bản bàn giao thực tế tại nhà máy <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Option 1: Nhập kho dự trữ */}
              <div
                onClick={() => setReceiptMode('warehouse_storage')}
                className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                  receiptMode === 'warehouse_storage'
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border bg-card hover:bg-muted/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      receiptMode === 'warehouse_storage'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <WarehouseIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-sm text-foreground">
                      <span>Kịch bản 1: Nhập kho dự trữ</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Lưu trữ tại kho đích để quản lý tập trung, phục vụ nhu cầu sản xuất và cấp phát dần theo ca.
                      <strong> Tồn kho sẽ được tự động cộng thêm.</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Option 2: Bàn giao xuất dùng ngay */}
              <div
                onClick={() => setReceiptMode('direct_issue')}
                className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                  receiptMode === 'direct_issue'
                    ? 'border-indigo-500 bg-indigo-500/5 ring-2 ring-indigo-500/20'
                    : 'border-border bg-card hover:bg-muted/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      receiptMode === 'direct_issue'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-sm text-foreground">
                      <span>Kịch bản 2: Bàn giao xuất dùng ngay</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Hàng kiểm đếm xong bàn giao thẳng cho phân xưởng/thiết bị sửa chữa. Tự động sinh phiếu nhập & phiếu xuất dùng, <strong>chi phí hạch toán trực tiếp cho bộ phận</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Thông tin chứng từ Phiếu Nhập Kho đầy đủ */}
          <div className="rounded-xl border border-border bg-muted/10 p-4 space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <FileText className="h-4 w-4 text-primary" />
              <span>Thông tin chứng từ phiếu nhập kho</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Mã phiếu nhập kho */}
              <div>
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  Mã phiếu nhập (PNK) <span className="text-destructive">*</span>
                </label>
                <div className="relative mt-1">
                  <FileText className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    placeholder="VD: PNK-20261016-001"
                    className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-1.5 text-xs font-mono font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>

              {/* Ngày nhập kho */}
              <div>
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  Ngày nhập kho <span className="text-destructive">*</span>
                </label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="date"
                    required
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>

              {/* Kho tiếp nhận */}
              <div>
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  Kho tiếp nhận <span className="text-destructive">*</span>
                </label>
                <select
                  required
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">-- Chọn kho nhận hàng --</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.code} - {wh.name} ({wh.warehouse_type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Mã đợt / kỳ sản xuất */}
              <div>
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  Mã đợt / Kỳ sản xuất
                </label>
                <div className="relative mt-1">
                  <Layers className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={productionPeriodCode}
                    onChange={(e) => setProductionPeriodCode(e.target.value)}
                    placeholder="VD: KY-2026-10, DOT-01..."
                    className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>

              {/* Số phiếu giao hàng / Hóa đơn NCC */}
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  Số phiếu giao hàng / Hóa đơn vận đơn của NCC
                </label>
                <div className="relative mt-1">
                  <Truck className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={deliveryNoteNumber}
                    onChange={(e) => setDeliveryNoteNumber(e.target.value)}
                    placeholder="VD: PGH-NCC-2026-889 / HD-88129"
                    className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-1.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Trường bổ sung nếu chọn Kịch bản 2 (Bàn giao xuất dùng ngay) */}
          {receiptMode === 'direct_issue' && (
            <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/50 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/20 animate-in fade-in space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                <Zap className="h-3.5 w-3.5" />
                <span>Thông tin điều chuyển & Bàn giao xuất dùng trực tiếp</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Bộ phận tiếp nhận bàn giao <span className="text-destructive">*</span>
                  </label>
                  <select
                    required
                    value={targetDepartment}
                    onChange={(e) => setTargetDepartment(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {hrDepartments && hrDepartments.length > 0 ? (
                      hrDepartments.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name} ({d.code})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Xưởng Tuyển Khoáng">Xưởng Tuyển Khoáng</option>
                        <option value="Xưởng Nghiền & Sấy">Xưởng Nghiền & Sấy</option>
                        <option value="Phòng Cơ Điện & Bảo Trì">Phòng Cơ Điện & Bảo Trì</option>
                        <option value="Phòng KCS / QC">Phòng KCS / QC</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Vị trí máy móc / Thiết bị sử dụng
                  </label>
                  <input
                    type="text"
                    value={targetEquipment}
                    onChange={(e) => setTargetEquipment(e.target.value)}
                    placeholder="VD: Máy bơm tuyển nổi P-02, Máy nghiền BM-01..."
                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    Người nhận bàn giao / Phụ trách
                  </label>
                  <div className="relative mt-1">
                    <UserCheck className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      placeholder="VD: Kỹ sư Nguyễn Văn A..."
                      className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. Danh mục chi tiết các mặt hàng nhận */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Chi tiết vật tư nghiệm thu & thực nhận
              </label>
              <span className="text-xs text-muted-foreground">
                Đang nhận: <strong className="text-primary">{totalReceivingItemsCount}</strong> / {orderItems.length} mặt hàng
              </span>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[720px]">
                  <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2.5 w-10 text-center">STT</th>
                      <th className="px-3.5 py-2.5">Vật tư & Quy cách</th>
                      <th className="px-3 py-2.5 text-right">SL Đặt</th>
                      <th className="px-3 py-2.5 text-right">Đã nhận</th>
                      <th className="px-3 py-2.5 text-right">Còn lại</th>
                      <th className="px-3.5 py-2.5 text-right w-40">SL Thực nhận</th>
                      <th className="px-3.5 py-2.5 text-right w-36">Đơn giá nhập (₫)</th>
                      <th className="px-3.5 py-2.5 text-right w-36">Thành tiền (₫)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isOrderDetailLoading && orderItems.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <span className="text-xs font-medium">Đang tải danh mục vật tư của đơn PO...</span>
                          </div>
                        </td>
                      </tr>
                    ) : orderItems.length > 0 ? (
                      orderItems.map((item, index) => {
                        const orderedQty = Number(item.quantity) || 0;
                        const receivedSoFar = Number(item.received_quantity) || 0;
                        const remainingBefore = Math.max(0, orderedQty - receivedSoFar);
                        const isAlreadyCompleted = remainingBefore <= 0;
                        const currentQty = isAlreadyCompleted
                          ? 0
                          : itemQuantities[item.id] !== undefined
                          ? Number(itemQuantities[item.id]) || 0
                          : remainingBefore;
                        const currentCost = Number(itemUnitCosts[item.id] ?? item.unit_price ?? 0);
                        const lineTotal = currentQty * currentCost;

                        // Dynamic calculations: Đã nhận tăng và Còn lại giảm theo SL thực nhận
                        const totalReceivedAfter = receivedSoFar + currentQty;
                        const remainingAfter = Math.max(0, orderedQty - totalReceivedAfter);

                        return (
                          <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                            <td className="px-3 py-3 text-center text-muted-foreground font-mono">
                              {index + 1}
                            </td>
                            <td className="px-3.5 py-3">
                              <div className="font-semibold text-foreground">
                                {item.material?.name || 'Vật tư mua theo PO'}
                              </div>
                              <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                                <span>Mã: <code className="font-mono text-foreground">{item.material?.code || '-'}</code></span>
                                <span>•</span>
                                <span>ĐVT: <strong className="text-foreground">{item.material?.unit_of_measure || '-'}</strong></span>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-right font-medium text-foreground">
                              {orderedQty.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-3 py-3 text-right">
                              <div className="font-semibold text-foreground">
                                {totalReceivedAfter.toLocaleString('vi-VN')}
                              </div>
                              {receivedSoFar > 0 && currentQty > 0 && (
                                <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                                  (Trước: <span>{receivedSoFar.toLocaleString('vi-VN')}</span> + Nhận: {currentQty.toLocaleString('vi-VN')})
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-3 text-right">
                              {remainingAfter <= 0 ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                                  <CheckCircle2 className="h-3 w-3" /> Đủ (0)
                                </span>
                              ) : (
                                <span className="font-semibold text-amber-600">
                                  {remainingAfter.toLocaleString('vi-VN')}
                                </span>
                              )}
                            </td>
                            <td className="px-3.5 py-3 text-right">
                              {isAlreadyCompleted ? (
                                <span className="text-muted-foreground italic text-[11px]">Đã nhận đủ</span>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5">
                                  <input
                                    type="number"
                                    min="0"
                                    max={remainingBefore}
                                    step="any"
                                    value={currentQty}
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      const val = raw === '' ? 0 : Number(raw);
                                      handleQtyChange(item.id, isNaN(val) ? 0 : val, remainingBefore);
                                    }}
                                    className="w-20 rounded-lg border border-input bg-background px-2 py-1 text-right text-xs font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSetMax(item.id, remainingBefore)}
                                    className="h-6 px-1.5 text-[10px]"
                                    title="Nhận toàn bộ số lượng còn lại"
                                  >
                                    Nhận đủ
                                  </Button>
                                </div>
                              )}
                            </td>
                            <td className="px-3.5 py-3 text-right">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={currentCost}
                                onChange={(e) => handleUnitCostChange(item.id, Number(e.target.value) || 0)}
                                className="w-28 rounded-lg border border-input bg-background px-2 py-1 text-right text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              />
                            </td>
                            <td className="px-3.5 py-3 text-right font-semibold text-foreground font-mono">
                              {lineTotal.toLocaleString('vi-VN')} ₫
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                            <span className="text-xs font-medium">Không tìm thấy mặt hàng nào trong đơn mua này.</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 5. Khung tổng kết giá trị & Ghi chú kiểm đếm */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Biên bản kiểm đếm / ghi chú */}
            <div>
              <label className="text-xs font-semibold text-foreground">
                Biên bản nghiệm thu & Ghi chú kiểm đếm
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="VD: Hàng kiểm tra đạt COA, đủ số lượng theo cân xe số 104, bao bì niêm chì nguyên vẹn..."
                className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {/* Bảng tổng hợp số liệu thanh toán */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 flex flex-col justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                Tổng hợp giá trị phiếu nhập kho
              </span>
              <div className="space-y-1.5 my-2 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Số mặt hàng thực nhận:</span>
                  <span className="font-semibold text-foreground">{totalReceivingItemsCount} mặt hàng</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Tổng số lượng nhập:</span>
                  <span className="font-semibold text-foreground">{totalReceivingQuantity.toLocaleString('vi-VN')}</span>
                </div>
                <div className="flex items-center justify-between border-t border-emerald-500/20 pt-1.5 text-sm font-bold text-foreground">
                  <span>Tổng tiền nhập kho:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-base font-mono">
                    {totalReceivingAmount.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>
                Hệ thống sẽ tự động cập nhật thẻ kho, phiếu xuất dùng (nếu có) và trạng thái đơn PO ngay khi xác nhận.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={receiveMutation.isPending}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={
                  receiveMutation.isPending ||
                  isOrderDetailLoading ||
                  totalReceivingItemsCount === 0 ||
                  orderItems.length === 0
                }
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {receiveMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang xử lý nhập kho...</span>
                  </>
                ) : (
                  <>
                    <PackageCheck className="h-4 w-4" />
                    <span>
                      {receiptMode === 'direct_issue'
                        ? 'Xác nhận nhập kho & Bàn giao dùng ngay'
                        : 'Xác nhận & Hoàn tất nhập kho (+ Tồn kho)'}
                    </span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
