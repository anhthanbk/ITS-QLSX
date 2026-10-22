import React, { useState } from 'react';
import {
  Search,
  Filter,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Layers,
  Building2,
  Boxes,
  History,
  RotateCcw,
  PackageCheck,
  Wrench,
  Truck,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { InventoryStockBalance, Warehouse } from '@/features/warehouse/types';
import { useItemAggregatedStockBalances } from '../hooks/use-stock-balances';
import { StockHistoryModal, type StockHistoryTargetItem } from './stock-history-modal';

const WAREHOUSE_TYPE_CONFIG: Record<
  string,
  {
    label: string;
    shortLabel: string;
    badgeClass: string;
    icon: React.ComponentType<{ className?: string }>;
    order: number;
  }
> = {
  raw_material: {
    label: 'Kho Nguyên Liệu Thô',
    shortLabel: 'Nguyên liệu thô',
    badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
    icon: Boxes,
    order: 1,
  },
  finished_goods: {
    label: 'Kho Thành Phẩm',
    shortLabel: 'Thành phẩm',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    icon: PackageCheck,
    order: 2,
  },
  spare_parts: {
    label: 'Kho Phụ Tùng & Cơ Điện',
    shortLabel: 'Phụ tùng cơ điện',
    badgeClass: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30',
    icon: Wrench,
    order: 3,
  },
  byproduct: {
    label: 'Kho Phụ Phẩm & Thu Hồi',
    shortLabel: 'Phụ phẩm thu hồi',
    badgeClass: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30',
    icon: RotateCcw,
    order: 4,
  },
  transit: {
    label: 'Kho Trung Chuyển & Đệm',
    shortLabel: 'Trung chuyển',
    badgeClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
    icon: Truck,
    order: 5,
  },
  quarantine: {
    label: 'Kho Cách Ly / Kiểm Định KCS',
    shortLabel: 'Cách ly KCS',
    badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
    icon: AlertTriangle,
    order: 6,
  },
};

const MATERIAL_CATEGORY_CONFIG: Record<
  string,
  {
    label: string;
    shortLabel: string;
    badgeClass: string;
    icon: React.ComponentType<{ className?: string }>;
    order: number;
  }
> = {
  raw_material: {
    label: 'Nguyên Vật Liệu Thô & Khoáng Sản',
    shortLabel: 'Nguyên liệu thô',
    badgeClass: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
    icon: Boxes,
    order: 1,
  },
  chemical: {
    label: 'Hóa Chất Xử Lý & Công Nghiệp',
    shortLabel: 'Hóa chất xử lý',
    badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
    icon: Boxes,
    order: 2,
  },
  spare_part: {
    label: 'Phụ Tùng Cơ Điện & Vật Tư Bảo Trì',
    shortLabel: 'Phụ tùng cơ điện',
    badgeClass: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30',
    icon: Wrench,
    order: 3,
  },
  packaging: {
    label: 'Bao Bì & Đóng Gói',
    shortLabel: 'Bao bì & Đóng gói',
    badgeClass: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30',
    icon: PackageCheck,
    order: 4,
  },
  consumable: {
    label: 'Tiêu Hao & Bảo Hộ Lao Động',
    shortLabel: 'Tiêu hao / BHLĐ',
    badgeClass: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/30',
    icon: Boxes,
    order: 5,
  },
  fuel_energy: {
    label: 'Nhiên Liệu & Năng Lượng',
    shortLabel: 'Nhiên liệu & Năng lượng',
    badgeClass: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30',
    icon: Boxes,
    order: 6,
  },
  finished_good: {
    label: 'Thành Phẩm Hoàn Thiện',
    shortLabel: 'Thành phẩm',
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    icon: PackageCheck,
    order: 7,
  },
  semi_finished: {
    label: 'Bán Thành Phẩm & Dở Dang',
    shortLabel: 'Bán thành phẩm',
    badgeClass: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30',
    icon: Layers,
    order: 8,
  },
  byproduct: {
    label: 'Phụ Phẩm & Thu Hồi Tái Chế',
    shortLabel: 'Phụ phẩm thu hồi',
    badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30',
    icon: RotateCcw,
    order: 9,
  },
  other: {
    label: 'Vật Tư Khác & Phụ Trợ',
    shortLabel: 'Vật tư khác',
    badgeClass: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30',
    icon: Layers,
    order: 10,
  },
};

function getItemCategoryKey(item: {
  category?: string;
  category_label?: string;
  item_type?: string;
  item_code?: string;
}): string {
  const isSemi =
    item.category === 'semi_finished' ||
    item.category_label?.toLowerCase().includes('bán thành phẩm') ||
    item.item_code?.toLowerCase().includes('btp');
  if (isSemi) return 'semi_finished';

  const isByProduct =
    item.item_type === 'byproduct' ||
    item.category === 'by_product' ||
    item.category === 'byproduct' ||
    item.category_label?.toLowerCase().includes('phụ phẩm');
  if (isByProduct) return 'byproduct';

  const isProduct =
    item.item_type === 'product' ||
    item.category === 'finished_good' ||
    item.category === 'finished_goods' ||
    item.category_label?.toLowerCase().includes('thành phẩm');
  if (isProduct) return 'finished_good';

  if (item.category && item.category in MATERIAL_CATEGORY_CONFIG) {
    return item.category;
  }

  return 'other';
}

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
  const [historyTargetItem, setHistoryTargetItem] = useState<StockHistoryTargetItem | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const handleOpenHistory = (target: StockHistoryTargetItem) => {
    setHistoryTargetItem(target);
    setIsHistoryModalOpen(true);
  };

  const handleCloseHistory = () => {
    setIsHistoryModalOpen(false);
    setHistoryTargetItem(null);
  };

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

      // Check duplicate items within same warehouse (e.g. Bán thành phẩm or different item_types)
      const normCode = item.item_code && item.item_code !== '---' ? item.item_code.trim().toUpperCase() : item.item_id;
      const existing = group.items.find((i) => {
        const iCode = i.item_code && i.item_code !== '---' ? i.item_code.trim().toUpperCase() : i.item_id;
        return iCode === normCode || i.item_id === item.item_id;
      });

      if (existing) {
        existing.current_quantity += item.current_quantity;
        existing.reserved_quantity += item.reserved_quantity;
        existing.available_quantity = Math.max(0, existing.current_quantity - existing.reserved_quantity);
        existing.total_inbound = (existing.total_inbound ?? 0) + (item.total_inbound ?? 0);
        existing.total_outbound = (existing.total_outbound ?? 0) + (item.total_outbound ?? 0);
        if (item.last_transaction_at && (!existing.last_transaction_at || item.last_transaction_at > existing.last_transaction_at)) {
          existing.last_transaction_at = item.last_transaction_at;
        }
        if (item.category === 'semi_finished' || item.category_label?.toLowerCase().includes('bán thành phẩm')) {
          existing.category = item.category;
          existing.category_label = item.category_label;
          existing.item_type = item.item_type;
        }
      } else {
        group.items.push({ ...item });
      }

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

  // Filter warehouse type (phân loại kho rõ rệt)
  const [selectedWarehouseType, setSelectedWarehouseType] = useState<string>('all');

  // Filtered warehouse groups based on selected warehouse type
  const filteredWarehouseGroups = React.useMemo(() => {
    if (selectedWarehouseType === 'all') return warehouseGroups;
    return warehouseGroups.filter((g) => g.warehouseType === selectedWarehouseType);
  }, [warehouseGroups, selectedWarehouseType]);

  // Count warehouses by type for quick filter pills
  const warehouseTypeCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: warehouseGroups.length };
    warehouseGroups.forEach((g) => {
      const type = g.warehouseType || 'other';
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [warehouseGroups]);

  // Default is ALWAYS COLLAPSED as requested by user ("view luôn ở dạng thu gọn trước")
  const [expandedWarehouseIds, setExpandedWarehouseIds] = useState<Set<string>>(() => {
    if (selectedWarehouseId && selectedWarehouseId !== 'all') {
      return new Set([selectedWarehouseId]);
    }
    return new Set();
  });

  // Automatically expand only when a specific warehouse is filtered
  React.useEffect(() => {
    if (selectedWarehouseId && selectedWarehouseId !== 'all') {
      setExpandedWarehouseIds(new Set([selectedWarehouseId]));
    }
  }, [selectedWarehouseId]);

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
    setExpandedWarehouseIds(new Set(filteredWarehouseGroups.map((g) => g.warehouseId)));
  };

  const collapseAllWarehouses = () => {
    setExpandedWarehouseIds(new Set());
  };

  // Group warehouses by warehouse classification (sắp xếp phân loại kho thành các phân loại kho)
  interface WarehouseTypeSection {
    typeKey: string;
    label: string;
    shortLabel: string;
    badgeClass: string;
    icon: React.ComponentType<{ className?: string }>;
    order: number;
    warehouses: WarehouseStockGroup[];
    totalWarehouses: number;
    totalItems: number;
    totalCurrentQuantity: number;
    totalAvailableQuantity: number;
  }

  const warehouseTypeSections = React.useMemo<WarehouseTypeSection[]>(() => {
    const sectionsMap = new Map<string, WarehouseTypeSection>();

    filteredWarehouseGroups.forEach((wh) => {
      const typeKey = wh.warehouseType || 'other';
      let section = sectionsMap.get(typeKey);
      if (!section) {
        const config = WAREHOUSE_TYPE_CONFIG[typeKey] || {
          label: 'Kho Lưu Trữ Khác',
          shortLabel: 'Kho khác',
          badgeClass: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30',
          icon: Building2,
          order: 99,
        };
        section = {
          typeKey,
          label: config.label,
          shortLabel: config.shortLabel,
          badgeClass: config.badgeClass,
          icon: config.icon,
          order: config.order,
          warehouses: [],
          totalWarehouses: 0,
          totalItems: 0,
          totalCurrentQuantity: 0,
          totalAvailableQuantity: 0,
        };
        sectionsMap.set(typeKey, section);
      }
      section.warehouses.push(wh);
      section.totalWarehouses += 1;
      section.totalItems += wh.items.length;
      section.totalCurrentQuantity += wh.totalCurrentQuantity;
      section.totalAvailableQuantity += wh.totalAvailableQuantity;
    });

    return Array.from(sectionsMap.values()).sort((a, b) => a.order - b.order);
  }, [filteredWarehouseGroups]);

  // Group items by material classification (sắp xếp phân loại vật tư theo phân loại vật tư)
  interface ItemCategorySection {
    categoryKey: string;
    label: string;
    shortLabel: string;
    badgeClass: string;
    icon: React.ComponentType<{ className?: string }>;
    order: number;
    items: typeof filteredAggregatedItems;
    totalItems: number;
    totalCurrentQuantity: number;
  }

  const itemCategorySections = React.useMemo<ItemCategorySection[]>(() => {
    const sectionsMap = new Map<string, ItemCategorySection>();

    filteredAggregatedItems.forEach((item) => {
      const catKey = getItemCategoryKey(item);
      let section = sectionsMap.get(catKey);
      if (!section) {
        const config = MATERIAL_CATEGORY_CONFIG[catKey] || {
          label: 'Vật Tư Khác & Phụ Trợ',
          shortLabel: 'Vật tư khác',
          badgeClass: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30',
          icon: Layers,
          order: 99,
        };
        section = {
          categoryKey: catKey,
          label: config.label,
          shortLabel: config.shortLabel,
          badgeClass: config.badgeClass,
          icon: config.icon,
          order: config.order,
          items: [],
          totalItems: 0,
          totalCurrentQuantity: 0,
        };
        sectionsMap.set(catKey, section);
      }
      section.items.push(item);
      section.totalItems += 1;
      section.totalCurrentQuantity += item.total_current_quantity;
    });

    return Array.from(sectionsMap.values()).sort((a, b) => a.order - b.order);
  }, [filteredAggregatedItems]);

  // State to expand/collapse material category sections in by_item view
  const [collapsedCategoryKeys, setCollapsedCategoryKeys] = useState<Set<string>>(new Set());
  const toggleCollapseCategory = (key: string) => {
    setCollapsedCategoryKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const expandAllCategories = () => setCollapsedCategoryKeys(new Set());
  const collapseAllCategories = () => {
    setCollapsedCategoryKeys(new Set(itemCategorySections.map((s) => s.categoryKey)));
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
            <optgroup label="📦 Danh mục Vật tư & NVL">
              <option value="raw_material">Nguyên vật liệu</option>
              <option value="chemical">Hóa chất công nghiệp</option>
              <option value="spare_part">Phụ tùng cơ điện</option>
              <option value="packaging">Bao bì & Đóng gói</option>
              <option value="consumable">Tiêu hao / BHLĐ</option>
              <option value="fuel_energy">Nhiên liệu & Năng lượng</option>
              <option value="other">Vật tư phụ trợ</option>
            </optgroup>
            <optgroup label="🏭 Sản phẩm & Phụ phẩm">
              <option value="finished_good">Thành phẩm</option>
              <option value="semi_finished">Bán thành phẩm</option>
              <option value="by_product">Phụ phẩm thu hồi</option>
            </optgroup>
            <optgroup label="🗂️ Nhóm tổng quát">
              <option value="material">Tất cả vật tư & phụ tùng</option>
              <option value="product">Tất cả thành phẩm & phụ phẩm</option>
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
              {/* Phân loại các kho rõ rệt: Filter pills by warehouse type */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5">
                <button
                  type="button"
                  onClick={() => setSelectedWarehouseType('all')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap border transition-all',
                    selectedWarehouseType === 'all'
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-background text-muted-foreground border-border hover:bg-muted/60 hover:text-foreground'
                  )}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Tất cả kho</span>
                  <span
                    className={cn(
                      'ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                      selectedWarehouseType === 'all'
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {warehouseTypeCounts['all'] || warehouseGroups.length}
                  </span>
                </button>

                {Object.entries(WAREHOUSE_TYPE_CONFIG)
                  .sort((a, b) => a[1].order - b[1].order)
                  .map(([typeKey, config]) => {
                    const count = warehouseTypeCounts[typeKey] || 0;
                    if (count === 0 && selectedWarehouseType !== typeKey) return null;
                    const IconComponent = config.icon;
                    const isSelected = selectedWarehouseType === typeKey;
                    return (
                      <button
                        key={typeKey}
                        type="button"
                        onClick={() => setSelectedWarehouseType(typeKey)}
                        className={cn(
                          'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap border transition-all',
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                            : 'bg-background text-muted-foreground border-border hover:bg-muted/60 hover:text-foreground'
                        )}
                      >
                        <IconComponent className="h-3.5 w-3.5" />
                        <span>{config.shortLabel}</span>
                        <span
                          className={cn(
                            'ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                            isSelected
                              ? 'bg-primary-foreground/20 text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
              </div>

              {/* Expand / Collapse all controls & summary */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    Hiển thị <span className="font-semibold text-foreground">{filteredWarehouseGroups.length}</span> / {warehouseGroups.length} kho lưu trữ
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
              {filteredWarehouseGroups.length === 0 ? (
                <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-6 text-center">
                  <Building2 className="h-8 w-8 text-muted-foreground/60" />
                  <h4 className="mt-2 text-sm font-semibold text-foreground">Không có kho nào thuộc phân loại này</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Không tìm thấy kho lưu trữ nào phù hợp với bộ lọc phân loại đang chọn.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedWarehouseType('all')}
                    className="mt-3 text-xs"
                  >
                    Xem tất cả phân loại kho
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {warehouseTypeSections.map((section) => {
                    const SectionIcon = section.icon;
                    return (
                      <div key={section.typeKey} className="space-y-3">
                        {/* Section Header: Phân loại kho rõ rệt */}
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-muted/40 px-3.5 py-2.5 border border-border">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold',
                                section.badgeClass
                              )}
                            >
                              <SectionIcon className="h-3.5 w-3.5" />
                              <span>{section.shortLabel}</span>
                            </span>
                            <span className="text-xs font-bold uppercase tracking-wide text-foreground">
                              {section.label}
                            </span>
                            <span className="rounded-full bg-background border px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                              {section.totalWarehouses} kho
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
                            <span>
                              📦 <strong className="text-foreground">{section.totalItems}</strong> danh mục tồn
                            </span>
                            <span>•</span>
                            <span>
                              Tổng tồn:{' '}
                              <strong
                                className={
                                  section.totalCurrentQuantity < 0
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-primary'
                                }
                              >
                                {section.totalCurrentQuantity.toLocaleString('vi-VN')}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              Khả dụng:{' '}
                              <strong className="text-emerald-600 dark:text-emerald-400">
                                {section.totalAvailableQuantity.toLocaleString('vi-VN')}
                              </strong>
                            </span>
                          </div>
                        </div>

                        {/* List of Warehouses in this classification */}
                        <div className="space-y-3 pl-0 sm:pl-2">
                          {section.warehouses.map((group) => {
                    const isExpanded = expandedWarehouseIds.has(group.warehouseId);
                    const typeConfig =
                      (group.warehouseType && WAREHOUSE_TYPE_CONFIG[group.warehouseType]) || {
                        label: 'Kho lưu trữ',
                        shortLabel: 'Kho chung',
                        badgeClass: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30',
                        icon: Building2,
                        order: 99,
                      };
                    const TypeIcon = typeConfig.icon;

                    return (
                      <div
                        key={group.warehouseId}
                        className={cn(
                          'overflow-hidden rounded-xl border bg-card shadow-xs transition-all',
                          isExpanded
                            ? 'border-primary/40 ring-1 ring-primary/20'
                            : 'border-border hover:border-border/80'
                        )}
                      >
                        {/* Warehouse Header Bar (Accordion Toggle - Default Collapsed) */}
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
                          className={cn(
                            'flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between cursor-pointer select-none transition-colors',
                            isExpanded ? 'bg-muted/30' : 'bg-card hover:bg-muted/20'
                          )}
                        >
                          {/* Left: Chevron + Type Badge + Warehouse Name & Code */}
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-transform duration-200',
                                isExpanded
                                  ? 'rotate-180 text-primary border-primary/40 bg-primary/10'
                                  : 'text-muted-foreground border-border bg-background'
                              )}
                              title={isExpanded ? 'Thu gọn kho này' : 'Mở rộng chi tiết kho này'}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {/* Phân loại kho rõ rệt: Type Badge with Icon */}
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold',
                                  typeConfig.badgeClass
                                )}
                              >
                                <TypeIcon className="h-3 w-3" />
                                <span>{typeConfig.shortLabel}</span>
                              </span>

                              {/* Warehouse Code & Name */}
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                  {group.warehouseCode || 'KHO'}
                                </span>
                                <span className="text-sm font-bold text-foreground">
                                  {group.warehouseName}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Tóm tắt thông số khi thu gọn */}
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-background/80 px-2.5 py-1 text-muted-foreground">
                              <span>📦</span>
                              <span className="font-semibold text-foreground">{group.items.length}</span>
                              <span>mặt hàng</span>
                            </div>

                            <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/80 px-2.5 py-1">
                              <span className="text-muted-foreground">Tồn:</span>
                              <span
                                className={cn(
                                  'font-bold',
                                  group.totalCurrentQuantity < 0
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-primary'
                                )}
                              >
                                {group.totalCurrentQuantity.toLocaleString('vi-VN')}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/80 px-2.5 py-1">
                              <span className="text-muted-foreground">Khả dụng:</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {group.totalAvailableQuantity.toLocaleString('vi-VN')}
                              </span>
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
                                    <th className="py-2.5 px-4">Mã mặt hàng</th>
                                    <th className="py-2.5 px-4">Tên hàng / Vật tư</th>
                                    <th className="py-2.5 px-4 text-right font-bold text-foreground">Tồn kho</th>
                                    <th className="py-2.5 px-4 text-right">Thao tác</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                  {group.items.map((item, idx) => (
                                    <tr
                                      key={`${item.warehouse_id}-${item.item_id}-${idx}`}
                                      onClick={() =>
                                        handleOpenHistory({
                                          itemId: item.item_id,
                                          itemCode: item.item_code || '—',
                                          itemName: item.item_name || 'Chưa đặt tên',
                                          unitOfMeasure: item.unit_of_measure,
                                          itemType: item.item_type,
                                          category: item.category,
                                          categoryLabel: item.category_label,
                                          warehouseId: item.warehouse_id,
                                          warehouseName: group.warehouseName,
                                          warehouseCode: group.warehouseCode,
                                        })
                                      }
                                      className="hover:bg-accent/40 cursor-pointer transition-colors"
                                      title="Nhấp để xem chi tiết lịch sử nhập xuất kho"
                                    >
                                      <td className="py-3 px-4 font-mono font-bold whitespace-nowrap text-foreground">
                                        {item.item_code}
                                      </td>
                                      <td className="py-3 px-4 font-medium text-foreground">
                                        <span className="hover:underline hover:text-primary">
                                          {item.item_name}
                                        </span>
                                      </td>
                                      <td className={`py-3 px-4 text-right font-bold ${item.current_quantity < 0 ? 'text-rose-600 dark:text-rose-400' : item.current_quantity === 0 ? 'text-muted-foreground' : 'text-foreground'}`}>
                                        {item.current_quantity.toLocaleString('vi-VN')}
                                        {item.unit_of_measure && (
                                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                                            {item.unit_of_measure}
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-3 px-4 text-right whitespace-nowrap">
                                        <div
                                          className="flex items-center justify-end gap-1.5"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              handleOpenHistory({
                                                itemId: item.item_id,
                                                itemCode: item.item_code || '—',
                                                itemName: item.item_name || 'Chưa đặt tên',
                                                unitOfMeasure: item.unit_of_measure,
                                                itemType: item.item_type,
                                                category: item.category,
                                                categoryLabel: item.category_label,
                                                warehouseId: item.warehouse_id,
                                                warehouseName: group.warehouseName,
                                                warehouseCode: group.warehouseCode,
                                              })
                                            }
                                            className="h-7 gap-1 px-2 text-[11px] text-primary hover:text-primary hover:bg-primary/10"
                                            title="Xem lịch sử nhập xuất của mặt hàng này"
                                          >
                                            <History className="h-3 w-3" />
                                            Lịch sử
                                          </Button>
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
                                        </div>
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
            </div>
          );
        })}
      </div>
      )}

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
            <div className="flex flex-col gap-4">
              {/* Category Controls & Summary */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    Phân loại: <span className="font-semibold text-foreground">{itemCategorySections.length}</span> nhóm vật tư
                  </span>
                  <span>•</span>
                  <span>
                    Tổng <span className="font-semibold text-foreground">{filteredAggregatedItems.length}</span> mặt hàng trong toàn hệ thống
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={expandAllCategories}
                    className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Mở rộng tất cả phân loại
                  </Button>
                  <span className="text-muted-foreground/40">|</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={collapseAllCategories}
                    className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Thu gọn tất cả phân loại
                  </Button>
                </div>
              </div>

              {/* Material Category Sections */}
              <div className="space-y-4">
                {itemCategorySections.map((sec) => {
                  const isCollapsed = collapsedCategoryKeys.has(sec.categoryKey);
                  const CatIcon = sec.icon;

                  return (
                    <div
                      key={sec.categoryKey}
                      className="overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-all"
                    >
                      {/* Material Category Header Bar (Accordion Toggle) */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleCollapseCategory(sec.categoryKey)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleCollapseCategory(sec.categoryKey);
                          }
                        }}
                        className={cn(
                          'flex flex-col gap-2.5 p-3.5 sm:flex-row sm:items-center sm:justify-between cursor-pointer select-none transition-colors',
                          !isCollapsed ? 'bg-muted/30' : 'bg-card hover:bg-muted/20'
                        )}
                      >
                        <div className="flex flex-wrap items-center gap-2.5">
                          <div
                            className={cn(
                              'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-transform duration-200',
                              !isCollapsed
                                ? 'rotate-180 text-primary border-primary/40 bg-primary/10'
                                : 'text-muted-foreground border-border bg-background'
                            )}
                            title={!isCollapsed ? 'Thu gọn phân loại này' : 'Mở rộng phân loại này'}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </div>

                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold',
                              sec.badgeClass
                            )}
                          >
                            <CatIcon className="h-3 w-3" />
                            <span>{sec.shortLabel}</span>
                          </span>

                          <span className="text-xs font-bold uppercase tracking-wide text-foreground">
                            {sec.label}
                          </span>

                          <span className="rounded-full bg-background border px-2 py-0.2 text-[10px] font-bold text-muted-foreground">
                            {sec.totalItems} mặt hàng
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/80 px-2.5 py-1">
                            <span className="text-muted-foreground">Tổng tồn nhóm:</span>
                            <span
                              className={cn(
                                'font-bold',
                                sec.totalCurrentQuantity < 0
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-primary'
                              )}
                            >
                              {sec.totalCurrentQuantity.toLocaleString('vi-VN')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Items table inside this category */}
                      {!isCollapsed && (
                        <div className="border-t border-border overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                                <th className="py-2.5 px-3 w-10 text-center"></th>
                                <th className="py-2.5 px-4">Mã mặt hàng</th>
                                <th className="py-2.5 px-4">Tên hàng / Vật tư</th>
                                <th className="py-2.5 px-4 text-right font-bold text-foreground">Tồn kho</th>
                                <th className="py-2.5 px-4 text-right">Thao tác</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                              {sec.items.map((item) => {
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
                                      <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap">{item.item_code}</td>
                                      <td className="py-3.5 px-4 font-medium text-foreground">{item.item_name}</td>
                                      <td className={`py-3.5 px-4 text-right font-bold ${item.total_current_quantity < 0 ? 'text-rose-600 dark:text-rose-400' : item.total_current_quantity === 0 ? 'text-muted-foreground' : 'text-foreground'}`}>
                                        {item.total_current_quantity.toLocaleString('vi-VN')}
                                        {item.unit_of_measure && (
                                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                                            {item.unit_of_measure}
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-3.5 px-4 text-right">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenHistory({
                                              itemId: item.item_id,
                                              itemCode: item.item_code,
                                              itemName: item.item_name,
                                              unitOfMeasure: item.unit_of_measure,
                                              itemType: item.item_type,
                                              category: item.category,
                                              categoryLabel: item.category_label,
                                            });
                                          }}
                                          className="h-7 gap-1 px-2 text-[11px] text-primary hover:text-primary hover:bg-primary/10"
                                          title="Xem toàn bộ lịch sử giao dịch toàn công ty của vật tư này"
                                        >
                                          <History className="h-3 w-3" />
                                          Lịch sử
                                        </Button>
                                      </td>
                                    </tr>

                                    {/* Sub-row: Chi tiết số dư theo từng kho */}
                                    {isExpanded && (
                                      <tr className="bg-muted/15">
                                        <td colSpan={5} className="p-0">
                                          <div className="border-t border-border/80 p-4 pl-12">
                                            <div className="mb-2 flex items-center justify-between">
                                              <h4 className="text-[12px] font-semibold text-foreground flex items-center gap-1.5">
                                                <Building2 className="h-3.5 w-3.5 text-primary" />
                                                Chi tiết phân bổ tồn kho của vật tư: {item.item_name} ({item.item_code})
                                              </h4>
                                            </div>
                                            <div className="overflow-hidden rounded-lg border border-border bg-background shadow-xs">
                                              <table className="w-full text-left border-collapse text-xs">
                                                <thead>
                                                  <tr className="border-b border-border bg-muted/30 font-medium text-muted-foreground text-[11px]">
                                                    <th className="py-2.5 px-3">Kho lưu trữ</th>
                                                    <th className="py-2.5 px-3 text-right font-bold text-foreground">Tồn tại kho</th>
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
                                                      <td className={`py-2.5 px-3 text-right font-bold ${wh.current_quantity < 0 ? 'text-rose-600 dark:text-rose-400' : wh.current_quantity === 0 ? 'text-muted-foreground' : 'text-foreground'}`}>
                                                        {wh.current_quantity.toLocaleString('vi-VN')}
                                                        {item.unit_of_measure && (
                                                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                                                            {item.unit_of_measure}
                                                          </span>
                                                        )}
                                                      </td>
                                                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-1">
                                                          <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                              handleOpenHistory({
                                                                itemId: item.item_id,
                                                                itemCode: item.item_code,
                                                                itemName: item.item_name,
                                                                unitOfMeasure: item.unit_of_measure,
                                                                itemType: item.item_type,
                                                                category: item.category,
                                                                categoryLabel: item.category_label,
                                                                warehouseId: wh.warehouse_id,
                                                                warehouseName: wh.warehouse_name,
                                                                warehouseCode: wh.warehouse_code,
                                                                })
                                                            }
                                                            className="h-6 gap-1 px-2 text-[11px] text-primary hover:text-primary hover:bg-primary/10"
                                                            title="Xem lịch sử nhập xuất tại kho này"
                                                          >
                                                            <History className="h-3 w-3" />
                                                            Lịch sử
                                                          </Button>
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
                                                              Kiểm kê
                                                            </Button>
                                                          )}
                                                        </div>
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
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Lịch sử nhập xuất kho */}
      {isHistoryModalOpen && historyTargetItem && (
        <StockHistoryModal
          isOpen={isHistoryModalOpen}
          item={historyTargetItem}
          onClose={handleCloseHistory}
        />
      )}
    </div>
  );
};
