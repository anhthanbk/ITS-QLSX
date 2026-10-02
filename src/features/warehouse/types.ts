// Warehouse feature TypeScript types - strictly aligned with Supabase schema

export type WarehouseType = 
  | 'raw_material' 
  | 'finished_goods' 
  | 'quarantine' 
  | 'spare_parts' 
  | 'transit' 
  | 'byproduct';

export type WarehouseStatus = 'active' | 'inactive';

export type ItemType = 'material' | 'product' | 'byproduct';

export interface WarehouseItemOption {
  id: string;
  code: string;
  name: string;
  item_type: ItemType;
  category: string;
  category_label: string;
  unit: string;
  cost: number;
}

export type InventoryTransactionType =
  | 'inbound_receipt'
  | 'production_issue'
  | 'production_receipt'
  | 'warehouse_transfer'
  | 'inventory_adjustment'
  | 'scrap_disposal'
  | 'sales_dispatch';

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  warehouse_type: WarehouseType;
  location: string | null;
  manager_employee_id: string | null;
  manager_name?: string | null;
  status: WarehouseStatus;
  created_at: string;
  updated_at: string;
}

export interface InventoryStockBalance {
  id?: string;
  warehouse_id: string;
  warehouse_code?: string;
  warehouse_name?: string;
  item_type: ItemType;
  category?: string;
  category_label?: string;
  item_id: string;
  item_code?: string;
  item_name?: string;
  unit_of_measure?: string;
  current_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  total_inbound?: number;
  total_outbound?: number;
  last_transaction_at: string;
}

export interface ItemAggregatedStockBalance {
  item_id: string;
  item_type: ItemType;
  item_code: string;
  item_name: string;
  category?: string;
  category_label?: string;
  unit_of_measure: string;
  total_inbound: number;
  total_outbound: number;
  total_current_quantity: number;
  total_reserved_quantity: number;
  total_available_quantity: number;
  warehouse_count: number;
  warehouses: Array<{
    warehouse_id: string;
    warehouse_code?: string;
    warehouse_name?: string;
    current_quantity: number;
    reserved_quantity: number;
    available_quantity: number;
    total_inbound: number;
    total_outbound: number;
    last_transaction_at?: string;
  }>;
}

export interface WarehouseTransferValues {
  from_warehouse_id: string;
  to_warehouse_id: string;
  item_type: ItemType;
  item_id: string;
  quantity: number;
  notes?: string | null;
}

export interface InventoryTransaction {
  id: string;
  transaction_number: string;
  warehouse_id: string;
  warehouse_code?: string;
  warehouse_name?: string;
  item_type: ItemType;
  category?: string;
  category_label?: string;
  item_id: string;
  item_code?: string;
  item_name?: string;
  transaction_type: InventoryTransactionType;
  quantity: number;
  unit_cost: number;
  reference_doc_type: string | null;
  reference_doc_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_by_name?: string | null;
  created_at: string;
  unit_of_measure?: string;
  balance_after_transaction?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface WarehouseFilterParams {
  search?: string;
  warehouseType?: string;
  status?: string;
  page: number;
  pageSize: number;
}

export interface StockBalanceFilterParams {
  search?: string;
  warehouseId?: string;
  itemType?: string;
  page: number;
  pageSize: number;
}

export interface TransactionFilterParams {
  search?: string;
  warehouseId?: string;
  transactionType?: string;
  itemType?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  pageSize: number;
}

export interface WarehouseMetrics {
  totalWarehouses: number;
  activeWarehouses: number;
  totalStockItems: number;
  totalTransactionsCount: number;
}

export type MaterialCategory =
  | 'raw_material'
  | 'chemical'
  | 'spare_part'
  | 'packaging'
  | 'consumable'
  | 'fuel_energy'
  | 'other';

export interface MaterialCatalogItem {
  id: string;
  code: string;
  name: string;
  category: MaterialCategory | string;
  unit_of_measure: string;
  min_stock_level: number;
  max_stock_level: number | null;
  reorder_point: number;
  standard_cost: number;
  status: string;
  total_stock: number;
  created_at: string;
}

export interface MaterialCatalogFilterParams {
  search?: string;
  category?: string;
  page: number;
  pageSize: number;
}

export type ProductType = 'finished_good' | 'semi_finished' | 'by_product';
export type ProductStatus = 'active' | 'discontinued';

export interface ProductCatalogItem {
  id: string;
  sku: string;
  name: string;
  product_type: ProductType;
  unit_of_measure: string;
  base_sales_price: number;
  standard_cycle_time_mins: number;
  standard_labor_cost: number;
  status: ProductStatus;
  total_stock?: number;
  created_at: string;
  updated_at?: string;
}

export interface ProductCatalogFilterParams {
  search?: string;
  productType?: string;
  status?: string;
  page: number;
  pageSize: number;
}

