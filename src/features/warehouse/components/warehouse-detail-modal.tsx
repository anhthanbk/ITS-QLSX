import React from 'react';
import { X, Warehouse as WarehouseIcon, MapPin, User, Calendar, Edit, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Warehouse } from '@/features/warehouse/types';
import { WarehouseStatusBadge, WarehouseTypeBadge, ItemTypeBadge } from './warehouse-badges';
import { useStockBalances } from '../hooks/use-stock-balances';

interface WarehouseDetailModalProps {
  warehouse: Warehouse | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (warehouse: Warehouse) => void;
  canManage: boolean;
}

export const WarehouseDetailModal: React.FC<WarehouseDetailModalProps> = ({
  warehouse,
  isOpen,
  onClose,
  onEdit,
  canManage,
}) => {
  const { data: stockData, isLoading: isStockLoading } = useStockBalances({
    warehouseId: warehouse?.id,
    page: 1,
    pageSize: 50,
  });

  if (!isOpen || !warehouse) return null;

  const stockItems = stockData?.data ?? [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="warehouse-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in-50 zoom-in-95">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <WarehouseIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-muted-foreground uppercase">{warehouse.code}</span>
                <WarehouseStatusBadge status={warehouse.status} />
              </div>
              <h2 id="warehouse-detail-title" className="text-base font-bold text-foreground">
                {warehouse.name}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canManage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit(warehouse);
                }}
                className="gap-1.5 h-8 text-xs"
              >
                <Edit className="h-3.5 w-3.5" />
                Chỉnh sửa
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Đóng"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Metadata Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-accent/20 p-3.5">
              <span className="text-[11px] font-medium text-muted-foreground">Phân loại kho</span>
              <div className="mt-1.5">
                <WarehouseTypeBadge type={warehouse.warehouse_type} />
              </div>
            </div>
            <div className="rounded-xl border border-border bg-accent/20 p-3.5">
              <span className="text-[11px] font-medium text-muted-foreground">Vị trí mặt bằng</span>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{warehouse.location || 'Chưa cập nhật'}</span>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-accent/20 p-3.5">
              <span className="text-[11px] font-medium text-muted-foreground">Thủ kho / Phụ trách</span>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span>{warehouse.manager_name || 'Chưa chỉ định'}</span>
              </div>
            </div>
          </div>

          {/* Current Stock Table in this Warehouse */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-primary" />
                Danh mục vật tư / hàng hóa tồn trong kho ({stockItems.length})
              </h3>
            </div>

            {isStockLoading ? (
              <div className="space-y-2 py-4 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-10 bg-accent/30 rounded-lg" />
                ))}
              </div>
            ) : stockItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-accent/10 p-6 text-center">
                <p className="text-xs text-muted-foreground">Kho hiện chưa có hàng hóa hoặc vật tư nào được ghi nhận tồn kho.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                      <th className="py-2.5 px-3">Loại</th>
                      <th className="py-2.5 px-3">Mã hàng</th>
                      <th className="py-2.5 px-3">Tên hàng</th>
                      <th className="py-2.5 px-3 text-right">Tồn hiện tại</th>
                      <th className="py-2.5 px-3 text-right">Đã đặt trước</th>
                      <th className="py-2.5 px-3 text-right">Khả dụng</th>
                      <th className="py-2.5 px-3">Đơn vị</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {stockItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-accent/30">
                        <td className="py-2 px-3">
                          <ItemTypeBadge type={item.item_type} />
                        </td>
                        <td className="py-2 px-3 font-mono font-medium">{item.item_code}</td>
                        <td className="py-2 px-3 font-medium text-foreground">{item.item_name}</td>
                        <td className="py-2 px-3 text-right font-bold text-foreground">
                          {item.current_quantity.toLocaleString('vi-VN')}
                        </td>
                        <td className="py-2 px-3 text-right text-muted-foreground">
                          {item.reserved_quantity.toLocaleString('vi-VN')}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                          {item.available_quantity.toLocaleString('vi-VN')}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">{item.unit_of_measure}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Audit timestamps */}
          <div className="flex flex-wrap items-center justify-between border-t border-border pt-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Ngày khởi tạo: {new Date(warehouse.created_at).toLocaleString('vi-VN')}
            </span>
            <span>Cập nhật lần cuối: {new Date(warehouse.updated_at).toLocaleString('vi-VN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
