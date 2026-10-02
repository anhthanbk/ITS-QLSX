import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  ShieldAlert,
  Wrench,
  Truck,
  Recycle,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Sliders,
  Trash2,
} from 'lucide-react';
import type {
  WarehouseStatus,
  WarehouseType,
  InventoryTransactionType,
  ItemType,
} from '@/features/warehouse/types';

export const WarehouseStatusBadge: React.FC<{ status: WarehouseStatus }> = ({ status }) => {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="h-3 w-3" />
        Đang hoạt động
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/10 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-500/20">
      <AlertCircle className="h-3 w-3" />
      Tạm dừng
    </span>
  );
};

export const WarehouseTypeBadge: React.FC<{ type: WarehouseType }> = ({ type }) => {
  switch (type) {
    case 'raw_material':
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <Layers className="h-3 w-3" />
          Kho nguyên liệu
        </span>
      );
    case 'finished_goods':
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <Package className="h-3 w-3" />
          Kho thành phẩm
        </span>
      );
    case 'quarantine':
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <ShieldAlert className="h-3 w-3" />
          Kho cách ly / KCS
        </span>
      );
    case 'spare_parts':
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-[11px] font-medium text-purple-600 dark:text-purple-400 border border-purple-500/20">
          <Wrench className="h-3 w-3" />
          Kho phụ tùng
        </span>
      );
    case 'transit':
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-600 dark:text-sky-400 border border-sky-500/20">
          <Truck className="h-3 w-3" />
          Kho trung chuyển
        </span>
      );
    case 'byproduct':
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <Recycle className="h-3 w-3" />
          Kho phụ phẩm
        </span>
      );
    default:
      return null;
  }
};

export const TransactionTypeBadge: React.FC<{ type: InventoryTransactionType }> = ({ type }) => {
  switch (type) {
    case 'inbound_receipt':
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <ArrowDownLeft className="h-3 w-3" />
          Nhập mua hàng
        </span>
      );
    case 'production_receipt':
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-teal-500/10 px-2 py-0.5 text-[11px] font-semibold text-teal-600 dark:text-teal-400 border border-teal-500/20">
          <ArrowDownLeft className="h-3 w-3" />
          Nhập sản xuất
        </span>
      );
    case 'production_issue':
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <ArrowUpRight className="h-3 w-3" />
          Xuất sản xuất
        </span>
      );
    case 'sales_dispatch':
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <ArrowUpRight className="h-3 w-3" />
          Xuất bán hàng
        </span>
      );
    case 'warehouse_transfer':
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
          <RefreshCw className="h-3 w-3" />
          Chuyển kho
        </span>
      );
    case 'inventory_adjustment':
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-violet-500/10 px-2 py-0.5 text-[11px] font-semibold text-violet-600 dark:text-violet-400 border border-violet-500/20">
          <Sliders className="h-3 w-3" />
          Điều chỉnh kiểm kê
        </span>
      );
    case 'scrap_disposal':
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive border border-destructive/20">
          <Trash2 className="h-3 w-3" />
          Xuất hủy / phế liệu
        </span>
      );
    default:
      return null;
  }
};

export interface ItemTypeBadgeProps {
  type: ItemType;
  category?: string;
  categoryLabel?: string;
}

export const ItemTypeBadge: React.FC<ItemTypeBadgeProps> = ({ type, category, categoryLabel }) => {
  if (category) {
    switch (category) {
      case 'raw_material':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400 border border-amber-500/20">
            Nguyên vật liệu chính
          </span>
        );
      case 'chemical':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-medium text-teal-700 dark:text-teal-400 border border-teal-500/20">
            Hóa chất công nghiệp
          </span>
        );
      case 'spare_part':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 dark:text-purple-400 border border-purple-500/20">
            Phụ tùng cơ điện
          </span>
        );
      case 'packaging':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-700 dark:text-cyan-400 border border-cyan-500/20">
            Vật tư bao bì
          </span>
        );
      case 'consumable':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-medium text-orange-700 dark:text-orange-400 border border-orange-500/20">
            Vật tư tiêu hao / BHLĐ
          </span>
        );
      case 'fuel_energy':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-yellow-500/10 px-1.5 py-0.5 text-[10px] font-medium text-yellow-700 dark:text-yellow-400 border border-yellow-500/20">
            Nhiên liệu & Năng lượng
          </span>
        );
      case 'other':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-slate-500/10 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-400 border border-slate-500/20">
            Vật tư phụ trợ
          </span>
        );
      case 'finished_good':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            Thành phẩm
          </span>
        );
      case 'semi_finished':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-400 border border-blue-500/20">
            Bán thành phẩm
          </span>
        );
      case 'by_product':
      case 'byproduct':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 dark:text-rose-400 border border-rose-500/20">
            Phụ phẩm
          </span>
        );
      default:
        if (categoryLabel) {
          return (
            <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground border border-border">
              {categoryLabel}
            </span>
          );
        }
    }
  }

  switch (type) {
    case 'material':
      return (
        <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 border border-blue-500/20">
          Nguyên vật liệu
        </span>
      );
    case 'product':
      return (
        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          Thành phẩm
        </span>
      );
    case 'byproduct':
      return (
        <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-medium text-rose-600 dark:text-rose-400 border border-rose-500/20">
          Phụ phẩm
        </span>
      );
    default:
      return null;
  }
};

export const ProductTypeBadge: React.FC<{ type: 'finished_good' | 'semi_finished' | 'by_product' }> = ({
  type,
}) => {
  switch (type) {
    case 'finished_good':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <Package className="h-3 w-3" />
          Thành phẩm sản xuất
        </span>
      );
    case 'semi_finished':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <Layers className="h-3 w-3" />
          Bán thành phẩm
        </span>
      );
    case 'by_product':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <Recycle className="h-3 w-3" />
          Phụ phẩm thu hồi
        </span>
      );
    default:
      return null;
  }
};

export const ProductStatusBadge: React.FC<{ status: 'active' | 'discontinued' }> = ({ status }) => {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="h-3 w-3" />
        Đang sản xuất / KD
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/10 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-500/20">
      <AlertCircle className="h-3 w-3" />
      Ngừng kinh doanh
    </span>
  );
};
