import React, { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  ArrowLeftRight,
  User,
  Edit2,
  Trash2,
  DollarSign,
  FileText,
  Clock,
  Info,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { InventoryTransaction, Warehouse } from '@/features/warehouse/types';
import { TransactionTypeBadge, ItemTypeBadge } from './warehouse-badges';

interface TransactionTableProps {
  data?: {
    data: InventoryTransaction[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  warehouses: Warehouse[];
  selectedWarehouseId: string;
  onWarehouseChange: (id: string) => void;
  selectedTxType: string;
  onTxTypeChange: (type: string) => void;
  selectedItemType: string;
  onItemTypeChange: (type: string) => void;
  search: string;
  onSearchChange: (val: string) => void;
  startDate: string;
  onStartDateChange: (val: string) => void;
  endDate: string;
  onEndDateChange: (val: string) => void;
  onResetFilters: () => void;
  onPageChange: (newPage: number) => void;
  onOpenCreateTx: () => void;
  canTransact: boolean;
  canManageTransactions?: boolean;
  onEditTransaction?: (tx: InventoryTransaction) => void;
  onDeleteTransaction?: (tx: InventoryTransaction) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  data,
  isLoading,
  isError,
  onRetry,
  warehouses,
  selectedWarehouseId,
  onWarehouseChange,
  selectedTxType,
  onTxTypeChange,
  selectedItemType,
  onItemTypeChange,
  search,
  onSearchChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onResetFilters,
  onPageChange,
  onOpenCreateTx,
  canTransact,
  canManageTransactions = false,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const [expandedTxIds, setExpandedTxIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedTxIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  const hasFilter =
    search !== '' ||
    selectedWarehouseId !== 'all' ||
    selectedTxType !== 'all' ||
    selectedItemType !== 'all' ||
    startDate !== '' ||
    endDate !== '';

  const transactions = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;
  const page = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;
  const pageSize = data?.pageSize ?? 10;

  const startIdx = (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, totalCount);

  return (
    <div className="space-y-4">
      {/* Filters & Actions Header */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Tìm theo số phiếu, tên mặt hàng, ghi chú..."
                className="w-full rounded-lg border border-input bg-background py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Warehouse */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={selectedWarehouseId}
                onChange={(e) => onWarehouseChange(e.target.value)}
                className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">Tất cả kho lưu trữ</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Transaction Type */}
            <select
              value={selectedTxType}
              onChange={(e) => onTxTypeChange(e.target.value)}
              className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Tất cả loại giao dịch</option>
              <option value="inbound_receipt">Nhập mua hàng</option>
              <option value="production_receipt">Nhập sản xuất</option>
              <option value="production_issue">Xuất sản xuất</option>
              <option value="sales_dispatch">Xuất bán hàng</option>
              <option value="warehouse_transfer">Chuyển kho</option>
              <option value="inventory_adjustment">Điều chỉnh kiểm kê</option>
              <option value="scrap_disposal">Xuất hủy / phế phẩm</option>
            </select>

            {/* Item Type */}
            <select
              value={selectedItemType}
              onChange={(e) => onItemTypeChange(e.target.value)}
              className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Tất cả phân loại</option>
              <optgroup label="📦 Vật tư & Phụ tùng">
                <option value="raw_material">Nguyên vật liệu chính</option>
                <option value="chemical">Hóa chất công nghiệp</option>
                <option value="spare_part">Phụ tùng cơ điện</option>
                <option value="packaging">Bao bì & Đóng gói</option>
                <option value="consumable">Tiêu hao / BHLĐ</option>
                <option value="fuel_energy">Nhiên liệu & Năng lượng</option>
                <option value="other">Vật tư phụ trợ</option>
              </optgroup>
              <optgroup label="🏭 Sản xuất & Phụ phẩm">
                <option value="finished_good">Thành phẩm sản xuất</option>
                <option value="semi_finished">Bán thành phẩm</option>
                <option value="by_product">Phụ phẩm thu hồi</option>
              </optgroup>
              <optgroup label="🗂️ Nhóm tổng quát">
                <option value="material">Tất cả vật tư & phụ tùng</option>
                <option value="product">Tất cả thành phẩm</option>
                <option value="byproduct">Tất cả phụ phẩm</option>
              </optgroup>
            </select>
          </div>

          {canTransact && (
            <Button
              size="sm"
              onClick={onOpenCreateTx}
              className="gap-1.5 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              Lập phiếu nhập / xuất kho
            </Button>
          )}
        </div>

        {/* Date Filter & Reset */}
        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Từ ngày:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Đến ngày:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {hasFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground ml-auto"
            >
              <RotateCcw className="h-3 w-3" />
              Đặt lại bộ lọc
            </Button>
          )}
        </div>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-4 animate-pulse">
            <div className="h-10 bg-accent/40 rounded-lg" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-accent/20 rounded-lg" />
            ))}
          </div>
        </div>
      ) : isError ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <h3 className="mt-2 text-sm font-semibold text-foreground">Không thể tải lịch sử giao dịch</h3>
          <p className="mt-1 text-xs text-muted-foreground">Đã xảy ra lỗi khi kết nối truy vấn dữ liệu giao dịch.</p>
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-4 gap-1.5">
            Thử lại
          </Button>
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <ArrowLeftRight className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-foreground">Chưa có giao dịch nhập / xuất</h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            Hệ thống chưa ghi nhận phiếu giao dịch nào theo điều kiện tìm kiếm.
          </p>
          {canTransact && (
            <Button size="sm" onClick={onOpenCreateTx} className="mt-4 bg-primary text-primary-foreground">
              Tạo phiếu đầu tiên
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                    <th className="py-3 px-4 min-w-[170px]">Số phiếu & Ngày giờ</th>
                    <th className="py-3 px-4 min-w-[140px]">Loại giao dịch</th>
                    <th className="py-3 px-4 min-w-[160px]">Kho liên quan</th>
                    <th className="py-3 px-4 min-w-[220px]">Mặt hàng & Phân loại</th>
                    <th className="py-3 px-4 text-right min-w-[100px]">Phát sinh</th>
                    <th className="py-3 px-4 text-right min-w-[130px]">Tồn sau phiếu</th>
                    {canManageTransactions && <th className="py-3 px-4 text-right min-w-[110px]">Thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {transactions.map((tx) => {
                    const isPositive = tx.quantity > 0;
                    const isExpanded = expandedTxIds.has(tx.id);
                    const txDate = new Date(tx.created_at);
                    const formattedDate = txDate.toLocaleDateString('vi-VN');
                    const formattedTime = txDate.toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <React.Fragment key={tx.id}>
                        {/* Main Streamlined Row */}
                        <tr
                          onClick={() => toggleExpand(tx.id)}
                          className={`group transition-colors cursor-pointer select-none ${
                            isExpanded
                              ? 'bg-primary/5 dark:bg-primary/10 border-l-2 border-l-primary'
                              : 'hover:bg-accent/40'
                          }`}
                        >
                          {/* 1. Số phiếu & Ngày giờ */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/50 text-muted-foreground transition-transform duration-200 group-hover:border-primary/40 group-hover:text-primary ${
                                  isExpanded ? 'rotate-180 bg-primary/10 text-primary border-primary/40' : ''
                                }`}
                                title={isExpanded ? 'Nhấp để thu gọn' : 'Nhấp để xem chi tiết'}
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </span>
                              <div>
                                <div className="font-mono font-bold text-foreground text-xs hover:text-primary transition-colors">
                                  {tx.transaction_number}
                                </div>
                                <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 font-sans">
                                  <Clock className="h-3 w-3 text-muted-foreground/60" />
                                  <span>{formattedDate}</span>
                                  <span className="text-muted-foreground/40">•</span>
                                  <span>{formattedTime}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. Loại giao dịch */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <TransactionTypeBadge type={tx.transaction_type} />
                          </td>

                          {/* 3. Kho liên quan */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-medium text-foreground">{tx.warehouse_name}</div>
                            <div className="text-muted-foreground font-mono text-[10px] mt-0.5">
                              Mã kho: {tx.warehouse_code}
                            </div>
                          </td>

                          {/* 4. Mặt hàng & Phân loại */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <ItemTypeBadge
                                type={tx.item_type}
                                category={tx.category}
                                categoryLabel={tx.category_label}
                              />
                              <span className="font-semibold text-foreground">{tx.item_name}</span>
                            </div>
                            <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
                              Mã: {tx.item_code}
                            </div>
                          </td>

                          {/* 5. Số lượng phát sinh */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-md font-mono font-bold text-xs ${
                                isPositive
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {isPositive ? `+${tx.quantity.toLocaleString('vi-VN')}` : tx.quantity.toLocaleString('vi-VN')}
                            </span>
                          </td>

                          {/* 6. Tồn sau phiếu (Tồn kho tức thời) */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1 font-mono text-xs font-bold text-foreground bg-muted/40 px-2.5 py-1 rounded-md border border-border/50">
                              <span className="text-muted-foreground font-sans font-normal text-[10px]">Tồn:</span>
                              <span className="text-primary font-bold">
                                {(tx.balance_after_transaction ?? 0).toLocaleString('vi-VN')}
                              </span>
                              {tx.unit_of_measure && (
                                <span className="text-muted-foreground font-sans font-normal text-[10px] ml-0.5">
                                  {tx.unit_of_measure}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 7. Thao tác */}
                          {canManageTransactions && (
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditTransaction?.(tx);
                                  }}
                                  title="Chỉnh sửa phiếu giao dịch"
                                  className="h-7 w-7 rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteTransaction?.(tx);
                                  }}
                                  title="Xóa phiếu giao dịch"
                                  className="h-7 w-7 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>

                        {/* Expandable Detail Panel */}
                        {isExpanded && (
                          <tr className="bg-muted/15 dark:bg-muted/5 transition-all border-b border-border/80">
                            <td colSpan={canManageTransactions ? 7 : 6} className="p-0">
                              <div className="mx-3 my-2.5 rounded-xl border border-border/80 bg-card p-4 shadow-sm animate-in fade-in-50 duration-150">
                                <div className="flex items-center justify-between border-b border-border/60 pb-2.5 mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                      <Info className="h-3.5 w-3.5" />
                                    </span>
                                    <span className="text-xs font-bold text-foreground">
                                      Chi tiết phiếu giao dịch {tx.transaction_number}
                                    </span>
                                    <TransactionTypeBadge type={tx.transaction_type} />
                                  </div>
                                  <span className="text-[11px] text-muted-foreground">
                                    Nhấp lại vào dòng để thu gọn
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                                  {/* Cột 1: Phát sinh & Tồn kho tức thời */}
                                  <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
                                    <div className="flex items-center gap-1.5 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                                      <Layers className="h-3.5 w-3.5 text-primary" />
                                      Phát sinh & Tồn tức thời
                                    </div>
                                    <div className="flex justify-between items-center py-0.5">
                                      <span className="text-muted-foreground">Số lượng phiếu:</span>
                                      <span className={`font-mono font-bold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                        {isPositive ? `+${tx.quantity.toLocaleString('vi-VN')}` : tx.quantity.toLocaleString('vi-VN')} {tx.unit_of_measure}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center py-0.5 border-t border-border/50 pt-1.5">
                                      <span className="text-muted-foreground">Tồn sau phiếu:</span>
                                      <span className="font-mono font-bold text-primary">
                                        {(tx.balance_after_transaction ?? 0).toLocaleString('vi-VN')} {tx.unit_of_measure}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Cột 2: Giá trị & Hạch toán */}
                                  <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
                                    <div className="flex items-center gap-1.5 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                                      <DollarSign className="h-3.5 w-3.5 text-primary" />
                                      Giá trị & Hạch toán
                                    </div>
                                    <div className="flex justify-between items-center py-0.5">
                                      <span className="text-muted-foreground">Đơn giá:</span>
                                      <span className="font-mono font-semibold text-foreground">
                                        {tx.unit_cost > 0 ? `${tx.unit_cost.toLocaleString('vi-VN')} VNĐ` : '—'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center py-0.5 border-t border-border/50 pt-1.5">
                                      <span className="text-muted-foreground">Tổng giá trị:</span>
                                      <span className="font-mono font-bold text-primary">
                                        {tx.unit_cost > 0
                                          ? `${(Math.abs(tx.quantity) * tx.unit_cost).toLocaleString('vi-VN')} VNĐ`
                                          : '—'}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Cột 2: Người thực hiện & Thời gian */}
                                  <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
                                    <div className="flex items-center gap-1.5 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                                      <User className="h-3.5 w-3.5 text-primary" />
                                      Người thực hiện & Thời gian
                                    </div>
                                    <div className="flex justify-between items-center py-0.5">
                                      <span className="text-muted-foreground">Người lập phiếu:</span>
                                      <span className="font-medium text-foreground">
                                        {tx.created_by_name || 'Hệ thống'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center py-0.5 border-t border-border/50 pt-1.5">
                                      <span className="text-muted-foreground">Thời gian ghi nhận:</span>
                                      <span className="font-mono text-muted-foreground">
                                        {new Date(tx.created_at).toLocaleString('vi-VN')}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Cột 3: Chứng từ & Ghi chú */}
                                  <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
                                    <div className="flex items-center gap-1.5 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                                      <FileText className="h-3.5 w-3.5 text-primary" />
                                      Chứng từ & Ghi chú
                                    </div>
                                    <div className="flex justify-between items-center py-0.5">
                                      <span className="text-muted-foreground">Chứng từ kèm:</span>
                                      <span className="font-mono text-foreground">
                                        {tx.reference_doc_type
                                          ? `${tx.reference_doc_type} (${tx.reference_doc_id || '—'})`
                                          : 'Không kèm chứng từ'}
                                      </span>
                                    </div>
                                    <div className="py-0.5 border-t border-border/50 pt-1.5">
                                      <span className="text-muted-foreground block mb-0.5">Ghi chú:</span>
                                      <p className="text-foreground italic bg-background/60 p-2 rounded-md border border-border/40 text-[11px]">
                                        {tx.notes || 'Không có ghi chú thêm.'}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {canManageTransactions && (
                                  <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-end gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEditTransaction?.(tx);
                                      }}
                                      className="h-7 text-xs gap-1.5"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                      Chỉnh sửa phiếu này
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteTransaction?.(tx);
                                      }}
                                      className="h-7 text-xs gap-1.5"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      Xóa phiếu này
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-1">
            <span className="text-xs text-muted-foreground">
              Hiển thị <span className="font-semibold text-foreground">{startIdx}</span> -{' '}
              <span className="font-semibold text-foreground">{endIdx}</span> trong tổng số{' '}
              <span className="font-semibold text-foreground">{totalCount}</span> giao dịch
            </span>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                className="h-8 gap-1 px-2.5 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Trước
              </Button>
              <span className="text-xs font-medium text-foreground px-2">
                Trang {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                className="h-8 gap-1 px-2.5 text-xs"
              >
                Sau
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
