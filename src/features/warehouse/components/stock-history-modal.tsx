import React, { useState } from 'react';
import {
  History,
  X,
  Building2,
  Filter,
  ChevronLeft,
  ChevronRight,
  Boxes,
  FileText,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TransactionTypeBadge, ItemTypeBadge } from './warehouse-badges';
import { useInventoryTransactions } from '../hooks/use-inventory-transactions';
import type { InventoryTransactionType } from '../types';

export interface StockHistoryTargetItem {
  itemId: string;
  itemCode?: string;
  itemName?: string;
  unitOfMeasure?: string;
  itemType?: 'material' | 'product' | 'byproduct';
  category?: string;
  categoryLabel?: string;
  warehouseId?: string;
  warehouseName?: string;
  warehouseCode?: string;
}

interface StockHistoryModalProps {
  item: StockHistoryTargetItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StockHistoryModal: React.FC<StockHistoryModalProps> = ({
  item,
  isOpen,
  onClose,
}) => {
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [selectedTxType, setSelectedTxType] = useState<string>('all');
  const [filterAllWarehouses, setFilterAllWarehouses] = useState(false);

  // Determine active warehouse filter
  const activeWarehouseId =
    !filterAllWarehouses && item?.warehouseId ? item.warehouseId : 'all';

  const { data: txData, isLoading } = useInventoryTransactions({
    page,
    pageSize,
    itemId: item?.itemId,
    warehouseId: activeWarehouseId,
    transactionType: selectedTxType,
  });

  if (!isOpen || !item) return null;

  const transactions = txData?.data ?? [];
  const totalCount = txData?.totalCount ?? 0;
  const totalPages = txData?.totalPages ?? 1;

  // Format date dd/mm/yy HH:mm
  const formatDateTime = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(-2);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${yy} ${hh}:${mm}`;
    } catch {
      return isoStr;
    }
  };

  // Quick stats from current transactions query
  const totalInboundInPage = transactions
    .filter((t) => t.quantity > 0)
    .reduce((sum, t) => sum + t.quantity, 0);

  const totalOutboundInPage = transactions
    .filter((t) => t.quantity < 0)
    .reduce((sum, t) => sum + Math.abs(t.quantity), 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="stock-history-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 flex flex-col w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in-50 zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-card/95 px-5 py-3.5 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              <History className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-foreground">
                  {item.itemCode}
                </span>
                {item.itemType && (
                  <ItemTypeBadge
                    type={item.itemType}
                    category={item.category}
                    categoryLabel={item.categoryLabel}
                  />
                )}
                {item.unitOfMeasure && (
                  <span className="text-[11px] text-muted-foreground font-medium">
                    (ĐVT: {item.unitOfMeasure})
                  </span>
                )}
              </div>
              <h2
                id="stock-history-title"
                className="text-base font-bold text-foreground leading-tight mt-0.5"
              >
                Lịch sử nhập / xuất kho: {item.itemName}
              </h2>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Đóng"
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Filter & Scope Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 px-5 py-2.5 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* Scope: Specific Warehouse vs All Warehouses */}
            {item.warehouseId && (
              <div className="flex items-center rounded-lg border border-border bg-background p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setFilterAllWarehouses(false);
                    setPage(1);
                  }}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    !filterAllWarehouses
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Building2 className="h-3 w-3" />
                  <span>{item.warehouseName || 'Kho hiện tại'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterAllWarehouses(true);
                    setPage(1);
                  }}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                    filterAllWarehouses
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Boxes className="h-3 w-3" />
                  <span>Tất cả các kho</span>
                </button>
              </div>
            )}

            {/* Transaction Type Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={selectedTxType}
                onChange={(e) => {
                  setSelectedTxType(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-input bg-background px-2.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">Tất cả loại nghiệp vụ</option>
                <option value="production_receipt">Nhập sản xuất (NK-SX)</option>
                <option value="inbound_receipt">Nhập mua hàng</option>
                <option value="production_issue">Xuất sản xuất</option>
                <option value="sales_dispatch">Xuất bán hàng</option>
                <option value="transfer_in">Nhập chuyển kho</option>
                <option value="transfer_out">Xuất chuyển kho</option>
                <option value="stock_adjustment">Điều chỉnh kiểm kê</option>
              </select>
            </div>
          </div>

          {/* Quick Metrics in Current View */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">
              Tổng <span className="font-bold text-foreground">{totalCount}</span> lượt giao dịch
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              + {totalInboundInPage.toLocaleString('vi-VN')} {item.unitOfMeasure}
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              - {totalOutboundInPage.toLocaleString('vi-VN')} {item.unitOfMeasure}
            </span>
          </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {isLoading ? (
            <div className="space-y-3 py-6 animate-pulse">
              <div className="h-8 bg-muted rounded-lg" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-11 bg-muted/60 rounded-lg" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
                <History className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                Chưa có lịch sử giao dịch phát sinh
              </p>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm">
                Mặt hàng này chưa phát sinh giao dịch nhập/xuất kho nào trong phạm vi được chọn.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 font-semibold text-muted-foreground">
                      <th className="py-2.5 px-3 whitespace-nowrap">Thời gian</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Mã phiếu</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Loại giao dịch</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Kho lưu trữ</th>
                      <th className="py-2.5 px-3 text-right whitespace-nowrap">Số lượng</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Chứng từ / Ca SX</th>
                      <th className="py-2.5 px-3 whitespace-nowrap">Người lập</th>
                      <th className="py-2.5 px-3">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {transactions.map((tx) => {
                      const isInbound = tx.quantity > 0;
                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-muted/40 transition-colors"
                        >
                          {/* Thời gian */}
                          <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                            {formatDateTime(tx.created_at)}
                          </td>

                          {/* Mã phiếu */}
                          <td className="py-2.5 px-3 font-mono font-bold text-foreground whitespace-nowrap">
                            {tx.transaction_number}
                          </td>

                          {/* Loại nghiệp vụ */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <TransactionTypeBadge
                              type={tx.transaction_type as InventoryTransactionType}
                            />
                          </td>

                          {/* Kho */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1 font-medium text-foreground">
                              <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span>{tx.warehouse_name || tx.warehouse_code || '---'}</span>
                            </div>
                          </td>

                          {/* Số lượng */}
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <span
                              className={`font-bold text-xs ${
                                isInbound
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {isInbound ? '+' : ''}
                              {tx.quantity.toLocaleString('vi-VN')} {item.unitOfMeasure}
                            </span>
                          </td>

                          {/* Chứng từ tham chiếu */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {tx.reference_doc_type ? (
                              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                                <FileText className="h-3 w-3 text-muted-foreground" />
                                {tx.reference_doc_type}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/60">—</span>
                            )}
                          </td>

                          {/* Người lập */}
                          <td className="py-2.5 px-3 font-semibold text-foreground whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 text-muted-foreground shrink-0" />
                              <span>{tx.created_by_name || 'Hệ thống'}</span>
                            </div>
                          </td>

                          {/* Ghi chú */}
                          <td className="py-2.5 px-3 text-muted-foreground max-w-xs truncate" title={tx.notes || ''}>
                            {tx.notes || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer & Pagination */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-border bg-card px-5 py-3 text-xs shrink-0">
          <span className="text-muted-foreground">
            Hiển thị trang <span className="font-semibold text-foreground">{page}</span> /{' '}
            <span className="font-semibold text-foreground">{totalPages}</span> (Tổng{' '}
            <span className="font-semibold text-foreground">{totalCount}</span> dòng)
          </span>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-7 gap-1 px-2.5 text-xs"
            >
              <ChevronLeft className="h-3 w-3" />
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-7 gap-1 px-2.5 text-xs"
            >
              Sau
              <ChevronRight className="h-3 w-3" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="h-7 px-3 text-xs ml-2"
            >
              Đóng
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
