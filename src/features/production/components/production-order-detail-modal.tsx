import React, { useState } from 'react';
import { X, ClipboardList, Layers, Plus } from 'lucide-react';
import type { ProductionOrder } from '../types';
import { useProductionBatches, useCreateProductionBatch } from '../hooks/use-production-orders';
import { OrderStatusBadge, OrderPriorityBadge } from './production-status-badge';
import { ProductionBatchFormDialog } from './production-batch-form-dialog';

interface ProductionOrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ProductionOrder | null;
  canManage?: boolean;
}

export const ProductionOrderDetailModal: React.FC<ProductionOrderDetailModalProps> = ({
  isOpen,
  onClose,
  order,
  canManage,
}) => {
  const [isBatchOpen, setIsBatchOpen] = useState(false);

  const { data: batches = [], isLoading } = useProductionBatches(order ? order.id : null);
  const createBatchMutation = useCreateProductionBatch();

  if (!isOpen || !order) return null;

  const progressPct =
    order.target_quantity > 0
      ? Math.min(100, Math.round((order.completed_quantity / order.target_quantity) * 100))
      : 0;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground">{order.order_number}</h2>
                  <OrderStatusBadge status={order.status} />
                  <OrderPriorityBadge priority={order.priority} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Sản phẩm: {order.product_name} ({order.product_sku}) • Dây chuyền:{' '}
                  {order.line_name || 'Chưa gán'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="mt-4 space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <span className="text-[11px] text-muted-foreground">Sản lượng mục tiêu</span>
                <p className="mt-1 text-base font-bold text-foreground">
                  {order.target_quantity.toLocaleString()} Tấn
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <span className="text-[11px] text-muted-foreground">Đã gia công hoàn thành</span>
                <p className="mt-1 text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {order.completed_quantity.toLocaleString()} Tấn
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <span className="text-[11px] text-muted-foreground">Phế phẩm ghi nhận</span>
                <p className="mt-1 text-base font-bold text-rose-500">
                  {order.scrap_quantity.toLocaleString()} Tấn
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <span className="text-[11px] text-muted-foreground">Tiến độ gia công</span>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-primary">{progressPct}%</span>
                </div>
              </div>
            </div>

            {/* Time Timeline */}
            <div className="rounded-xl border border-border p-4 text-xs">
              <h3 className="font-bold text-foreground">Thời gian thực hiện kế hoạch</h3>
              <div className="mt-2 grid grid-cols-2 gap-3 text-muted-foreground sm:grid-cols-4">
                <div>
                  Kế hoạch bắt đầu:
                  <p className="font-medium text-foreground">
                    {new Date(order.planned_start_date).toLocaleString()}
                  </p>
                </div>
                <div>
                  Kế hoạch kết thúc:
                  <p className="font-medium text-foreground">
                    {new Date(order.planned_end_date).toLocaleString()}
                  </p>
                </div>
                <div>
                  Thực tế bắt đầu:
                  <p className="font-medium text-foreground">
                    {order.actual_start_date
                      ? new Date(order.actual_start_date).toLocaleString()
                      : 'Chưa bắt đầu'}
                  </p>
                </div>
                <div>
                  Thực tế kết thúc:
                  <p className="font-medium text-foreground">
                    {order.actual_end_date
                      ? new Date(order.actual_end_date).toLocaleString()
                      : 'Đang theo dõi'}
                  </p>
                </div>
              </div>
            </div>

            {/* Batches Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Layers className="h-4 w-4 text-primary" />
                  Danh sách lô sản xuất ({batches.length})
                </h3>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => setIsBatchOpen(true)}
                    className="inline-flex items-center gap-1 rounded bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Thêm lô sản xuất
                  </button>
                )}
              </div>

              {isLoading ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  Đang tải danh sách lô...
                </div>
              ) : batches.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
                  Chưa có lô sản xuất nào được chia nhỏ theo lệnh này.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Mã lô</th>
                        <th className="px-3 py-2 text-right">Kế hoạch (Tấn)</th>
                        <th className="px-3 py-2 text-right">Thực tế (Tấn)</th>
                        <th className="px-3 py-2 text-right">Phế phẩm</th>
                        <th className="px-3 py-2">Ca</th>
                        <th className="px-3 py-2 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {batches.map((b) => (
                        <tr key={b.id}>
                          <td className="px-3 py-2 font-mono font-medium text-primary">
                            {b.batch_number}
                          </td>
                          <td className="px-3 py-2 text-right">{b.planned_quantity}</td>
                          <td className="px-3 py-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                            {b.actual_quantity}
                          </td>
                          <td className="px-3 py-2 text-right text-rose-500">
                            {b.scrap_quantity}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{b.shift || '---'}</td>
                          <td className="px-3 py-2 text-center">
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground">
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-end border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-input bg-background px-4 py-2 text-xs font-medium text-foreground hover:bg-muted"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* New Batch Dialog */}
      <ProductionBatchFormDialog
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        onSubmit={async (values) => {
          await createBatchMutation.mutateAsync(values);
          setIsBatchOpen(false);
        }}
        productionOrderId={order.id}
        orderNumber={order.order_number}
        isSubmitting={createBatchMutation.isPending}
      />
    </>
  );
};
