import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Truck,
  Warehouse as WarehouseIcon,
  Loader2,
  Calendar,
  Layers,
  CheckCircle2,
  User,
  Scale,
} from 'lucide-react';
import type { SalesOrder } from '../types';
import { useDispatchSalesOrder, useSalesOrderDetail } from '../hooks/use-sales-queries';
import { useWarehouses } from '@/features/warehouse/hooks/use-warehouses';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/feedback/use-toast';

export interface SalesOrderDispatchDialogProps {
  isOpen: boolean;
  order: SalesOrder | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SalesOrderDispatchDialog: React.FC<SalesOrderDispatchDialogProps> = ({
  isOpen,
  order,
  onClose,
  onSuccess,
}) => {
  const { success, error: toastError } = useToast();
  const dispatchMutation = useDispatchSalesOrder();

  // Fetch full order detail with items
  const orderId = isOpen && order ? order.id : null;
  const { data: fullOrder, isLoading: isOrderDetailLoading } = useSalesOrderDetail(orderId);
  const effectiveOrder = fullOrder || order;

  // 1. Thông tin xuất kho
  const [dispatchNumber, setDispatchNumber] = useState<string>('');
  const [dispatchDate, setDispatchDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [weighbridgeTicketNumber, setWeighbridgeTicketNumber] = useState<string>('');

  // 2. Thông tin vận tải & phương tiện
  const [carrierName, setCarrierName] = useState<string>('');
  const [vehiclePlate, setVehiclePlate] = useState<string>('');
  const [driverInfo, setDriverInfo] = useState<string>('');
  const [deliveryLocation, setDeliveryLocation] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // 3. Chi tiết từng mặt hàng xuất: SL thực xuất
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});

  // Fetch active warehouses (finished goods / general warehouses)
  const { data: warehouseData } = useWarehouses({
    page: 1,
    pageSize: 50,
    status: 'active',
  });
  const warehouses = useMemo(() => warehouseData?.data || [], [warehouseData?.data]);

  // Reset & initialize form when order changes
  useEffect(() => {
    if (isOpen && order) {
      setItemQuantities({});
      const rand = Math.floor(100 + Math.random() * 900);
      setDispatchNumber(`PXK-${order.order_code.replace(/^SO-/, '')}-${rand}`);
      setDispatchDate(new Date().toISOString().slice(0, 10));
      setCarrierName(order.carrier_name || '');
      setVehiclePlate(order.vehicle_plate || '');
      setDriverInfo(order.driver_info || '');
      setDeliveryLocation(order.delivery_location || 'Cảng Quốc tế Cam Ranh');
      setWeighbridgeTicketNumber('');
      setNotes('');
    }
  }, [isOpen, order]);

  // Default warehouse selection
  useEffect(() => {
    if (warehouses.length > 0 && !selectedWarehouseId) {
      // Prioritize finished_goods warehouse if available
      const fgWarehouse = warehouses.find(
        (w) => w.warehouse_type === 'finished_goods' || w.code.includes('TP'),
      );
      setSelectedWarehouseId(fgWarehouse ? fgWarehouse.id : (warehouses[0]?.id || ''));
    }
  }, [warehouses, selectedWarehouseId]);

