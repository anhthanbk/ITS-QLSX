import React from 'react';
import { X, Printer, Calendar, User, FileText, Truck } from 'lucide-react';
import { StatusBadge } from './sales-status-badge';
import { Button } from '@/components/ui/button';
import { useSalesOrderDetail } from '../hooks/use-sales-queries';

interface SalesOrderDetailModalProps {
  orderId: string | null;
  onClose: () => void;
}

export const SalesOrderDetailModal: React.FC<SalesOrderDetailModalProps> = ({
  orderId,
  onClose,
}) => {
  const { data: order, isLoading } = useSalesOrderDetail(orderId);

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
                  {order?.order_code || 'Chi tiết đơn hàng'}
                </h3>
                {order && <StatusBadge status={order.status} type="sales" />}
              </div>
              <p className="text-xs text-muted-foreground">
                Hợp đồng & đơn bán hàng thương mại
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="hidden sm:flex gap-1.5"
              title="In đơn hàng"
            >
              <Printer className="h-4 w-4" />
              <span>In đơn</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-20 bg-muted rounded-xl" />
              <div className="h-40 bg-muted rounded-xl" />
            </div>
          ) : !order ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              Không tìm thấy thông tin đơn hàng.
            </p>
          ) : (
            <>
              {/* Info Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-xl border border-border bg-muted/20 p-4 text-sm">
                <div>
                  <div className="flex items-center gap-2 font-medium text-foreground mb-1.5">
                    <User className="h-4 w-4 text-primary" />
                    <span>Thông tin Khách hàng</span>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p className="text-foreground font-semibold text-sm">
                      {order.customer?.name}
                    </p>
                    <p>Mã KH: <span className="text-foreground font-medium">{order.customer?.code}</span></p>
                    {order.customer?.phone && <p>Điện thoại: {order.customer.phone}</p>}
                    {order.customer?.email && <p>Email: {order.customer.email}</p>}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 font-medium text-foreground mb-1.5">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>Thời hạn & Điều khoản</span>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>Ngày đặt: <span className="text-foreground font-medium">{formatDate(order.order_date)}</span></p>
                    <p>Ngày hẹn giao: <span className="text-foreground font-medium">{formatDate(order.promised_delivery_date)}</span></p>
                    <p>Thanh toán: <span className="text-foreground font-medium">{order.payment_terms || 'Theo thỏa thuận'}</span></p>
                    <p>Tiền tệ: <span className="text-foreground font-medium">{order.currency}</span></p>
                  </div>
                </div>

                {/* Logistics Info Block */}
                <div className="sm:col-span-2 pt-2 border-t border-border/60">
                  <div className="flex items-center gap-2 font-medium text-foreground mb-1.5">
                    <Truck className="h-4 w-4 text-primary" />
                    <span>Thông tin Vận tải & Điều xe bốc hàng</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-muted-foreground">
                    <div>
                      <span className="block text-[11px] text-muted-foreground">Đơn vị vận tải:</span>
                      <span className="text-foreground font-medium">{order.carrier_name || 'Chưa chỉ định'}</span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-muted-foreground">Biển số xe:</span>
                      <span className="text-foreground font-mono font-medium">{order.vehicle_plate || '—'}</span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-muted-foreground">Tài xế & Liên hệ:</span>
                      <span className="text-foreground font-medium">{order.driver_info || '—'}</span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-muted-foreground">Địa điểm giao hàng:</span>
                      <span className="text-foreground font-medium">{order.delivery_location || 'Kho bãi nhà máy'}</span>
                    </div>
                  </div>
                </div>

                {order.notes && (
                  <div className="sm:col-span-2 pt-2 border-t border-border/60 text-xs">
                    <span className="font-medium text-foreground">Ghi chú đơn hàng: </span>
                    <span className="text-muted-foreground">{order.notes}</span>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-semibold text-sm text-foreground mb-3">
                  Danh mục thành phẩm đặt hàng
                </h4>
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border bg-muted/40 uppercase tracking-wider text-muted-foreground font-medium">
                      <tr>
                        <th className="px-3.5 py-2.5">Sản phẩm</th>
                        <th className="px-3.5 py-2.5 text-center">ĐVT</th>
                        <th className="px-3.5 py-2.5 text-right">SL đặt</th>
                        <th className="px-3.5 py-2.5 text-right">Đã giao</th>
                        <th className="px-3.5 py-2.5 text-right">Đơn giá</th>
                        <th className="px-3.5 py-2.5 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-muted/20">
                            <td className="px-3.5 py-3">
                              <div className="font-semibold text-foreground">
                                {item.product?.name || 'Sản phẩm'}
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                SKU: {item.product?.sku}
                              </div>
                            </td>
                            <td className="px-3.5 py-3 text-center text-muted-foreground">
                              {item.product?.unit_of_measure || 'Tấn'}
                            </td>
                            <td className="px-3.5 py-3 text-right font-medium text-foreground">
                              {new Intl.NumberFormat('vi-VN').format(item.quantity)}
                            </td>
                            <td className="px-3.5 py-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                              {new Intl.NumberFormat('vi-VN').format(item.fulfilled_quantity || 0)}
                            </td>
                            <td className="px-3.5 py-3 text-right text-muted-foreground">
                              {formatCurrency(item.unit_price)}
                            </td>
                            <td className="px-3.5 py-3 text-right font-semibold text-foreground">
                              {formatCurrency(item.line_total)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-3.5 py-6 text-center text-muted-foreground">
                            Không có mục sản phẩm nào trong đơn hàng.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Totals */}
              <div className="flex justify-end pt-2">
                <div className="w-full sm:w-72 space-y-2 rounded-xl border border-border bg-muted/20 p-4 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tạm tính tiền hàng:</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(order.subtotal_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Thuế GTGT (VAT):</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(order.tax_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 text-sm font-bold text-foreground">
                    <span>Tổng thanh toán:</span>
                    <span className="text-primary">{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-border px-6 py-3.5">
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};
