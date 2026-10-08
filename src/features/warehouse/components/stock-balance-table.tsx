import React, { useState } from 'react';
import {
  Search,
  Filter,
  RotateCcw,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Layers,
  Building2,
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { InventoryStockBalance, Warehouse } from '@/features/warehouse/types';
import { ItemTypeBadge, WarehouseTypeBadge } from './warehouse-badges';
import { useItemAggregatedStockBalances } from '../hooks/use-stock-balances';

interface StockBalanceTableProps {
  data?: {
    data: InventoryStockBalance[];
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
  selectedItemType: string;
  onItemTypeChange: (type: string) => void;
  search: string;
  onSearchChange: (val: string) => void;
  onResetFilters: () => void;
  onPageChange: (newPage: number) => void;
  onAdjustStock: (item: InventoryStockBalance) => void;
  canTransact: boolean;
}

export const StockBalanceTable: React.FC<StockBalanceTableProps> = ({
  data,
  isLoading,
  isError,
  onRetry,
  warehouses,
  selectedWarehouseId,
  onWarehouseChange,
  selectedItemType,
  onItemTypeChange,
  search,
  onSearchChange,
  onResetFilters,
  onPageChange,
  onAdjustStock,
  canTransact,
}) => {
  const [viewMode, setViewMode] = useState<'by_warehouse' | 'by_item'>('by_warehouse');
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(new Set());

  const toggleExpandItem = (itemId: string) => {
    setExpandedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // Aggregated data for company-wide item view
  const { data: aggregatedItems, isLoading: isAggLoading, isError: isAggError, refetch: refetchAgg } = useItemAggregatedStockBalances();
  const hasFilter = search !== '' || selectedWarehouseId !== 'all' || selectedItemType !== 'all';
  const balances = React.useMemo(() => data?.data ?? [], [data?.data]);
  const totalCount = data?.totalCount ?? 0;
  const page = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;
  const pageSize = data?.pageSize ?? 10;

  const startIdx = (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, totalCount);

  // Client-side filter for aggregated item view
  const filteredAggregatedItems = React.useMemo(() => {
    if (!aggregatedItems) return [];
    return aggregatedItems.filter((item) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.item_code.toLowerCase().includes(q) ||
        item.item_name.toLowerCase().includes(q);

      const isSemi =
        item.category === 'semi_finished' ||
        item.category_label?.toLowerCase().includes('bán thành phẩm') ||
        item.item_code.toLowerCase().includes('btp');

      const matchesType =
        selectedItemType === 'all' ||
        (selectedItemType === 'semi_finished' && isSemi) ||
        (selectedItemType === 'finished_good' && !isSemi && (item.category === 'finished_good' || item.item_type === 'product')) ||
        (selectedItemType === 'product' && !isSemi && (item.item_type === 'product' || item.category === 'finished_good')) ||
        (selectedItemType === 'material' && (item.item_type === 'material' || ['raw_material', 'spare_part', 'chemical', 'packaging', 'consumable', 'fuel_energy', 'other'].includes(item.category || ''))) ||
        (selectedItemType === 'byproduct' && (item.item_type === 'byproduct' || item.category === 'by_product' || item.category === 'byproduct')) ||
        item.category === selectedItemType ||
        item.item_type === selectedItemType;

      const matchesWarehouse =
        selectedWarehouseId === 'all' ||
        item.warehouses.some((w) => w.warehouse_id === selectedWarehouseId);

      return matchesSearch && matchesType && matchesWarehouse;
    });
  }, [aggregatedItems, search, selectedItemType, selectedWarehouseId]);

  // Group balances by warehouse for "by_warehouse" view
  interface WarehouseStockGroup {
    warehouseId: string;
    warehouseCode: string;
    warehouseName: string;
    warehouseType?: Warehouse['warehouse_type'];
    items: InventoryStockBalance[];
    totalInbound: number;
    totalOutbound: number;
    totalCurrentQuantity: number;
    totalAvailableQuantity: number;
  }

  const warehouseGroups: WarehouseStockGroup[] = React.useMemo(() => {
    const groupsMap = new Map<string, WarehouseStockGroup>();

    // If filtering by a specific warehouse, ensure that warehouse is in the map if found
    if (selectedWarehouseId !== 'all') {
      const targetWh = warehouses.find((w) => w.id === selectedWarehouseId);
      if (targetWh) {
        groupsMap.set(targetWh.id, {
          warehouseId: targetWh.id,
          warehouseCode: targetWh.code,
          warehouseName: targetWh.name,
          warehouseType: targetWh.warehouse_type,
          items: [],
          totalInbound: 0,
          totalOutbound: 0,
          totalCurrentQuantity: 0,
          totalAvailableQuantity: 0,
        });
      }
    } else if (!search && selectedItemType === 'all') {
      // Show all existing warehouses in configured order
      warehouses.forEach((wh) => {
        groupsMap.set(wh.id, {
          warehouseId: wh.id,
          warehouseCode: wh.code,
          warehouseName: wh.name,
          warehouseType: wh.warehouse_type,
          items: [],
          totalInbound: 0,
          totalOutbound: 0,
          totalCurrentQuantity: 0,
          totalAvailableQuantity: 0,
        });
      });
    }

    balances.forEach((item) => {
      let group = groupsMap.get(item.warehouse_id);
      if (!group) {
        const wh = warehouses.find((w) => w.id === item.warehouse_id);
        group = {
          warehouseId: item.warehouse_id,
          warehouseCode: item.warehouse_code || wh?.code || '',
          warehouseName: item.warehouse_name || wh?.name || 'Kho lưu trữ',
          warehouseType: wh?.warehouse_type,
          items: [],
          totalInbound: 0,
          totalOutbound: 0,
          totalCurrentQuantity: 0,
          totalAvailableQuantity: 0,
        };
        groupsMap.set(item.warehouse_id, group);
      }
      group.items.push(item);
      group.totalInbound += item.total_inbound ?? 0;
      group.totalOutbound += item.total_outbound ?? 0;
      group.totalCurrentQuantity += item.current_quantity ?? 0;
      group.totalAvailableQuantity += item.available_quantity ?? 0;
    });

    // If searching or filtering by item type, only show warehouses that contain matching items
    if (search || selectedItemType !== 'all') {
      return Array.from(groupsMap.values()).filter((g) => g.items.length > 0);
    }

    return Array.from(groupsMap.values());
  }, [balances, warehouses, selectedWarehouseId, search, selectedItemType]);

  const [expandedWarehouseIds, setExpandedWarehouseIds] = useState<Set<string>>(() => new Set());
  const [hasInitializedWhExpand, setHasInitializedWhExpand] = useState(false);

  React.useEffect(() => {
    if (!hasInitializedWhExpand && warehouseGroups.length > 0) {
      setExpandedWarehouseIds(new Set(warehouseGroups.map((g) => g.warehouseId)));
      setHasInitializedWhExpand(true);
    }
  }, [warehouseGroups, hasInitializedWhExpand]);

  const toggleExpandWarehouse = (whId: string) => {
    setExpandedWarehouseIds((prev) => {
      const next = new Set(prev);
      if (next.has(whId)) {
        next.delete(whId);
      } else {
        next.add(whId);
      }
      return next;
    });
  };

  const expandAllWarehouses = () => {
    setExpandedWarehouseIds(new Set(warehouseGroups.map((g) => g.warehouseId)));
  };

  const collapseAllWarehouses = () => {
    setExpandedWarehouseIds(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Top Header & View Mode Switcher */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* View mode toggle */}
          <div className="flex items-center rounded-lg border border-border bg-muted/50 p-1">
            <button
              type="button"
              onClick={() => setViewMode('by_warehouse')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                viewMode === 'by_warehouse'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Building2 className="h-3.5 w-3.5 text-primary" />
              <span>Theo từng kho</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('by_item')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                viewMode === 'by_item'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Boxes className="h-3.5 w-3.5 text-primary" />
              <span>Tổng hợp theo vật tư</span>
            </button>
          </div>

          <div className="h-4 w-px bg-border hidden sm:block" />

          {/* Search */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm theo mã hàng, tên hàng..."
              className="w-full rounded-lg border border-input bg-background py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Warehouse select */}
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

          {/* Item type select */}
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
              <option value="product">Tất cả thành phẩm chính</option>
              <option value="semi_finished">Tất cả bán thành phẩm</option>
              <option value="byproduct">Tất cả phụ phẩm</option>
            </optgroup>
          </select>

          {hasFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              Đặt lại
            </Button>
          )}
        </div>
      </div>

      {/* Mode 1: Theo từng kho (By Warehouse) */}
      {viewMode === 'by_warehouse' && (
        <>
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
              <h3 className="mt-2 text-sm font-semibold text-foreground">Không thể tải dữ liệu tồn kho</h3>
              <p className="mt-1 text-xs text-muted-foreground">Đã xảy ra lỗi khi truy vấn số dư tồn kho từ máy chủ.</p>
              <Button variant="outline" size="sm" onClick={onRetry} className="mt-4 gap-1.5">
                Thử lại
              </Button>
            </div>
          ) : warehouseGroups.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-foreground">Chưa có số dư tồn kho</h3>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Chưa có mặt hàng nào phát sinh số dư tồn trong kho được chọn hoặc bộ lọc không khớp.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Expand / Collapse all controls & summary */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    Tổng số <span className="font-semibold text-foreground">{warehouseGroups.length}</span> kho lưu trữ
                  </span>
                  <span>•</span>
                  <span>
                    Tổng <span className="font-semibold text-foreground">{balances.length}</span> danh mục tồn
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={expandAllWarehouses}
                    className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Mở rộng tất cả
                  </Button>
                  <span className="text-muted-foreground/40">|</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={collapseAllWarehouses}
                    className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Thu gọn tất cả
                  </Button>
                </div>
              </div>

              {/* Warehouse Groups */}
              <div className="space-y-3">
                {warehouseGroups.map((group) => {
                  const isExpanded = expandedWarehouseIds.has(group.warehouseId);
                  return (
                    <div
                      key={group.warehouseId}
                      className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all"
                    >
                      {/* Warehouse Header Bar (Accordion Toggle) */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleExpandWarehouse(group.warehouseId)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleExpandWarehouse(group.warehouseId);
                          }
                        }}
                        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between cursor-pointer select-none bg-card hover:bg-accent/30 transition-colors"
                      >
                        {/* Left: Chevron + Warehouse Name + Code + Badge + Count */}
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background transition-transform duration-200 ${
                              isExpanded ? 'rotate-180 text-primary border-primary/40' : 'text-muted-foreground'
                            }`}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <Building2 className="h-4 w-4 text-primary shrink-0" />
                            <span className="text-sm font-bold text-foreground">{group.warehouseName}</span>
                            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/50">
                              {group.warehouseCode}
                            </span>
                            {group.warehouseType && (
                              <WarehouseTypeBadge type={group.warehouseType} />
                            )}
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[11px] font-semibold">
                              <Boxes className="h-3 w-3" />
                              {group.items.length} mặt hàng
                            </span>
                          </div>
                        </div>

                        {/* Right: Aggregated Totals in Header */}
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                          <div className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-emerald-700 dark:text-emerald-400 font-medium">
                            <ArrowDownLeft className="h-3 w-3" />
                            <span>Nhập:</span>
                            <span className="font-bold">{group.totalInbound.toLocaleString('vi-VN')}</span>
                          </div>

                          <div className="flex items-center gap-1 rounded-lg bg-rose-500/10 px-2.5 py-1 text-rose-700 dark:text-rose-400 font-medium">
                            <ArrowUpRight className="h-3 w-3" />
                            <span>Xuất:</span>
                            <span className="font-bold">{group.totalOutbound.toLocaleString('vi-VN')}</span>
                          </div>

                          <div className="flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-foreground font-semibold">
                            <span className="text-muted-foreground">Tồn:</span>
                            <span className="font-bold text-primary">{group.totalCurrentQuantity.toLocaleString('vi-VN')}</span>
                          </div>

                          <div className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                            <span className="text-emerald-700/80 dark:text-emerald-400/80">Khả dụng:</span>
                            <span>{group.totalAvailableQuantity.toLocaleString('vi-VN')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Warehouse Table */}
                      {isExpanded && (
                        <div className="border-t border-border">
                          {group.items.length === 0 ? (
                            <div className="py-6 px-4 text-center text-xs text-muted-foreground">
                              Kho hiện chưa có vật tư nào phát sinh số dư tồn.
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                                    <th className="py-2.5 px-4">Phân loại</th>
                                    <th className="py-2.5 px-4">Mã mặt hàng</th>
                                    <th className="py-2.5 px-4">Tên hàng / Vật tư</th>
                                    <th className="py-2.5 px-4 text-right text-emerald-700 dark:text-emerald-400">
                                      <span className="flex items-center justify-end gap-1">
                                        <ArrowDownLeft className="h-3 w-3" />
                                        Tổng Nhập (+)
                                      </span>
                                    </th>
                                    <th className="py-2.5 px-4 text-right text-rose-700 dark:text-rose-400">
                                      <span className="flex items-center justify-end gap-1">
                                        <ArrowUpRight className="h-3 w-3" />
                                        Tổng Xuất (-)
                                      </span>
                                    </th>
                                    <th className="py-2.5 px-4 text-right font-bold text-foreground">Tồn thực tế (=)</th>
                                    <th className="py-2.5 px-4 text-right">Khả dụng</th>
                                    <th className="py-2.5 px-4">Đơn vị</th>
                                    <th className="py-2.5 px-4">Cập nhật cuối</th>
                                    <th className="py-2.5 px-4 text-right">Thao tác</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                  {group.items.map((item, idx) => (
                                    <tr
                                      key={`${item.warehouse_id}-${item.item_id}-${idx}`}
                                      className="hover:bg-accent/30 transition-colors"
                                    >
                                      <td className="py-3 px-4 whitespace-nowrap">
                                        <ItemTypeBadge
                                          type={item.item_type}
                                          category={item.category}
                                          categoryLabel={item.category_label}
                                        />
                                      </td>
                                      <td className="py-3 px-4 font-mono font-bold whitespace-nowrap text-foreground">
                                        {item.item_code}
                                      </td>
                                      <td className="py-3 px-4 font-medium text-foreground">{item.item_name}</td>
                                      <td className="py-3 px-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                                        {(item.total_inbound ?? 0).toLocaleString('vi-VN')}
                                      </td>
                                      <td className="py-3 px-4 text-right font-medium text-rose-600 dark:text-rose-400">
                                        {(item.total_outbound ?? 0).toLocaleString('vi-VN')}
                                      </td>
                                      <td className={`py-3 px-4 text-right font-bold bg-muted/20 ${item.current_quantity < 0 ? 'text-rose-600 dark:text-rose-400' : item.current_quantity === 0 ? 'text-muted-foreground' : 'text-foreground'}`}>
                                        {item.current_quantity.toLocaleString('vi-VN')}
                                      </td>
                                      <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                        {item.available_quantity.toLocaleString('vi-VN')}
                                      </td>
                                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                                        {item.unit_of_measure}
                                      </td>
                                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                                        {item.last_transaction_at
                                          ? new Date(item.last_transaction_at).toLocaleDateString('vi-VN')
                                          : '—'}
                                      </td>
                                      <td className="py-3 px-4 text-right whitespace-nowrap">
                                        {canTransact && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onAdjustStock(item)}
                                            className="h-7 gap-1 px-2 text-[11px]"
                                          >
                                            <Sliders className="h-3 w-3 text-primary" />
                                            Kiểm kê
                                          </Button>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-1">
                <span className="text-xs text-muted-foreground">
                  Hiển thị <span className="font-semibold text-foreground">{startIdx}</span> -{' '}
                  <span className="font-semibold text-foreground">{endIdx}</span> trong tổng số{' '}
                  <span className="font-semibold text-foreground">{totalCount}</span> dòng tồn kho
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
        </>
      )}

      {/* Mode 2: Tổng hợp theo vật tư (Aggregated By Item across warehouses) */}
      {viewMode === 'by_item' && (
        <>
          {isAggLoading ? (
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="space-y-4 animate-pulse">
                <div className="h-10 bg-accent/40 rounded-lg" />
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-accent/20 rounded-lg" />
                ))}
              </div>
            </div>
          ) : isAggError ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <h3 className="mt-2 text-sm font-semibold text-foreground">Không thể tải dữ liệu tổng hợp theo vật tư</h3>
              <p className="mt-1 text-xs text-muted-foreground">Đã xảy ra lỗi khi tổng hợp số dư tồn kho từ máy chủ.</p>
              <Button variant="outline" size="sm" onClick={() => refetchAgg()} className="mt-4 gap-1.5">
                Thử lại
              </Button>
            </div>
          ) : filteredAggregatedItems.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Boxes className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-foreground">Không tìm thấy vật tư phù hợp</h3>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Không có vật tư nào khớp với từ khóa tìm kiếm hoặc phân loại được chọn.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                        <th className="py-3 px-3 w-10 text-center"></th>
                        <th className="py-3 px-4">Phân loại</th>
                        <th className="py-3 px-4">Mã mặt hàng</th>
                        <th className="py-3 px-4">Tên hàng / Vật tư</th>
                        <th className="py-3 px-4 text-right text-emerald-700 dark:text-emerald-400">
                          <span className="flex items-center justify-end gap-1">
                            <ArrowDownLeft className="h-3 w-3" />
                            Tổng Nhập Cty (+)
                          </span>
                        </th>
                        <th className="py-3 px-4 text-right text-rose-700 dark:text-rose-400">
                          <span className="flex items-center justify-end gap-1">
                            <ArrowUpRight className="h-3 w-3" />
                            Tổng Xuất Cty (-)
                          </span>
                        </th>
                        <th className="py-3 px-4 text-right font-bold text-foreground">Tổng Tồn Thực Tế (=)</th>
                        <th className="py-3 px-4 text-right">Tổng Khả Dụng</th>
                        <th className="py-3 px-4">Đơn vị</th>
                        <th className="py-3 px-4 text-center">Phân bổ kho</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredAggregatedItems.map((item) => {
                        const isExpanded = expandedItemIds.has(item.item_id);
                        return (
                          <React.Fragment key={item.item_id}>
                            <tr
                              onClick={() => toggleExpandItem(item.item_id)}
                              className={`cursor-pointer transition-colors ${
                                isExpanded ? 'bg-primary/5 font-medium' : 'hover:bg-accent/30'
                              }`}
                            >
                              <td className="py-3.5 px-3 text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-muted-foreground"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpandItem(item.item_id);
                                  }}
                                >
                                  <ChevronDown
                                    className={`h-4 w-4 transition-transform duration-200 ${
                                      isExpanded ? 'rotate-180 text-primary' : ''
                                    }`}
                                  />
                                </Button>
                              </td>
                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <ItemTypeBadge
                                  type={item.item_type}
                                  category={item.category}
                                  categoryLabel={item.category_label}
                                />
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap">{item.item_code}</td>
                              <td className="py-3.5 px-4 font-medium text-foreground">{item.item_name}</td>
                              <td className="py-3.5 px-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                                {item.total_inbound.toLocaleString('vi-VN')}
                              </td>
                              <td className="py-3.5 px-4 text-right font-medium text-rose-600 dark:text-rose-400">
                                {item.total_outbound.toLocaleString('vi-VN')}
                              </td>
                              <td className={`py-3.5 px-4 text-right font-bold bg-muted/20 ${item.total_current_quantity < 0 ? 'text-rose-600 dark:text-rose-400' : item.total_current_quantity === 0 ? 'text-muted-foreground' : 'text-foreground'}`}>
                                {item.total_current_quantity.toLocaleString('vi-VN')}
                              </td>
                              <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                {item.total_available_quantity.toLocaleString('vi-VN')}
                              </td>
                              <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">{item.unit_of_measure}</td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
                                  <Building2 className="h-3 w-3 text-muted-foreground" />
                                  {item.warehouses.length} kho
                                </span>
                              </td>
                            </tr>

                            {/* Sub-row: Chi tiết số dư theo từng kho */}
                            {isExpanded && (
                              <tr className="bg-muted/15">
                                <td colSpan={10} className="p-0">
                                  <div className="border-t border-border/80 p-4 pl-12">
                                    <div className="mb-2 flex items-center justify-between">
                                      <h4 className="text-[12px] font-semibold text-foreground flex items-center gap-1.5">
                                        <Building2 className="h-3.5 w-3.5 text-primary" />
                                        Chi tiết phân bổ tồn kho của vật tư: {item.item_name} ({item.item_code})
                                      </h4>
                                      <span className="text-[11px] text-muted-foreground">
                                        Tổng tồn = Tổng nhập - Tổng xuất theo từng kho
                                      </span>
                                    </div>
                                    <div className="overflow-hidden rounded-lg border border-border bg-background shadow-xs">
                                      <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                          <tr className="border-b border-border bg-muted/30 font-medium text-muted-foreground text-[11px]">
                                            <th className="py-2.5 px-3">Kho lưu trữ</th>
                                            <th className="py-2.5 px-3 text-right text-emerald-700 dark:text-emerald-400">Tổng Nhập (+)</th>
                                            <th className="py-2.5 px-3 text-right text-rose-700 dark:text-rose-400">Tổng Xuất (-)</th>
                                            <th className="py-2.5 px-3 text-right font-bold text-foreground">Tồn tại kho (=)</th>
                                            <th className="py-2.5 px-3 text-right">Khả dụng</th>
                                            <th className="py-2.5 px-3">Cập nhật cuối</th>
                                            <th className="py-2.5 px-3 text-right">Thao tác</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/40">
                                          {item.warehouses.map((wh) => (
                                            <tr key={wh.warehouse_id} className="hover:bg-accent/20">
                                              <td className="py-2.5 px-3 font-medium text-foreground">
                                                {wh.warehouse_name}
                                                <span className="ml-1.5 font-mono text-[11px] text-muted-foreground">
                                                  ({wh.warehouse_code})
                                                </span>
                                              </td>
                                              <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                                                {(wh.total_inbound ?? 0).toLocaleString('vi-VN')}
                                              </td>
                                              <td className="py-2.5 px-3 text-right text-rose-600 dark:text-rose-400 font-medium">
                                                {(wh.total_outbound ?? 0).toLocaleString('vi-VN')}
                                              </td>
                                              <td className={`py-2.5 px-3 text-right font-bold ${wh.current_quantity < 0 ? 'text-rose-600 dark:text-rose-400' : wh.current_quantity === 0 ? 'text-muted-foreground' : 'text-foreground'}`}>
                                                {wh.current_quantity.toLocaleString('vi-VN')}
                                              </td>
                                              <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                {wh.available_quantity.toLocaleString('vi-VN')}
                                              </td>
                                              <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap text-[11px]">
                                                {wh.last_transaction_at
                                                  ? new Date(wh.last_transaction_at).toLocaleDateString('vi-VN')
                                                  : 'Chưa giao dịch'}
                                              </td>
                                              <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                                {canTransact && (
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                      onAdjustStock({
                                                        id: `${wh.warehouse_id}-${item.item_id}`,
                                                        warehouse_id: wh.warehouse_id,
                                                        warehouse_code: wh.warehouse_code,
                                                        warehouse_name: wh.warehouse_name,
                                                        item_id: item.item_id,
                                                        item_code: item.item_code,
                                                        item_name: item.item_name,
                                                        item_type: item.item_type,
                                                        category: item.category,
                                                        category_label: item.category_label,
                                                        current_quantity: wh.current_quantity,
                                                        reserved_quantity: wh.reserved_quantity,
                                                        available_quantity: wh.available_quantity,
                                                        unit_of_measure: item.unit_of_measure,
                                                        last_transaction_at: wh.last_transaction_at || new Date().toISOString(),
                                                        total_inbound: wh.total_inbound,
                                                        total_outbound: wh.total_outbound,
                                                      })
                                                    }
                                                    className="h-6 gap-1 px-2 text-[11px]"
                                                  >
                                                    <Sliders className="h-3 w-3 text-primary" />
                                                    Kiểm kê kho này
                                                  </Button>
                                                )}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
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

              <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
                <span>
                  Tổng số <span className="font-semibold text-foreground">{filteredAggregatedItems.length}</span> mặt hàng trong toàn hệ thống
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