  // Initialize remaining quantities when order items load
  useEffect(() => {
    if (isOpen && effectiveOrder?.items && effectiveOrder.items.length > 0) {
      setItemQuantities((prev) => {
        const next = { ...prev };
        let changed = false;
        effectiveOrder.items!.forEach((it) => {
          if (next[it.id] === undefined) {
            const remaining = Math.max(0, (Number(it.quantity) || 0) - (Number(it.fulfilled_quantity) || 0));
            next[it.id] = remaining;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
  }, [isOpen, effectiveOrder]);

  if (!isOpen || !order) return null;

  const orderItems = effectiveOrder?.items || [];

  const handleQtyChange = (itemId: string, value: number, maxAllowed: number) => {
    const validVal = Math.max(0, Math.min(value, maxAllowed));
    setItemQuantities((prev) => ({
      ...prev,
      [itemId]: validVal,
    }));
  };

  const handleSetMax = (itemId: string, maxAllowed: number) => {
    setItemQuantities((prev) => ({
      ...prev,
      [itemId]: maxAllowed,
    }));
  };

  const totalDispatchQuantity = orderItems.reduce((acc, item) => {
    const remainingBefore = Math.max(0, (Number(item.quantity) || 0) - (Number(item.fulfilled_quantity) || 0));
    const qty = itemQuantities[item.id] !== undefined ? Number(itemQuantities[item.id]) || 0 : remainingBefore;
    return acc + qty;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedWarehouseId) {
      toastError('Vui lòng chọn kho xuất thành phẩm.');
      return;
    }

    if (!dispatchNumber.trim()) {
      toastError('Vui lòng nhập số phiếu xuất kho.');
      return;
    }

    const dispatchItems = orderItems
      .map((item) => {
        const remainingBefore = Math.max(0, (Number(item.quantity) || 0) - (Number(item.fulfilled_quantity) || 0));
        const currentQty =
          itemQuantities[item.id] !== undefined ? Number(itemQuantities[item.id]) || 0 : remainingBefore;
        return {
          order_item_id: item.id,
          product_id: item.product_id,
          dispatch_quantity: currentQty,
          unit_price: Number(item.unit_price) || 0,
        };
      })
      .filter((it) => it.dispatch_quantity > 0);

    if (dispatchItems.length === 0) {
      toastError('Vui lòng nhập số lượng xuất kho lớn hơn 0 cho ít nhất một mặt hàng.');
      return;
    }

    try {
      const result = await dispatchMutation.mutateAsync({
        sales_order_id: effectiveOrder?.id || order.id,
        order_code: effectiveOrder?.order_code || order.order_code,
        warehouse_id: selectedWarehouseId,
        dispatch_number: dispatchNumber.trim() || undefined,
        dispatch_date: dispatchDate || undefined,
        carrier_name: carrierName.trim() || undefined,
        vehicle_plate: vehiclePlate.trim().toUpperCase() || undefined,
        driver_info: driverInfo.trim() || undefined,
        delivery_location: deliveryLocation.trim() || undefined,
        weighbridge_ticket_number: weighbridgeTicketNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        items: dispatchItems,
      });

      success(result.message);
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      toastError(err instanceof Error ? err.message : 'Lỗi khi thực hiện xuất kho giao hàng');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative flex max-h-[94vh] w-full max-w-4xl flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">
                  Xuất Kho Thành Phẩm / Phụ Phẩm Theo Đơn Hàng
                </h3>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                  {effectiveOrder?.order_code || order.order_code}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Khách hàng: <strong className="text-foreground">{effectiveOrder?.customer?.name || order.customer?.name}</strong> • Tự động trừ tồn kho và cập nhật số lượng giao hàng
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {isOrderDetailLoading && (
            <div className="flex items-center justify-center py-6 text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Đang tải thông tin chi tiết các mặt hàng của đơn...</span>
            </div>
          )}

          {/* Section 1: Chứng từ xuất kho */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2 font-bold text-foreground text-xs uppercase tracking-wider">
              <WarehouseIcon className="h-4 w-4 text-primary" />
              <span>1. Thông tin Phiếu Xuất Kho</span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-muted-foreground font-medium mb-1">
                  Số phiếu xuất kho <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={dispatchNumber}
                  onChange={(e) => setDispatchNumber(e.target.value)}
                  placeholder="VD: PXK-SO-..."
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-muted-foreground font-medium mb-1">
                  Ngày xuất kho <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="date"
                    value={dispatchDate}
                    onChange={(e) => setDispatchDate(e.target.value)}
                    required
                    className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground font-medium mb-1">
                  Kho xuất hàng <span className="text-destructive">*</span>
                </label>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                >
                  <option value="">-- Chọn kho xuất --</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code} - {w.name} ({w.warehouse_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-muted-foreground font-medium mb-1">
                  Số phiếu cân / Hóa đơn xuất
                </label>
                <div className="relative">
                  <Scale className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={weighbridgeTicketNumber}
                    onChange={(e) => setWeighbridgeTicketNumber(e.target.value)}
                    placeholder="VD: CAN-79C-15288"
                    className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Vận tải & Điều xe */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center gap-2 font-bold text-foreground text-xs uppercase tracking-wider">
              <Truck className="h-4 w-4 text-primary" />
              <span>2. Thông tin Đơn Vị Vận Tải & Phương Tiện Bốc Hàng</span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-muted-foreground font-medium mb-1">
                  Đơn vị vận tải / Nhà xe
                </label>
                <input
                  type="text"
                  value={carrierName}
                  onChange={(e) => setCarrierName(e.target.value)}
                  placeholder="VD: Cty Vận tải Hải Vân Cam Ranh"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                />
              </div>

              <div>
                <label className="block text-muted-foreground font-medium mb-1">
                  Biển số xe / Sà lan
                </label>
                <input
                  type="text"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  placeholder="VD: 79C-152.88"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono font-bold uppercase text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-muted-foreground font-medium mb-1">
                  Tài xế & Số điện thoại
                </label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={driverInfo}
                    onChange={(e) => setDriverInfo(e.target.value)}
                    placeholder="VD: Nguyễn Văn Hùng - 0914.xxx.xxx"
                    className="w-full rounded-lg border border-input bg-background pl-8 pr-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground font-medium mb-1">
                  Địa điểm / Cảng giao nhận
                </label>
                <input
                  type="text"
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  placeholder="VD: Cảng Cam Ranh / Kho khách"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-muted-foreground font-medium mb-1">Ghi chú bốc xếp / Đóng gói</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="VD: Hàng đóng bao Jumbo 50kg, kiểm tra niêm phong bạt xe tải..."
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Section 3: Bảng danh sách thành phẩm xuất kho */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-foreground text-xs uppercase tracking-wider">
                <Layers className="h-4 w-4 text-primary" />
                <span>3. Danh mục thành phẩm & Khối lượng xuất kho ({orderItems.length})</span>
              </div>
              <span className="text-xs text-muted-foreground">
                Tổng xuất đợt này:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  {totalDispatchQuantity.toLocaleString('vi-VN')}
                </strong>{' '}
                đơn vị
              </span>
            </div>

            <div className="rounded-xl border border-border overflow-hidden bg-card">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/40 uppercase tracking-wider text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-4 py-3">Thành phẩm / Phụ phẩm</th>
                    <th className="px-3 py-3 text-center">ĐVT</th>
                    <th className="px-3 py-3 text-right">SL đặt</th>
                    <th className="px-3 py-3 text-right">Đã giao</th>
                    <th className="px-3 py-3 text-right">Còn lại</th>
                    <th className="px-4 py-3 text-right w-44">SL thực xuất lần này</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orderItems.map((item) => {
                    const orderedQty = Number(item.quantity) || 0;
                    const fulfilledQty = Number(item.fulfilled_quantity) || 0;
                    const remainingQty = Math.max(0, orderedQty - fulfilledQty);
                    const currentDispatchQty =
                      itemQuantities[item.id] !== undefined
                        ? itemQuantities[item.id]!
                        : remainingQty;

                    const isFullyDelivered = remainingQty === 0;

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isFullyDelivered ? 'bg-muted/10 opacity-70' : 'hover:bg-muted/30'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground">
                            {item.product?.name || 'Thành phẩm'}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono">
                            Mã: {item.product?.sku || '-'}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center font-medium text-muted-foreground">
                          {item.product?.unit_of_measure || 'Tấn'}
                        </td>
                        <td className="px-3 py-3 text-right font-medium text-foreground">
                          {orderedQty.toLocaleString('vi-VN')}
                        </td>
                        <td className="px-3 py-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                          {fulfilledQty.toLocaleString('vi-VN')}
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-foreground">
                          {remainingQty.toLocaleString('vi-VN')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isFullyDelivered ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Đã xuất đủ
                            </span>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <input
                                type="number"
                                min={0}
                                max={remainingQty}
                                step="any"
                                value={currentDispatchQty === 0 ? '' : currentDispatchQty}
                                onChange={(e) =>
                                  handleQtyChange(item.id, Number(e.target.value) || 0, remainingQty)
                                }
                                placeholder="0"
                                className="w-24 rounded-lg border border-input bg-background px-2.5 py-1.5 text-right font-mono font-bold text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetMax(item.id, remainingQty)}
                                className="h-7 px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                                title="Xuất toàn bộ số lượng còn lại"
                              >
                                Max
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <div className="text-xs text-muted-foreground">
              Phiếu xuất kho sẽ lập tức trừ tồn kho thực tế của thành phẩm.
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={dispatchMutation.isPending}>
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={dispatchMutation.isPending || totalDispatchQuantity <= 0}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                {dispatchMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang xuất kho...</span>
                  </>
                ) : (
                  <>
                    <Truck className="h-4 w-4" />
                    <span>Xác nhận xuất kho ({totalDispatchQuantity.toLocaleString('vi-VN')})</span>
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
