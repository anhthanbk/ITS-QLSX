import React from 'react';
import { X, Printer, Calendar, Building2, FileText, CheckCircle2, PackageCheck } from 'lucide-react';
import { StatusBadge } from './sales-status-badge';
import { Button } from '@/components/ui/button';
import { usePurchaseOrderDetail } from '../hooks/use-sales-queries';
import type { PurchaseOrder } from '../types';

interface PurchaseOrderDetailModalProps {
  orderId: string | null;
  onClose: () => void;
  onReceiveGoods?: (order: PurchaseOrder) => void;
}

export const PurchaseOrderDetailModal: React.FC<PurchaseOrderDetailModalProps> = ({
  orderId,
  onClose,
  onReceiveGoods,
}) => {
  const { data: order, isLoading } = usePurchaseOrderDetail(orderId);

  if (!orderId) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">
                  {order?.po_code || 'Chi tiết đơn mua hàng (PO)'}
                </h3>
                {order && <StatusBadge status={order.status} type="purchase" />}
              </div>
              <p className="text-xs text-muted-foreground">
                Đơn đặt mua nguyên vật liệu và chuỗi cung ứng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onReceiveGoods && order && ['confirmed', 'sent', 'partially_received'].includes(order.status) && (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  onClose();
                  onReceiveGoods(order);
                }}
                className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                title="Nghiệm thu & Nhập kho hàng về"
              >
                <PackageCheck className="h-3.5 w-3.5" />
                <span>Nhập kho hàng về</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 text-xs"
              title="In phiếu đặt hàng"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>In đơn</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-24 rounded-xl bg-muted" />
              <div className="h-48 rounded-xl bg-muted" />
            </div>
          ) : !order ? (
            <div className="py-12 text-center text-muted-foreground">
              Không tìm thấy thông tin đơn mua hàng này.
            </div>
          ) : (
            <>
              {/* Partner & Timeline Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Supplier Info */}
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span>Nhà cung cấp đối tác</span>
                  </div>
                  <h4 className="text-base font-semibold text-foreground">
                    {order.supplier?.name || '-'}
                  </h4>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <div>Mã NCC: <strong className="text-foreground">{order.supplier?.code}</strong></div>
                    {order.supplier?.phone && <div>Số điện thoại: {order.supplier.phone}</div>}
                    {order.supplier?.email && <div>Email: {order.supplier.email}</div>}
                  </div>
                </div>

                {/* Dates & Status */}
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>Lịch trình & Thanh toán</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Ngày lập PO:</span>
                      <strong className="text-foreground">{formatDate(order.order_date)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Dự kiến giao hàng:</span>
                      <strong className="text-foreground">{formatDate(order.expected_delivery_date)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Điều khoản TT:</span>
                      <strong className="text-foreground">{order.payment_terms || 'Theo thỏa thuận'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Danh mục nguyên vật liệu nghiệm thu
                </h4>
                <div className="overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 font-semibold text-muted-foreground border-b border-border">
                      <tr>
                        <th className="px-4 py-2.5">Nguyên vật liệu</th>
                        <th className="px-4 py-2.5">ĐVT</th>
                        <th className="px-4 py-2.5 text-right">SL Đặt</th>
                        <th className="px-4 py-2.5 text-right">Đã nhập kho</th>
                        <th className="px-4 py-2.5 text-right">Đơn giá</th>
                        <th className="px-4 py-2.5 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item) => (
                          <tr key={item.id} className="hover:bg-muted/20">
                            <td className="px-4 py-2.5 font-medium text-foreground">
                              {item.material?.name || '-'}
                              <div className="text-[11px] text-muted-foreground font-normal">
                                {item.material?.code}
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-muted-foreground">
                              {item.material?.unit_of_measure || '-'}
                            </td>
                            <td className="px-4 py-2.5 text-right font-semibold text-foreground">
                              {item.quantity.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              <span
                                className={`font-medium ${
                                  item.received_quantity >= item.quantity
                                    ? 'text-emerald-500 flex items-center justify-end gap-1'
                                    : 'text-amber-500'
                                }`}
                              >
                                {item.received_quantity.toLocaleString('vi-VN')}
                                {item.received_quantity >= item.quantity && (
                                  <CheckCircle2 className="h-3 w-3" />
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right text-muted-foreground">
                              {formatCurrency(item.unit_price)}
                            </td>
                            <td className="px-4 py-2.5 text-right font-bold text-foreground">
                              {formatCurrency(item.line_total)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-4 text-center text-muted-foreground">
                            Chưa có chi tiết dòng hàng.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Calculation summary */}
              <div className="flex justify-end">
                <div className="w-full sm:w-72 rounded-xl border border-border bg-muted/20 p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tổng tiền hàng:</span>
                    <strong className="text-foreground">{formatCurrency(order.subtotal_amount)}</strong>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tiền thuế VAT:</span>
                    <strong className="text-foreground">{formatCurrency(order.tax_amount)}</strong>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 text-sm font-bold text-primary">
                    <span>Tổng giá trị PO:</span>
                    <span>{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {order.notes && (
                <div className="rounded-xl border border-border bg-muted/10 p-4">
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Ghi chú:</div>
                  <p className="text-xs text-foreground italic">{order.notes}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-border px-6 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};
